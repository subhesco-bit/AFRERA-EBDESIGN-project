import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { wikipediaAPI, foluBenchmarkAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Combines two small, topically-adjacent reference/benchmark route files
 * onto one page:
 * - backend/src/routes/wikipediaRoutes.js + services/legacy/wikipediaService.js
 *   (2 methods verified to exist, real Wikimedia REST API integration)
 * - backend/src/routes/foluBenchmarkRoutes.js + services/legacy/foluBenchmarkService.js
 *   (2 methods verified to exist, real FOLU framework benchmark data)
 * Both are read-oriented reference lookups - ActionCard pattern with tabs.
 */
function KnowledgeReferencePage() {
  const [tab, setTab] = useState('wikipedia');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-amber-600" />
          Knowledge Reference
        </h1>
        <p className="text-gray-600">Wikipedia knowledge lookups and FOLU (Food & Land Use) transition benchmark data.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('wikipedia')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'wikipedia' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
        >
          Wikipedia
        </button>
        <button
          onClick={() => setTab('folu')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'folu' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
        >
          FOLU Benchmark
        </button>
      </div>

      {tab === 'wikipedia' && (
        <>
          <ActionCard
            title="Lookup"
            description="Fuzzy lookup a Wikipedia reference by query text. Returns null honestly if no match is found."
            fields={[{ name: 'q', label: 'Query' }]}
            onRun={(v) => wikipediaAPI.lookup(v.q)}
          />
          <ActionCard
            title="Get Summary by Title"
            description="Get a Wikipedia page summary by exact title."
            fields={[{ name: 'title', label: 'Title' }]}
            onRun={(v) => wikipediaAPI.getSummaryByTitle(v.title)}
          />
        </>
      )}

      {tab === 'folu' && (
        <>
          <ActionCard
            title="List Transitions"
            description="List all FOLU transition indicators."
            onRun={() => foluBenchmarkAPI.listTransitions()}
          />
          <ActionCard
            title="Get Benchmark Report"
            description="Get the full FOLU benchmark report. Never estimates a transition it has no real data for."
            onRun={() => foluBenchmarkAPI.getBenchmarkReport()}
          />
        </>
      )}
    </div>
  );
}

export default KnowledgeReferencePage;
