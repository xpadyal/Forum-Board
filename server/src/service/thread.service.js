import { prisma } from '../../config.js';
import { moderateText } from '../utils/moderation.js';

export const createThread = async (authorId, title, content) => {
    // Moderate both title and content before creating thread
    try {
      await moderateText(title);
      await moderateText(content);
      
      // If moderation passes, create thread with approved status
      return await prisma.thread.create({
        data: { 
          authorId, 
          title, 
          content,
          moderationStatus: 'approved'
        },
        include: { author: { select: { id: true, username: true } } },
      });
    } catch (error) {
      // If moderation fails, the error will be thrown (content is inappropriate)
      throw error;
    }
  };

export const getAllThreads = async () => {
  return await prisma.thread.findMany({
    where: {
      moderationStatus: 'approved', // Only show approved threads
    },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { username: true } },
      _count: { select: { comments: true } },
    },
  });
};

export const getThreadById = async (id) => {
    return await prisma.thread.findUnique({
      where: { id: Number(id) },
      include: {
        author: { select: { username: true, email: true } },
        comments: {
          where: {
            moderationStatus: 'approved', // Only show approved comments
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
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { comments: true } },
      },
    });
  };
// Will handle authorization in middleware later
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