import { prisma } from '../../config.js';
import { moderateText } from '../utils/moderation.js';

/**
 * Create a comment or reply
 */
export const createComment = async (authorId, threadId, parentId, content) => {
  // Ensure either a thread or a parent comment is referenced
  if (!threadId && !parentId) throw new Error('Comment must belong to a thread or another comment');

  // Fetch parent comment if replying
  let threadReferenceId = threadId;
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: Number(parentId) },
      include: { thread: true },
    });
    if (!parentComment) throw new Error('Parent comment not found');
    // Replies inherit the same thread as their parent
    threadReferenceId = parentComment.threadId;
  }

  // Moderate content before creating comment
  try {
    await moderateText(content);
    
    // If moderation passes, create comment with approved status
    return await prisma.comment.create({
      data: {
        authorId,
        threadId: threadReferenceId,
        parentId,
        content,
        moderationStatus: 'approved',
      },
      include: {
        author: { select: { username: true } },
      },
    });
  } catch (error) {
    // If moderation fails, the error will be thrown (content is inappropriate)
    throw error;
  }
};

/**
 * Get all comments for a thread (nested)
 */
export const getCommentsByThread = async (threadId) => {
  const comments = await prisma.comment.findMany({
    where: {
      threadId: Number(threadId),
      parentId: null, // top-level only
      isDeleted: false,
      moderationStatus: 'approved', // Only show approved comments
    },
    include: {
      author: { select: { username: true } },
      replies: {
        where: {
          moderationStatus: 'approved',
          isDeleted: false,
        },
        include: {
          author: { select: { username: true } },
          replies: {
            where: {
              moderationStatus: 'approved',
              isDeleted: false,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  return comments;
};

/**
 * Delete a comment (ownership check later)
 */
export const deleteComment = async (id) => {
  return await prisma.comment.delete({ where: { id: Number(id) } });
};
