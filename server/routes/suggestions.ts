import { Router } from 'express';
import { scrapeTrends } from '../services/oxylabs.js';
import { generateSuggestions } from '../services/aiand.js';

export const suggestionsRouter = Router();

suggestionsRouter.post('/suggestions', async (req, res) => {
  const { prompt } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Body must include a non-empty "prompt" string' });
    return;
  }

  try {
    const trends = await scrapeTrends(`${prompt} trends 2026`);
    const { suggestions } = await generateSuggestions(prompt, trends);
    res.json({ trends, suggestions });
  } catch (err) {
    console.error('suggestions failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
