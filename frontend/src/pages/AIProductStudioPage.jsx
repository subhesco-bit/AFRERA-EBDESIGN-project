import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon, Sparkles, Wand2, HeartPulse, Leaf, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { nutritionAPI } from '../services/api';
import productMediaAIAPI from '../services/productMediaAIAPI';
import { buildCartoonPrompt, buildProductImagePrompt, getWellnessStatusTone } from '../utils/aiStudio';

export default function AIProductStudioPage() {
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('Organic Assam Tea');
  const [productDescription, setProductDescription] = useState('Premium tea with aroma and traceability from a certified farm');
  const [stateName, setStateName] = useState('Assam');
  const [moodTheme, setMoodTheme] = useState('farmer storytelling');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mediaLoading, setMediaLoading] = useState(null);
  const [generatedMedia, setGeneratedMedia] = useState(null);
  const [mediaError, setMediaError] = useState(null);

  const { data: wellnessData, isLoading: wellnessLoading, error: wellnessError } = useQuery({
    queryKey: ['wellness-practices'],
    queryFn: () => nutritionAPI.getWellnessPractices({ category: selectedCategory || undefined }).then((r) => r.data?.data || { practices: [] }),
  });

  const imagePrompt = useMemo(
    () => buildProductImagePrompt(productName, productDescription, stateName),
    [productName, productDescription, stateName],
  );

  const cartoonPrompt = useMemo(
    () => buildCartoonPrompt(productName, moodTheme),
    [productName, moodTheme],
  );

  const providerStatus = useQuery({
    queryKey: ['product-media-status'],
    queryFn: () => productMediaAIAPI.getProviderStatus().then((r) => r.data?.data || r.data || {}),
  });

  const wellnessPractices = wellnessData?.practices || [];
  const statusTone = getWellnessStatusTone(providerStatus.data?.status || 'not_configured');

  const generateMedia = async (type) => {
    if (!productId.trim()) {
      setMediaError('Enter the product/listing ID to store and audit generated media.');
      return;
    }
    setMediaError(null);
    setMediaLoading(type);
    try {
      const response = type === 'image'
        ? await productMediaAIAPI.generateImage(productId, imagePrompt, { assetPurpose: 'marketplace_product_image' })
        : await productMediaAIAPI.generateCartoon(productId, cartoonPrompt, { assetPurpose: 'nutrition_diet_wellness_education' });
      const result = response.data?.data || response.data;
      if (!result?.ok || !result.imageUrl) {
        setMediaError(result?.envVar ? `Configure ${result.envVar} to enable AI media generation.` : 'The provider did not return an image.');
        return;
      }
      setGeneratedMedia({ type, url: result.imageUrl });
    } catch (error) {
      setMediaError(error.response?.data?.error || error.message || 'Media generation failed.');
    } finally {
      setMediaLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
            <Sparkles className="h-4 w-4" />
            AI Product Studio
          </div>
          <h1 className="text-3xl font-bold text-slate-900">AI image, cartoon, and wellness generation</h1>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${statusTone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : statusTone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
          {statusTone === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {providerStatus.data?.status || 'not_configured'}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <ImageIcon className="h-5 w-5 text-violet-600" />
            Product image generation
          </div>

          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-slate-700">Product / listing ID</span>
              <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Required for audited asset storage" className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block">
              <span className="mb-1 block text-slate-700">Product name</span>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block">
              <span className="mb-1 block text-slate-700">Description</span>
              <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block">
              <span className="mb-1 block text-slate-700">State/region</span>
              <input value={stateName} onChange={(e) => setStateName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <div className="rounded-lg border border-violet-100 bg-violet-50 p-3 text-violet-800">
              <div className="mb-1 font-medium">Generated prompt</div>
              <p className="whitespace-pre-wrap text-xs leading-6">{imagePrompt}</p>
            </div>
            <button type="button" onClick={() => generateMedia('image')} disabled={Boolean(mediaLoading)} className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
              {mediaLoading === 'image' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate marketplace image
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Wand2 className="h-5 w-5 text-emerald-600" />
            Cartoon education generator
          </div>

          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-slate-700">Story / education theme</span>
              <input value={moodTheme} onChange={(e) => setMoodTheme(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <p className="text-xs text-slate-500">Use this for understandable visual explanations of nutrients, diet concepts and wellness education; professional/clinical decisions remain governed by the appropriate service layer.</p>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-800">
              <div className="mb-1 font-medium">Cartoon prompt</div>
              <p className="whitespace-pre-wrap text-xs leading-6">{cartoonPrompt}</p>
            </div>
            <button type="button" onClick={() => generateMedia('cartoon')} disabled={Boolean(mediaLoading)} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
              {mediaLoading === 'cartoon' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate education cartoon
            </button>
          </div>
        </section>
      </div>

      {mediaError && <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{mediaError}</div>}
      {generatedMedia && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 font-semibold text-slate-900">Generated {generatedMedia.type === 'image' ? 'marketplace image' : 'education cartoon'}</div><img src={generatedMedia.url} alt={generatedMedia.type === 'image' ? 'AI-generated product' : 'AI-generated educational cartoon'} className="max-h-[32rem] w-full rounded-xl border object-contain" /></section>}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <HeartPulse className="h-5 w-5 text-rose-600" />
          Nutrient diagnosis & natural therapist layer
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">All wellness categories</option>
            <option value="dietary">Dietary</option>
            <option value="traditional">Traditional</option>
            <option value="gut_health">Gut health</option>
          </select>
        </div>

        {wellnessLoading && <div className="text-sm text-slate-500">Loading wellness suggestions…</div>}
        {wellnessError && <div className="text-sm text-red-600">Unable to load wellness suggestions.</div>}

        {!wellnessLoading && wellnessPractices.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No wellness suggestions are available yet for this filter, but the module is live and ready for provider-backed AI guidance.</div>}

        <div className="grid gap-3 md:grid-cols-2">
          {wellnessPractices.map((practice) => (
            <div key={practice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">{practice.practice_name}</div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium uppercase text-amber-700">{practice.evidence_level || 'reference'}</span>
              </div>
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">{practice.category}</div>
              <p className="mb-2 text-sm text-slate-700">{practice.traditional_use || 'Traditional wellness use guidance is recorded for this practice.'}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600"><Leaf className="h-3.5 w-3.5" />{practice.requires_consultation ? 'Requires professional consultation' : 'General educational guidance'}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
