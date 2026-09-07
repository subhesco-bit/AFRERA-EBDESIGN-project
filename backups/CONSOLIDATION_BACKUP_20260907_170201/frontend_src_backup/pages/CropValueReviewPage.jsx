import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Check, X, ExternalLink } from 'lucide-react'
import { cropValueResearchAPI } from '../services/api'
import { AsyncState, Section } from '../components/common/DataPrimitives'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

/**
 * Admin review queue for AI-suggested crop value-compound reference data
 * (cropValueResearchService.js). Every row here is verified = FALSE by
 * construction — approving here is the ONLY way a row becomes eligible for
 * nutritionIntelligenceService.calculateValuePerNutrient's customer-facing
 * "why this costs more" explanation. Rejecting deletes it outright rather
 * than leaving a known-bad AI guess sitting in the table.
 */
export default function CropValueReviewPage() {
  const queryClient = useQueryClient()

  const { data: pending, isLoading, error } = useQuery({
    queryKey: ['crop-value-pending'],
    queryFn: () => cropValueResearchAPI.getPending().then((r) => r.data?.data || []),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve }) => cropValueResearchAPI.review(id, approve),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crop-value-pending'] }),
  })

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <ClipboardCheck className="h-6 w-6" /> Crop Value-Compound Review
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        AI-suggested published reference values, grounded in real web search results (see the
        source link on each). Nothing here is used in any customer-facing claim until approved.
      </p>

      <Section title="Pending review">
        <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}
          empty={!isLoading && (!pending || pending.length === 0)}
          emptyMessage="Nothing pending — either none has been suggested yet, or everything is reviewed.">
          <div className="space-y-3">
            {(pending || []).map((row) => (
              <Card key={row.id}>
                <CardContent className="space-y-2 pt-6 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{row.variety_name}</div>
                      <div className="text-xs text-muted-foreground">{row.compound_key}</div>
                    </div>
                    <Badge variant="outline" className="text-data-estimated">Unverified</Badge>
                  </div>
                  <div>
                    {row.typical_min ?? '—'}–{row.typical_max ?? '—'} {row.unit}
                  </div>
                  {row.notes && <p className="text-muted-foreground">{row.notes}</p>}
                  <a href={row.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary underline">
                    <ExternalLink className="h-3 w-3" /> {row.source_url}
                  </a>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => reviewMutation.mutate({ id: row.id, approve: true })} disabled={reviewMutation.isPending}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ id: row.id, approve: false })} disabled={reviewMutation.isPending}>
                      <X className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AsyncState>
      </Section>
    </main>
  )
}
