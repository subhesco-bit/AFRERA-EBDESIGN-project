import React, { useState, useEffect } from 'react';
import { X, Menu, ChevronRight, Home, User, ShoppingBag, MessageSquare, Settings } from 'lucide-react';

const MobileOptimization = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const mobileNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: MessageSquare, label: 'AI Chat', path: '/ai/chat' },
    { icon: User, label: 'Profile', path: '/dashboard' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">AFRERA</h1>
          <div className="w-8" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-64 bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-accent rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {mobileNavItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Content */}
      <main className="pt-16 pb-20 px-4">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex justify-around py-2">
          {mobileNavItems.slice(0, 4).map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex flex-col items-center p-2 hover:bg-accent rounded-lg min-w-[60px]"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileOptimization;
