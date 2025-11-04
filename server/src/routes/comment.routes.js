import { Router } from 'express';
import { createComment, getCommentsByThread, deleteComment } from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { verifyOwnership } from '../middleware/ownership.middleware.js';
const router = Router();

router.post('/', authenticate, createComment);
router.get('/thread/:threadId', getCommentsByThread);
router.delete('/:id', authenticate, verifyOwnership('comment'), deleteComment);

export default router;