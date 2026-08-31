import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../utils/config.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const config = getConfig();

export const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileUploadSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.allowedFileExtensions.includes(ext) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed.`));
    }
  },
});
