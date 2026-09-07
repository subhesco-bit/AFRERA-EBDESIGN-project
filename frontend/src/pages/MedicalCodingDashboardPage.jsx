import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Activity, Code2, AlertTriangle, CheckCircle, BookOpen, Filter, Search, Plus, Download, RefreshCw } from 'lucide-react'
import { medicalCodingAPI, nutritionIntelligenceAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

/**
 * Medical Coding Dashboard - Production-grade medical code management
 * Provides proper ICD-10-CM, SNOMED-CT, and LOINC medical coding
 * Focuses on common health conditions: diabetes, hypertension, migraines, gout, etc.
 */
export default function MedicalCodingDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('conditions')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [selectedType, setSelectedType] = useState('')

  // Fetch medical condition codes
  const { data: medicalCodes, isLoading: codesLoading } = useQuery({
    queryKey: ['medical-codes'],
    queryFn: () => medicalCodingAPI.getMedicalConditionCodes().then(res => res.data),
  })

  // Fetch dietary restrictions for selected condition
  const { data: restrictions, isLoading: restrictionsLoading } = useQuery({
    queryKey: ['dietary-restrictions', selectedCondition],
    queryFn: () => medicalCodingAPI.getDietaryRestrictions(selectedCondition).then(res => res.data),
    enabled: !!selectedCondition,
  })

  // Fetch nutrient requirements for selected condition
  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['nutrient-requirements', selectedCondition],
    queryFn: => medicalCodingAPI.getNutrientRequirements(selectedCondition).then(res => res.data),
    enabled: !!selectedCondition,
  })

  const getConditionColor = (condition) => {
    const colors = {
      diabetes: 'text-red-600 bg-red-100',
      hypertension: 'text-orange-600 bg-orange-100',
      hypotension: 'text-blue-600 bg-blue-100',
      migraine: 'text-purple-600 bg-purple-100',
      gout: 'text-green-600 bg-green-100',
      cardiovascular: 'text-pink-600 bg-pink-100',
      respiratory: 'text-cyan-600 bg-cyan-100',
      gastrointestinal: 'text-teal-600 bg-teal-100',
      nutritional: 'text-amber-600 bg-amber-100',
      mental_health: 'text-indigo-600 bg-indigo-100',
    }
    return colors[condition] || 'text-gray-600 bg-gray-100'
  }

  const getConditionIcon = (condition) => {
    const icons = {
      diabetes: '🩸',
      hypertension: '💓',
      hypotension: '💙',
      migraine: '🤕',
      gout: '🦵',
      cardiovascular: '❤️',
      respiratory: '🫁',
      gastrointestinal: '🍽️',
      nutritional: '🥗',
      mental_health: '🧠',
    }
    return icons[condition] || '🏥'
  }

  const commonConditions = [
    { id: 'diabetes', name: 'Diabetes Mellitus', icon: '🩸', description: 'Type 1, Type 2, Gestational' },
    { id: 'hypertension', name: 'Hypertension', icon: '💓', description: 'High blood pressure management' },
    { id: 'hypotension', name: 'Hypotension', icon: '💙', description: 'Low blood pressure management' },
    { id: 'migraine', name: 'Migraine', icon: '🤕', description: 'Headache and migraine management' },
    { id: 'gout', name: 'Gout', icon: '🦵', description: 'Uric acid and joint pain' },
    { id: 'cardiovascular', name: 'Cardiovascular', icon: '❤️', description: 'Heart and circulatory health' },
    { id: 'respiratory', name: 'Respiratory', icon: '🫁', description: 'Lung and respiratory health' },
    { id: 'gastrointestinal', name: 'Gastrointestinal', icon: '🍽️', description: 'Digestive system health' },
    { id: 'nutritional', name: 'Nutritional', icon: '🥗', description: 'Nutrition and diet-related' },
    { id: 'mental_health', name: 'Mental Health', icon: '🧠', description: 'Psychological well-being' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Code2 className="w-6 h-6 mr-2 text-emerald-700" />
          Medical Coding Dashboard
        </h1>
        <p className="text-gray-600">Proper medical coding (ICD-10-CM, SNOMED-CT, LOINC) for health conditions with dietary and nutrient guidance</p>
      </div>

      {/* Common Conditions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {commonConditions.map((condition) => (
          <Card 
            key={condition.id}
            className={`cursor-pointer transition hover:shadow-md ${selectedCondition === condition.id ? 'ring-2 ring-emerald-500' : ''}`}
            onClick={() => setSelectedCondition(condition.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <span className="text-2xl mr-2">{condition.icon}</span>
                {condition.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">{condition.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="codes">Medical Codes</TabsTrigger>
          <TabsTrigger value="restrictions">Dietary Restrictions</TabsTrigger>
          <TabsTrigger value="requirements">Nutrient Requirements</TabsTrigger>
          <TabsTrigger value="calculator">Nutrient Calculator</TabsTrigger>
          <TabsTrigger value="therapist">Natural Therapist</TabsTrigger>
        </TabsList>

        <TabsContent value="conditions">
          <Card>
            <CardHeader>
              <CardTitle>Health Conditions</CardTitle>
              <CardDescription>Select a condition to view medical codes and dietary guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commonConditions.map((condition) => (
                  <div 
                    key={condition.id}
                    className={`p-4 border rounded cursor-pointer transition hover:bg-gray-50 ${selectedCondition === condition.id ? 'bg-emerald-50 border-emerald-500' : ''}`}
                    onClick={() => setSelectedCondition(condition.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{condition.icon}</span>
                        <div>
                          <h3 className="font-semibold">{condition.name}</h3>
                          <p className="text-sm text-gray-600">{condition.description}</p>
                        </div>
                      </div>
                      <Badge className={getConditionColor(condition.id)}>
                        {selectedCondition === condition.id ? 'Selected' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes">
          <Card>
            <CardHeader>
              <CardTitle>Medical Codes by Condition</CardTitle>
              <CardDescription>ICD-10-CM, SNOMED-CT, and LOINC codes for selected condition</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCondition ? (
                <div className="text-center py-8 text-gray-500">
                  Select a condition to view medical codes
                </div>
              ) : codesLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading medical codes...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="unspecified">General</SelectItem>
                        <SelectItem value="complications">Complications</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['medical-codes'] })}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {selectedCondition && medicalCodes?.conditions?.[selectedCondition] && (
                    <div className="space-y-3">
                      {Object.entries(medicalCodes.conditions[selectedCondition]).map(([type, codeData]) => {
                        if (selectedType !== 'all' && selectedType !== type) return null;
                        
                        return (
                          <div key={type} className="p-4 border rounded">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold capitalize">{type.replace('_', ' ')}</h3>
                                <p className="text-sm text-gray-600">{codeData.display}</p>
                              </div>
                              <Badge variant="outline">{codeData.system}</Badge>
                            </div>
                            <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                              Code: {codeData.code}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restrictions">
          <Card>
            <CardHeader>
              <CardTitle>Dietary Restrictions</CardTitle>
              <CardDescription>Food restrictions and dietary guidelines for the selected condition</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCondition ? (
                <div className="text-center py-8 text-gray-500">
                  Select a condition to view dietary restrictions
                </div>
              ) : restrictionsLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading restrictions...
                </div>
              ) : restrictions?.restrictions ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <h3 className="font-semibold mb-2">Allowed Foods</h3>
                      <div className="space-y-2">
                        {restrictions.restrictions.allowed.map((food, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="capitalize">{food.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 border rounded">
                      <h3 className="font-semibold mb-2">Restricted Foods</h3>
                      <div className="space-y-2">
                        {restrictions.restrictions.restricted.map((food, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="capitalize">{food.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <h3 className="font-semibold mb-2">Meal Guidelines</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Portion Control:</span>
                          <Badge variant={restrictions.restrictions.portion_control ? 'default' : 'secondary'}>
                            {restrictions.restrictions.portion_control ? 'Required' : 'Optional'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Meal Frequency:</span>
                          <span className="capitalize">{restrictions.restrictions.meal_frequency.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded">
                      <h3 className="font-semibold mb-2">Special Focus</h3>
                      <div className="space-y-2 text-sm">
                        {restrictions.restrictions.glycemic_focus && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span>Glycemic Index Focus</span>
                          </div>
                        )}
                        {restrictions.restrictions.dash_compliant && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span>DASH Compliant</span>
                          </div>
                        )}
                        {restrictions.restrictions.trigger_avoidance && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span>Trigger Avoidance</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No dietary restrictions found for this condition
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Nutrient Requirements</CardTitle>
              <CardDescription>Daily nutrient requirements for the selected condition</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCondition ? (
                <div className="text-center py-8 text-gray-500">
                  Select a condition to view nutrient requirements
                </div>
              ) : requirementsLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading requirements...
                </div>
              ) : requirements?.requirements ? (
                <div className="space-y-4">
                  {Object.entries(requirements.requirements).map(([nutrient, req]) => (
                    <div key={nutrient} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">{nutrient.replace(/_/g, ' ')}</h3>
                        <Badge variant="outline">{req.unit}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Minimum:</span>
                          <span className="ml-2 font-mono">{req.min !== undefined ? req.min : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Maximum:</span>
                          <span className="ml-2 font-mono">{req.max !== undefined ? req.max : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Note:</span>
                          <span className="ml-2">{req.note || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No nutrient requirements found for this condition
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Nutrient Calculator</CardTitle>
              <CardDescription>Calculate nutrient profile against condition requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Nutrient calculator interface - Select a condition first
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapist">
          <Card>
            <CardHeader>
              <CardTitle>Natural Therapist Guidance</CardTitle>
              <CardDescription>Get natural therapy guidance for health conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Natural therapist guidance interface - Select a condition first
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
