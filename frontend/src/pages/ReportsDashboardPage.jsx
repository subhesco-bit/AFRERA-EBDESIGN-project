import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  BarChart3,
  Shield,
  ArrowRight,
} from 'lucide-react';

// 2026-09-16: was a navigation hub sitting on top of the fabricated
// report pages this session fixed. Its own data was fake too: clicking
// any report item ran a fake `setTimeout` "Generate" and showed a
// "Report Preview" card whose content was a static "Report preview will
// appear here" placeholder, and "Download PDF/Excel/CSV" just
// `console.log`'d - none of it called a real API or navigated anywhere.
// Replaced the fake generate/preview/download flow with real navigation
// (react-router `Link`) to the actual report pages, and added honest
// status badges for the report pages this session investigated directly
// (see each page's own file header for the full backend-verification
// trail): Sales and Farmer reports now show real, if partial, backend
// data; Operations and Audit reports have no matching backend yet and
// show an honest unavailable state on their own pages. Financial and
// Inventory reports weren't part of this pass, so they're linked with no
// live-data claim either way rather than guessing.
const reportCategories = [
  {
    id: 'sales',
    name: 'Sales Reports',
    icon: DollarSign,
    path: '/reports/sales',
    description: 'Revenue, orders and daily sales breakdown.',
    status: 'partial',
  },
  {
    id: 'farmer',
    name: 'Farmer Reports',
    icon: Users,
    path: '/reports/farmer',
    description: 'Farmer counts and top FDI performers.',
    status: 'partial',
  },
  {
    id: 'operations',
    name: 'Operations Reports',
    icon: BarChart3,
    path: '/reports/operations',
    description: 'Logistics and warehouse performance.',
    status: 'unavailable',
  },
  {
    id: 'audit',
    name: 'Audit Reports',
    icon: Shield,
    path: '/reports/audit',
    description: 'System compliance and security audit results.',
    status: 'unavailable',
  },
  {
    id: 'financial',
    name: 'Financial Reports',
    icon: TrendingUp,
    path: '/reports/financial',
    description: 'Revenue breakdown, expenses, P&L, cash flow.',
    status: 'unknown',
  },
  {
    id: 'inventory',
    name: 'Inventory Reports',
    icon: Package,
    path: '/reports/inventory',
    description: 'Stock levels, movement and valuation.',
    status: 'unknown',
  },
];

const STATUS_BADGE = {
  partial: { label: 'Partial live data', variant: 'secondary' },
  unavailable: { label: 'Not yet available', variant: 'outline' },
  unknown: null,
};

const ReportsDashboardPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports Dashboard</h1>
        <p className="text-muted-foreground">Central hub for all reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((category) => {
          const badge = STATUS_BADGE[category.status];
          return (
            <Link key={category.id} to={category.path} className="block">
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {badge ? (
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsDashboardPage;
