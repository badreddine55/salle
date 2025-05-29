const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder must exist
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// POST /api/pdf/upload
router.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  res.status(200).json({
    success: true,
    message: 'PDF uploaded successfully',
    filename: req.file.filename,
    path: req.file.path,
  });
});

module.exports = router;
