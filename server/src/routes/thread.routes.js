import { Router } from 'express';
import { createThread, getAllThreads, getThreadById, deleteThread, updateThread } from '../controllers/thread.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public: list all threads
router.get('/', getAllThreads);

// Public: get one thread
router.get('/:id', getThreadById);

// Authenticated: create thread
router.post('/', authenticate, createThread);

// Authenticated: delete thread (Will add ownership later)
router.delete('/:id', authenticate, deleteThread);

// Authenticated: update thread (Will add ownership later)
router.put('/:id', authenticate, updateThread);

export default router;