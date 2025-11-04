import { prisma } from '../../config.js';
import { moderateText } from '../utils/moderation.js';
import { generateAutoReplyToComment } from '../utils/autoReply.js';
import { setTimeout } from 'timers/promises';

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
    const comment = await prisma.comment.create({
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

    // If this is a reply to a comment, check if it's replying to ForumBot
    // and trigger auto-reply asynchronously (non-blocking)
    if (parentId) {
      (async () => {
        await setTimeout(2000); // 2s delay before replying
        try {
          await generateAutoReplyToComment(comment);
        } catch (err) {
          console.error("ForumBot reply to comment async error:", err.message);
        }
      })();
    }

    return comment;
  } catch (error) {
    // If moderation fails, the error will be thrown (content is inappropriate)
    throw error;
  }
};

/**
 * Helper function to build nested comment tree from flat list
 * Supports infinite nesting levels
 * Exported for use in thread.service.js
 */
export function buildCommentTree(comments) {
  // Create a map of comments by ID for quick lookup
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create map and initialize replies array
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build tree structure
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id);
    if (comment.parentId === null) {
      // Root level comment
      rootComments.push(commentWithReplies);
    } else {
      // Nested reply - add to parent's replies array
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    }
  });

  // Sort replies at each level by createdAt
  function sortReplies(comments) {
    comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        sortReplies(comment.replies);
      }
    });
  }

  sortReplies(rootComments);
  return rootComments;
}

/**
 * Get all comments for a thread (nested with infinite depth)
 */
export const getCommentsByThread = async (threadId) => {
  // Fetch ALL comments for the thread (flat list)
  const allComments = await prisma.comment.findMany({
    where: {
      threadId: Number(threadId),
      isDeleted: false,
      moderationStatus: 'approved', // Only show approved comments
    },
    select: {
      id: true,
      content: true,
      authorId: true,
      threadId: true,
      parentId: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      moderationStatus: true,
      author: { select: { username: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Build nested tree structure from flat list
  return buildCommentTree(allComments);
};

/**
 */
export const deleteComment = async (id) => {
  return await prisma.comment.delete({ where: { id: Number(id) } });
};
