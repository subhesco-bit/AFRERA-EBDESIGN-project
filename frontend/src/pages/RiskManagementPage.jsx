import { useMemo } from 'react';
import AIInsightsPanel from '../components/ui/AIInsightsPanel';
import { aiDecisionService } from '../services/aiDecisionService';

export default function RiskManagementPage() {
  const aiInsights = useMemo(
    () => [
      aiDecisionService.buildDecision({
        id: 'risk-weather-exposure',
        title: 'Weather risk escalation',
        description: 'A cluster of high-risk harvest zones is showing elevated rainfall and flood exposure. Early mitigation and insurance coverage review should be initiated.',
        status: 'pending',
        confidence: 0.9,
        impact: 'high',
        category: 'risk',
        icon: '🌧️',
        severity: 'critical',
        metadata: { source: 'fallback', module: 'risk' },
        context: { exposure: 'high', zones: 4 },
        timestamp: new Date().toISOString(),
      }),
      aiDecisionService.buildDecision({
        id: 'risk-market-volatility',
        title: 'Market volatility watch',
        description: 'Price spread volatility is increasing in two categories. A hedged supply plan or earlier pre-booking may reduce downside exposure.',
        status: 'pending',
        confidence: 0.82,
        impact: 'medium',
        category: 'risk',
        icon: '📉',
        severity: 'warning',
        metadata: { source: 'fallback', module: 'market' },
        context: { categories: 2, volatility: 'rising' },
        timestamp: new Date().toISOString(),
      }),
    ],
    [],
  );

  const handleApplyRecommendation = (insight) => {
    alert(`Applied recommendation: ${insight.title}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Risk Management</h1>
        <p className="text-gray-600">Weather, market, operational and credit risk monitoring with AI decision support.</p>
      </div>

      <AIInsightsPanel
        insights={aiInsights}
        loading={false}
        onRefresh={() => window.location.reload()}
        onApplyRecommendation={handleApplyRecommendation}
      />
    </div>
  );
}
