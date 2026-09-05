import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { TrendingUp, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const CreditScorePage = () => {
  const [creditData, setCreditData] = useState({
    score: 750,
    range: 'Excellent',
    factors: [
      { name: 'Payment History', impact: 'positive', score: 95 },
      { name: 'Credit Utilization', impact: 'positive', score: 88 },
      { name: 'Credit Age', impact: 'positive', score: 72 },
      { name: 'Account Mix', impact: 'neutral', score: 65 },
    ],
    recommendations: [
      'Maintain current payment pattern',
      'Keep credit utilization below 30%',
      'Consider diversifying credit types',
    ],
  });

  const getScoreColor = (score) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Score</h1>
          <p className="text-muted-foreground">Your creditworthiness assessment</p>
        </div>
        <Button variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" />
          Improve Score
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Credit Score Details</CardTitle>
            <CardDescription>Breakdown of your credit factors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(creditData.score)}`}>
                  {creditData.score}
                </div>
                <p className="text-lg text-muted-foreground">{creditData.range}</p>
              </div>
              <div className="space-y-4">
                {creditData.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {factor.impact === 'positive' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {factor.impact === 'neutral' && <Shield className="h-5 w-5 text-blue-600" />}
                      {factor.impact === 'negative' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      <span className="font-medium">{factor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{factor.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Ways to improve your score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creditData.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditScorePage;
