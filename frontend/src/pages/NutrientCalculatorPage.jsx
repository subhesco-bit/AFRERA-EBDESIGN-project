import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calculator, Activity, AlertTriangle, CheckCircle, TrendingUp, PieChart, Download, RefreshCw } from 'lucide-react'
import { nutritionIntelligenceAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Progress } from '../components/ui/progress'

/**
 * Nutrient Calculator - Production-grade nutrient analysis for health conditions
 * Calculates nutrient profiles against medical condition requirements
 * Focuses on diabetes, hypertension, migraines, gout, and other common conditions
 */
export default function NutrientCalculatorPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('calculator')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [nutritionData, setNutritionData] = useState({})

  // Calculate nutrient profile mutation
  const calculateMutation = useMutation({
    mutationFn: (data) => nutritionIntelligenceAPI.calculateNutrientProfile(selectedCondition, data),
    onSuccess: (result) => {
      toast.success('Nutrient profile calculated successfully')
      queryClient.setQueryData(['nutrient-analysis', selectedCondition], result.data)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to calculate nutrient profile'),
  })

  const commonConditions = [
    { id: 'diabetes', name: 'Diabetes Mellitus', icon: '🩸', description: 'Blood sugar management' },
    { id: 'hypertension', name: 'Hypertension', icon: '💓', description: 'High blood pressure' },
    { id: 'hypotension', name: 'Hypotension', icon: '💙', description: 'Low blood pressure' },
    { id: 'migraine', name: 'Migraine', icon: '🤕', description: 'Headache management' },
    { id: 'gout', name: 'Gout', icon: '🦵', description: 'Uric acid management' },
    { id: 'cardiovascular', name: 'Cardiovascular', icon: '❤️', description: 'Heart health' },
  ]

  const handleNutrientInput = (nutrient, value) => {
    setNutritionData(prev => ({
      ...prev,
      [nutrient]: parseFloat(value) || 0
    }))
  }

  const handleCalculate = () => {
    if (!selectedCondition) {
      toast.error('Please select a health condition')
      return
    }
    if (Object.keys(nutritionData).length === 0) {
      toast.error('Please enter at least one nutrient value')
      return
    }
    calculateMutation.mutate(nutritionData)
  }

  const { data: analysis } = useQuery({
    queryKey: ['nutrient-analysis', selectedCondition],
    queryFn: () => nutritionIntelligenceAPI.calculateNutrientProfile(selectedCondition, nutritionData).then(res => res.data),
    enabled: false, // Only calculate when button is clicked
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Calculator className="w-6 h-6 mr-2 text-emerald-700" />
          Nutrient Calculator
        </h1>
        <p className="text-gray-600">Calculate nutrient profiles against health condition requirements</p>
      </div>

      {/* Condition Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Health Condition</CardTitle>
          <CardDescription>Choose a condition to analyze nutrient requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {commonConditions.map((condition) => (
              <div
                key={condition.id}
                className={`p-4 border rounded cursor-pointer transition hover:shadow-md ${selectedCondition === condition.id ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''}`}
                onClick={() => setSelectedCondition(condition.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{condition.icon}</span>
                  <div>
                    <h3 className="font-semibold">{condition.name}</h3>
                    <p className="text-sm text-gray-600">{condition.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nutrient Input</CardTitle>
                <CardDescription>Enter nutrient values for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCondition ? (
                  <div className="text-center py-8 text-gray-500">
                    Select a health condition first
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="carbohydrates">Carbohydrates (%)</Label>
                      <Input
                        id="carbohydrates"
                        type="number"
                        step="0.1"
                        value={nutritionData.carbohydrates || ''}
                        onChange={(e) => handleNutrientInput('carbohydrates', e.target.value)}
                        placeholder="e.g., 50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein">Protein (%)</Label>
                      <Input
                        id="protein"
                        type="number"
                        step="0.1"
                        value={nutritionData.protein || ''}
                        onChange={(e) => handleNutrientInput('protein', e.target.value)}
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat">Fat (%)</Label>
                      <Input
                        id="fat"
                        type="number"
                        step="0.1"
                        value={nutritionData.fat || ''}
                        onChange={(e) => handleNutrientInput('fat', e.target.value)}
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fiber">Fiber (g)</Label>
                      <Input
                        id="fiber"
                        type="number"
                        step="0.1"
                        value={nutritionData.fiber || ''}
                        onChange={(e) => handleNutrientInput('fiber', e.target.value)}
                        placeholder="e.g., 25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sodium">Sodium (mg)</Label>
                      <Input
                        id="sodium"
                        type="number"
                        step="1"
                        value={nutritionData.sodium || ''}
                        onChange={(e) => handleNutrientInput('sodium', e.target.value)}
                        placeholder="e.g., 2300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="potassium">Potassium (mg)</Label>
                      <Input
                        id="potassium"
                        type="number"
                        step="1"
                        value={nutritionData.potassium || ''}
                        onChange={(e) => handleNutrientInput('potassium', e.target.value)}
                        placeholder="e.g., 3500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="magnesium">Magnesium (mg)</Label>
                      <Input
                        id="magnesium"
                        type="number"
                        step="1"
                        value={nutritionData.magnesium || ''}
                        onChange={(e) => handleNutrientInput('magnesium', e.target.value)}
                        placeholder="e.g., 310"
                      />
                    </div>
                    <div>
                      <Label htmlFor="calcium">Calcium (mg)</Label>
                      <Input
                        id="calcium"
                        type="number"
                        step="1"
                        value={nutritionData.calcium || ''}
                        onChange={(e) => handleNutrientInput('calcium', e.target.value)}
                        placeholder="e.g., 1000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="glycemic_index">Glycemic Index</Label>
                      <Input
                        id="glycemic_index"
                        type="number"
                        step="1"
                        value={nutritionData.glycemic_index || ''}
                        onChange={(e) => handleNutrientInput('glycemic_index', e.target.value)}
                        placeholder="e.g., 55"
                      />
                    </div>
                    <div>
                      <Label htmlFor="purines">Purines (mg)</Label>
                      <Input
                        id="purines"
                        type="number"
                        step="1"
                        value={nutritionData.purines || ''}
                        onChange={(e) => handleNutrientInput('purines', e.target.value)}
                        placeholder="e.g., 200"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Input</CardTitle>
                <CardDescription>Nutrient values entered for analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(nutritionData).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No nutrient values entered yet
                    </div>
                  ) : (
                    Object.entries(nutritionData).map(([nutrient, value]) => (
                      <div key={nutrient} className="flex items-center justify-between p-2 border rounded">
                        <span className="capitalize">{nutrient.replace(/_/g, ' ')}</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))
                  )}
                </div>
                <Button 
                  onClick={handleCalculate}
                  disabled={!selectedCondition || Object.keys(nutritionData).length === 0 || calculateMutation.isPending}
                  className="w-full mt-4"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {calculateMutation.isPending ? 'Calculating...' : 'Calculate Profile'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Nutrient Analysis Results</CardTitle>
              <CardDescription>Analysis of nutrient profile against condition requirements</CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-8 text-gray-500">
                  Calculate a nutrient profile to see analysis results
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      <span className="font-semibold">Overall Status</span>
                    </div>
                    <Badge 
                      variant={analysis.overall_status === 'optimal' ? 'default' : 'secondary'}
                      className={analysis.overall_status === 'optimal' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}
                    >
                      {analysis.overall_status === 'optimal' ? 'Optimal' : 'Needs Adjustment'}
                    </Badge>
                  </div>

                  {analysis.analysis && Object.entries(analysis.analysis).map(([nutrient, result]) => (
                    <div key={nutrient} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">{nutrient.replace(/_/g, ' ')}</h3>
                        <Badge 
                          variant={result.status === 'within_range' ? 'default' : 'secondary'}
                          className={
                            result.status === 'within_range' ? 'bg-green-100 text-green-600' :
                            result.status === 'below_minimum' ? 'bg-blue-100 text-blue-600' :
                            'bg-red-100 text-red-600'
                          }
                        >
                          {result.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Current:</span>
                          <span className="ml-2 font-mono">{result.value} {result.required.unit}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Required:</span>
                          <span className="ml-2 font-mono">
                            {result.required.min !== undefined ? result.required.min : 'N/A'} - {result.required.max !== undefined ? result.required.max : 'N/A'} {result.required.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className="ml-2">{result.recommendation}</span>
                        </div>
                      </div>
                      {result.status !== 'within_range' && (
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <span className="text-sm text-yellow-800">{result.recommendation}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {analysis.warnings && analysis.warnings.length > 0 && (
                    <div className="p-4 border rounded bg-yellow-50">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Warnings
                      </h3>
                      <ul className="space-y-1">
                        {analysis.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-yellow-800">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="p-4 border rounded bg-blue-50">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Recommendations
                      </h3>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-blue-800">• {recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines">
          <Card>
            <CardHeader>
              <CardTitle>Condition Guidelines</CardTitle>
              <CardDescription>Dietary guidelines for selected condition</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCondition ? (
                <div className="text-center py-8 text-gray-500">
                  Select a health condition to view guidelines
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border rounded">
                    <h3 className="font-semibold mb-2">General Guidelines</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Consult with healthcare provider for personalized guidance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Monitor nutrient intake regularly</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Adjust diet based on individual response</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded">
                    <h3 className="font-semibold mb-2">Important Notes</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• Nutrient requirements may vary based on individual factors</p>
                      <p>• This calculator provides general guidance only</p>
                      <p>• Always follow medical advice from qualified professionals</p>
                      <p>• Regular monitoring of health parameters is recommended</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded bg-blue-50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-blue-600" />
                      Medical Disclaimer
                    </h3>
                    <p className="text-sm text-blue-800">
                      This tool is for educational purposes only and does not constitute medical advice. 
                      Always consult with qualified healthcare professionals for diagnosis and treatment 
                      of medical conditions.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
