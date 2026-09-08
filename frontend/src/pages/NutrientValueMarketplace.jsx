import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { nutrientValueSalesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Leaf,
  Gem,
  Award,
  CheckCircle,
  CheckCircle2,
  Star,
  Beaker,
  Calculator,
} from 'lucide-react';

/**
 * AFRERA Nutrient-Value Marketplace
 *
 * Sell by nutrient value rather than kilogram: quality tiers, lab
 * verification, nutrient certification, price-per-nutrient-unit.
 * Backed by nutrientValueSalesAPI (real backend at
 * backend/src/services/legacy/nutrientValueSalesService.js).
 *
 * Honesty note: the API has no list/read endpoint for "pending
 * verifications" or "active certificates" — only submit/approve/issue
 * actions. Earlier versions of this page filled those tabs with fabricated
 * rows ("Verification #1, Product: Rice (Basmati), National Food Lab" —
 * none of it real). Those have been removed; each form now submits to the
 * real endpoint and shows an honest confirmation instead of a fake history.
 */

const fieldClass = 'w-full p-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric';
const FieldLabel = ({ children }) => <label className="block text-sm font-medium text-v42-ink2 mb-1">{children}</label>;
const SuccessNote = ({ children }) => (
  <div className="flex items-start gap-2 rounded-lg border border-v42-forest/30 bg-v42-forest/10 p-3 text-sm text-v42-forestd">
    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </div>
);

const tierBadgeClass = (tier) => ({
  diamond: 'bg-v42-indigo/15 text-v42-indigo',
  platinum: 'bg-v42-mist text-v42-ink2',
  gold: 'bg-v42-turmerictint text-v42-turmericink',
  silver: 'bg-v42-paddy2 text-v42-ink2',
}[tier] || 'bg-orange-100 text-orange-800');

