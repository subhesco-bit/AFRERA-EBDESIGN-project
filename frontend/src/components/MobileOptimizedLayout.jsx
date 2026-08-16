import { useState } from 'react'
import { Menu, X, Home, User, ShoppingCart, Bell } from 'lucide-react'

function MobileOptimizedLayout({ children, title, showBackButton = false, onBack }) {
  const [bottomNavOpen, setBottomNavOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-white shadow-sm z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {showBackButton ? (
            <button onClick={onBack} className="p-2 -ml-2">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-bold text-gray-800">AFRERA</span>
            </div>
          )}
          
          <h1 className="font-semibold text-gray-800 truncate flex-1 text-center pr-8">
            {title}
          </h1>
          
          <button className="p-2">
            <Bell className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-4 md:px-6 md:py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-sticky">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center p-2 text-green-600">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-600">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs mt-1">Market</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-600">
            <Menu className="w-6 h-6" />
            <span className="text-xs mt-1">Menu</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-600">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileOptimizedLayout