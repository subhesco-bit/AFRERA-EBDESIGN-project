import { Brain } from 'lucide-react';
import { enterpriseAIAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/enterpriseAIRoutes.js. Per that file's own
 * 2026-08-10 audit header, the old enterpriseAIService.js was 100%
 * fabricated (every method returned a hardcoded/canned value) and has been
 * deleted. Six endpoints here delegate to real, DB-backed services
 * (financialService credit scoring, governmentSchemeService eligibility,
 * aiOrchestrationService model-slot registry, aiOrchestrator's
 * template-fallback query engine). assess-risk, recommendations,
 * entity-profile, anomaly-detection and predict-yield/demand/price are
 * NOT built here - the route itself returns 501 Not Implemented for each,
 * with the real reason it was never wired documented in its own comments;
 * building a page for those would only be exercising honest 501s.
 * Flat list, not tabs - only six real operations, not enough sub-domains
 * to warrant the ComprehensiveERPPage tab pattern.
 */
function EnterpriseAIPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-indigo-700" />
          Enterprise AI
        </h1>
        <p className="text-gray-600">Credit scoring, government scheme eligibility, AI model-slot registry and the conversational query endpoint.</p>
      </div>

      <ActionCard
        title="Credit Score"
        description="Real-data credit scoring: provide farmerId (farmer credit-risk score) or buyerId (buyer B2B credit eligibility)."
        fields={[{ name: 'farmerId', label: 'Farmer ID' }, { name: 'buyerId', label: 'Buyer ID' }]}
        onRun={(v) => enterpriseAIAPI.getCreditScore({ farmerId: v.farmerId || undefined, buyerId: v.buyerId || undefined })}
      />
      <ActionCard
        title="Scheme Eligibility"
        description="Check government scheme eligibility: provide schemeId for a single verified check, or category/state/farm_size to filter the registry."
        fields={[{ name: 'schemeId', label: 'Scheme ID' }, { name: 'category', label: 'Category' }, { name: 'state', label: 'State' }, { name: 'farm_size', label: 'Farm Size' }]}
        onRun={(v) => enterpriseAIAPI.getSchemeEligibility(v)}
      />
      <ActionCard
        title="Model Slot Registry"
        description="List the AI model slot registry (ai_model_registry)."
        onRun={() => enterpriseAIAPI.getModelSlots()}
      />
      <ActionCard
        title="Unserved Intents"
        description="List intents that have no registered model slot yet."
        onRun={() => enterpriseAIAPI.getUnservedIntents()}
      />
      <ActionCard
        title="Upsert Model Slot"
        description="Create or update an entry in the model slot registry."
        hasJsonPayload
        jsonPlaceholder='{"intent": "crop_advisory", "provider": "claude", "model": "claude-sonnet"}'
        onRun={(_, p) => enterpriseAIAPI.upsertModelSlot(p)}
      />
      <ActionCard
        title="Conversational Query"
        description="Ask a question through the orchestrator. Uses a template-fallback responder (rule-based, not an LLM call) since no LLM SDK is configured - the response is labelled usedTemplateFallbackNotLLM."
        fields={[{ name: 'query', label: 'Query' }]}
        hasJsonPayload
        jsonLabel="Context (optional)"
        jsonPlaceholder='{"farmerId": "123"}'
        onRun={(v, p) => enterpriseAIAPI.query({ query: v.query, context: p })}
      />
    </div>
  );
}

export default EnterpriseAIPage;
