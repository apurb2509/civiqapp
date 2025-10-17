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

const createNotification = async (userId, reportId, content, type) => {
  const { data, error } = await supabaseAdmin.from('notifications').insert([{ user_id: userId, report_id: reportId, content: content, type: type }]).select().single();
  if (error) { console.error('Failed to create notification:', error); return; }
  const channel = supabaseAdmin.channel(`notifications:${userId}`);
  channel.send({ type: 'broadcast', event: 'new_notification', payload: data });
};

app.get('/', (req, res) => { res.status(200).json({ message: 'Welcome to the CiviQ Backend API!' }); });

app.post('/api/reports', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication token is required.' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid or expired token.' });
    const { issueType, description } = req.body;
    if (!issueType) return res.status(400).json({ message: 'Issue Type cannot be null or empty.' });
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

    const adminChannel = supabaseAdmin.channel('reports');
    adminChannel.send({ type: 'broadcast', event: 'new_report', payload: reportData });
    
    res.status(201).json({ message: 'Report submitted and saved successfully!', data: reportData });
  } catch (error) {
    console.error('--- DETAILED ERROR ---', error);
    res.status(500).json({ message: `Backend Error: ${error.message}`});
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
    if (status === 'submitted') {
      updateData.in_progress_at = null;
      updateData.resolved_at = null;
    } else if (status === 'in_progress') {
      updateData.in_progress_at = new Date().toISOString();
      updateData.resolved_at = null;
    } else if (status === 'resolved') {
      const { data: currentReport } = await supabaseAdmin.from('reports').select('in_progress_at').eq('id', id).single();
      if (!currentReport.in_progress_at) {
        updateData.in_progress_at = new Date().toISOString();
      }
      updateData.resolved_at = new Date().toISOString();
    }
    
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

app.post('/api/admin/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ message: 'Invalid user.' });
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
    const { recipient_id, report_id, content } = req.body;
    if (!recipient_id || !content) return res.status(400).json({ message: 'Recipient and content are required.' });
    await createNotification(recipient_id, report_id, content, 'admin_message');
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
    if (profileError || profile.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
    
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required.' });
    
    const { data: users, error: usersError } = await supabaseAdmin.from('profiles').select('id');
    if (usersError) throw usersError;

    for (const u of users) {
      await createNotification(u.id, null, content, 'broadcast');
    }
    res.status(200).json({ message: 'Broadcast sent successfully.' });
  } catch(error) {
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

app.get('/api/notifications', async (req, res) => { try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Authentication required.' }); const { data: { user }, error: userError } = await supabase.auth.getUser(token); if (userError || !user) return res.status(401).json({ message: 'Invalid user.' }); const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (error) throw error; res.status(200).json(data); } catch(error) { res.status(500).json({ message: 'Failed to fetch notifications.' }); } });
app.get('/api/admin/reports', async (req, res) => { try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Authentication required.' }); const { data: { user }, error: userError } = await supabase.auth.getUser(token); if (userError || !user) return res.status(401).json({ message: 'Invalid user.' }); const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single(); if (profileError || profile.role !== 'admin') { return res.status(403).json({ message: 'Admin access required.' }); } const { data: reports, error: reportsError } = await supabaseAdmin.from('reports').select('*').order('created_at', { ascending: false }); if (reportsError) throw reportsError; const userIds = [...new Set(reports.map(r => r.user_id).filter(id => id !== null))]; if (userIds.length === 0) { const combinedData = reports.map(report => ({ ...report, profiles: { email: 'N/A' } })); return res.status(200).json(combinedData); } const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('id, email').in('id', userIds); if (profilesError) throw profilesError; const profileMap = new Map(profiles.map(p => [p.id, p])); const combinedData = reports.map(report => ({ ...report, profiles: { email: profileMap.get(report.user_id)?.email || 'N/A' } })); res.status(200).json(combinedData); } catch (error) { console.error('Error fetching admin reports:', error.message); res.status(500).json({ message: 'Failed to fetch admin reports.', error: error.message }); } });
app.get('/api/reports', async (req, res) => { try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(200).json([]); const { data: { user }, error: userError } = await supabase.auth.getUser(token); if (userError || !user) return res.status(200).json([]); const { data, error } = await supabaseAdmin.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (error) throw error; res.status(200).json(data); } catch (error) { res.status(500).json({ message: 'Failed to fetch reports.'}); } });
app.listen(PORT, () => { console.log(`Server is running on http://localhost:${PORT}`); });