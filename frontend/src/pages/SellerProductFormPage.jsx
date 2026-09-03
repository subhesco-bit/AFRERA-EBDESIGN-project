import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PackagePlus, Sparkles } from 'lucide-react'
import { productsAPI } from '../services/api'
import { buildProductImagePrompt } from '../utils/aiStudio'
import { Section } from '../components/common/DataPrimitives'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import offlineQueue from '../services/offlineQueue'

/**
 * Seller Product Creation — real gap confirmed this session: no page
 * anywhere in the frontend called productsAPI.createProduct, even though
 * the real endpoint (POST /api/v1/products, productService.createProduct)
 * has existed all along. Building the actual form, not another adapter
 * layer — the backend side of this chain was already complete.
 *
 * One real, already-wired consequence of using this form: productService.
 * createProduct automatically calls productMediaAIService.
 * requestProductImageGeneration when no image is supplied — best-effort,
 * never blocks creation, and its honest outcome (including not_configured)
 * is recorded on the product row. This page doesn't duplicate that call —
 * it just tells the seller it will happen.
 */
const emptyForm = {
  name: '',
  description: '',
  usp: '',
  category_id: '',
  state_id: '',
  base_price: '',
  map_price: '',
  retail_price: '',
  weight_per_unit: '',
  tags: '',
  imagePrompt: '',
  organic: false,
  gi_status: false,
}

export default function SellerProductFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState(null)

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => productsAPI.getCategories().then((r) => r.data || []),
  })
  const { data: states } = useQuery({
    queryKey: ['product-states'],
    queryFn: () => productsAPI.getStates().then((r) => r.data || []),
  })

  const [queuedOffline, setQueuedOffline] = useState(false)

  // Rural connectivity is unreliable — a seller filling this form in a low-
  // signal area shouldn't lose their listing to a dropped connection. If
  // the device is offline, or the request fails for a network reason (not
  // a validation error from the server, which still surfaces normally),
  // the submission is queued via services/offlineQueue.js and synced by
  // the existing service-worker background sync once connectivity returns.
  const createMutation = useMutation({
    mutationFn: (payload) => {
      if (!navigator.onLine) {
        offlineQueue.add({ method: 'POST', url: '/products', data: payload })
        return Promise.resolve({ queued: true })
      }
      return productsAPI.createProduct(payload)
    },
    onSuccess: (res) => {
      if (res?.queued) {
        setQueuedOffline(true)
        return
      }
      const prompt = form.imagePrompt?.trim() || buildProductImagePrompt(form.name, form.description, states?.find((s) => String(s.id) === String(form.state_id))?.name)
      navigate(`/products/${res.data.id}?autoAI=1&prompt=${encodeURIComponent(prompt)}`)
    },
    onError: (err, payload) => {
      const isNetworkError = !err.response
      if (isNetworkError) {
        offlineQueue.add({ method: 'POST', url: '/products', data: payload })
        setQueuedOffline(true)
        return
      }
      setFormError(err.response?.data?.error || err.message)
    },
  })

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim() || !form.base_price) {
      setFormError('Name and base price are required.')
      return
    }
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || null,
      usp: form.usp.trim() || null,
      category_id: form.category_id || null,
      state_id: form.state_id || null,
      base_price: Number(form.base_price),
      map_price: form.map_price ? Number(form.map_price) : null,
      retail_price: form.retail_price ? Number(form.retail_price) : null,
      weight_per_unit: form.weight_per_unit ? Number(form.weight_per_unit) : null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      organic: form.organic,
      gi_status: form.gi_status,
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <PackagePlus className="h-6 w-6" /> List a product to sell
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in the details below — it only takes a few minutes. Fields marked * are required;
        everything else can be added or edited later.
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        Since you're not attaching an image below, AFRERA will automatically attempt to
        generate one via the AI backbone once you save (falls back honestly if no image
        provider is configured — see the AI Backbone page).
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        <strong className="text-foreground">What happens after you submit:</strong> your product
        goes live on the marketplace immediately — there's no waiting for approval. You can come
        back and edit or remove it any time from your seller listings.
      </p>

      <Section title="Details">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product name *</Label>
                <Input id="name" value={form.name} onChange={update('name')} required placeholder="e.g. Sikkim Large Cardamom" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={update('description')} rows={3}
                  placeholder="Tell buyers about your product — how it's grown, harvested, and what makes it good." />
              </div>

              <div>
                <Label htmlFor="usp">Why this product? (optional)</Label>
                <Textarea id="usp" value={form.usp} onChange={update('usp')} rows={2}
                  placeholder="What makes yours stand out — organic, GI-certified, family farm, etc." />
                <p className="mt-1 text-xs text-muted-foreground">A short, honest reason buyers should pick your listing.</p>
              </div>

              <div>
                <Label htmlFor="imagePrompt">AI product image prompt (optional)</Label>
                <Textarea id="imagePrompt" value={form.imagePrompt} onChange={update('imagePrompt')} rows={2}
                  placeholder="e.g. premium organic produce with clean background, bright natural colours, Northeast India farm branding" />
                <p className="mt-1 text-xs text-muted-foreground">If left blank, AFRERA will generate a default storefront image prompt after listing.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select id="category" value={form.category_id} onChange={update('category_id')}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select…</option>
                    {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <select id="state" value={form.state_id} onChange={update('state_id')}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select…</option>
                    {(states || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">Your price (₹) *</Label>
                  <Input id="base_price" type="number" min="0" step="0.01" value={form.base_price} onChange={update('base_price')} required placeholder="0.00" />
                  <p className="mt-1 text-xs text-muted-foreground">Per unit, before GST.</p>
                </div>
                <div>
                  <Label htmlFor="map_price">MAP price (₹)</Label>
                  <Input id="map_price" type="number" min="0" step="0.01" value={form.map_price} onChange={update('map_price')} placeholder="Optional" />
                  <p className="mt-1 text-xs text-muted-foreground">Minimum advertised price, if you set one.</p>
                </div>
                <div>
                  <Label htmlFor="retail_price">Retail price (₹)</Label>
                  <Input id="retail_price" type="number" min="0" step="0.01" value={form.retail_price} onChange={update('retail_price')} placeholder="Optional" />
                  <p className="mt-1 text-xs text-muted-foreground">Typical shelf price, for comparison.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight_per_unit">Weight per unit (kg)</Label>
                  <Input id="weight_per_unit" type="number" min="0" step="0.01" value={form.weight_per_unit} onChange={update('weight_per_unit')} placeholder="Optional" />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" value={form.tags} onChange={update('tags')} placeholder="spices, organic, turmeric" />
                  <p className="mt-1 text-xs text-muted-foreground">Helps buyers find you when searching.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.organic} onChange={update('organic')} /> Organic
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.gi_status} onChange={update('gi_status')} /> GI Certified
                </label>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Only check these if you can back them up — they're shown to buyers as certifications.
              </p>

              {formError && (
                <div role="alert" className="rounded-md border border-sev-critical/30 bg-sev-critical/10 p-3 text-sm text-sev-critical">
                  {formError}
                </div>
              )}

              {queuedOffline && (
                <div role="status" className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                  No connection right now — this listing is saved on your device and will be
                  created automatically once you're back online. You can close this page.
                </div>
              )}

              <Button type="submit" disabled={createMutation.isPending || queuedOffline} className="w-full sm:w-auto">
                {createMutation.isPending ? 'Publishing…' : queuedOffline ? 'Queued for sync' : 'Publish Listing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Section>
    </main>
  )
}
