import { Link, useLocation } from 'react-router-dom'

// Quick links — always visible, unchanged from before.
const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/sell/new-product', label: 'Add Product' },
  { to: '/variety-directory', label: 'Variety Directory' },
  { to: '/modules', label: 'Modules' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/forms', label: 'Forms' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/enterprise-control', label: 'Enterprise Control' },
  { to: '/ai-backbone', label: 'AI Backbone' },
  { to: '/diet-recipes', label: 'Diet & Recipes' },
  { to: '/wearables', label: 'Wearables' },
  { to: '/defense-fitness-prep', label: 'Defense Fitness Prep' },
  { to: '/admin-dashboard', label: 'Admin' },
  { to: '/admin/crop-value-review', label: 'Crop Value Review' },
]

// Grouped sections covering the previously-unreachable routed pages (audit
// UI Finding 7: 111/162 routed pages had no link anywhere in primary nav).
// Sidebar has no role-gating today, so every group is shown to every user —
// reachable-but-imperfectly-grouped beats unreachable.
const NAV_GROUPS = [
  {
    section: 'Livestock & Aquaculture',
    items: [
      { to: '/animal-health', label: 'Animal Health' },
      { to: '/cattle-registry', label: 'Cattle Registry' },
      { to: '/dairy-management', label: 'Dairy Management' },
      { to: '/goat-farming', label: 'Goat Farming' },
      { to: '/pig-farming', label: 'Pig Farming' },
      { to: '/sheep-farming', label: 'Sheep Farming' },
      { to: '/poultry-management', label: 'Poultry Management' },
      { to: '/fisheries-management', label: 'Fisheries Management' },
      { to: '/livestock-management', label: 'Livestock Management' },
      { to: '/pond-management', label: 'Pond Management' },
    ],
  },
  {
    section: 'Crops & Land',
    items: [
      { to: '/horticulture-management', label: 'Horticulture Management' },
      { to: '/orchard-management', label: 'Orchard Management' },
      { to: '/nursery-management', label: 'Nursery Management' },
      { to: '/crop-calendar', label: 'Crop Calendar' },
      { to: '/crop-monitoring', label: 'Crop Monitoring' },
      { to: '/crop-registration', label: 'Crop Registration' },
      { to: '/crop-variety', label: 'Crop Variety' },
      { to: '/seed-planning', label: 'Seed Planning' },
      { to: '/sowing-management', label: 'Sowing Management' },
      { to: '/soil-management', label: 'Soil Management' },
      { to: '/land-management', label: 'Land Management' },
      { to: '/land-registry', label: 'Land Registry' },
      { to: '/land-use', label: 'Land Use & Carbon' },
      { to: '/irrigation-management', label: 'Irrigation Management' },
      { to: '/water-management', label: 'Water Management' },
      { to: '/water-records', label: 'Water Records' },
      { to: '/environment-management', label: 'Environment Management' },
      { to: '/climate', label: 'Climate' },
      { to: '/climate-advisory', label: 'Climate Advisory' },
      { to: '/climate-monitoring', label: 'Climate Monitoring' },
      { to: '/farm-costing', label: 'Farm Costing' },
      { to: '/yield-management', label: 'Yield Management' },
    ],
  },
  {
    section: 'Equipment & Logistics',
    items: [
      { to: '/asset-lifecycle-management', label: 'Asset Lifecycle Management' },
      { to: '/machinery-management', label: 'Machinery Management' },
      { to: '/tractor-management', label: 'Tractor Management' },
      { to: '/implement-management', label: 'Implement Management' },
      { to: '/equipment-inventory', label: 'Equipment Inventory' },
      { to: '/equipment-rental', label: 'Equipment Rental' },
      { to: '/fuel-management', label: 'Fuel Management' },
      { to: '/spare-parts-management', label: 'Spare Parts Management' },
      { to: '/breakdown-maintenance', label: 'Breakdown Maintenance' },
      { to: '/cold-storage', label: 'Cold Storage' },
      { to: '/logistics-enhancement', label: 'Logistics Enhancement' },
      { to: '/logistics-matching', label: 'Logistics Matching' },
      { to: '/input-supply', label: 'Input Supply' },
      { to: '/fertilizer-inventory', label: 'Fertilizer Inventory' },
    ],
  },
  {
    section: 'Farmer & Community',
    items: [
      { to: '/farmer-portal', label: 'Farmer Portal' },
      { to: '/farmer-profile', label: 'Farmer Profile' },
      { to: '/farmer-family', label: 'Farmer Family' },
      { to: '/farmer-skills', label: 'Farmer Skills' },
      { to: '/farmer-verification', label: 'Farmer Verification' },
      { to: '/farmer-welfare', label: 'Farmer Welfare' },
      { to: '/farmer-kyc', label: 'Farmer KYC' },
      { to: '/community-management', label: 'Community Management' },
      { to: '/cooperative-shares', label: 'Cooperative Shares' },
      { to: '/shg-management', label: 'SHG Management' },
      { to: '/village-registry', label: 'Village Registry' },
      { to: '/labour-management', label: 'Labour Management' },
      { to: '/farmer-entrance/field', label: 'Farmer Field Door' },
      { to: '/farmer-entrance/household', label: 'Farmer Household Door' },
      { to: '/farmer-entrance/sell', label: 'Farmer Sell Door' },
      { to: '/farmer-entrance/shared', label: 'Farmer Shared Door' },
    ],
  },
  {
    section: 'Finance & ERP',
    items: [
      { to: '/unified-ledger', label: 'Unified Ledger' },
      { to: '/corridor-economics', label: 'Corridor Economics' },
      { to: '/subsidy-management', label: 'Subsidy Management' },
      { to: '/bulk-orders', label: 'Bulk Orders' },
      { to: '/checkout', label: 'Checkout' },
      { to: '/pricing/forward', label: 'Forward Pricing' },
      { to: '/complete-erp-integration', label: 'ERP Integration' },
      { to: '/comprehensive-erp', label: 'Comprehensive ERP' },
      { to: '/engineering-projects', label: 'Engineering Projects' },
      { to: '/operations-management', label: 'Operations Management' },
    ],
  },
  {
    section: 'AI & Intelligence',
    items: [
      { to: '/agri-intelligence', label: 'Agri Intelligence' },
      { to: '/ai-agent', label: 'AI Agent' },
      { to: '/ai-brain', label: 'AI Brain' },
      { to: '/ai-operation-intelligence', label: 'AI Operation Intelligence' },
      { to: '/ai-self-healing', label: 'AI Self-Healing' },
      { to: '/ai/chat', label: 'AI Chat' },
      { to: '/ai/collaboration', label: 'AI Collaboration' },
      { to: '/complete-ai-integration', label: 'Complete AI Integration' },
      { to: '/enterprise-ai', label: 'Enterprise AI' },
      { to: '/nervous-system', label: 'Nervous System' },
      { to: '/decision-support', label: 'Decision Support' },
      { to: '/market-signals', label: 'Market Signals' },
      { to: '/competitive-position', label: 'Competitive Position' },
      { to: '/realtime-monitoring', label: 'Realtime Monitoring' },
      { to: '/research-and-development', label: 'Research & Development' },
      { to: '/research-dashboard', label: 'Research Dashboard' },
      { to: '/knowledge-reference', label: 'Knowledge Reference' },
      { to: '/information-sharing', label: 'Information Sharing' },
    ],
  },
  {
    section: 'Dashboards',
    items: [
      { to: '/banker-dashboard', label: 'Banker Dashboard' },
      { to: '/ca-dashboard', label: 'CA Dashboard' },
      { to: '/fpo-dashboard', label: 'FPO Dashboard' },
      { to: '/fpo-registration', label: 'FPO Registration' },
      { to: '/government-dashboard', label: 'Government Dashboard' },
      { to: '/reos-dashboard', label: 'REOS Dashboard' },
    ],
  },
  {
    section: 'Admin & Platform',
    items: [
      { to: '/system-administration', label: 'System Administration' },
      { to: '/role-permissions', label: 'Role Permissions' },
      { to: '/identity-management', label: 'Identity Management' },
      { to: '/platform-foundation', label: 'Platform Foundation' },
      { to: '/platform-management', label: 'Platform Management' },
      { to: '/shared-infra', label: 'Shared Infrastructure' },
      { to: '/sap-module-architecture', label: 'SAP Module Architecture' },
      { to: '/users', label: 'Users' },
      { to: '/account/mfa', label: 'Account MFA' },
      { to: '/account/privacy', label: 'Account Privacy' },
    ],
  },
  {
    section: 'E-commerce',
    items: [
      { to: '/ecommerce-integration', label: 'E-commerce Integration' },
      { to: '/ecommerce-marketplace', label: 'E-commerce Marketplace' },
    ],
  },
  {
    section: 'More',
    items: [
      { to: '/library', label: 'Library' },
      { to: '/experience', label: 'Experience Layer' },
    ],
  },
]

function NavLink({ item, pathname }) {
  const isActive = pathname === item.to
  return (
    <Link
      key={item.to}
      to={item.to}
      className={`block px-3 py-2 rounded hover:bg-gray-50 ${isActive ? 'bg-green-50 text-green-700 font-medium' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {item.label}
    </Link>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white lg:overflow-y-auto">
      <div className="p-4 text-lg font-semibold">AFRERA</div>
      <nav aria-label="Sidebar" className="flex-1 px-2 pb-8 space-y-1">
        {QUICK_LINKS.map((item) => (
          <NavLink key={item.to} item={item} pathname={pathname} />
        ))}

        {NAV_GROUPS.map((group) => (
          <div key={group.section} className="pt-4">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {group.section}
            </div>
            {group.items.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
