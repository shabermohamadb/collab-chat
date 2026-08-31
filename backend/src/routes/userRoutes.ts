import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.patch('/profile', userController.updateProfile);
router.get('/search', userController.searchUsers);

export default router;
