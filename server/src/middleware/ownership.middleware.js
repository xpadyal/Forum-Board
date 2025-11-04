import { AppError } from '../utils/appError.js';
import { prisma } from '../../config.js';

/**
 * Checks ownership of a resource (thread/comment)
 * @param {"thread" | "comment"} type - The resource type to check
 */

export const verifyOwnership = (type) => {
    return async (req, res, next) => {
      try {
        const userId = parseInt(req.user.id);
        const resourceId = parseInt(req.params.id);
  
        if (!userId || !resourceId) {
          return next(new AppError('Invalid user or resource ID', 400));
        }
  
        // Fetch resource based on type
        const resource =
          type === 'thread'
            ? await prisma.thread.findUnique({ where: { id: resourceId }, select: { authorId: true } })
            : await prisma.comment.findUnique({ where: { id: resourceId }, select: { authorId: true } });
  
        if (!resource) {
          return next(new AppError(`${type} not found`, 404));
        }
  
        // Check if user is the owner or admin
        if (req.user.role !== 'admin' && resource.authorId !== userId) {
          return next(new AppError('Not authorized to modify this resource', 403));
        }
  
        next();
      } catch (error) {
        next(error);
      }
    };
  };