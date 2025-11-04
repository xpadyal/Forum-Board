import { prisma } from '../../config.js';
import { moderateText } from '../utils/moderation.js';
import { generateAutoReply } from '../utils/autoReply.js';
import { setTimeout } from 'timers/promises';
import { buildCommentTree } from './comment.service.js';
export const createThread = async (authorId, title, content, attachments = []) => {
    // Moderate both title and content before creating thread
    try {
      await moderateText(title);
      await moderateText(content);
      
      // If moderation passes, create thread with approved status
      const thread = await prisma.thread.create({
        data: { 
          authorId, 
          title, 
          content,
          moderationStatus: 'approved',
          attachments: attachments.length > 0 ? {
            create: attachments.map(att => ({
              fileUrl: att.fileUrl,
              mimeType: att.mimeType,
            }))
          } : undefined,
        },
        include: { 
          author: { select: { id: true, username: true } },
          attachments: true,
        },
      });
      // Run delayed reply asynchronously (non-blocking)
      (async () => {
        await setTimeout(3000); // 3s delay
        try {
          await generateAutoReply(thread);
        } catch (err) {
          console.error("ForumBot async error:", err.message);
        }
      })();

      return thread;
    } catch (error) {
      // If moderation fails, the error will be thrown (content is inappropriate)
      throw error;
    }
  };

export const getAllThreads = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  // Get total count for pagination metadata
  const total = await prisma.thread.count({
    where: {
      moderationStatus: 'approved',
    },
  });

  const threads = await prisma.thread.findMany({
    where: {
      moderationStatus: 'approved', // Only show approved threads
    },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { username: true } },
      attachments: true, // Include attachments in thread listing
      _count: { select: { comments: true } },
    },
    skip,
    take: limit,
  });

  return {
    threads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + threads.length < total,
    },
  };
};

export const getThreadById = async (id) => {
    // Fetch thread with basic info
    const thread = await prisma.thread.findUnique({
      where: { id: Number(id) },
      include: {
        author: { select: { username: true, email: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!thread) {
      return null;
    }

    // Fetch ALL comments for the thread (flat list) - supports infinite nesting
    const allComments = await prisma.comment.findMany({
      where: {
        threadId: Number(id),
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
    const nestedComments = buildCommentTree(allComments);

    // Return thread with nested comments
    return {
      ...thread,
      comments: nestedComments,
    };
  };

  export const deleteThread = async (id) => {
    return await prisma.thread.delete({ where: { id: Number(id) } });
  };

export const updateThread = async (id, title, content) => {
  // Moderate updated content
  try {
    await moderateText(title);
    await moderateText(content);
    
    // If moderation passes, update thread with approved status
    return await prisma.thread.update({
      where: { id: Number(id) },
      data: { 
        title, 
        content,
        moderationStatus: 'approved'
      },
    });
  } catch (error) {
    // If moderation fails, the error will be thrown
    throw error;
  }
};