import { Router } from 'express';
import { generateVariant as aiandGenerateVariant } from '../services/aiand.js';
import { runVariant } from '../services/daytona.js';

export const generateVariantsRouter = Router();

// Scoped MVP per CLAUDE.md: 2 backend concepts x 2 frontend styles = 4 variants max.
// Each variant is still the same proven single-file Node http server shape (no
// npm install in the sandbox) - only the content/data concept and visual style
// prompted to the model differ, not the underlying execution contract.
const BACKEND_CONCEPTS = [
  {
    label: 'Simple Catalog',
    detail: 'a straightforward single-page product/content listing with prices or key details',
  },
  {
    label: 'Catalog + Filter',
    detail: 'a product/content listing with a simple client-side search or filter box above it',
  },
];

const FRONTEND_STYLES = [
  {
    label: 'Minimalist',
    detail: 'a clean, minimalist, mostly-monochrome visual design with generous whitespace',
  },
  {
    label: 'Bold & Playful',
    detail: 'a bold, vibrant, playful visual design with bright accent colors',
  },
];

interface VariantResult {
  backendLabel: string;
  frontendLabel: string;
  previewUrl?: string;
  sandboxId?: string;
  code?: string;
  error?: string;
}

async function generateOneVariant(
  prompt: string,
  backend: (typeof BACKEND_CONCEPTS)[number],
  frontend: (typeof FRONTEND_STYLES)[number],
): Promise<VariantResult> {
  const combinedPrompt = `${prompt}\n\nContent/data concept: ${backend.detail}\nVisual style: ${frontend.detail}`;
  const { code } = await aiandGenerateVariant(combinedPrompt);
  const { previewUrl, sandboxId } = await runVariant(code);
  return { backendLabel: backend.label, frontendLabel: frontend.label, previewUrl, sandboxId, code };
}

generateVariantsRouter.post('/generate-variants', async (req, res) => {
  const { prompt } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Body must include a non-empty "prompt" string' });
    return;
  }

  const combos = BACKEND_CONCEPTS.flatMap((backend) => FRONTEND_STYLES.map((frontend) => ({ backend, frontend })));

  const settled = await Promise.allSettled(combos.map(({ backend, frontend }) => generateOneVariant(prompt, backend, frontend)));

  const variants: VariantResult[] = settled.map((result, i) => {
    const { backend, frontend } = combos[i];
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error(`variant [${backend.label} x ${frontend.label}] failed:`, result.reason);
    return {
      backendLabel: backend.label,
      frontendLabel: frontend.label,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });

  res.json({ variants });
});
