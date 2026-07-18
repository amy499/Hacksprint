import { Router } from 'express';
import { scoreVariant } from '../services/scoring.js';

export const scoreVariantsRouter = Router();

scoreVariantsRouter.post('/score-variants', async (req, res) => {
  const { variants } = req.body ?? {};
  if (!Array.isArray(variants) || variants.length === 0) {
    res.status(400).json({ error: 'Body must include a non-empty "variants" array' });
    return;
  }

  try {
    const scored = await Promise.all(
      variants.map(async (variant) => ({ ...variant, score: await scoreVariant(variant) })),
    );

    scored.sort((a, b) => b.score.overallScore - a.score.overallScore);

    res.json({ variants: scored, winner: scored[0] });
  } catch (err) {
    console.error('score-variants failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
