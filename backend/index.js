const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const { supabase, supabaseAdmin } = require('./lib/supabaseClient');
const elasticClient = require('./lib/elasticClient');
const { pipeline } = require('@xenova/transformers');

const app = express();
const PORT = process.env.PORT || 8080;

const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Load embedding model once
// ===============================
let extractor;
pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  .then(instance => {
    extractor = instance;
    console.log('✅ Embedding model loaded successfully.');
  })
  .catch(err => console.error('❌ Failed to load embedding model:', err));

// ===============================
// Helper: Create and broadcast notification
// ===============================
const createNotification = async (userId, reportId, content, type) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert([{ user_id: userId, report_id: reportId, content: content, type: type }])
    .select()
    .single();
  if (error) {
    console.error('Failed to create notification:', error);
    return;
  }
  const channel = supabaseAdmin.channel(`notifications:${userId}`);
  channel.send({ type: 'broadcast', event: 'new_notification', payload: data });
};

// ===============================
// Routes
// ===============================
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the CiviQ Backend API!' });
});

// =======================================================
// AI Duplicate Detection + Report Submission Endpoint
// =======================================================
app.post('/api/reports', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
      return res.status(401).json({ message: 'Authentication token is required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user)
      return res.status(401).json({ message: 'Invalid or expired token.' });

    const { issueType, description, lat, lon } = req.body;
    if (!issueType || !description || !lat || !lon)
      return res.status(400).json({ message: 'Issue Type, description, and location are required.' });

    if (!extractor)
      return res.status(503).json({ message: 'AI model is still loading, please try again shortly.' });

    // === Step 1: Generate embedding
    const embedding = await extractor(description, { pooling: 'mean', normalize: true });
    const vector = Array.from(embedding.data);

    // === Step 2: Search for duplicates in Elasticsearch
    const { hits } = await elasticClient.search({
      index: 'civiq-reports',
      knn: {
        field: 'description_vector',
        query_vector: vector,
        k: 1,
        num_candidates: 10,
      },
      query: {
        bool: {
          must: [{ term: { issue_type: issueType } }],
          filter: [
            {
              geo_distance: {
                distance: '50m',
                location: { lat: parseFloat(lat), lon: parseFloat(lon) },
              },
            },
          ],
        },
      },
    });

    // === Step 3: Handle duplicate
    if (hits.total.value > 0 && hits.hits[0]._score > 0.9) {
      const duplicate = hits.hits[0]._source;
    
      // Read current duplicate_count (use .single() for one row)
      const { data: existingRow, error: selectError } = await supabaseAdmin
        .from('reports')
        .select('id, duplicate_count')
        .eq('id', duplicate.supabase_id)
        .single();
    
      if (selectError) {
        console.error('Failed to fetch duplicate report row before increment:', selectError);
        // fallback: respond with message but do not crash the whole flow
        return res.status(200).json({
          message: 'This issue appears to be a duplicate (could not update counter).',
          data: null,
        });
      }
    
      // Compute new count (handle null or missing)
      const currentCount = (existingRow && typeof existingRow.duplicate_count === 'number') ? existingRow.duplicate_count : 1;
      const newCount = currentCount + 1;
    
      // Update duplicate_count atomically (simple update)
      const { data: updatedReport, error: updateError } = await supabaseAdmin
        .from('reports')
        .update({ duplicate_count: newCount })
        .eq('id', duplicate.supabase_id)
        .select()
        .single();
    
      if (updateError) {
        console.error('Failed to update duplicate_count:', updateError);
        return res.status(200).json({
          message: 'This issue has already been reported (failed to update counter).',
          data: null,
        });
      }
    
      return res.status(200).json({
        message: 'This issue has already been reported nearby. We upvoted the existing report.',
        data: updatedReport,
      });
    }
    

    // === Step 4: Upload file (if any)
    const file = req.file;
    let mediaUrl = null;
    if (file) {
      const extension =
        file.mimetype === 'audio/webm'
          ? 'webm'
          : file.originalname.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${extension}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('report-media')
        .upload(fileName, file.buffer, { contentType: file.mimetype });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseAdmin.storage
        .from('report-media')
        .getPublicUrl(uploadData.path);
      mediaUrl = urlData.publicUrl;
    }

    // === Step 5: Insert new report in Supabase
    const { data: reportData, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert([
        {
          issue_type: issueType,
          description,
          media_url: mediaUrl,
          user_id: user.id,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
        },
      ])
      .select()
      .single();
    if (insertError) throw insertError;

    // === Step 6: Index new report in Elasticsearch
    await elasticClient.index({
      index: 'civiq-reports',
      id: reportData.id.toString(),
      document: {
        description,
        description_vector: vector,
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        supabase_id: reportData.id,
        issue_type: issueType,
      },
    });

    // === Step 7: Notify all admins
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    if (!adminError && admins) {
      for (const admin of admins) {
        await createNotification(
          admin.id,
          reportData.id,
          `New report submitted: ${issueType}.`,
          'new_report'
        );
      }
    }

    res.status(201).json({
      message: 'Report submitted successfully and indexed!',
      data: reportData,
    });
  } catch (error) {
    console.error('--- DETAILED ERROR ---', error);
    res.status(500).json({ message: `Backend Error: ${error.message}` });
  }
});

// =======================================================
// Existing Admin and Notification Endpoints
// =======================================================
app.patch('/api/admin/reports/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || profile.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required.' });

    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'New status is required.' });

    const updateData = { status };
    if (status === 'submitted') {
      updateData.in_progress_at = null;
      updateData.resolved_at = null;
    } else if (status === 'in_progress') {
      updateData.in_progress_at = new Date().toISOString();
      updateData.resolved_at = null;
    } else if (status === 'resolved') {
      const { data: currentReport } = await supabaseAdmin
        .from('reports')
        .select('in_progress_at')
        .eq('id', id)
        .single();
      if (!currentReport.in_progress_at) {
        updateData.in_progress_at = new Date().toISOString();
      }
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    if (data.user_id !== user.id) {
      const notificationContent = `Your report for "${data.issue_type}" was updated to: ${status}.`;
      await createNotification(data.user_id, data.id, notificationContent, 'status_update');
    }

    res.status(200).json({ message: 'Report status updated successfully', data });
  } catch (error) {
    console.error('Error updating report status:', error.message);
    res.status(500).json({ message: 'Failed to update report status.', error: error.message });
  }
});

