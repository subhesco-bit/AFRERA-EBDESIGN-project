import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Sprout, Search, BadgeCheck } from 'lucide-react'
import { varietyDirectoryAPI } from '../services/api'
import { AsyncState, Section } from '../components/common/DataPrimitives'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

/**
 * Regional Variety Directory — real, citation-backed NE India crop/
 * livestock/fisheries master data (142 varieties). Backend has existed
 * since before this session (regionalVarietyService.js, mounted at
 * /api/v1/variety-directory) but had zero frontend caller anywhere —
 * confirmed this session via grep. This page is that missing UI.
 *
 * Deliberately not shown as buyable inventory: these are reference entries,
 * not real seller SKUs. "Create listing" hands off to the real backend
 * endpoint that requires a seller-entered basePrice — this page never
 * invents a price.
 */
function GiBadge({ status }) {
  if (status === 'registered') {
    return <Badge className="gap-1 border-transparent bg-sev-info/15 text-sev-info hover:bg-sev-info/15"><BadgeCheck className="h-3 w-3" /> GI Registered</Badge>
  }
  if (status === 'pending') {
    return <Badge variant="outline" className="text-data-estimated">GI Pending</Badge>
  }
  return null
}

function CreateListingForm({ variety, onCreated }) {
  const [basePrice, setBasePrice] = useState('')
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: () => varietyDirectoryAPI.createListing(variety.id, { basePrice: Number(basePrice) }),
    onSuccess: (res) => onCreated(res.data?.data),
    onError: (err) => setError(err.response?.data?.error || err.message),
  })

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
      <Input
        type="number" min="0.01" step="0.01" placeholder="Your price (₹)"
        value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
        className="w-32"
      />
      <Button size="sm" disabled={!basePrice || mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? 'Creating…' : 'Create listing from this variety'}
      </Button>
      {error && <span className="text-xs text-sev-critical">{error}</span>}
    </div>
  )
}

export default function VarietyDirectoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const { data: categories } = useQuery({
    queryKey: ['variety-categories'],
    queryFn: () => varietyDirectoryAPI.getCategories().then((r) => r.data?.data || []),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['variety-directory', search, category],
    queryFn: () => varietyDirectoryAPI.list({ search: search || undefined, category: category || undefined }).then((r) => r.data),
  })

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Sprout className="h-6 w-6" /> North-East India Variety Directory
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data?.count ?? '142'} real, citation-backed crop, livestock, and fisheries varieties.
        Reference and discovery content — not buyable inventory until a seller creates a real
        listing with their own price.
      </p>

      <Section title="Browse">
        <div className="mb-3 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Search varieties" placeholder="Search varieties…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <select
            aria-label="Filter by category"
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {(categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}
          empty={!isLoading && (!data?.data || data.data.length === 0)}
          emptyMessage="No varieties match this search.">
          <div className="space-y-3">
            {(data?.data || []).map((v) => (
              <Card key={v.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{v.product_name}</CardTitle>
                    <CardDescription>
                      {v.scientific_name && <em>{v.scientific_name} · </em>}{v.primary_states}
                    </CardDescription>
                  </div>
                  <GiBadge status={v.gi_status} />
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-sm">
                  {v.specialty_usp && <p>{v.specialty_usp}</p>}
                  {v.commercial_potential && <p className="text-xs text-muted-foreground">{v.commercial_potential}</p>}

                  {expandedId === v.id ? (
                    <CreateListingForm
                      variety={v}
                      onCreated={(product) => navigate(`/products/${product.id}`)}
                    />
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setExpandedId(v.id)}>
                      Create listing from this variety
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </AsyncState>
      </Section>
    </main>
  )
}
