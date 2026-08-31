import { Router } from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadController.uploadFile);

export default router;
