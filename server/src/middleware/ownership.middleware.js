import { AppError } from '../utils/appError.js';
import { prisma } from '../../config.js';

/**
 * Checks ownership of a resource (thread/comment)
 * @param {"thread" | "comment"} type - The resource type to check
 */

export const verifyOwnership = (type) => {
    return async (req, res, next) => {
      try {
        // Convert user ID to BigInt for comparison (Prisma returns BigInt)
        if (!req.user?.id || !req.params?.id) {
          return next(new AppError('Invalid user or resource ID', 400));
        }
        
        const userId = BigInt(req.user.id);
        const resourceId = BigInt(req.params.id);
  
        // Fetch resource based on type
        const resource =
          type === 'thread'
            ? await prisma.thread.findUnique({ where: { id: Number(resourceId) }, select: { authorId: true } })
            : await prisma.comment.findUnique({ where: { id: Number(resourceId) }, select: { authorId: true } });
  
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