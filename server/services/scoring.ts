import { personaScoreVariant } from './doubleword.js';

export interface VariantScore {
  loadsOk: boolean;
  loadTimeMs: number | null;
  hasKeyElements: boolean;
  mobileFriendly: boolean;
  personaScore: number | null;
  personaVerdict: string | null;
  overallScore: number;
}

interface ScorableVariant {
  code?: string;
  previewUrl?: string;
}

async function checkLoads(previewUrl: string): Promise<{ loadsOk: boolean; loadTimeMs: number | null }> {
  const start = Date.now();
  try {
    const res = await fetch(previewUrl, { signal: AbortSignal.timeout(10000) });
    return { loadsOk: res.ok, loadTimeMs: Date.now() - start };
  } catch {
    return { loadsOk: false, loadTimeMs: null };
  }
}

function checkKeyElements(html: string): boolean {
  return /<title>/i.test(html) && /(\$\d|price)/i.test(html) && /<img/i.test(html);
}

function checkMobileFriendly(html: string): boolean {
  return /<meta[^>]+viewport/i.test(html);
}

// Simple, explainable weighting for demo ranking purposes - not a rigorous benchmark.
// A variant that doesn't load at all is gated to 0 regardless of anything else.
function computeOverallScore(parts: Omit<VariantScore, 'overallScore'>): number {
  if (!parts.loadsOk) return 0;

  let score = 40; // baseline for actually working
  score += parts.hasKeyElements ? 15 : 0;
  score += parts.mobileFriendly ? 10 : 0;
  score += parts.loadTimeMs !== null && parts.loadTimeMs < 1000 ? 10 : parts.loadTimeMs !== null && parts.loadTimeMs < 3000 ? 5 : 0;
  score += (parts.personaScore ?? 0) * 2.5; // persona 1-10 -> 2.5-25 points

  return Math.round(score);
}

export async function scoreVariant(variant: ScorableVariant): Promise<VariantScore> {
  if (!variant.previewUrl || !variant.code) {
    return {
      loadsOk: false,
      loadTimeMs: null,
      hasKeyElements: false,
      mobileFriendly: false,
      personaScore: null,
      personaVerdict: 'Variant failed to generate - nothing to score',
      overallScore: 0,
    };
  }

  const { loadsOk, loadTimeMs } = await checkLoads(variant.previewUrl);
  const hasKeyElements = checkKeyElements(variant.code);
  const mobileFriendly = checkMobileFriendly(variant.code);

  let personaScore: number | null = null;
  let personaVerdict: string | null = null;
  if (loadsOk) {
    try {
      const persona = await personaScoreVariant(variant.code);
      personaScore = persona.score;
      personaVerdict = persona.verdict;
    } catch (err) {
      personaVerdict = `Persona check failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  const parts = { loadsOk, loadTimeMs, hasKeyElements, mobileFriendly, personaScore, personaVerdict };
  return { ...parts, overallScore: computeOverallScore(parts) };
}
