/**
 * AI Provider Interface & Contract
 *
 * This module defines the architectural contract for integrating an LLM provider
 * (such as OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, or Google Gemini 1.5 Pro)
 * into A Una Milla's Travel Hacking Advisor.
 *
 * Current Status:
 * - No AI provider credentials (e.g. OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY)
 *   are currently configured in the environment.
 * - The application strictly uses a deterministic, verified rule-based travel hacking
 *   engine (advisor.engine.js) to guarantee financial honesty and eliminate hallucinations.
 *
 * Interface Specification for Future LLM Implementation:
 *
 * 1. Method: `generateAdvice(promptPayload, options)`
 *    - Input:
 *      {
 *        systemPrompt: string,      // Enforces financial honesty and anti-hallucination rules
 *        flightContext: {
 *          origin: string,          // e.g. "MAD"
 *          destination: string,     // e.g. "JFK"
 *          departureDate: string,   // "YYYY-MM-DD"
 *          returnDate?: string,     // "YYYY-MM-DD"
 *          travelers: number,       // 1-9
 *          cabin: string,           // "economy" | "premium_economy" | "business" | "first"
 *          cashPrice: number,       // Verified cash fare total in EUR
 *          airline: string,         // e.g. "Iberia"
 *          dataSource: string,      // "live" | "fixture" | "demo"
 *          userPointsBalance?: number,
 *          pointsProgram?: string,
 *        },
 *        userQuestion?: string,     // Optional user question
 *      }
 *    - Output (Structured JSON):
 *      {
 *        summary: string,
 *        recommendationTitle: string,
 *        reasoning: string,
 *        facts: string[],
 *        estimates: string[],
 *        assumptions: string[],
 *        alternatives: {
 *          airports?: Array<{ code: string, name: string, notes: string }>,
 *          dates?: string,
 *          routing?: string,
 *        },
 *        transferPartners: Array<{ bank: string, program: string, ratio: string, transferTime: string }>,
 *        nextAction: { action: string, verificationRequired: boolean },
 *        followUpQuestions: string[],
 *      }
 *
 * 2. Requirements for AI Integration:
 *    - Temperature: <= 0.2 (low randomness to prevent mathematical errors)
 *    - Structured outputs (e.g. JSON schema / function calling)
 *    - Fallback: Gracefully fall back to deterministic rule-based engine on API error, timeout, or invalid JSON.
 */

export class BaseAIProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  isConfigured() {
    return false;
  }

  async generateAdvice(/* promptPayload, options */) {
    throw new Error(`AI Provider ${this.name} is not configured or implemented.`);
  }
}
