import { Router } from 'express';
import { createComment, getCommentsByThread, deleteComment } from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();

router.post('/', authenticate, createComment);
router.get('/thread/:threadId', getCommentsByThread);
router.delete('/:id', authenticate, deleteComment);

export default router;