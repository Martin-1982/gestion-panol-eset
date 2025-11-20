const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const pool = require('../db');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// multer storage: save into uploads/YYYY/MM
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const d = new Date();
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const destDir = path.join(UPLOAD_DIR, yyyy, mm);
      fs.mkdirSync(destDir, { recursive: true });
      cb(null, destDir);
    } catch (e) {
      try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (err) {}
      cb(null, UPLOAD_DIR);
    }
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') : 'file';
    cb(null, `${ts}_${safe}`);
  }
});

const upload = multer({ storage });

// POST /api/files/upload
// field: file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filename = req.file.filename;
    const originalPath = req.file.path;
    const relPath = path.relative(path.join(__dirname, '..', '..', 'uploads'), path.join(path.dirname(originalPath), filename)).replace(/\\/g, '/');
    const fileUrl = `/uploads/${relPath}`;
    return res.json({ ok: true, fileUrl, filename });
  } catch (err) {
    console.error('Error saving uploaded file:', err);
    return res.status(500).json({ error: 'Error saving file' });
  }
});

// GET /api/files/list?dir=YYYY/MM
// devuelve lista de archivos en uploads/<dir>
router.get('/list', auth, async (req, res) => {
  try {
    const dir = req.query.dir || '';
    const safe = path.normalize(dir).replace(/^\/+/, '');
    if (safe.includes('..')) return res.status(400).json({ error: 'Invalid directory' });

    const target = path.join(__dirname, '..', '..', 'uploads', safe);
    const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
    if (!target.startsWith(uploadsRoot)) return res.status(400).json({ error: 'Invalid directory' });

    if (!fs.existsSync(target)) return res.json({ files: [] });

    const items = fs.readdirSync(target, { withFileTypes: true });
    const files = items.filter(it => it.isFile()).map(f => f.name);
    return res.json({ files });
  } catch (e) {
    console.error('Error listing files:', e);
    return res.status(500).json({ error: 'Error listing files' });
  }
});

module.exports = router;
