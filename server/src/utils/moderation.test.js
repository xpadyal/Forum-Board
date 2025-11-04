import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { moderateText } from './moderation.js';
import { AppError } from './appError.js';
import { openai } from '../../config.js';

// Mock OpenAI
vi.mock('../../config.js', () => ({
  openai: {
    moderations: {
      create: vi.fn(),
    },
  },
}));

describe('Moderation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('moderateText', () => {
    it('should return true for safe content', async () => {
      // Mock OpenAI response for safe content
      openai.moderations.create.mockResolvedValue({
        results: [
          {
            flagged: false,
            categories: {},
          },
        ],
      });

      const result = await moderateText('This is a safe and friendly comment about technology.');
      
      expect(result).toBe(true);
      expect(openai.moderations.create).toHaveBeenCalledWith({
        model: 'omni-moderation-latest',
        input: 'This is a safe and friendly comment about technology.',
      });
    });

    it('should throw AppError for flagged content', async () => {
      // Mock OpenAI response for flagged content
      openai.moderations.create.mockResolvedValue({
        results: [
          {
            flagged: true,
            categories: {
              hate: true,
              harassment: false,
            },
          },
        ],
      });

      await expect(
        moderateText('This is inappropriate content that should be flagged')
      ).rejects.toThrow(AppError);

      await expect(
        moderateText('This is inappropriate content that should be flagged')
      ).rejects.toThrow('Inappropriate or unsafe content detected');
    });

    it('should throw AppError with 400 status code for flagged content', async () => {
      openai.moderations.create.mockResolvedValue({
        results: [
          {
            flagged: true,
            categories: {
              self_harm: true,
            },
          },
        ],
      });

      try {
        await moderateText('Inappropriate content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Inappropriate or unsafe content detected');
      }
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI API error
      const apiError = new Error('OpenAI API error');
      openai.moderations.create.mockRejectedValue(apiError);

      await expect(
        moderateText('Some content')
      ).rejects.toThrow(AppError);

      await expect(
        moderateText('Some content')
      ).rejects.toThrow('Moderation service unavailable');
    });

    it('should throw AppError with 503 status code when service is unavailable', async () => {
      openai.moderations.create.mockRejectedValue(new Error('Network error'));

      try {
        await moderateText('Some content');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(503);
        expect(error.message).toBe('Moderation service unavailable');
      }
    });

    it('should moderate different types of safe content', async () => {
      openai.moderations.create.mockResolvedValue({
        results: [{ flagged: false, categories: {} }],
      });

      const safeContent = [
        'Hello, this is a friendly discussion about programming.',
        'I love React and Next.js for building web applications.',
        'What are your thoughts on TypeScript?',
        'Great article! Thanks for sharing.',
        'I have a question about the implementation.',
      ];

      for (const content of safeContent) {
        const result = await moderateText(content);
        expect(result).toBe(true);
      }

      expect(openai.moderations.create).toHaveBeenCalledTimes(safeContent.length);
    });

    it('should handle empty string content', async () => {
      openai.moderations.create.mockResolvedValue({
        results: [{ flagged: false, categories: {} }],
      });

      const result = await moderateText('');
      expect(result).toBe(true);
      expect(openai.moderations.create).toHaveBeenCalledWith({
        model: 'omni-moderation-latest',
        input: '',
      });
    });

    it('should handle long content', async () => {
      openai.moderations.create.mockResolvedValue({
        results: [{ flagged: false, categories: {} }],
      });

      const longContent = 'A'.repeat(1000);
      const result = await moderateText(longContent);
      
      expect(result).toBe(true);
      expect(openai.moderations.create).toHaveBeenCalledWith({
        model: 'omni-moderation-latest',
        input: longContent,
      });
    });

    it('should use the correct OpenAI model', async () => {
      openai.moderations.create.mockResolvedValue({
        results: [{ flagged: false, categories: {} }],
      });

      await moderateText('Test content');
      
      expect(openai.moderations.create).toHaveBeenCalledWith({
        model: 'omni-moderation-latest',
        input: 'Test content',
      });
    });

    it('should handle multiple flagged categories', async () => {
      openai.moderations.create.mockResolvedValue({
        results: [
          {
            flagged: true,
            categories: {
              hate: true,
              harassment: true,
              self_harm: false,
              violence: true,
            },
          },
        ],
      });

      await expect(
        moderateText('Inappropriate content')
      ).rejects.toThrow(AppError);
    });
  });
});

