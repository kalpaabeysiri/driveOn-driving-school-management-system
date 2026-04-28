const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(mp4|mov|webm|m4v)$/i;
  const extOk = allowedExt.test(path.extname(file.originalname));
  const mimeOk = /^video\//.test(file.mimetype);

  if (extOk && mimeOk) cb(null, true);
  else cb(new Error('Videos only (mp4, mov, webm, m4v)'));
};

const videoUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter,
});

module.exports = videoUpload;
