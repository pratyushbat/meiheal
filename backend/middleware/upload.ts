import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req:any, file:any, cb:any) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images allowed'));
    }
    cb(null, true);
  }
});


export default upload;
