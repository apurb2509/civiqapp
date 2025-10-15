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

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the CiviQ Backend API!' });
});

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
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('report-media')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseAdmin.storage
        .from('report-media')
        .getPublicUrl(uploadData.path);
      
      mediaUrl = urlData.publicUrl;
    }

    const { data: reportData, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert([{ 
          issue_type: issueType, 
          description: description, 
          media_url: mediaUrl,
          user_id: user.id
      }])
      .select();

    if (insertError) throw insertError;

    res.status(201).json({ 
      message: 'Report submitted and saved successfully!',
      data: reportData
    });

  } catch (error) {
    console.error('--- DETAILED ERROR ---', error);
    res.status(500).json({ 
      message: `Backend Error: ${error.message}`, 
      details: error.details || 'No additional details provided.',
      code: error.code || 'No code provided.'
    });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

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