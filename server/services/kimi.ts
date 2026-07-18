// OPTIONAL / STRETCH ONLY - Kimi is currently billing-blocked (see CLAUDE.md).
// ai& (server/services/aiand.ts) is the primary code-generation path. This is kept
// around to reintroduce later, ideally for the suggestion-reasoning step, once the
// Moonshot account is topped up and there's time to restore a fully distinct
// 6-sponsor story. Not currently called from any route.
import OpenAI from 'openai';
import { env } from '../env.js';
import { parseServerJsResponse, SERVER_JS_SYSTEM_PROMPT } from '../lib/parseServerJsResponse.js';

const client = new OpenAI({
  apiKey: env.MOONSHOT_API_KEY,
  baseURL: env.MOONSHOT_BASE_URL,
});

export async function generateVariant(prompt: string): Promise<{ code: string }> {
  const completion = await client.chat.completions.create({
    model: env.MOONSHOT_MODEL,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SERVER_JS_SYSTEM_PROMPT },
      { role: 'user', content: `Website idea: ${prompt}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Kimi returned an empty response');
  }

  const { serverJs } = parseServerJsResponse(raw);
  return { code: serverJs };
}
