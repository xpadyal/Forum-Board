import { AppError } from '../utils/appError.js';
import { prisma } from '../../config.js';

/**
 * Checks ownership of a resource (thread/comment)
 * - Thread: Only the thread owner can delete/modify their thread
 * - Comment: The comment owner OR the thread owner can delete the comment
 * - Admin: Admin users can delete/modify any resource
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
        const resourceId = Number(req.params.id);
  
        // Admin users can delete anything
        if (req.user.role === 'admin') {
          return next();
        }

        if (type === 'thread') {
          // Check if user is the thread owner
          const thread = await prisma.thread.findUnique({ 
            where: { id: resourceId }, 
            select: { authorId: true } 
          });
  
          if (!thread) {
            return next(new AppError('Thread not found', 404));
          }
  
          if (thread.authorId !== userId) {
            return next(new AppError('Not authorized to modify this thread', 403));
          }
        } else if (type === 'comment') {
          // For comments: check if user is comment owner OR thread owner
          const comment = await prisma.comment.findUnique({ 
            where: { id: resourceId },
            include: {
              thread: {
                select: { authorId: true }
              }
            }
          });
  
          if (!comment) {
            return next(new AppError('Comment not found', 404));
          }
  
          const isCommentOwner = comment.authorId === userId;
          const isThreadOwner = comment.thread.authorId === userId;
  
          // Allow if user is comment owner OR thread owner
          if (!isCommentOwner && !isThreadOwner) {
            return next(new AppError('Not authorized to delete this comment', 403));
          }
        }
  
        next();
      } catch (error) {
        next(error);
      }
    };
  };