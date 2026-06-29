import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import VariantCard from './components/VariantCard';
import EvidencePanel from './components/EvidencePanel';

interface InterpretationData {
  variant: {
    originalInput: string;
    gene: string | null;
    hgvsCoding: string | null;
    hgvsGenomic: string | null;
    chromosome: string | null;
    position: number | null;
  };
  interpretation: {
    variant_summary: string;
    clinical_significance: string;
    disease: string | null;
    confidence: number;
    review_status: string;
    evidence_list: Array<{
      accession: string;
      significance: string;
      review_status: string;
      condition: string | null;
      last_updated: string | null;
    }>;
    warnings: string[];
  };
}

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterpretationData | null>(null);

  const handleSearch = async (variant: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/explain', { variant });
      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.error);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🧬 VariantIQ V0</h1>
          <p className="text-lg text-gray-600">Evidence-backed genomic variant interpreter</p>
        </div>

        <SearchBar onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-semibold">⚠️ Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 text-center text-gray-600">
            <p className="text-lg">⏳ Analyzing variant...</p>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <VariantCard result={result} />
            <EvidencePanel evidence={result.interpretation.evidence_list} />
            {result.interpretation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-semibold text-yellow-900">⚠️ Warnings</p>
                <ul className="text-sm text-yellow-800 mt-2 list-disc list-inside">
                  {result.interpretation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
