import { prisma } from '../../config.js';

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

  return await prisma.comment.create({
    data: {
      authorId,
      threadId: threadReferenceId,
      parentId,
      content,
    },
    include: {
      author: { select: { username: true } },
    },
  });
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
    },
    include: {
      author: { select: { username: true } },
      replies: {
        include: {
          author: { select: { username: true } },
          replies: true, // nested replies recursively
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
