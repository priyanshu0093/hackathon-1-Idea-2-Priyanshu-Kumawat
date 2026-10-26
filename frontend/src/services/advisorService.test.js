import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeTripAdvice } from './advisorService';

describe('Advisor Service (Frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully fetches travel advisor recommendations', async () => {
    const mockAdvice = {
      advisorMode: 'rule_based_engine',
      recommendation: {
        title: 'Save ~€420 Using Iberia Plus Sweet Spot',
        reasoning: 'Off-peak saver tickets offer outstanding value.',
      },
      facts: ['Verified cash fare: €650'],
      estimates: ['Estimated award: 34,000 Avios'],
      assumptions: ['Award inventory requires checking Iberia Plus'],
      followUpQuestions: ['How do I transfer points?'],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: mockAdvice }),
    });

    const result = await analyzeTripAdvice({
      origin: 'MAD',
      destination: 'JFK',
      departureDate: '2026-11-20',
      travelers: 1,
      cabin: 'economy',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.advisorMode).toBe('rule_based_engine');
    expect(result.recommendation.title).toContain('Save ~€420');
  });

  it('handles backend validation errors with actionable messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        code: 'VALIDATION_ERROR',
        errors: { destination: ['Origin and destination airports must be different'] },
      }),
    });

    await expect(
      analyzeTripAdvice({
        origin: 'MAD',
        destination: 'MAD',
        departureDate: '2026-11-20',
      })
    ).rejects.toThrow('Validation Error (destination): Origin and destination airports must be different');
  });

  it('handles network failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    await expect(
      analyzeTripAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
      })
    ).rejects.toThrow('Network offline');
  });

  it('submits user questions and receives answers', async () => {
    const mockQnaResponse = {
      advisorMode: 'rule_based_engine',
      questionAnswer: {
        topic: 'Points Transfer Strategy',
        answer: 'Never transfer points speculatively.',
        adviceTip: 'Search space first.',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: mockQnaResponse }),
    });

    const result = await analyzeTripAdvice({
      origin: 'MAD',
      destination: 'JFK',
      departureDate: '2026-11-20',
      question: 'How do I transfer points?',
    });

    expect(result.questionAnswer.topic).toBe('Points Transfer Strategy');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/advisor/analyze'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('How do I transfer points?'),
      })
    );
  });

  it('handles request cancellation cleanly when aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';

    global.fetch = vi.fn().mockRejectedValue(abortError);

    await expect(
      analyzeTripAdvice(
        { origin: 'MAD', destination: 'JFK', departureDate: '2026-11-20' },
        { signal: controller.signal }
      )
    ).rejects.toThrow('The user aborted a request.');
  });
});
