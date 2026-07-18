import express from 'express';
import { env } from './env.js';
import { generateVariantRouter } from './routes/generateVariant.js';
import { generateVariantsRouter } from './routes/generateVariants.js';
import { scoreVariantsRouter } from './routes/scoreVariants.js';
import { suggestionsRouter } from './routes/suggestions.js';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', generateVariantRouter);
app.use('/api', generateVariantsRouter);
app.use('/api', scoreVariantsRouter);
app.use('/api', suggestionsRouter);

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
