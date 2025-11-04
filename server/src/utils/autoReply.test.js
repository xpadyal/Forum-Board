import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateAutoReply } from './autoReply.js';

// Mock Groq SDK - create mock function inside the factory
const mockCreateCompletion = vi.fn();

vi.mock('groq-sdk', () => {
  const mockCreateCompletion = vi.fn();
  return {
    default: class Groq {
      constructor() {
        this.chat = {
          completions: {
            get create() {
              return mockCreateCompletion;
            },
          },
        };
      }
    },
    __mockCreateCompletion: mockCreateCompletion,
  };
});

// Mock config.js including OpenAI
vi.mock('../../config.js', async (importOriginal) => {
  return {
    prisma: {
      comment: {
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

describe('generateAutoReply', () => {
  let mockCreateCompletion;

  beforeEach(async () => {
    // Reset environment variables
    process.env.FORUMBOT_ID = '1';
    process.env.GROQ_API_KEY = 'test-api-key';

    // Get the mock function from the module
    const groqModule = await import('groq-sdk');
    mockCreateCompletion = groqModule.__mockCreateCompletion;

    // Reset all mocks
    vi.clearAllMocks();
    mockCreateCompletion.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful auto-reply generation', () => {
    it('should generate and save a reply when Groq API returns valid response', async () => {
      const mockThread = {
        id: BigInt(1),
        title: 'Test Thread',
        content: 'This is a test thread content.',
      };

      const mockReply = 'Great thread! Looking forward to the discussion.';
      const mockCompletion = {
        choices: [
          {
            message: {
              content: mockReply,
            },
          },
        ],
      };

      const { prisma } = await import('../../config.js');
      
      mockCreateCompletion.mockResolvedValue(mockCompletion);
      prisma.comment.create.mockResolvedValue({
        id: BigInt(1),
        content: mockReply,
        threadId: mockThread.id,
      });

      await generateAutoReply(mockThread);

      // Verify Groq API was called with correct parameters
      expect(mockCreateCompletion).toHaveBeenCalledWith({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are ForumBot, a helpful and friendly AI participant.',
          },
          {
            role: 'user',
            content: expect.stringContaining('Test Thread'),
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
      });

      // Verify prompt contains thread title and content
      const callArgs = mockCreateCompletion.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('Test Thread');
      expect(callArgs.messages[1].content).toContain('This is a test thread content.');

      // Verify comment was created with correct data
      const { prisma: prismaImport } = await import('../../config.js');
      expect(prismaImport.comment.create).toHaveBeenCalledWith({
        data: {
          content: mockReply,
          authorId: 1, // FORUMBOT_ID from env
          threadId: mockThread.id,
          moderationStatus: 'approved',
        },
      });
    });

    it('should handle different thread content correctly', async () => {
      const mockThread = {
        id: BigInt(2),
        title: 'Another Thread',
        content: 'Different content here with more details.',
      };

      const mockReply = 'Interesting topic! Thanks for sharing.';
      mockCreateCompletion.mockResolvedValue({
        choices: [{ message: { content: mockReply } }],
      });
      const { prisma } = await import('../../config.js');
      prisma.comment.create.mockResolvedValue({ id: BigInt(2) });

      await generateAutoReply(mockThread);

      const callArgs = mockCreateCompletion.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('Another Thread');
      expect(callArgs.messages[1].content).toContain('Different content here with more details.');
    });

    it('should trim whitespace from the generated reply', async () => {
      const mockThread = {
        id: BigInt(3),
        title: 'Test',
        content: 'Content',
      };

      const replyWithWhitespace = '   \n  This is a reply with whitespace  \n  ';
      mockCreateCompletion.mockResolvedValue({
        choices: [{ message: { content: replyWithWhitespace } }],
      });
      const { prisma } = await import('../../config.js');
      prisma.comment.create.mockResolvedValue({ id: BigInt(3) });

      await generateAutoReply(mockThread);

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: 'This is a reply with whitespace',
        }),
      });
    });
  });

  describe('error handling', () => {
    it('should handle empty reply from Groq API gracefully', async () => {
      const mockThread = {
        id: BigInt(4),
        title: 'Test Thread',
        content: 'Content',
      };

      // Mock console.warn to verify it's called
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockCreateCompletion.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });

      await generateAutoReply(mockThread);

      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ ForumBot did not generate a reply.');
      const { prisma } = await import('../../config.js');
      expect(prisma.comment.create).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle null reply from Groq API gracefully', async () => {
      const mockThread = {
        id: BigInt(5),
        title: 'Test Thread',
        content: 'Content',
      };

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockCreateCompletion.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await generateAutoReply(mockThread);

      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ ForumBot did not generate a reply.');
      const { prisma } = await import('../../config.js');
      expect(prisma.comment.create).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle missing choices in Groq response', async () => {
      const mockThread = {
        id: BigInt(6),
        title: 'Test Thread',
        content: 'Content',
      };

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockCreateCompletion.mockResolvedValue({
        choices: [],
      });

      await generateAutoReply(mockThread);

      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ ForumBot did not generate a reply.');
      const { prisma } = await import('../../config.js');
      expect(prisma.comment.create).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle Groq API errors gracefully', async () => {
      const mockThread = {
        id: BigInt(7),
        title: 'Test Thread',
        content: 'Content',
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const apiError = new Error('Groq API error');
      mockCreateCompletion.mockRejectedValue(apiError);

      await generateAutoReply(mockThread);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ ForumBot auto-reply failed:',
        'Groq API error'
      );
      const { prisma } = await import('../../config.js');
      expect(prisma.comment.create).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle Prisma database errors gracefully', async () => {
      const mockThread = {
        id: BigInt(8),
        title: 'Test Thread',
        content: 'Content',
      };

      const mockReply = 'Test reply';
      mockCreateCompletion.mockResolvedValue({
        choices: [{ message: { content: mockReply } }],
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { prisma } = await import('../../config.js');
      const dbError = new Error('Database connection failed');
      prisma.comment.create.mockRejectedValue(dbError);

      await generateAutoReply(mockThread);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ ForumBot auto-reply failed:',
        'Database connection failed'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle network timeout errors', async () => {
      const mockThread = {
        id: BigInt(9),
        title: 'Test Thread',
        content: 'Content',
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const timeoutError = new Error('Request timeout');
      mockCreateCompletion.mockRejectedValue(timeoutError);

      await generateAutoReply(mockThread);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ ForumBot auto-reply failed:',
        'Request timeout'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('prompt generation', () => {
    it('should include correct system and user messages in prompt', async () => {
      const mockThread = {
        id: BigInt(10),
        title: 'Specific Title',
        content: 'Specific Content',
      };

      mockCreateCompletion.mockResolvedValue({
        choices: [{ message: { content: 'Reply' } }],
      });
      const { prisma } = await import('../../config.js');
      prisma.comment.create.mockResolvedValue({ id: BigInt(10) });

      await generateAutoReply(mockThread);

      const callArgs = mockCreateCompletion.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0]).toEqual({
        role: 'system',
        content: 'You are ForumBot, a helpful and friendly AI participant.',
      });
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.messages[1].content).toContain('Specific Title');
      expect(callArgs.messages[1].content).toContain('Specific Content');
    });

    it('should escape or handle special characters in thread content', async () => {
      const mockThread = {
        id: BigInt(11),
        title: 'Thread with "quotes"',
        content: "Content with 'apostrophes' and \n newlines",
      };

      mockCreateCompletion.mockResolvedValue({
        choices: [{ message: { content: 'Reply' } }],
      });
      const { prisma } = await import('../../config.js');
      prisma.comment.create.mockResolvedValue({ id: BigInt(11) });

      await generateAutoReply(mockThread);

      // Should not throw an error and should handle special characters
      expect(mockCreateCompletion).toHaveBeenCalled();
      expect(prisma.comment.create).toHaveBeenCalled();
    });
  });
});

