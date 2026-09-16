import { Code2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'

// 2026-09-16: re-investigated this page's `medicalCodingAPI`
// (getMedicalConditionCodes/getDietaryRestrictions/getNutrientRequirements)
// as part of the pondAPI/medicalCodingAPI/nutritionIntelligenceAPI
// gap-closing pass. `.ai/tasks/AGENT_ASSIGNMENTS.md` previously assumed
// this traced to a `createCrudService(...)` object that "just needs a
// router" - not the case on direct inspection.
//
// The three methods this page calls need condition-keyed data
// (`{conditions: {diabetes: {type: {code, system, display}}}}`,
// `{restrictions: {allowed, restricted, portion_control, meal_frequency,
// glycemic_focus, dash_compliant, trigger_avoidance}}`,
// `{requirements: {nutrient: {min, max, unit, note}}}`). Grepped the
// entire backend for these exact method names and for the distinctive
// keys (`dash_compliant`, `glycemic_focus`, `trigger_avoidance`,
// `portion_control` alongside `meal_frequency`) - zero real matches.
//
// Two adjacent-sounding real services exist, neither is a match:
// - `services/advancedMedicalCodingService.js` is real and already
//   mounted at `/api/v1/advanced-medical-coding`, but its actual
//   frontend consumer is a different page (`AdvancedMedicalCodingPage.jsx`).
//   It exposes `getDietitianKnowledge`/`getNaturalTherapistKnowledge`/
//   `getMedicalCodeSystems` - free-text knowledge-base lookups, not the
//   `{allowed, restricted}` condition-restriction shape this page needs -
//   and its `searchMedicalCodes()` is a stub that always returns
//   `codes: []`.
// - `services/medicalCodingReferenceService.js` is a real, unmounted
//   router that does a plain standard/domain/code text search against a
//   `medical_coding_reference` table. It has no per-condition dietary
//   restriction or nutrient requirement data at all.
// - `services/legacy/consumerHealthService.js`'s `meal_frequency` field
//   and `'unspecified'` gender placeholder are coincidental keyword
//   matches on unrelated data, not this shape.
//
// `medicalCodingAPI` is correctly kept as a documented empty stub in
// `services/api.js`. Wiring this page to a route that doesn't exist, or
// inventing the condition/restriction/requirement data ourselves, would
// be exactly the fabrication this pass exists to avoid - so this page
// shows an honest "not available" state instead of fake medical/dietary
// guidance.
export default function MedicalCodingDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Code2 className="w-6 h-6 mr-2 text-emerald-700" />
          Medical Coding Dashboard
        </h1>
        <p className="text-gray-600">Proper medical coding (ICD-10-CM, SNOMED-CT, LOINC) for health conditions with dietary and nutrient guidance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medical coding data isn&apos;t available yet</CardTitle>
          <CardDescription>
            Condition-based medical codes, dietary restrictions and nutrient requirements aren&apos;t
            connected to any live backend yet, so there&apos;s no real data to show here. This page
            will display real guidance once that backend is built.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No medical coding data to display.</p>
        </CardContent>
      </Card>
    </div>
  )
}
