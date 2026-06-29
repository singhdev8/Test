import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import explainRouter from './routes/explain.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', explainRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`\n✅ VariantIQ V0 backend running on http://localhost:${config.port}`);
  console.log(`📝 Variant explain endpoint: POST /api/explain`);
  console.log(`🏥 Node env: ${config.nodeEnv}`);
  console.log(`🧬 Groq model: ${config.groq.model}\n`);
});
