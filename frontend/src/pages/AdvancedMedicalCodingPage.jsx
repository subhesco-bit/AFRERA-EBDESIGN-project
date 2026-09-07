import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Brain, Heart, Activity, BookOpen, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function AdvancedMedicalCodingPage() {
  const [loading, setLoading] = useState(false);
  const [codeSystems, setCodeSystems] = useState(null);
  const [dietitianKnowledge, setDietitianKnowledge] = useState(null);
  const [naturalTherapistKnowledge, setNaturalTherapistKnowledge] = useState(null);
  const [healthPlan, setHealthPlan] = useState(null);
  const [searchCondition, setSearchCondition] = useState('');
  const [selectedCodeSystem, setSelectedCodeSystem] = useState('ICD-10-CM');

  useEffect(() => {
    loadCodeSystems();
  }, []);

  const loadCodeSystems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/advanced-medical-coding/code-systems');
      setCodeSystems(response.data);
    } catch (error) {
      toast.error('Failed to load code systems');
    } finally {
      setLoading(false);
    }
  };

  const searchMedicalCodes = async () => {
    if (!searchCondition) {
      toast.error('Please enter a condition to search');
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/advanced-medical-coding/search-codes/${searchCondition}`, {
        params: { codeSystem: selectedCodeSystem }
      });
      toast.success('Codes retrieved successfully');
    } catch (error) {
      toast.error('Failed to search medical codes');
    } finally {
      setLoading(false);
    }
  };

  const loadDietitianKnowledge = async (condition) => {
    try {
      setLoading(true);
      const response = await api.get(`/advanced-medical-coding/dietitian-knowledge/${condition}`);
      setDietitianKnowledge(response.data);
    } catch (error) {
      toast.error('Failed to load dietitian knowledge');
    } finally {
      setLoading(false);
    }
  };

  const loadNaturalTherapistKnowledge = async (condition) => {
    try {
      setLoading(true);
      const response = await api.get(`/advanced-medical-coding/natural-therapist-knowledge/${condition}`);
      setNaturalTherapistKnowledge(response.data);
    } catch (error) {
      toast.error('Failed to load natural therapist knowledge');
    } finally {
      setLoading(false);
    }
  };

  const generateHealthPlan = async () => {
    try {
      setLoading(true);
      const response = await api.post('/advanced-medical-coding/health-management-plan', {
        conditions: ['diabetes', 'hypertension'],
        preferences: { dietary: 'balanced', lifestyle: 'moderate' }
      });
      setHealthPlan(response.data);
      toast.success('Health management plan generated');
    } catch (error) {
      toast.error('Failed to generate health plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !codeSystems) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Advanced Medical Coding & Health Management</h1>
        <p className="text-muted-foreground">
          MS-Level Knowledge for Dietitians and Natural Therapists with 30+ Years Experience Integration
        </p>
      </div>

      <Tabs defaultValue="code-systems" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="code-systems">Code Systems</TabsTrigger>
          <TabsTrigger value="dietitian">Dietitian Knowledge</TabsTrigger>
          <TabsTrigger value="natural">Natural Therapist</TabsTrigger>
          <TabsTrigger value="health-plan">Health Management</TabsTrigger>
          <TabsTrigger value="ai-coding">AI Coding</TabsTrigger>
        </TabsList>

        <TabsContent value="code-systems" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Medical Code Systems
              </CardTitle>
              <CardDescription>
                Comprehensive medical and biological coding systems for precision medicine
              </CardDescription>
            </CardHeader>
            <CardContent>
              {codeSystems && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Medical Code Systems</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(codeSystems.medical || {}).map(([key, value]) => (
                        <div key={key} className="p-3 border rounded-lg">
                          <Badge variant="outline" className="mb-2">{key}</Badge>
                          <p className="text-sm text-muted-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Biological Code Systems</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(codeSystems.biological || {}).map(([key, value]) => (
                        <div key={key} className="p-3 border rounded-lg">
                          <Badge variant="outline" className="mb-2">{key}</Badge>
                          <p className="text-sm text-muted-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dietitian" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                MS-Level Dietitian Knowledge
              </CardTitle>
              <CardDescription>
                30+ years experience level clinical nutrition protocols and evidence-based practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter condition (e.g., diabetes, hypertension, ckd)"
                  value={searchCondition}
                  onChange={(e) => setSearchCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadDietitianKnowledge(searchCondition)}
                />
                <Button onClick={() => loadDietitianKnowledge(searchCondition)}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {dietitianKnowledge && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{dietitianKnowledge.category}</Badge>
                      <Badge variant="outline">{dietitianKnowledge.condition}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Evidence Level: {dietitianKnowledge.evidence_level}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Knowledge Base</h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(dietitianKnowledge.knowledge, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="natural" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                MS-Level Natural Therapist Knowledge
              </CardTitle>
              <CardDescription>
                Integrative medicine protocols combining traditional wisdom with modern research
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter condition (e.g., anxiety, chronic_pain, autoimmune)"
                  value={searchCondition}
                  onChange={(e) => setSearchCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadNaturalTherapistKnowledge(searchCondition)}
                />
                <Button onClick={() => loadNaturalTherapistKnowledge(searchCondition)}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {naturalTherapistKnowledge && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{naturalTherapistKnowledge.category}</Badge>
                      <Badge variant="outline">{naturalTherapistKnowledge.condition}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Evidence Level: {naturalTherapistKnowledge.evidence_level}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Knowledge Base</h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(naturalTherapistKnowledge.knowledge, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health-plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Comprehensive Health Management Plan
              </CardTitle>
              <CardDescription>
                Generate personalized health management plans using MS-level knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateHealthPlan} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate Health Plan
              </Button>

              {healthPlan && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Conditions</h4>
                    <div className="flex gap-2">
                      {healthPlan.conditions.map((condition, index) => (
                        <Badge key={index}>{condition}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Dietitian Recommendations</h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(healthPlan.dietitian_recommendations, null, 2)}
                    </pre>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Natural Therapist Recommendations</h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(healthPlan.natural_therapist_recommendations, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-coding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Medical Coding
              </CardTitle>
              <CardDescription>
                Advanced AI assistance for medical coding and clinical documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Enter clinical description for AI coding assistance"
                  disabled={loading}
                />
                <Select value={selectedCodeSystem} onValueChange={setSelectedCodeSystem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select code system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ICD-10-CM">ICD-10-CM</SelectItem>
                    <SelectItem value="CPT">CPT</SelectItem>
                    <SelectItem value="HCPCS">HCPCS</SelectItem>
                    <SelectItem value="SNOMED-CT">SNOMED-CT</SelectItem>
                    <SelectItem value="LOINC">LOINC</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => {}} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate AI Coding Suggestions
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <p className="text-sm text-muted-foreground">
                  Note: AI coding assistance requires AI provider configuration (OpenAI, Gemini, or Anthropic API keys).
                  Configure these in your environment variables to enable this feature.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
