// NEW COMPONENT ROUTES - Priorities #6 & #7
export const newComponentRoutes = [
  {
    path: "/ai/chat",
    name: "AIChat",
    label: "AI Assistant",
    icon: "MessageSquare",
    requiresAuth: true,
    roles: ["farmer", "admin", "advisor"],
  },
  {
    path: "/security/mfa",
    name: "MFASetup",
    label: "Two-Factor Authentication",
    icon: "Shield",
    requiresAuth: true,
    roles: ["farmer", "admin", "advisor"],
  },
  {
    path: "/privacy/gdpr",
    name: "GDPRConsent",
    label: "Privacy & Consent",
    icon: "Lock",
    requiresAuth: true,
    roles: ["farmer", "admin", "advisor"],
  },
  {
    path: "/library/browse",
    name: "LibraryBrowser",
    label: "Knowledge Library",
    icon: "Book",
    requiresAuth: true,
    roles: ["farmer", "admin", "advisor"],
  },
  {
    path: "/platform/core",
    name: "PlatformCoreDashboard",
    label: "Platform Dashboard",
    icon: "Zap",
    requiresAuth: true,
    roles: ["admin", "manager"],
  },
];

// MISSING REPORT PAGES (Priority #6)
export const reportPages = [
  {
    path: "/reports/sales",
    name: "SalesReport",
    label: "Sales Dashboard",
    icon: "TrendingUp",
    requiresAuth: true,
    roles: ["admin", "manager"],
  },
  {
    path: "/reports/revenue",
    name: "RevenueReport",
    label: "Revenue Report",
    icon: "DollarSign",
    requiresAuth: true,
    roles: ["admin", "manager"],
  },
  {
    path: "/reports/expenses",
    name: "ExpenseReport",
    label: "Expense Report",
    icon: "CreditCard",
    requiresAuth: true,
    roles: ["admin", "manager"],
  },
  {
    path: "/reports/profit",
    name: "ProfitReport",
    label: "Profit & Loss",
    icon: "BarChart3",
    requiresAuth: true,
    roles: ["admin", "manager"],
  },
  {
    path: "/reports/crops",
    name: "CropPerformance",
    label: "Crop Performance",
    icon: "Leaf",
    requiresAuth: true,
    roles: ["farmer", "admin"],
  },
];

// SETTINGS PAGES (Priority #6)
export const settingsPages = [
  {
    path: "/settings/advanced",
    name: "AdvancedSettings",
    label: "Advanced Settings",
    icon: "Settings2",
    requiresAuth: true,
    roles: ["admin"],
  },
  {
    path: "/settings/api",
    name: "APIManagement",
    label: "API Keys",
    icon: "Code",
    requiresAuth: true,
    roles: ["admin"],
  },
  {
    path: "/settings/integrations",
    name: "Integrations",
    label: "Integrations",
    icon: "Zap",
    requiresAuth: true,
    roles: ["admin"],
  },
  {
    path: "/settings/webhooks",
    name: "Webhooks",
    label: "Webhooks",
    icon: "GitBranch",
    requiresAuth: true,
    roles: ["admin"],
  },
  {
    path: "/settings/audit",
    name: "AuditTrail",
    label: "Audit Trail",
    icon: "History",
    requiresAuth: true,
    roles: ["admin"],
  },
];

export const allNewRoutes = [
  ...newComponentRoutes,
  ...reportPages,
  ...settingsPages,
];