app.post('/api/admin/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || profile.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required.' });

    const { recipient_id, report_id, content } = req.body;
    if (!recipient_id || !content)
      return res.status(400).json({ message: 'Recipient and content are required.' });

    if (recipient_id !== user.id) {
      await createNotification(recipient_id, report_id, content, 'admin_message');
    }

    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending message:', error.message);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

app.post('/api/admin/broadcast', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || profile.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required.' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required.' });

    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id');
    if (usersError) throw usersError;

    for (const u of users) {
      if (u.id !== user.id) {
        await createNotification(u.id, null, content, 'broadcast');
      }
    }

    res.status(200).json({ message: 'Broadcast sent successfully.' });
  } catch (error) {
    console.error('Error sending broadcast:', error.message);
    res.status(500).json({ message: 'Failed to send broadcast.' });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    res.status(200).json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Error marking notifications as read:', error.message);
    res.status(500).json({ message: 'Failed to mark notifications as read.' });
  }
});

app.get('/api/notifications/summary', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    let summary = { unreadCount: 0, newReportCount: 0 };

    const { count: unreadCount, error: unreadError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (unreadError) throw unreadError;

    summary.unreadCount = unreadCount;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile && profile.role === 'admin') {
      const { count: newReportCount, error: reportCountError } = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');
      if (reportCountError) throw reportCountError;
      summary.newReportCount = newReportCount;
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching notification summary:', error.message);
    res.status(500).json({ message: 'Failed to fetch notification summary.' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || profile.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (reportsError) throw reportsError;

    const userIds = [...new Set(reports.map(r => r.user_id).filter(id => id !== null))];
    if (userIds.length === 0) {
      const combinedData = reports.map(report => ({
        ...report,
        profiles: { email: 'N/A' },
      }));
      return res.status(200).json(combinedData);
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('id', userIds);
    if (profilesError) throw profilesError;

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const combinedData = reports.map(report => ({
      ...report,
      profiles: { email: profileMap.get(report.user_id)?.email || 'N/A' },
    }));

    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching admin reports:', error.message);
    res.status(500).json({ message: 'Failed to fetch admin reports.', error: error.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(200).json([]);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(200).json([]);

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
