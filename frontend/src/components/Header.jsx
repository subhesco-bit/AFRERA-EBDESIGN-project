import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, Search, LogOut, ChevronDown, Sprout, DollarSign, Package, Building2, Shield, Landmark, Brain, Megaphone, Leaf } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState, useRef, useEffect } from 'react'
import LanguageSelector from './Multilingual/LanguageSelector'
import NotificationBell from './NotificationBell'

function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRefs = useRef({})

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName)
  }

  const closeDropdown = () => {
    setOpenDropdown(null)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !dropdownRefs.current[openDropdown]?.contains(event.target)) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  const handleKeyDown = (event, dropdownName) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleDropdown(dropdownName)
    } else if (event.key === 'Escape') {
      closeDropdown()
    }
  }

  return (
    <header className="bg-v42-forestd shadow-md sticky top-0 z-sticky font-body border-b-4 border-v42-turmeric">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-v42-turmeric rounded-lg flex items-center justify-center">
              <span className="text-v42-forestd font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-v42-paddy font-display">AFRERA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main" className="hidden md:flex items-center space-x-8">
            {/* Marketplace Dropdown */}
            <div 
              className="relative"
              ref={(el) => dropdownRefs.current.marketplace = el}
            >
              <button 
                className="flex items-center space-x-1 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'marketplace'}
                onClick={() => toggleDropdown('marketplace')}
                onKeyDown={(e) => handleKeyDown(e, 'marketplace')}
              >
                <Package className="w-4 h-4" />
                <span>Marketplace</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === 'marketplace' && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <Link 
                    to="/marketplace" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Browse Products
                  </Link>
                  <Link 
                    to="/discover" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Discover
                  </Link>
                  <Link 
                    to="/price-check" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Price Check
                  </Link>
                  <Link 
                    to="/compare" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Compare Products
                  </Link>
                  <Link 
                    to="/pre-order" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Pre-Orders
                  </Link>
                </div>
              )}
            </div>

            {/* Farmer Portal Dropdown */}
            <div 
              className="relative"
              ref={(el) => dropdownRefs.current.farmer = el}
            >
              <button 
                className="flex items-center space-x-1 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'farmer'}
                onClick={() => toggleDropdown('farmer')}
                onKeyDown={(e) => handleKeyDown(e, 'farmer')}
              >
                <Sprout className="w-4 h-4" />
                <span>Farmer Portal</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === 'farmer' && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <Link 
                    to="/farmer-entrance" 
                    className="block px-4 py-2 text-green-700 font-medium hover:bg-gray-100 border-b border-gray-100 mb-1 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Explore first — no sign-in
                  </Link>
                  <Link 
                    to="/farmerhome" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Farmer Home
                  </Link>
                  <Link 
                    to="/farmer-sell" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Sell Produce
                  </Link>
                  <Link 
                    to="/farmer-field" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    My Fields
                  </Link>
                  <Link 
                    to="/harvest-plan" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Harvest Plan
                  </Link>
                  <Link 
                    to="/harvest-score" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Harvest Score
                  </Link>
                  <Link 
                    to="/what-grow" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    What to Grow
                  </Link>
                  <Link 
                    to="/seed-vault" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Seed Vault
                  </Link>
                  <Link 
                    to="/farm-advisor" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Farm Advisor
                  </Link>
                </div>
              )}
            </div>

            {/* Pricing Tools Dropdown */}
            <div 
              className="relative"
              ref={(el) => dropdownRefs.current.pricing = el}
            >
              <button 
                className="flex items-center space-x-1 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'pricing'}
                onClick={() => toggleDropdown('pricing')}
                onKeyDown={(e) => handleKeyDown(e, 'pricing')}
              >
                <DollarSign className="w-4 h-4" />
                <span>Pricing</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === 'pricing' && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <Link 
                    to="/price-build" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Price Builder
                  </Link>
                  <Link 
                    to="/dynamic-pricing" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Dynamic Pricing
                  </Link>
                  <Link 
                    to="/sell-timing" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Sell Timing
                  </Link>
                </div>
              )}
            </div>

            {/* Finance / ERP dropdown — ledger, compliance and procurement were
                previously built with no link anywhere in the UI (an orphan-page
                pattern this session keeps finding); the three ERP domains below
                (asset accounting, cost control, project systems) are added here
                for the same reason, rather than repeating the gap. */}
            <div 
              className="relative"
              ref={(el) => dropdownRefs.current.finance = el}
            >
              <button 
                className="flex items-center space-x-1 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'finance'}
                onClick={() => toggleDropdown('finance')}
                onKeyDown={(e) => handleKeyDown(e, 'finance')}
              >
                <Landmark className="w-4 h-4" />
                <span>Finance / ERP</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === 'finance' && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <Link 
                    to="/ledger" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    General Ledger
                  </Link>
                  <Link 
                    to="/compliance" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Tax Compliance
                  </Link>
                  <Link 
                    to="/procurement" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Procurement &amp; QC
                  </Link>
                  <Link 
                    to="/asset-accounting" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Asset Accounting
                  </Link>
                  <Link 
                    to="/cost-control" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Cost Control
                  </Link>
                  <Link 
                    to="/project-systems" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Project Systems
                  </Link>
                </div>
              )}
            </div>

            <Link to="/logistics" className="text-v42-paddy/90 hover:text-v42-turmeric transition">
              Logistics
            </Link>
            <Link to="/insurance" className="text-v42-paddy/90 hover:text-v42-turmeric transition">
              Insurance
            </Link>
            <Link to="/forms" className="text-v42-paddy/90 hover:text-v42-turmeric transition">
              Forms
            </Link>
            <Link to="/analytics" className="text-v42-paddy/90 hover:text-v42-turmeric transition">
              Analytics
            </Link>
            <Link to="/modules" className="text-v42-paddy/90 hover:text-v42-turmeric transition">
              Modules
            </Link>

            {/* Vendor Portal Dropdown */}
            {isAuthenticated && (user?.role === 'corporate' || user?.role === 'logistics') && (
              <div 
                className="relative"
                ref={(el) => dropdownRefs.current.vendor = el}
              >
                <button 
                  className="flex items-center space-x-1 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'vendor'}
                  onClick={() => toggleDropdown('vendor')}
                  onKeyDown={(e) => handleKeyDown(e, 'vendor')}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Vendor Portal</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === 'vendor' && (
                  <div 
                    className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {user?.role === 'corporate' && (
                      <Link 
                        to="/corporate-buyer" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        role="menuitem"
                        onClick={closeDropdown}
                      >
                        Corporate Buyer
                      </Link>
                    )}
                    {user?.role === 'logistics' && (
                      <Link 
                        to="/logistics-provider" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        role="menuitem"
                        onClick={closeDropdown}
                      >
                        Logistics Provider
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Admin Portal Dropdown */}
            {isAuthenticated && user?.role === 'admin' && (
              <div 
                className="relative"
                ref={(el) => dropdownRefs.current.admin = el}
              >
                <button 
                  className="flex items-center space-x-1 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'admin'}
                  onClick={() => toggleDropdown('admin')}
                  onKeyDown={(e) => handleKeyDown(e, 'admin')}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === 'admin' && (
                  <div 
                    className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <Link 
                      to="/admin/settings" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      Admin Dashboard
                    </Link>
                    <Link 
                      to="/ai-dashboard" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      AI Dashboard
                    </Link>
                    <Link 
                      to="/erp-dashboard" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      ERP Dashboard
                    </Link>
                    <Link 
                      to="/marketing-center" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      Marketing Center
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Enterprise Portal Dropdown */}
            {isAuthenticated && (
              <div 
                className="relative"
                ref={(el) => dropdownRefs.current.enterprise = el}
              >
                <button 
                  className="flex items-center space-x-1 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'enterprise'}
                  onClick={() => toggleDropdown('enterprise')}
                  onKeyDown={(e) => handleKeyDown(e, 'enterprise')}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Enterprise</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === 'enterprise' && (
                  <div 
                    className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <Link 
                      to="/b2b-marketplace" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      B2B Marketplace
                    </Link>
                    <Link 
                      to="/nutrient-marketplace" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      Nutrient-Value Marketplace
                    </Link>
                  </div>
                )}
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

            {/* Notifications — real M010 notificationAPI, only rendered for
                logged-in users (backend requires auth). */}
            <NotificationBell />

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-v42-paddy/90 hover:text-v42-turmeric transition" aria-label="Cart, 0 items">
              <ShoppingCart className="w-6 h-6" />
              <span aria-hidden="true" className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div 
                className="relative"
                ref={(el) => dropdownRefs.current.user = el}
              >
                <button 
                  className="flex items-center space-x-2 p-2 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'user'}
                  aria-label={`User menu for ${user?.firstName || user?.email || 'account'}`}
                  onClick={() => toggleDropdown('user')}
                  onKeyDown={(e) => handleKeyDown(e, 'user')}
                >
                  <User className="w-6 h-6" />
                  <span className="hidden md:inline">{user?.firstName || user?.email}</span>
                </button>
                {openDropdown === 'user' && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/wallet"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      Wallet
                    </Link>
                    <Link
                      to="/bank-passport"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      Bank Passport
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        closeDropdown()
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-v42-paddy/90 hover:text-v42-turmeric transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-v42-turmeric text-v42-forestd font-semibold rounded-lg hover:bg-v42-turmerictint transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-v42-paddy"
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
          <div id="mobile-nav-menu" className="md:hidden py-4 border-t border-v42-forest">
            <nav aria-label="Mobile" className="flex flex-col space-y-2">
              <div className="font-semibold text-v42-turmerictint px-4 py-2">Marketplace</div>
              <Link
                to="/marketplace"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Products
              </Link>
              <Link
                to="/discover"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover
              </Link>
              <Link
                to="/price-check"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Price Check
              </Link>
              <Link
                to="/compare"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compare Products
              </Link>
              <Link
                to="/pre-order"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pre-Orders
              </Link>

              <div className="font-semibold text-v42-turmerictint px-4 py-2 mt-4">Farmer Portal</div>
              <Link
                to="/farmer-entrance"
                className="text-green-700 font-medium hover:text-green-800 transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore first — no sign-in
              </Link>
              <Link
                to="/farmerhome"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Farmer Home
              </Link>
              <Link
                to="/farmer-sell"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell Produce
              </Link>
              <Link
                to="/farmer-field"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Fields
              </Link>
              <Link
                to="/harvest-plan"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Harvest Plan
              </Link>
              <Link
                to="/harvest-score"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Harvest Score
              </Link>
              <Link
                to="/what-grow"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                What to Grow
              </Link>
              <Link
                to="/seed-vault"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Seed Vault
              </Link>
              <Link
                to="/farm-advisor"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Farm Advisor
              </Link>

              <div className="font-semibold text-v42-turmerictint px-4 py-2 mt-4">Pricing Tools</div>
              <Link
                to="/price-build"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Price Builder
              </Link>
              <Link
                to="/dynamic-pricing"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dynamic Pricing
              </Link>
              <Link
                to="/sell-timing"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell Timing
              </Link>

              <div className="font-semibold text-v42-turmerictint px-4 py-2 mt-4">Finance / ERP</div>
              <Link
                to="/ledger"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                General Ledger
              </Link>
              <Link
                to="/compliance"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tax Compliance
              </Link>
              <Link
                to="/procurement"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Procurement &amp; QC
              </Link>
              <Link
                to="/asset-accounting"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Asset Accounting
              </Link>
              <Link
                to="/cost-control"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cost Control
              </Link>
              <Link
                to="/project-systems"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Project Systems
              </Link>

              <div className="font-semibold text-v42-turmerictint px-4 py-2 mt-4">Other</div>
              <Link
                to="/logistics"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Logistics
              </Link>
              <Link
                to="/insurance"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Insurance
              </Link>
              <Link
                to="/forms"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Forms
              </Link>
              <Link
                to="/analytics"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link
                to="/modules"
                className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Modules
              </Link>

              {/* Vendor Portal Mobile */}
              {isAuthenticated && (user?.role === 'corporate' || user?.role === 'logistics') && (
                <>
                  <div className="font-semibold text-v42-turmerictint px-4 py-2 mt-4">Vendor Portal</div>
                  {user?.role === 'corporate' && (
                    <Link
                      to="/corporate-buyer"
                      className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Corporate Buyer
                    </Link>
                  )}
                  {user?.role === 'logistics' && (
                    <Link
                      to="/logistics-provider"
                      className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
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
                  <div className="font-semibold text-v42-turmerictint px-4 py-2 mt-4">Admin Portal</div>
                  <Link
                    to="/admin/settings"
                    className="text-v42-paddy/90 hover:text-v42-turmeric transition px-4 py-2"
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
