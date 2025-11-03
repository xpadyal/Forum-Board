import { prisma } from '../../config.js';

export const createThread = async (authorId, title, content) => {
    return await prisma.thread.create({
      data: { authorId, title, content },
      include: { author: { select: { id: true, username: true } } },
    });
  };

export const getAllThreads = async () => {
  return await prisma.thread.findMany({
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
          include: {
            author: { select: { username: true } },
            replies: true,
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
  return await prisma.thread.update({
    where: { id: Number(id) },
    data: { title, content },
  });
};