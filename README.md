# VariantIQ V0

Evidence-backed, explainable genomic variant interpreter.

## Features

✅ Variant Normalization (rsID, HGVS, genomic coordinates)  
✅ ClinVar Integration with multi-form HGVS search  
✅ Evidence Ranking by review status & submitter agreement  
✅ Confidence Scoring from evidence quality  
✅ Groq LLM (Llama 3 70B, temperature=0, JSON mode)  
✅ In-memory caching to prevent rate limits  
✅ React Frontend with confidence bars & evidence cards  

## Quick Start

### Backend

```bash
npm install
cp .env.example .env
# Edit .env with your Groq API key
npm run dev
```

### Testing

```bash
npm run test:regression
npm run test:edge-cases
```

## Architecture

User Input → Normalizer → ClinVar Fetcher → Evidence Aggregator → Ranker → Confidence Calculator → Prompt Builder → Groq LLM → Validator → Response

## API

### POST /api/explain

```json
{
  "variant": "rs121913529"
}
```

Returns structured interpretation with clinical significance, disease, confidence, and supporting evidence.

## Key Design Decisions

1. **LLM as Writer**: Forces copying significance from evidence, prevents hallucinations
2. **Multi-Form HGVS**: Generates variants with/without gene prefix, shortened forms, genomic HGVS, rsID
3. **Post-Retrieval Filtering**: Filters by exact chromosome, position, alleles
4. **Evidence Ranking**: Scores by review status, submitter agreement, recency, completeness
5. **Deterministic Output**: Temperature=0 + JSON mode for reproducibility
6. **Evidence-Based Confidence**: Formula: `min(100, base_score * (1 + 0.2 * (num_records - 1)))`

## Critical Warnings

⚠️ DO NOT let LLM determine clinical significance - it must copy from evidence  
⚠️ DO NOT assume first ClinVar record is best - always rank  
⚠️ DO NOT treat empty trait_set as "benign" - it means null  
⚠️ DO NOT query ClinVar with one HGVS form - use expansion  
⚠️ DO NOT mix variants from same gene - filter by exact position/alleles  
⚠️ ALWAYS cache MyVariant & ClinVar responses from day 0  
⚠️ ALWAYS validate LLM JSON against schema  

## License

MIT
