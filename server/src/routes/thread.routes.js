import { Router } from 'express';
import { createThread, getAllThreads, getThreadById, deleteThread, updateThread } from '../controllers/thread.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { verifyOwnership } from '../middleware/ownership.middleware.js';

const router = Router();

// Public: list all threads
router.get('/', getAllThreads);

// Public: get one thread
router.get('/:id', getThreadById);

// Authenticated: create thread
router.post('/', authenticate, createThread);


router.delete('/:id', authenticate, verifyOwnership('thread'), deleteThread);


router.put('/:id', authenticate, verifyOwnership('thread'), updateThread);

export default router;