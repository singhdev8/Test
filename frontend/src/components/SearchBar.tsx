import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (variant: string) => Promise<void>;
  loading: boolean;
}

function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter variant (rsID: rs121913529, HGVS: BRCA1:c.68_69del, or genomic: chr17:43044295)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-semibold"
        >
          {loading ? 'Analyzing...' : 'Search'}
        </button>
      </div>
      <p className="text-xs text-gray-600 mt-2 text-center">
        Try: rs121913529 (KRAS), rs1799966 (TP53), or BRCA1:c.68_69del
      </p>
    </form>
  );
}

export default SearchBar;
