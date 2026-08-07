import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        <Sidebar />
        <main className="flex-1 p-4">
          {children || <Outlet />}
        </main>
      </div>
      <Footer />
      <BottomNav />
    </div>
  )
}

export default Layout
