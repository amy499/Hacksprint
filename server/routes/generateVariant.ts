import { Router } from 'express';
import { generateVariant as aiandGenerateVariant } from '../services/aiand.js';
import { runVariant, deleteSandbox } from '../services/daytona.js';

export const generateVariantRouter = Router();

generateVariantRouter.post('/generate-variant', async (req, res) => {
  const { prompt } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Body must include a non-empty "prompt" string' });
    return;
  }

  try {
    const { code } = await aiandGenerateVariant(prompt);
    const { previewUrl, sandboxId } = await runVariant(code);
    res.json({ previewUrl, sandboxId, code });
  } catch (err) {
    console.error('generate-variant failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

generateVariantRouter.delete('/sandbox/:sandboxId', async (req, res) => {
  try {
    await deleteSandbox(req.params.sandboxId);
    res.json({ ok: true });
  } catch (err) {
    console.error('delete sandbox failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
