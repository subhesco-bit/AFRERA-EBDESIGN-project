import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PackagePlus, Sparkles } from 'lucide-react'
import { productsAPI } from '../services/api'
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
  organic: false,
  gi_status: false,
  featured: false,
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
      navigate(`/products/${res.data.id}`)
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
      featured: form.featured,
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <PackagePlus className="h-6 w-6" /> Add Product
      </h1>
      <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        Since you're not attaching an image below, AFRERA will automatically attempt to
        generate one via the AI backbone once you save (falls back honestly if no image
        provider is configured — see the AI Backbone page).
      </p>

      <Section title="Details">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product name *</Label>
                <Input id="name" value={form.name} onChange={update('name')} required />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={update('description')} rows={3} />
              </div>

              <div>
                <Label htmlFor="usp">Why this product? (USP)</Label>
                <Textarea id="usp" value={form.usp} onChange={update('usp')} rows={2} />
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
                  <Label htmlFor="base_price">Base price (₹) *</Label>
                  <Input id="base_price" type="number" min="0" step="0.01" value={form.base_price} onChange={update('base_price')} required />
                </div>
                <div>
                  <Label htmlFor="map_price">MAP price (₹)</Label>
                  <Input id="map_price" type="number" min="0" step="0.01" value={form.map_price} onChange={update('map_price')} />
                </div>
                <div>
                  <Label htmlFor="retail_price">Retail price (₹)</Label>
                  <Input id="retail_price" type="number" min="0" step="0.01" value={form.retail_price} onChange={update('retail_price')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight_per_unit">Weight per unit (kg)</Label>
                  <Input id="weight_per_unit" type="number" min="0" step="0.01" value={form.weight_per_unit} onChange={update('weight_per_unit')} />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" value={form.tags} onChange={update('tags')} placeholder="spices, organic, turmeric" />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.organic} onChange={update('organic')} /> Organic
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.gi_status} onChange={update('gi_status')} /> GI Certified
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.featured} onChange={update('featured')} /> Featured
                </label>
              </div>

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

              <Button type="submit" disabled={createMutation.isPending || queuedOffline}>
                {createMutation.isPending ? 'Saving…' : queuedOffline ? 'Queued for sync' : 'Create Product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Section>
    </main>
  )
}
