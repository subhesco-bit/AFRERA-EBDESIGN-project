import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChefHat, Sparkles, AlertTriangle } from 'lucide-react';
import { nutritionAPI } from '../services/api';
import { AsyncState, Section } from '../components/common/DataPrimitives';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

/**
 * Diet & Recipes — real dietary profiles (nutritionIntelligenceService)
 * feeding a real AI backbone call (aiBackboneService) grounded ONLY in
 * AFRERA's own matching products. Not a static recipe database and not a
 * fabricated one: the AI is given the real ingredient list and told not to
 * invent others (see nutritionIntelligenceService.generateDietBasedRecipe).
 * Every response carries the same nutrition/wellness disclaimer used
 * elsewhere in this codebase — this is education, not medical advice.
 */
export default function DietRecipesPage() {
  const [dietaryProfileId, setDietaryProfileId] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [result, setResult] = useState(null);

  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['dietary-profiles'],
    queryFn: () => nutritionAPI.getDietaryProfiles().then((r) => r.data || []),
  });

  const recipeMutation = useMutation({
    mutationFn: () => nutritionAPI.generateRecipe(dietaryProfileId, targetCalories || undefined),
    onMutate: () => setResult(null),
    onSuccess: (res) => setResult(res.data),
    onError: (err) => setResult({ status: 'error', message: err.response?.data?.error || err.message }),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <ChefHat className="h-6 w-6" /> Diet & Recipes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate a recipe from a real dietary profile and AFRERA's own matching products, using the
        AI backbone. No invented ingredients, no invented recipe if no AI provider is configured.
      </p>

      <Section title="Choose a dietary profile">
        <AsyncState loading={profilesLoading} error={profilesError?.response?.data?.error || profilesError?.message}
          empty={!profilesLoading && (!profiles || profiles.length === 0)}
          emptyMessage="No dietary profiles recorded yet.">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="diet-profile" className="text-sm font-medium">Profile</label>
                <select
                  id="diet-profile"
                  value={dietaryProfileId}
                  onChange={(e) => setDietaryProfileId(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Select a profile…</option>
                  {(profiles || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.id}</option>
                  ))}
                </select>

                <label htmlFor="diet-calories" className="text-sm font-medium">Target kcal/day (optional)</label>
                <input
                  id="diet-calories"
                  type="number"
                  min="0"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  className="w-28 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  placeholder="e.g. 1800"
                />

                <Button
                  size="sm"
                  disabled={!dietaryProfileId || recipeMutation.isPending}
                  onClick={() => recipeMutation.mutate()}
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  {recipeMutation.isPending ? 'Generating…' : 'Generate recipe'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </AsyncState>
      </Section>

      {result && (
        <Section title="Result">
          {result.status === 'generated' && (
            <Card>
              <CardContent className="space-y-3 pt-6 text-sm">
                <div className="text-xs text-muted-foreground">
                  {result.ai_provider} · {result.ai_model}
                  {result.calorie_target_kcal_per_day ? ` · target ~${result.calorie_target_kcal_per_day} kcal/day` : ''}
                </div>
                <p className="whitespace-pre-wrap">{result.recipe_text}</p>
                <div className="text-xs text-muted-foreground">
                  Ingredients considered: {result.ingredients_considered?.join(', ')}
                </div>
                <p className="text-xs italic text-muted-foreground">{result.disclaimer}</p>
              </CardContent>
            </Card>
          )}

          {result.status === 'ai_not_configured' && (
            <div role="note" className="rounded-lg border border-border border-l-4 border-l-sev-notice bg-muted/40 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> No AI provider configured</p>
              <p className="text-muted-foreground">{result.message} Set a provider key in backend/.env — see the AI Backbone page.</p>
              {result.ingredients_considered?.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Real ingredients that would have been used: {result.ingredients_considered.join(', ')}
                </p>
              )}
            </div>
          )}

          {result.status === 'no_ingredients' && (
            <div role="note" className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              {result.message}
            </div>
          )}

          {result.status === 'error' && (
            <div role="alert" className="rounded-md border border-sev-critical/30 bg-sev-critical/10 p-3 text-sm text-sev-critical">
              {result.message}
            </div>
          )}
        </Section>
      )}
    </main>
  );
}
