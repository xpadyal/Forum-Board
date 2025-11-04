import * as commentService from '../service/comment.service.js';

/**
 * POST /api/comments
 */
export const createComment = async (req, res, next) => {
  try {
    const { threadId, parentId, content } = req.body;
    const authorId = BigInt(req.user.id);

    const comment = await commentService.createComment(
      authorId,
      threadId,
      parentId,
      content
    );

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/threads/:threadId/comments
 */
export const getCommentsByThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const comments = await commentService.getCommentsByThread(threadId);
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/comments/:id
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await commentService.deleteComment(id);
    res.json({ message: 'Comment deleted successfully', deleted });
  } catch (err) {
    next(err);
  }
};
