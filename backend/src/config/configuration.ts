const DEV_JWT_FALLBACK = 'dev-only-secret-change-me';

function resolveJwtSecret(): string {
  const env = process.env.NODE_ENV ?? 'development';
  const secret = process.env.JWT_SECRET;
  if (env === 'production') {
    if (!secret || secret === DEV_JWT_FALLBACK) {
      throw new Error(
        'JWT_SECRET production muhitida majburiy va default qiymatdan farq qilishi kerak (NODE_ENV=production).',
      );
    }
    return secret;
  }
  return secret ?? DEV_JWT_FALLBACK;
}

export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  cors: {
    origins: process.env.CORS_ORIGINS ?? '',
  },
  jwt: {
    secret: resolveJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    // 0 → eng aniq/qat'iy javob; 1+ → ko'proq turli xil. Tibbiy domen — past tutamiz.
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE ?? '0.5'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '600', 10),
    // Suhbat tarixidan oxirgi N ta xabar kontekstga qo'shiladi.
    historySize: parseInt(process.env.OPENAI_HISTORY_SIZE ?? '10', 10),
  },
});
