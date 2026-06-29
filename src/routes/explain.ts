import { Router, Request, Response } from 'express';
import { normalizeVariant } from '../normalizer/variantNormalizer.js';
import { aggregateEvidence } from '../aggregator.js';
import { rankEvidence } from '../ranker/evidenceRanker.js';
import { calculateConfidence } from '../confidence/confidenceCalculator.js';
import { buildPromptContext } from '../prompt/builder.js';
import { callGroqLLM } from '../llm/groqClient.js';
import { validateAndFillResponse } from '../llm/validator.js';

const router = Router();

interface ExplainRequest {
  variant: string;
}

interface ExplainResponse {
  success: boolean;
  error?: string;
  data?: any;
}

router.post('/explain', async (req: Request, res: Response<ExplainResponse>) => {
  try {
    const { variant } = req.body as ExplainRequest;

    if (!variant || typeof variant !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: "variant" must be a non-empty string',
      });
    }

    console.log(`\n[Explain] Processing variant: "${variant}"`);

    const normalized = await normalizeVariant(variant);
    if (!normalized.gene) {
      return res.status(400).json({
        success: false,
        error: `Could not normalize variant "${variant}". Check input format (rsID, HGVS, or genomic coordinate).`,
      });
    }
    console.log(`[Explain] Normalized: gene=${normalized.gene}`);

    const aggregated = await aggregateEvidence(normalized);
    if (aggregated.evidence.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No ClinVar records found for ${normalized.gene}. Variant may be rare or uncharacterized.`,
      });
    }
    console.log(`[Explain] Found ${aggregated.evidence.length} raw records`);

    const topEvidence = rankEvidence(aggregated.evidence, 3);
    console.log(`[Explain] Top ${topEvidence.length} ranked records`);

    const confidence = calculateConfidence(topEvidence);
    console.log(`[Explain] Confidence: ${confidence}`);

    const promptContext = buildPromptContext(
      normalized.gene,
      variant,
      topEvidence,
      confidence
    );

    const llmResponse = await callGroqLLM(
      promptContext.systemPrompt,
      promptContext.userMessage
    );

    let parsed;
    try {
      parsed = JSON.parse(llmResponse);
    } catch {
      console.error('[Explain] LLM returned invalid JSON');
      parsed = {};
    }

    const validated = validateAndFillResponse(parsed);
    console.log('[Explain] Response validated');

    return res.json({
      success: true,
      data: {
        gene: normalized.gene,
        interpretation: validated,
        debug: {
          rawInput: variant,
          normalizedVariant: normalized,
          evidenceCount: aggregated.evidence.length,
          topEvidenceCount: topEvidence.length,
        },
      },
    });
  } catch (error) {
    console.error('[Explain Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
