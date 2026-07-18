// Primary code-generation provider for the walking skeleton (see CLAUDE.md: Kimi
// hit a billing block, ai& is fully event-funded and takes over the critical path).
import OpenAI from 'openai';
import { env } from '../env.js';
import { parseServerJsResponse, SERVER_JS_SYSTEM_PROMPT } from '../lib/parseServerJsResponse.js';
import type { TrendResult } from './oxylabs.js';

const client = new OpenAI({
  apiKey: env.AIAND_API_KEY,
  baseURL: env.AIAND_BASE_URL,
});

export async function generateVariant(prompt: string): Promise<{ code: string }> {
  const completion = await client.chat.completions.create({
    model: env.AIAND_MODEL,
    // AIAND_MODEL is configured to a reasoning model (moonshotai/kimi-k2.7-code) that
    // spends tokens on an internal "reasoning" field before emitting the actual JSON
    // answer (same failure mode as Doubleword's model, see doubleword.ts) - 4000 was
    // fully consumed by reasoning alone (content: null, finish_reason "length").
    // Budgeted generously for reasoning + a full generated file.
    max_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SERVER_JS_SYSTEM_PROMPT },
      { role: 'user', content: `Website idea: ${prompt}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('ai& returned an empty response');
  }

  const { serverJs } = parseServerJsResponse(raw);
  return { code: serverJs };
}

export interface Suggestion {
  title: string;
  reason: string;
}

const SUGGESTIONS_SYSTEM_PROMPT = `You are a product strategist. Given a website idea and a list of real, current
search-result trends related to it, suggest 2-4 concrete, actionable improvements to the website concept.
Respond with ONLY a JSON object of the shape {"suggestions": [{"title": "<short suggestion>", "reason": "<one sentence tying it to a specific trend from the list>"}]}
Each suggestion must be grounded in at least one of the given trends - do not invent generic advice unrelated to them.
No prose outside the JSON.`;

function parseSuggestionsJson(raw: string): { suggestions: Suggestion[] } {
  const attempt = (text: string): { suggestions: Suggestion[] } => {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed?.suggestions)) {
      throw new Error('Response JSON did not contain a "suggestions" array');
    }
    for (const s of parsed.suggestions) {
      if (typeof s?.title !== 'string' || typeof s?.reason !== 'string') {
        throw new Error('A suggestion entry was missing string "title"/"reason" fields');
      }
    }
    return { suggestions: parsed.suggestions };
  };

  try {
    return attempt(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return attempt(fenced[1]);
      } catch {
        // fall through to the error below
      }
    }
    throw new Error(`ai& suggestions response was not valid JSON with a "suggestions" array. Raw response:\n${raw}`);
  }
}

// Distinct task from generateVariant above (code generation) - same provider, per
// CLAUDE.md: ai& is used twice for two different jobs, not one call reused.
export async function generateSuggestions(prompt: string, trends: TrendResult[]): Promise<{ suggestions: Suggestion[] }> {
  const trendsList = trends.map((t, i) => `${i + 1}. ${t.title} - ${t.description}`).join('\n');

  const completion = await client.chat.completions.create({
    model: env.AIAND_MODEL,
    // Same reasoning-model headroom concern as generateVariant above, though this
    // task's actual answer is much shorter than a full generated file.
    max_tokens: 3000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SUGGESTIONS_SYSTEM_PROMPT },
      { role: 'user', content: `Website idea: ${prompt}\n\nCurrent search trends:\n${trendsList}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('ai& returned an empty response for suggestions');
  }

  return parseSuggestionsJson(raw);
}
