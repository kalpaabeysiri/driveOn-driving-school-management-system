const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');

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
  const allowedExt = /\.(jpg|jpeg|png|webp|gif|mp4|mov|webm|pdf|doc|docx)$/i;
  if (allowedExt.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error('Allowed files: images (jpg, png, webp), videos (mp4, mov), PDFs, and documents (doc, docx)'));
  }
};

const materialUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

module.exports = materialUpload;
