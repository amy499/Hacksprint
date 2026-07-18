import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 8787,

  // Primary code-generation provider (event-funded, not on the critical-path risk Kimi is).
  AIAND_API_KEY: required('AIAND_API_KEY'),
  AIAND_BASE_URL: process.env.AIAND_BASE_URL || 'https://api.aiand.com/v1',
  AIAND_MODEL: process.env.AIAND_MODEL || 'deepseek-ai/deepseek-v4-flash',

  // Optional/stretch only (self-funded, currently billing-blocked) - see CLAUDE.md.
  // Not `required()`: the app must boot and run fine without it.
  MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY || '',
  MOONSHOT_BASE_URL: process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1',
  MOONSHOT_MODEL: process.env.MOONSHOT_MODEL || 'kimi-k2.5',

  DAYTONA_API_KEY: required('DAYTONA_API_KEY'),
  DAYTONA_API_URL: process.env.DAYTONA_API_URL || '',

  // Doubleword self-hosts the persona-scoring model (on Nosana GPU compute - that
  // layer is infrastructural/invisible to this code, no separate Nosana API call).
  // OpenAI-compatible, same pattern as ai&/Kimi. No safe default model name exists -
  // this must be the exact model id assigned at the event.
  DOUBLEWORD_API_KEY: required('DOUBLEWORD_API_KEY'),
  DOUBLEWORD_BASE_URL: process.env.DOUBLEWORD_BASE_URL || 'https://api.doubleword.ai/v1',
  DOUBLEWORD_MODEL: required('DOUBLEWORD_MODEL'),

  // Oxylabs - real trend data scraping (Realtime API, HTTP Basic Auth), feeds the
  // ai& suggestion-reasoning step.
  OXYLABS_USERNAME: required('OXYLABS_USERNAME'),
  OXYLABS_PASSWORD: required('OXYLABS_PASSWORD'),
};
