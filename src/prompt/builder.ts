import { ClinVarEvidence } from '../fetchers/baseFetcher.js';
import { buildUserMessage, OUTPUT_SCHEMA, SYSTEM_PROMPT } from './templates.js';

function formatEvidenceRecord(record: ClinVarEvidence, index: number): string {
  return `\n  ${index + 1}. Accession: ${record.accession}
     Significance: ${record.significance}
     Review Status: ${record.reviewStatus}
     Condition: ${record.condition || '(not specified)'}
     Submitters: ${record.submitters}
     Last Evaluated: ${record.lastEvaluated || '(not specified)'}`;
}

export function buildPromptContext(
  gene: string,
  originalInput: string,
  evidence: ClinVarEvidence[],
  confidence: number
): { systemPrompt: string; userMessage: string; schema: any } {
  const formattedEvidence =
    evidence.length > 0
      ? evidence.map(formatEvidenceRecord).join('')
      : '(No ClinVar records found for this variant)';

  return {
    systemPrompt: SYSTEM_PROMPT,
    userMessage: buildUserMessage(gene, originalInput, formattedEvidence, confidence),
    schema: OUTPUT_SCHEMA,
  };
}