const NutrientValueMarketplace = () => {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedProducts, setSelectedProducts] = useState([]);

  const { data: nutrientProducts, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['nutrientProducts'],
    queryFn: () => nutrientValueSalesAPI.searchByNutrientCriteria({ min_nutrient_score: 0.6 }).then((r) => r.data),
  });

  const products = nutrientProducts?.products || [];

  const renderMarketplace = () => (
    <div className="space-y-6">
      <div className="bg-v42-forestd rounded-lg shadow p-6 text-v42-paddy">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-v42-turmeric" />
          Nutrient-Value Marketplace
        </h2>
        <p className="text-v42-paddy/85">
          Sell by nutrient value, not just weight — lab-verified content drives the premium.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6 border-l-4 border-v42-indigo">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-v42-mut">Diamond Tier</p><p className="text-2xl font-bold text-v42-ink">{products.filter((p) => p.nutrient_tier === 'diamond').length}</p></div>
            <Gem className="h-8 w-8 text-v42-indigo" />
          </div>
        </div>
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6 border-l-4 border-v42-mut">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-v42-mut">Platinum Tier</p><p className="text-2xl font-bold text-v42-ink">{products.filter((p) => p.nutrient_tier === 'platinum').length}</p></div>
            <Star className="h-8 w-8 text-v42-mut" />
          </div>
        </div>
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6 border-l-4 border-v42-turmeric">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-v42-mut">Gold Tier</p><p className="text-2xl font-bold text-v42-ink">{products.filter((p) => p.nutrient_tier === 'gold').length}</p></div>
            <Award className="h-8 w-8 text-v42-turmeric" />
          </div>
        </div>
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6 border-l-4 border-v42-forest">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-v42-mut">Verified Products</p><p className="text-2xl font-bold text-v42-ink">{products.filter((p) => p.verification_status === 'approved').length}</p></div>
            <CheckCircle className="h-8 w-8 text-v42-forest" />
          </div>
        </div>
      </div>

      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-v42-ink">Nutrient-Rich Products</h3>

        {searchLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-v42-paddy2 rounded-lg" />)}
          </div>
        )}
        {searchError && (
          <div className="rounded-lg border border-v42-chilli/30 bg-v42-chilli/10 p-4 text-sm text-v42-chilli">
            Couldn't load products: {searchError.message}
          </div>
        )}
        {!searchLoading && !searchError && products.length === 0 && (
          <p className="text-v42-mut text-center py-8">No nutrient-verified products yet.</p>
        )}
        {!searchLoading && !searchError && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border border-v42-line rounded-lg p-4 hover:shadow-md transition bg-v42-paddy">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-v42-ink">{product.product_name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${tierBadgeClass(product.nutrient_tier)}`}>
                    {product.nutrient_badge}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between"><span className="text-v42-mut">Nutrient Score:</span><span className="font-semibold text-v42-ink">{(product.nutrient_density_score * 100).toFixed(0)}/100</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Base Price:</span><span className="font-semibold text-v42-ink">₹{product.base_price}/kg</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Nutrient Price:</span><span className="font-semibold text-v42-forest">₹{product.nutrient_value_price}/kg</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Premium:</span><span className="font-semibold text-v42-turmericink">+{product.premium_percentage}%</span></div>
                </div>

                {product.verified_nutrient_content && (
                  <div className="p-2 bg-v42-paddy2 rounded mb-3">
                    <p className="text-xs text-v42-mut mb-1">Nutrient Content (per 100g)</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-v42-ink2">
                      <div>Protein: {product.verified_nutrient_content?.protein}g</div>
                      <div>Iron: {product.verified_nutrient_content?.iron}mg</div>
                      <div>Calcium: {product.verified_nutrient_content?.calcium}mg</div>
                      <div>Fiber: {product.verified_nutrient_content?.fiber}g</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProducts((prev) => prev.includes(product.id) ? prev : [...prev, product.id])}
                    className="flex-1 bg-v42-forest text-v42-paddy py-1 px-3 rounded text-sm hover:bg-v42-forestd transition"
                  >
                    Add to Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderComparison = () => {
    const compareList = products.filter((p) => selectedProducts.includes(p.id));
    return (
      <div className="space-y-6">
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
            <Calculator className="h-5 w-5" />
            Nutrient Comparison
          </h3>

          {compareList.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-v42-mut mx-auto mb-3" />
              <p className="text-v42-mut">Select products from the marketplace tab to compare</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-v42-paddy2">
                  <tr>
                    <th className="p-3 text-left text-v42-ink">Product</th>
                    <th className="p-3 text-center text-v42-ink">Tier</th>
                    <th className="p-3 text-center text-v42-ink">Score</th>
                    <th className="p-3 text-center text-v42-ink">Protein</th>
                    <th className="p-3 text-center text-v42-ink">Iron</th>
                    <th className="p-3 text-center text-v42-ink">Calcium</th>
                    <th className="p-3 text-center text-v42-ink">Fiber</th>
                    <th className="p-3 text-center text-v42-ink">Price/kg</th>
                  </tr>
                </thead>
                <tbody>
                  {compareList.map((p) => (
                    <tr key={p.id} className="border-b border-v42-line">
                      <td className="p-3 text-v42-ink">{p.product_name}</td>
                      <td className="p-3 text-center capitalize text-v42-ink2">{p.nutrient_tier}</td>
                      <td className="p-3 text-center text-v42-ink2">{(p.nutrient_density_score * 100).toFixed(0)}</td>
                      <td className="p-3 text-center text-v42-ink2">{p.verified_nutrient_content?.protein ?? '—'}g</td>
                      <td className="p-3 text-center text-v42-ink2">{p.verified_nutrient_content?.iron ?? '—'}mg</td>
                      <td className="p-3 text-center text-v42-ink2">{p.verified_nutrient_content?.calcium ?? '—'}mg</td>
                      <td className="p-3 text-center text-v42-ink2">{p.verified_nutrient_content?.fiber ?? '—'}g</td>
                      <td className="p-3 text-center text-v42-ink2">₹{p.base_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Verification form
  const [verifyForm, setVerifyForm] = useState({ productId: '', lab: '', protein: '', iron: '', calcium: '', fiber: '' });
  const verifyMutation = useMutation({
    mutationFn: () =>
      nutrientValueSalesAPI.submitNutrientContent(
        verifyForm.productId,
        { protein: Number(verifyForm.protein) || 0, iron: Number(verifyForm.iron) || 0, calcium: Number(verifyForm.calcium) || 0, fiber: Number(verifyForm.fiber) || 0 },
        { lab: verifyForm.lab },
      ),
    onSuccess: () => {
      toast.success('Submitted for lab verification');
      setVerifyForm({ productId: '', lab: '', protein: '', iron: '', calcium: '', fiber: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to submit for verification'),
  });

  const renderVerification = () => (
    <div className="space-y-6">
      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
          <Beaker className="h-5 w-5" />
          Nutrient Verification
        </h3>

        <form onSubmit={(e) => { e.preventDefault(); verifyMutation.mutate(); }} className="p-4 bg-v42-paddy2 rounded-lg mb-4">
          <h4 className="font-medium mb-3 text-v42-ink">Submit for Lab Verification</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><FieldLabel>Product ID</FieldLabel><input required value={verifyForm.productId} onChange={(e) => setVerifyForm({ ...verifyForm, productId: e.target.value })} placeholder="Enter Product ID" className={fieldClass} /></div>
            <div><FieldLabel>Testing Laboratory</FieldLabel><input required value={verifyForm.lab} onChange={(e) => setVerifyForm({ ...verifyForm, lab: e.target.value })} placeholder="Enter lab name" className={fieldClass} /></div>
            <div><FieldLabel>Protein (g/100g)</FieldLabel><input type="number" value={verifyForm.protein} onChange={(e) => setVerifyForm({ ...verifyForm, protein: e.target.value })} placeholder="Enter protein content" className={fieldClass} /></div>
            <div><FieldLabel>Iron (mg/100g)</FieldLabel><input type="number" value={verifyForm.iron} onChange={(e) => setVerifyForm({ ...verifyForm, iron: e.target.value })} placeholder="Enter iron content" className={fieldClass} /></div>
            <div><FieldLabel>Calcium (mg/100g)</FieldLabel><input type="number" value={verifyForm.calcium} onChange={(e) => setVerifyForm({ ...verifyForm, calcium: e.target.value })} placeholder="Enter calcium content" className={fieldClass} /></div>
            <div><FieldLabel>Fiber (g/100g)</FieldLabel><input type="number" value={verifyForm.fiber} onChange={(e) => setVerifyForm({ ...verifyForm, fiber: e.target.value })} placeholder="Enter fiber content" className={fieldClass} /></div>
          </div>
          <button type="submit" disabled={verifyMutation.isPending}
            className="w-full bg-v42-forest text-v42-paddy py-2 px-4 rounded-lg hover:bg-v42-forestd transition disabled:opacity-60">
            {verifyMutation.isPending ? 'Submitting…' : 'Submit for Verification'}
          </button>
        </form>

        {verifyMutation.isSuccess && (
          <SuccessNote>
            Submitted for lab verification. Once approved, this product's nutrient tier and price
            premium will reflect the verified content.
          </SuccessNote>
        )}
      </div>
    </div>
  );

  // Certification form
  const [certForm, setCertForm] = useState({ productId: '', type: 'Nutrient Quality', body: '', validUntil: '' });
  const certMutation = useMutation({
    mutationFn: () =>
      nutrientValueSalesAPI.issueNutrientCertificate(certForm.productId, {
        certificate_type: certForm.type,
        certifying_body: certForm.body,
        valid_until: certForm.validUntil,
      }),
    onSuccess: () => {
      toast.success('Certificate issued');
      setCertForm({ productId: '', type: 'Nutrient Quality', body: '', validUntil: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to issue certificate'),
  });

  const renderCertification = () => (
    <div className="space-y-6">
      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
          <Award className="h-5 w-5" />
          Nutrient Certification
        </h3>

        <form onSubmit={(e) => { e.preventDefault(); certMutation.mutate(); }} className="p-4 bg-v42-paddy2 rounded-lg mb-4">
          <h4 className="font-medium mb-3 text-v42-ink">Issue Quality Certificate</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><FieldLabel>Product ID</FieldLabel><input required value={certForm.productId} onChange={(e) => setCertForm({ ...certForm, productId: e.target.value })} placeholder="Enter Product ID" className={fieldClass} /></div>
            <div>
              <FieldLabel>Certificate Type</FieldLabel>
              <select value={certForm.type} onChange={(e) => setCertForm({ ...certForm, type: e.target.value })} className={fieldClass}>
                <option>Nutrient Quality</option>
                <option>Organic</option>
                <option>GMO-Free</option>
                <option>Non-GMO</option>
              </select>
            </div>
            <div><FieldLabel>Certifying Body</FieldLabel><input required value={certForm.body} onChange={(e) => setCertForm({ ...certForm, body: e.target.value })} placeholder="Enter certifying body" className={fieldClass} /></div>
            <div><FieldLabel>Valid Until</FieldLabel><input required type="date" value={certForm.validUntil} onChange={(e) => setCertForm({ ...certForm, validUntil: e.target.value })} className={fieldClass} /></div>
          </div>
          <button type="submit" disabled={certMutation.isPending}
            className="w-full bg-v42-forest text-v42-paddy py-2 px-4 rounded-lg hover:bg-v42-forestd transition disabled:opacity-60">
            {certMutation.isPending ? 'Issuing…' : 'Issue Certificate'}
          </button>
        </form>

        {certMutation.isSuccess && <SuccessNote>Certificate issued and attached to the product.</SuccessNote>}
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
          <Calculator className="h-5 w-5" />
          Pricing Model Explained
        </h3>
        <div className="p-4 bg-v42-paddy2 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-v42-indigo rounded" /><span className="text-v42-ink2"><strong>Diamond Tier:</strong> Up to 100% premium (top 5%)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-v42-mut rounded" /><span className="text-v42-ink2"><strong>Platinum Tier:</strong> Up to 80% premium (top 10%)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-v42-turmeric rounded" /><span className="text-v42-ink2"><strong>Gold Tier:</strong> Up to 50% premium (top 25%)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-400 rounded" /><span className="text-v42-ink2"><strong>Silver Tier:</strong> Up to 30% premium (above average)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-400 rounded" /><span className="text-v42-ink2"><strong>Bronze Tier:</strong> Meets nutritional standards</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-300 rounded" /><span className="text-v42-ink2"><strong>Standard Tier:</strong> Basic nutritional value</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    ['marketplace', 'Marketplace'],
    ['comparison', 'Comparison'],
    ['verification', 'Verification'],
    ['certification', 'Certification'],
    ['pricing', 'Pricing'],
  ];

  return (
    <div className="min-h-screen bg-v42-paddy2 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-v42-ink flex items-center gap-3">
            <Leaf className="h-8 w-8 text-v42-forest" />
            Nutrient-Value Marketplace
          </h1>
          <p className="text-v42-mut mt-2">
            Sell by nutrient value, not just weight — lab-verified content earns a real price premium
          </p>
        </div>

        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow mb-6">
          <div className="flex gap-4 border-b border-v42-line overflow-x-auto">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`px-4 py-3 font-medium whitespace-nowrap ${activeTab === id ? 'border-b-2 border-v42-forest text-v42-forestd' : 'text-v42-mut hover:text-v42-ink'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
          {activeTab === 'marketplace' && renderMarketplace()}
          {activeTab === 'comparison' && renderComparison()}
          {activeTab === 'verification' && renderVerification()}
          {activeTab === 'certification' && renderCertification()}
          {activeTab === 'pricing' && renderPricing()}
        </div>
      </div>
    </div>
  );
};

export default NutrientValueMarketplace;
