import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
    temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0'),
  },
  myVariant: {
    baseUrl: process.env.MYVARIANT_BASE_URL || 'https://myvariant.info/v1',
  },
  ncbi: {
    baseUrl: process.env.NCBI_BASE_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    email: process.env.NCBI_EMAIL || 'user@example.com',
  },
  cache: {
    ttlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '1440', 10),
  },
};

if (!config.groq.apiKey) {
  console.warn('⚠️  GROQ_API_KEY not set in environment');
}
