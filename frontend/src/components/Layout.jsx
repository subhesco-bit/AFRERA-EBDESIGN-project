import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MessageCircle, Mic, X } from 'lucide-react'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useAuthStore } from '../store/authStore'
import ChatInterface from './ConversationalAI/ChatInterface'
import VoiceAssistant from './VoiceAI/VoiceAssistant'

// Global AI assistant widgets: both ChatInterface and VoiceAssistant were
// fully built (real conversational-ai/voice-ai API calls) but had no parent
// page rendering them anywhere in the app. Neither is a fixed-dataset
// component a single page could own — they're live, session-driven, and
// useful from any screen — so they're mounted here as floating widgets
// rather than forced into one page. Both backends require auth
// (authMiddleware on /conversational-ai/sessions and /voice-ai/voice-sessions),
// so the widgets only render for logged-in users.
function Layout({ children }) {
  const { isAuthenticated } = useAuthStore()
  const [openWidget, setOpenWidget] = useState(null) // null | 'chat' | 'voice'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-green-700 focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4">
          {children || <Outlet />}
        </main>
      </div>
      <Footer />
      <BottomNav />

      {isAuthenticated && (
        <>
          {openWidget === 'chat' && (
            <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] shadow-2xl rounded-lg overflow-hidden">
              <ChatInterface />
            </div>
          )}
          {openWidget === 'voice' && (
            <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] shadow-2xl rounded-lg overflow-hidden">
              <VoiceAssistant />
            </div>
          )}

          <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <button
              onClick={() => setOpenWidget(openWidget === 'voice' ? null : 'voice')}
              aria-label={openWidget === 'voice' ? 'Close voice assistant' : 'Open voice assistant'}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-colors"
            >
              {openWidget === 'voice' ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setOpenWidget(openWidget === 'chat' ? null : 'chat')}
              aria-label={openWidget === 'chat' ? 'Close chat assistant' : 'Open chat assistant'}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-colors"
            >
              {openWidget === 'chat' ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Layout
