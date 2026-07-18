// Doubleword hosts the persona-scoring model (on Nosana GPU compute - that's the
// infrastructure layer underneath this, not a separate API we call directly).
// OpenAI-compatible, same integration pattern as ai&/Kimi.
import OpenAI from 'openai';
import { env } from '../env.js';

const client = new OpenAI({
  apiKey: env.DOUBLEWORD_API_KEY,
  baseURL: env.DOUBLEWORD_BASE_URL,
});

const PERSONA_SYSTEM_PROMPT = `You are an average online shopper evaluating a website landing page from its raw HTML source.
Respond with ONLY a JSON object of the shape {"score": <integer 1-10>, "verdict": "<one short sentence, from a shopper's perspective>"}
Judge: does the page look trustworthy and usable, is it clear what's being sold, would you browse further.
No prose outside the JSON.`;

function parseScoreJson(raw: string): { score: number; verdict: string } {
  const attempt = (text: string): { score: number; verdict: string } => {
    const parsed = JSON.parse(text);
    if (typeof parsed?.score !== 'number' || typeof parsed?.verdict !== 'string') {
      throw new Error('Response JSON did not contain numeric "score" and string "verdict" fields');
    }
    return { score: parsed.score, verdict: parsed.verdict };
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
    throw new Error(`Doubleword response was not valid JSON with score/verdict fields. Raw response:\n${raw}`);
  }
}

export async function personaScoreVariant(html: string): Promise<{ score: number; verdict: string }> {
  const completion = await client.chat.completions.create({
    model: env.DOUBLEWORD_MODEL,
    // This model reasons before answering (see message.reasoning) - 200 was consumed
    // entirely by reasoning tokens, hitting finish_reason "length" before any actual
    // JSON content was emitted. Budget generously for reasoning + a short answer.
    max_tokens: 1500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: PERSONA_SYSTEM_PROMPT },
      // Bounded slice - this is a judgment call on the page, not a full code review.
      { role: 'user', content: html.slice(0, 6000) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Doubleword returned an empty response');
  }

  return parseScoreJson(raw);
}
