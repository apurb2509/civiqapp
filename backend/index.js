const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const { supabase, supabaseAdmin } = require('./lib/supabaseClient');
const elasticClient = require('./lib/elasticClient');
const { pipeline } = require('@xenova/transformers');
const { HfInference } = require('@huggingface/inference');

const app = express();
const PORT = process.env.PORT || 8080;

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

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
// Helper Functions
// ===============================
const createNotification = async (userId, reportId, content, type) => {
  const { data, error } = await supabaseAdmin.from('notifications').insert([{ user_id: userId, report_id: reportId, content, type }]).select().single();
  if (error) { console.error('Failed to create notification:', error); return; }
  const channel = supabaseAdmin.channel(`notifications:${userId}`);
  channel.send({ type: 'broadcast', event: 'new_notification', payload: data });
};

const generateAndSaveBadge = async (report) => {
  let badgeTitle = '';
  try {
    const prompt = `Generate a short, fun, and heroic gamification badge title for a citizen who reported an issue. The issue was "${report.issue_type}" at the location described as "${report.description}". The title should be creative, location-specific, and a maximum of 3 words. Examples: "Rasulgarh's Pothole Patriot", "Flood Fighter of Nayapalli". Do not add quotation marks. Title only.`;
    
    console.log("📨 Sending prompt to Hugging Face...");

    const response = await hf.chatCompletion({
      model: process.env.HF_MODEL,
      messages: [
        { role: "system", content: "You are a creative civic badge generator." },
        { role: "user", content: prompt }
      ],
      max_new_tokens: 60,
      temperature: 0.7,
    });    

    const generatedText = response.choices?.[0]?.message?.content || '';
    badgeTitle = generatedText.trim().replace(/\"/g, "");    

        // Handle case if model returns empty or prompt echo
        if (!badgeTitle || badgeTitle.length < 3) {
          console.warn("⚠️ Badge text too short or empty, using fallback.");
          badgeTitle = `${report.issue_type.charAt(0).toUpperCase() + report.issue_type.slice(1)} Hero`;
        }

  } catch (error) {
    console.error("Failed to generate AI badge, using fallback:", error);
    badgeTitle = `${report.issue_type.charAt(0).toUpperCase() + report.issue_type.slice(1)} Hero`;
  }

  if (badgeTitle) {
    try {
      await supabaseAdmin.from('badges').insert({
        user_id: report.user_id,
        report_id: report.id,
        title: badgeTitle,
        description: `Awarded for resolving a "${report.issue_type}" issue.`
      });
      await createNotification(report.user_id, report.id, `You've earned a new badge: "${badgeTitle}"!`, 'badge_earned');
    } catch (dbError) {
        console.error("Failed to save badge or send notification:", dbError);
    }
  }
};

// ===============================
// Routes
// ===============================
app.get('/', (req, res) => { res.status(200).json({ message: 'Welcome to the CiviQ Backend API!' }); });

app.post('/api/reports', upload.single('file'), async (req, res) => {
  console.log('--- POST /api/reports called ---');
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No auth token provided.');
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.log('Invalid or expired token.', userError);
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    console.log('Authenticated user:', user.id);

    const { issueType, description, lat, lon } = req.body;
    if (!issueType || !description) {
      console.log('Missing required fields:', { issueType, description });
      return res.status(400).json({ message: 'Issue Type and description are required.' });
    }
    console.log('Report details received:', { issueType, description, lat, lon });

    // Duplicate detection
    if (lat && lon && extractor) {
      console.log('Running duplicate detection...');
      const embedding = await extractor(description, { pooling: 'mean', normalize: true });
      const vector = Array.from(embedding.data);

      const { hits } = await elasticClient.search({
        index: 'civiq-reports',
        knn: { field: 'description_vector', query_vector: vector, k: 1, num_candidates: 10 },
        query: { bool: { must: [{ term: { issue_type: issueType } }], filter: [{ geo_distance: { distance: '50m', location: { lat: parseFloat(lat), lon: parseFloat(lon) } } }] } },
      });

      console.log('Duplicate search results:', hits);

      if (hits.total.value > 0 && hits.hits[0]._score > 0.9) {
        const duplicate = hits.hits[0]._source;
        console.log('Duplicate found:', duplicate);
        const { data: existingRow } = await supabaseAdmin.from('reports').select('duplicate_count').eq('id', duplicate.supabase_id).single();
        const newCount = (existingRow?.duplicate_count || 1) + 1;
        const { data: updatedReport } = await supabaseAdmin.from('reports').update({ duplicate_count: newCount }).eq('id', duplicate.supabase_id).select().single();
        console.log('Updated duplicate count:', updatedReport);
        return res.status(200).json({ message: 'This issue has already been reported nearby. We upvoted the existing report.', data: updatedReport });
      }
    }

    // Handle file upload
    let mediaUrl = null;
    if (req.file) {
      console.log('Processing file upload...');
      const extension = req.file.mimetype.startsWith('audio/') ? 'webm' : req.file.originalname.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${extension}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from('report-media').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseAdmin.storage.from('report-media').getPublicUrl(uploadData.path);
      mediaUrl = urlData.publicUrl;
      console.log('File uploaded, URL:', mediaUrl);
    }

    // Insert report
    console.log('Inserting report into Supabase...');
    const { data: reportData, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert([{ 
        issue_type: issueType, 
        description, 
        media_url: mediaUrl, 
        user_id: user.id, 
        lat: lat ? parseFloat(lat) : null, 
        lon: lon ? parseFloat(lon) : null 
      }])
      .select().single();
    if (insertError) throw insertError;
    console.log('Report inserted:', reportData);

    // Index in Elastic if location provided
    if (lat && lon && extractor) {
      console.log('Indexing report in Elastic...');
      const embeddingForIndex = await extractor(description, { pooling: 'mean', normalize: true });
      const vectorForIndex = Array.from(embeddingForIndex.data);
      await elasticClient.index({
        index: 'civiq-reports',
        id: reportData.id.toString(),
        document: {
          description,
          description_vector: vectorForIndex,
          location: { lat: parseFloat(lat), lon: parseFloat(lon) },
          supabase_id: reportData.id,
          issue_type: issueType,
        },
      });
      console.log('Report indexed in Elastic.');
    }

    // Notify admins
    console.log('Sending notifications to admins...');
    const { data: admins, error: adminError } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
    if (!adminError && admins) {
      for (const admin of admins) {
        await createNotification(admin.id, reportData.id, `New report submitted: ${issueType}.`, 'new_report');
        console.log('Notification sent to admin:', admin.id);
      }
    }

    console.log('--- Report submission complete ---');
    res.status(201).json({ message: 'Report submitted successfully!', data: reportData });
  } catch (error) {
    console.error('--- DETAILED ERROR ---', error);
    res.status(500).json({ message: `Backend Error: ${error.message}` });
  }
});


app.patch('/api/admin/reports/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required.' });

    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'New status is required.' });

    const { data: currentReport, error: reportError } = await supabaseAdmin.from('reports').select('*').eq('id', id).single();
    if (reportError || !currentReport) return res.status(404).json({ message: 'Report not found.' });

    const updateData = { status };
    if (status === 'submitted') {
      updateData.in_progress_at = null;
      updateData.resolved_at = null;
    } else if (status === 'in_progress') {
      updateData.in_progress_at = new Date().toISOString();
      updateData.resolved_at = null;
    } else if (status === 'resolved') {
      if (!currentReport.in_progress_at) {
        updateData.in_progress_at = new Date().toISOString();
      }
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: updatedReport, error: updateError } = await supabaseAdmin.from('reports').update(updateData).eq('id', id).select().single();
    if (updateError) throw updateError;

    if (status === 'resolved' && currentReport.status !== 'resolved') {
      generateAndSaveBadge(updatedReport);
    }

    if (updatedReport.user_id !== user.id) {
      const notificationContent = `Your report for "${updatedReport.issue_type}" was updated to: ${status}.`;
      await createNotification(updatedReport.user_id, updatedReport.id, notificationContent, 'status_update');
    }

    res.status(200).json({ message: 'Report status updated successfully', data: updatedReport });
  } catch (error) {
    console.error('Error updating report status:', error.message);
    res.status(500).json({ message: 'Failed to update report status.', error: error.message });
  }
});


app.get('/api/badges/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin.from('badges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ message: 'Failed to fetch badges' });
  }
});

app.post('/api/admin/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
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
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required.' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required.' });
    const { data: users, error: usersError } = await supabaseAdmin.from('profiles').select('id');
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
    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
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
    const { count: unreadCount, error: unreadError } = await supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
    if (unreadError) throw unreadError;
    summary.unreadCount = unreadCount;
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profile && profile.role === 'admin') {
      const { count: newReportCount, error: reportCountError } = await supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'submitted');
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
    const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
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
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
    const { data: reports, error: reportsError } = await supabaseAdmin.from('reports').select('*').order('created_at', { ascending: false });
    if (reportsError) throw reportsError;
    const userIds = [...new Set(reports.map(r => r.user_id).filter(id => id !== null))];
    let combinedData;
    if (userIds.length === 0) {
      combinedData = reports.map(report => ({ ...report, profiles: { email: 'N/A' } }));
    } else {
      const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('id, email').in('id', userIds);
      if (profilesError) throw profilesError;
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      combinedData = reports.map(report => ({
        ...report,
        profiles: { email: profileMap.get(report.user_id)?.email || 'N/A' },
      }));
    }
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
    const { data, error } = await supabaseAdmin.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});