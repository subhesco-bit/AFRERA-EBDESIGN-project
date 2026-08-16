import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, Search, LogOut, ChevronDown, Sprout, DollarSign, Package, Building2, Shield, Landmark, Brain, Megaphone, Leaf } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import LanguageSelector from './Multilingual/LanguageSelector'

function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-sticky">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-gray-800">AFRERA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main" className="hidden md:flex items-center space-x-8">
            {/* Marketplace Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition" aria-haspopup="true">
                <Package className="w-4 h-4" />
                <span>Marketplace</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                <Link to="/marketplace" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Browse Products
                </Link>
                <Link to="/discover" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Discover
                </Link>
                <Link to="/pricecheck" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Price Check
                </Link>
                <Link to="/compare" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Compare Products
                </Link>
                <Link to="/preorder" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Pre-Orders
                </Link>
              </div>
            </div>

            {/* Farmer Portal Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition" aria-haspopup="true">
                <Sprout className="w-4 h-4" />
                <span>Farmer Portal</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                <Link to="/farmer-entrance" className="block px-4 py-2 text-green-700 font-medium hover:bg-gray-100 border-b border-gray-100 mb-1">
                  Explore first — no sign-in
                </Link>
                <Link to="/farmerhome" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Farmer Home
                </Link>
                <Link to="/farmersell" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Sell Produce
                </Link>
                <Link to="/farmerfield" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  My Fields
                </Link>
                <Link to="/harvestplan" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Harvest Plan
                </Link>
                <Link to="/harvestscore" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Harvest Score
                </Link>
                <Link to="/whatgrow" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  What to Grow
                </Link>
                <Link to="/seedvault" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Seed Vault
                </Link>
                <Link to="/farmadvisor" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Farm Advisor
                </Link>
              </div>
            </div>

            {/* Pricing Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition" aria-haspopup="true">
                <DollarSign className="w-4 h-4" />
                <span>Pricing</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                <Link to="/pricebuild" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Price Builder
                </Link>
                <Link to="/dynamicpricing" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Dynamic Pricing
                </Link>
                <Link to="/selltiming" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Sell Timing
                </Link>
              </div>
            </div>

            {/* Finance / ERP dropdown — ledger, compliance and procurement were
                previously built with no link anywhere in the UI (an orphan-page
                pattern this session keeps finding); the three ERP domains below
                (asset accounting, cost control, project systems) are added here
                for the same reason, rather than repeating the gap. */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition" aria-haspopup="true">
                <Landmark className="w-4 h-4" />
                <span>Finance / ERP</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                <Link to="/ledger" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  General Ledger
                </Link>
                <Link to="/compliance" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Tax Compliance
                </Link>
                <Link to="/procurement" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Procurement &amp; QC
                </Link>
                <Link to="/asset-accounting" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Asset Accounting
                </Link>
                <Link to="/cost-control" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Cost Control
                </Link>
                <Link to="/project-systems" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Project Systems
                </Link>
              </div>
            </div>

            <Link to="/logistics" className="text-gray-700 hover:text-green-600 transition">
              Logistics
            </Link>
            <Link to="/insurance" className="text-gray-700 hover:text-green-600 transition">
              Insurance
            </Link>
            <Link to="/forms" className="text-gray-700 hover:text-green-600 transition">
              Forms
            </Link>
            <Link to="/analytics" className="text-gray-700 hover:text-green-600 transition">
              Analytics
            </Link>
            <Link to="/modules" className="text-gray-700 hover:text-green-600 transition">
              Modules
            </Link>

            {/* Vendor Portal Dropdown */}
            {isAuthenticated && (user?.role === 'corporate' || user?.role === 'logistics') && (
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition" aria-haspopup="true">
                  <Building2 className="w-4 h-4" />
                  <span>Vendor Portal</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                  {user?.role === 'corporate' && (
                    <Link to="/corporate-buyer" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Corporate Buyer
                    </Link>
                  )}
                  {user?.role === 'logistics' && (
                    <Link to="/logistics-provider" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Logistics Provider
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Admin Portal Dropdown */}
            {isAuthenticated && user?.role === 'admin' && (
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition" aria-haspopup="true">
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                  <Link to="/admin-dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Admin Dashboard
                  </Link>
                  <Link to="/ai-dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    AI Dashboard
                  </Link>
                  <Link to="/erp-dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    ERP Dashboard
                  </Link>
                  <Link to="/marketing-center" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Marketing Center
                  </Link>
                </div>
              </div>
            )}

            {/* Enterprise Portal Dropdown */}
            {isAuthenticated && (
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition" aria-haspopup="true">
                  <Building2 className="w-4 h-4" />
                  <span>Enterprise</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                  <Link to="/b2b-marketplace" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    B2B Marketplace
                  </Link>
                  <Link to="/nutrient-value-marketplace" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Nutrient-Value Marketplace
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input aria-label="Search products..."
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Language switcher — the platform ships Hindi, Bengali, Assamese,
                Manipuri and Khasi support, but there was previously no control
                anywhere in the UI to actually change language. */}
            <LanguageSelector />

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-green-600 transition" aria-label="Cart, 0 items">
              <ShoppingCart className="w-6 h-6" />
              <span aria-hidden="true" className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-700 hover:text-green-600 transition" aria-haspopup="true" aria-label={`User menu for ${user?.firstName || user?.email || 'account'}`}>
                  <User className="w-6 h-6" />
                  <span className="hidden md:inline">{user?.firstName || user?.email}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/wallet"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Wallet
                  </Link>
                  <Link
                    to="/bank-passport"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Bank Passport
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-green-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-nav-menu" className="md:hidden py-4 border-t">
            <nav aria-label="Mobile" className="flex flex-col space-y-2">
              <div className="font-semibold text-gray-800 px-4 py-2">Marketplace</div>
              <Link
                to="/marketplace"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Products
              </Link>
              <Link
                to="/discover"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover
              </Link>
              <Link
                to="/pricecheck"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Price Check
              </Link>
              <Link
                to="/compare"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compare Products
              </Link>
              <Link
                to="/preorder"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pre-Orders
              </Link>

              <div className="font-semibold text-gray-800 px-4 py-2 mt-4">Farmer Portal</div>
              <Link
                to="/farmer-entrance"
                className="text-green-700 font-medium hover:text-green-800 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore first — no sign-in
              </Link>
              <Link
                to="/farmerhome"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Farmer Home
              </Link>
              <Link
                to="/farmersell"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell Produce
              </Link>
              <Link
                to="/farmerfield"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Fields
              </Link>
              <Link
                to="/harvestplan"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Harvest Plan
              </Link>
              <Link
                to="/harvestscore"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Harvest Score
              </Link>
              <Link
                to="/whatgrow"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                What to Grow
              </Link>
              <Link
                to="/seedvault"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Seed Vault
              </Link>
              <Link
                to="/farmadvisor"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Farm Advisor
              </Link>

              <div className="font-semibold text-gray-800 px-4 py-2 mt-4">Pricing Tools</div>
              <Link
                to="/pricebuild"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Price Builder
              </Link>
              <Link
                to="/dynamicpricing"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dynamic Pricing
              </Link>
              <Link
                to="/selltiming"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell Timing
              </Link>

              <div className="font-semibold text-gray-800 px-4 py-2 mt-4">Finance / ERP</div>
              <Link
                to="/ledger"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                General Ledger
              </Link>
              <Link
                to="/compliance"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tax Compliance
              </Link>
              <Link
                to="/procurement"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Procurement &amp; QC
              </Link>
              <Link
                to="/asset-accounting"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Asset Accounting
              </Link>
              <Link
                to="/cost-control"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cost Control
              </Link>
              <Link
                to="/project-systems"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Project Systems
              </Link>

              <div className="font-semibold text-gray-800 px-4 py-2 mt-4">Other</div>
              <Link
                to="/logistics"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Logistics
              </Link>
              <Link
                to="/insurance"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Insurance
              </Link>
              <Link
                to="/forms"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Forms
              </Link>
              <Link
                to="/analytics"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link
                to="/modules"
                className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Modules
              </Link>

              {/* Vendor Portal Mobile */}
              {isAuthenticated && (user?.role === 'corporate' || user?.role === 'logistics') && (
                <>
                  <div className="font-semibold text-gray-800 px-4 py-2 mt-4">Vendor Portal</div>
                  {user?.role === 'corporate' && (
                    <Link
                      to="/corporate-buyer"
                      className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Corporate Buyer
                    </Link>
                  )}
                  {user?.role === 'logistics' && (
                    <Link
                      to="/logistics-provider"
                      className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Logistics Provider
                    </Link>
                  )}
                </>
              )}

              {/* Admin Portal Mobile */}
              {isAuthenticated && user?.role === 'admin' && (
                <>
                  <div className="font-semibold text-gray-800 px-4 py-2 mt-4">Admin Portal</div>
                  <Link
                    to="/admin-dashboard"
                    className="text-gray-700 hover:text-green-600 transition px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                </>
              )}

              <input aria-label="Search products..."
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mt-4"
              />
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
