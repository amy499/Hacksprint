// Oxylabs scrapes real current trend data (Google search results) relevant to the
// user's prompt, feeding the ai& suggestion-reasoning step (server/services/aiand.ts).
import { env } from '../env.js';

export interface TrendResult {
  title: string;
  url: string;
  description: string;
}

export async function scrapeTrends(query: string): Promise<TrendResult[]> {
  const auth = Buffer.from(`${env.OXYLABS_USERNAME}:${env.OXYLABS_PASSWORD}`).toString('base64');

  const res = await fetch('https://realtime.oxylabs.io/v1/queries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      source: 'google_search',
      query,
      parse: true,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Oxylabs request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const organic = data?.results?.[0]?.content?.results?.organic ?? [];

  if (!Array.isArray(organic)) {
    throw new Error(`Unexpected Oxylabs response shape (no organic results array). Raw: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return organic.slice(0, 5).map((item: Record<string, unknown>) => ({
    title: typeof item.title === 'string' ? item.title : '',
    url: typeof item.url === 'string' ? item.url : '',
    // Oxylabs' real field name is "desc", not "description" - verified against a live response.
    description: typeof item.desc === 'string' ? item.desc : '',
  }));
}
