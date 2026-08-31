import { Router } from 'express';
import * as roomController from '../controllers/roomController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', roomController.create);
router.get('/', roomController.getUserRooms);
router.get('/user', roomController.getUserRooms);
router.get('/public', roomController.getPublicRooms);
router.get('/:id', roomController.getRoom);
router.post('/:id/join', roomController.join);
router.post('/:id/leave', roomController.leave);
router.patch('/:id', roomController.update);
router.delete('/:id', roomController.remove);
router.post('/direct-message', roomController.directMessage);

export default router;
