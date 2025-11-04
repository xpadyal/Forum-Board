import * as threadService from '../service/thread.service.js';

/**
 * POST /api/threads
 * Body: { title, content, attachments?: [{ fileUrl, mimeType }] }
 */
export const createThread = async (req, res, next) => {
    try {
      const { title, content, attachments } = req.body;
      // Convert string ID from JWT to BigInt for Prisma
      const authorId = BigInt(req.user.id);
  
      const thread = await threadService.createThread(authorId, title, content, attachments || []);
      res.status(201).json(thread);
    } catch (err) {
      next(err);
    }
  };

/**
 * GET /api/threads
 * Query params: page (default: 1), limit (default: 10)
 */
export const getAllThreads = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await threadService.getAllThreads(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

/**
 * GET /api/threads/:id
 */
export const getThreadById = async (req, res, next) => {
    try {
      const thread = await threadService.getThreadById(req.params.id);
      if (!thread) return res.status(404).json({ message: 'Thread not found' });
      res.json(thread);
    } catch (err) {
      next(err);
    }
  };

  /**
 * DELETE /api/threads/:id
 */
export const deleteThread = async (req, res, next) => {
    try {
      const deleted = await threadService.deleteThread(req.params.id);
      res.json({ message: 'Thread deleted successfully', deleted });
    } catch (err) {
      next(err);
    }
  };

/**
 * PUT /api/threads/:id
 */
export const updateThread = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const updated = await threadService.updateThread(req.params.id, title, content);
    res.json({ message: 'Thread updated successfully', updated });
  } catch (err) {
    next(err);
  }
};