import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { defenseFitnessPrepAPI } from '../services/api'
import { AsyncState, Section } from '../components/common/DataPrimitives'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

/**
 * Defense/Police/BSF Fitness Prep — self-training comparison against real,
 * cited published physical standards (Army Agniveer, BSF Constable GD,
 * Delhi Police, UP Police). This is NOT connected to any actual recruitment
 * process — see defenseFitnessPrepService.js. Every threshold shown here
 * links to its real source and the date it was last verified, because these
 * standards are cycle-dependent and change.
 */
function componentLabel(component) {
  return component.replace(/_/g, ' ').replace('km', ' km').replace('m', ' m')
}

function formatThreshold(row) {
  if (row.threshold_value === null) return 'varies by cycle — see source'
  if (row.threshold_type === 'max_time_seconds') {
    const m = Math.floor(row.threshold_value / 60)
    const s = row.threshold_value % 60
    return `within ${m}:${String(s).padStart(2, '0')}`
  }
  return `≥ ${row.threshold_value} ${row.unit}`
}

export default function DefenseFitnessPrepPage() {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState('')
  const [gender, setGender] = useState('male')
  const [attemptValues, setAttemptValues] = useState({})

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['defense-fitness-categories'],
    queryFn: () => defenseFitnessPrepAPI.getCategories().then((r) => r.data?.data || []),
  })

  const { data: readiness, isLoading: readinessLoading, error: readinessError } = useQuery({
    queryKey: ['defense-fitness-readiness', category, gender],
    queryFn: () => defenseFitnessPrepAPI.getReadiness(category, gender).then((r) => r.data?.data || []),
    enabled: Boolean(category),
  })

  const recordMutation = useMutation({
    mutationFn: ({ testComponent, value }) => defenseFitnessPrepAPI.recordAttempt(category, testComponent, value, 'manual'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['defense-fitness-readiness', category, gender] }),
  })

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Shield className="h-6 w-6" /> Defense & Police Fitness Prep
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Train and eat toward a real, cited published physical standard. This is a self-prep tool
        only — it has no connection to any actual recruitment or selection process, and your data
        is never shared with any recruiting authority.
      </p>

      <Section title="Choose a standard">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Force or category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Select a force/category…</option>
            {(categories || []).map((c) => (
              <option key={c.category} value={c.category}>{c.force_name}</option>
            ))}
          </select>
          <select
            aria-label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </Section>

      {category && (
        <Section title="Your readiness" description="Only components you've logged a value for show a verdict — nothing is guessed.">
          <AsyncState loading={readinessLoading} error={readinessError?.response?.data?.error || readinessError?.message}
            empty={!readinessLoading && (!readiness || readiness.length === 0)}
            emptyMessage="No standards recorded for this category yet.">
            <div className="space-y-3">
              {(readiness || []).map((row) => (
                <Card key={row.test_component}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
                    <div>
                      <div className="font-medium capitalize">{componentLabel(row.test_component)}</div>
                      <div className="text-xs text-muted-foreground">Standard: {formatThreshold(row)}</div>
                      <a href={row.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                        source, verified {row.last_verified_date}
                      </a>
                    </div>

                    <div className="flex items-center gap-3">
                      {row.your_value !== null ? (
                        <>
                          <span className="text-sm">You: {row.your_value}</span>
                          {row.meets_standard === true && <Badge className="gap-1 border-transparent bg-sev-info/15 text-sev-info"><CheckCircle2 className="h-3 w-3" /> Meets standard</Badge>}
                          {row.meets_standard === false && <Badge variant="outline" className="gap-1 text-sev-critical"><XCircle className="h-3 w-3" /> Below standard</Badge>}
                          {row.meets_standard === null && <Badge variant="outline" className="gap-1 text-muted-foreground"><HelpCircle className="h-3 w-3" /> No fixed threshold</Badge>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            aria-label={`Your ${componentLabel(row.test_component)} value, in ${row.unit}`}
                            placeholder={row.unit}
                            value={attemptValues[row.test_component] || ''}
                            onChange={(e) => setAttemptValues((prev) => ({ ...prev, [row.test_component]: e.target.value }))}
                            className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!attemptValues[row.test_component] || recordMutation.isPending}
                            onClick={() => recordMutation.mutate({ testComponent: row.test_component, value: attemptValues[row.test_component] })}
                          >
                            Log
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AsyncState>
        </Section>
      )}
    </main>
  )
}
