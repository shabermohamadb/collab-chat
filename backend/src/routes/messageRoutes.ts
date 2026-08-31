import { Router } from 'express';
import * as messageController from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', messageController.sendMessage);
router.get('/room/:roomId', messageController.getMessages);
router.patch('/:id', messageController.edit);
router.delete('/:id', messageController.remove);
router.post('/:id/react', messageController.react);
router.get('/:id/thread', messageController.getThread);

export default router;
