/**
 * Generic Placeholder Page Component
 * Used for pages that need structure but haven't been fully implemented yet
 */

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function PlaceholderPage({ title, description, featureName }) {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">{description}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Feature Status</h3>
              <p className="text-yellow-700 text-sm">
                The <strong>{featureName}</strong> feature is currently under development.
                This page will be fully implemented in an upcoming release.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">What to Expect</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Complete UI implementation</li>
                <li>• API integration with backend services</li>
                <li>• Real-time data updates</li>
                <li>• Comprehensive error handling</li>
                <li>• Accessibility compliance (WCAG AA)</li>
              </ul>
            </div>

            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}