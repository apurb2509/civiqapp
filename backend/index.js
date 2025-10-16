const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const { supabase, supabaseAdmin } = require('./lib/supabaseClient');

const app = express();
const PORT = process.env.PORT || 8080;

const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to create a notification
const createNotification = async (userId, reportId, content, type) => {
  const { error } = await supabaseAdmin.from('notifications').insert([{ user_id: userId, report_id: reportId, content: content, type: type }]);
  if (error) console.error('Failed to create notification:', error);
};

app.get('/', (req, res) => { res.status(200).json({ message: 'Welcome to the CiviQ Backend API!' }); });

app.post('/api/reports', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication token is required.' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid or expired token.' });
    const { issueType, description } = req.body;
    const file = req.file;
    let mediaUrl = null;
    if (file) {
      const fileName = `${user.id}/${Date.now()}_${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from('report-media').upload(fileName, file.buffer, { contentType: file.mimetype });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseAdmin.storage.from('report-media').getPublicUrl(uploadData.path);
      mediaUrl = urlData.publicUrl;
    }
    const { data: reportData, error: insertError } = await supabaseAdmin.from('reports').insert([{ issue_type: issueType, description: description, media_url: mediaUrl, user_id: user.id }]).select().single();
    if (insertError) throw insertError;
    const { data: admins, error: adminError } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
    if (adminError) { console.error("Could not fetch admins to notify:", adminError);
    } else if (admins) {
      for (const admin of admins) {
        await createNotification(admin.id, reportData.id, `New report submitted: ${issueType}.`, 'new_report');
      }
    }
    res.status(201).json({ message: 'Report submitted and saved successfully!', data: reportData });
  } catch (error) {
    console.error('--- DETAILED ERROR ---', error);
    res.status(500).json({ message: `Backend Error: ${error.message}`, details: error.details || 'No additional details provided.', code: error.code || 'No code provided.'});
  }
});

app.patch('/api/admin/reports/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'New status is required.' });
    const updateData = { status };
    if (status === 'in_progress') { updateData.in_progress_at = new Date().toISOString(); }
    else if (status === 'resolved') { updateData.resolved_at = new Date().toISOString(); }
    const { data, error } = await supabaseAdmin.from('reports').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    const notificationContent = `Your report for "${data.issue_type}" was updated to: ${status}.`;
    await createNotification(data.user_id, data.id, notificationContent, 'status_update');
    res.status(200).json({ message: 'Report status updated successfully', data });
  } catch (error) {
    console.error('Error updating report status:', error.message);
    res.status(500).json({ message: 'Failed to update report status.', error: error.message });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { data: reports, error: reportsError } = await supabaseAdmin.from('reports').select('*').order('created_at', { ascending: false });
    if (reportsError) throw reportsError;

    // *** THIS IS THE FIX for the "null" uuid error ***
    // Filter out reports with no user_id before querying profiles
    const userIds = [...new Set(reports.map(r => r.user_id).filter(id => id !== null))];
    
    if (userIds.length === 0) {
      // If there are no valid user IDs, just add an empty profiles object to each report
      const combinedData = reports.map(report => ({ ...report, profiles: { email: 'N/A' } }));
      return res.status(200).json(combinedData);
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('id, email').in('id', userIds);
    if (profilesError) throw profilesError;
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const combinedData = reports.map(report => ({
      ...report,
      profiles: { email: profileMap.get(report.user_id)?.email || 'N/A' }
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
    const { data, error } = await supabaseAdmin.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ message: 'Failed to fetch reports.', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});