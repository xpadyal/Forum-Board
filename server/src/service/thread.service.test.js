import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createThread } from './thread.service.js';
import { moderateText } from '../utils/moderation.js';
import { generateAutoReply } from '../utils/autoReply.js';
import { prisma } from '../../config.js';
import { setTimeout } from 'timers/promises';

// Mock dependencies
vi.mock('../utils/moderation.js', () => ({
  moderateText: vi.fn(),
}));

vi.mock('../utils/autoReply.js', () => ({
  generateAutoReply: vi.fn(),
}));

vi.mock('../../config.js', async (importOriginal) => {
  return {
    prisma: {
      thread: {
        create: vi.fn(),
      },
    },
    openai: {
      moderations: {
        create: vi.fn(),
      },
    },
  };
});

// Mock timers/promises
vi.mock('timers/promises', () => ({
  setTimeout: vi.fn(),
}));

describe('createThread - Auto-reply Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to resolve immediately for faster tests
    setTimeout.mockResolvedValue(undefined);
    // Make sure the mocked setTimeout actually resolves when called
    setTimeout.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful thread creation with auto-reply', () => {
    it('should create thread and trigger auto-reply after delay', async () => {
      const authorId = BigInt(1);
      const title = 'Test Thread Title';
      const content = 'Test thread content';

      const mockThread = {
        id: BigInt(1),
        title,
        content,
        authorId,
        moderationStatus: 'approved',
        author: { id: BigInt(1), username: 'testuser' },
      };

      moderateText.mockResolvedValue(true);
      prisma.thread.create.mockResolvedValue(mockThread);
      generateAutoReply.mockResolvedValue(undefined);

      const result = await createThread(authorId, title, content);

      // Verify moderation was called for both title and content
      expect(moderateText).toHaveBeenCalledTimes(2);
      expect(moderateText).toHaveBeenCalledWith(title);
      expect(moderateText).toHaveBeenCalledWith(content);

      // Verify thread was created
      expect(prisma.thread.create).toHaveBeenCalledWith({
        data: {
          authorId,
          title,
          content,
          moderationStatus: 'approved',
        },
        include: { author: { select: { id: true, username: true } } },
      });

      // Verify result is returned
      expect(result).toEqual(mockThread);

      // Wait for async IIFE to execute (setTimeout mock resolves immediately)
      await new Promise((resolve) => {
        // Use global setTimeout, not the mocked one
        global.setTimeout(() => resolve(), 50);
      });

      // Verify auto-reply was triggered after delay
      expect(setTimeout).toHaveBeenCalledWith(3000);
      expect(generateAutoReply).toHaveBeenCalledWith(mockThread);
    });

    it('should return thread immediately without waiting for auto-reply', async () => {
      const authorId = BigInt(2);
      const title = 'Quick Thread';
      const content = 'Quick content';

      const mockThread = {
        id: BigInt(2),
        title,
        content,
        authorId,
        moderationStatus: 'approved',
        author: { id: BigInt(2), username: 'user2' },
      };

      moderateText.mockResolvedValue(true);
      prisma.thread.create.mockResolvedValue(mockThread);
      generateAutoReply.mockResolvedValue(undefined);

      const startTime = Date.now();
      const result = await createThread(authorId, title, content);
      const endTime = Date.now();

      // Should return quickly (not wait for 3s delay)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result).toEqual(mockThread);
    });
  });

  describe('auto-reply error handling', () => {
    it('should not throw error if auto-reply fails', async () => {
      const authorId = BigInt(3);
      const title = 'Test Thread';
      const content = 'Test content';

      const mockThread = {
        id: BigInt(3),
        title,
        content,
        authorId,
        moderationStatus: 'approved',
        author: { id: BigInt(3), username: 'user3' },
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      moderateText.mockResolvedValue(true);
      prisma.thread.create.mockResolvedValue(mockThread);
      generateAutoReply.mockRejectedValue(new Error('Auto-reply failed'));

      // Should not throw error
      const result = await createThread(authorId, title, content);
      expect(result).toEqual(mockThread);

      // Wait for async error handling
      await new Promise((resolve) => {
        global.setTimeout(() => resolve(), 50);
      });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ForumBot async error:',
        'Auto-reply failed'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle Groq API errors in auto-reply gracefully', async () => {
      const authorId = BigInt(4);
      const title = 'Test Thread';
      const content = 'Test content';

      const mockThread = {
        id: BigInt(4),
        title,
        content,
        authorId,
        moderationStatus: 'approved',
        author: { id: BigInt(4), username: 'user4' },
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      moderateText.mockResolvedValue(true);
      prisma.thread.create.mockResolvedValue(mockThread);
      generateAutoReply.mockRejectedValue(new Error('Groq API unavailable'));

      const result = await createThread(authorId, title, content);
      expect(result).toEqual(mockThread);

      await new Promise((resolve) => {
        global.setTimeout(() => resolve(), 50);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ForumBot async error:',
        'Groq API unavailable'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('moderation failure', () => {
    it('should not trigger auto-reply if moderation fails', async () => {
      const authorId = BigInt(5);
      const title = 'Inappropriate Title';
      const content = 'Inappropriate content';

      const { AppError } = await import('../utils/appError.js');
      // Mock to reject on both title and content moderation
      moderateText.mockRejectedValue(new AppError('Inappropriate content', 400));

      await expect(createThread(authorId, title, content)).rejects.toThrow();

      // Should not create thread
      expect(prisma.thread.create).not.toHaveBeenCalled();

      // Should not trigger auto-reply
      await new Promise((resolve) => {
        global.setTimeout(() => resolve(), 10);
      });
      expect(generateAutoReply).not.toHaveBeenCalled();
    });

    it('should not trigger auto-reply if title moderation fails', async () => {
      const authorId = BigInt(6);
      const title = 'Bad Title';
      const content = 'Good content';

      const { AppError } = await import('../utils/appError.js');
      moderateText
        .mockRejectedValueOnce(new AppError('Inappropriate title', 400))
        .mockResolvedValueOnce(true);

      await expect(createThread(authorId, title, content)).rejects.toThrow();

      expect(prisma.thread.create).not.toHaveBeenCalled();
      expect(generateAutoReply).not.toHaveBeenCalled();
    });

    it('should not trigger auto-reply if content moderation fails', async () => {
      const authorId = BigInt(7);
      const title = 'Good Title';
      const content = 'Bad content';

      const { AppError } = await import('../utils/appError.js');
      // Reset mock and set up sequential calls: first (title) succeeds, second (content) fails
      moderateText.mockReset();
      moderateText.mockResolvedValueOnce(true);
      moderateText.mockRejectedValueOnce(new AppError('Inappropriate content', 400));

      await expect(createThread(authorId, title, content)).rejects.toThrow('Inappropriate content');

      expect(prisma.thread.create).not.toHaveBeenCalled();
      await new Promise((resolve) => {
        global.setTimeout(() => resolve(), 10);
      });
      expect(generateAutoReply).not.toHaveBeenCalled();
    });
  });

  describe('thread creation failure', () => {
    it('should not trigger auto-reply if thread creation fails', async () => {
      const authorId = BigInt(8);
      const title = 'Test Thread';
      const content = 'Test content';

      // Reset and set up mocks: both moderation calls should succeed
      moderateText.mockReset();
      moderateText.mockResolvedValue(true);
      prisma.thread.create.mockRejectedValue(new Error('Database error'));

      await expect(createThread(authorId, title, content)).rejects.toThrow('Database error');

      // Should not trigger auto-reply
      await new Promise((resolve) => {
        global.setTimeout(() => resolve(), 10);
      });
      expect(generateAutoReply).not.toHaveBeenCalled();
    });
  });

  describe('delayed auto-reply execution', () => {
    it('should call setTimeout with 3000ms delay', async () => {
      const authorId = BigInt(9);
      const title = 'Test Thread';
      const content = 'Test content';

      const mockThread = {
        id: BigInt(9),
        title,
        content,
        authorId,
        moderationStatus: 'approved',
        author: { id: BigInt(9), username: 'user9' },
      };

      moderateText.mockResolvedValue(true);
      prisma.thread.create.mockResolvedValue(mockThread);
      generateAutoReply.mockResolvedValue(undefined);

      await createThread(authorId, title, content);

      // Verify setTimeout was called with 3000ms
      expect(setTimeout).toHaveBeenCalledWith(3000);
    });

    it('should call generateAutoReply after setTimeout resolves', async () => {
      const authorId = BigInt(10);
      const title = 'Test Thread';
      const content = 'Test content';

      const mockThread = {
        id: BigInt(10),
        title,
        content,
        authorId,
        moderationStatus: 'approved',
        author: { id: BigInt(10), username: 'user10' },
      };

      moderateText.mockResolvedValue(true);
      prisma.thread.create.mockResolvedValue(mockThread);
      generateAutoReply.mockResolvedValue(undefined);

      // Reset mocks to track order
      setTimeout.mockClear();
      generateAutoReply.mockClear();

      await createThread(authorId, title, content);

      // setTimeout should be called first
      expect(setTimeout).toHaveBeenCalled();

      // Wait for async execution
      await new Promise((resolve) => {
        global.setTimeout(() => resolve(), 50);
      });

      // generateAutoReply should be called after setTimeout resolves
      expect(generateAutoReply).toHaveBeenCalledWith(mockThread);
    });
  });
});

