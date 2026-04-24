const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';

// Create uploads folder if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const originalExt = path.extname(file.originalname).toLowerCase();

    let safeExt = originalExt;

    if (!safeExt) {
      if (file.mimetype === 'image/png') safeExt = '.png';
      else if (file.mimetype === 'image/webp') safeExt = '.webp';
      else if (file.mimetype === 'image/heic') safeExt = '.heic';
      else if (file.mimetype === 'image/heif') safeExt = '.heif';
      else safeExt = '.jpg';
    }

    cb(null, `${file.fieldname}-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|webp|heic|heif)$/i;

  const hasAllowedExtension = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];

  const hasAllowedMimeType = allowedMimeTypes.includes(file.mimetype);

  /*
    Expo / React Native can sometimes send image uploads as application/octet-stream.
    In that case, accept it only if the file extension is valid.
  */
  const isReactNativeOctetStreamImage =
    file.mimetype === 'application/octet-stream' && hasAllowedExtension;

  if (hasAllowedExtension || hasAllowedMimeType || isReactNativeOctetStreamImage) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Images only. Allowed formats: jpeg, jpg, png, webp, heic, heif'
      )
    );
  }
};

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

module.exports = upload;