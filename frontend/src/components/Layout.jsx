import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  Code, 
  Map, 
  Trophy, 
  BarChart3, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Zap,
  Flame,
  Star
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import useAppStore from '../store/appStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/resume', label: 'Resume', icon: FileText },
  { path: '/interview', label: 'Mock Interview', icon: Mic },
  { path: '/coding', label: 'Coding', icon: Code },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/gamification', label: 'Achievements', icon: Trophy },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/debate', label: 'AI Debate', icon: MessageSquare },
]

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const { gamificationStatus, fetchGamificationStatus } = useAppStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchGamificationStatus()
  }, [fetchGamificationStatus])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className={`h-16 flex items-center px-4 border-b border-gray-200 ${!isSidebarOpen && 'lg:justify-center'}`}>
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {isSidebarOpen && (
                <span className="text-xl font-bold gradient-text">PrepSense</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              const Icon = item.icon
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${!isSidebarOpen && 'lg:justify-center lg:px-2'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {isSidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {!isSidebarOpen && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Stats */}
          {isSidebarOpen && gamificationStatus && (
            <div className="px-4 py-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">Level {gamificationStatus.level}</span>
                  </div>
                  <span className="text-xs opacity-80">{gamificationStatus.xp} XP</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${gamificationStatus.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1">
                    <Flame className="w-4 h-4 text-orange-300" />
                    <span className="text-sm">{gamificationStatus.streak} day streak</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'lg:justify-center'}`}>
              {isSidebarOpen && (
                <Link to="/profile" className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? <ChevronRight className="w-5 h-5 rotate-180" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {navItems.find(item => location.pathname.startsWith(item.path))?.label || 'PrepSense AI'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {gamificationStatus && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-semibold">{gamificationStatus.xp}</span>
                </div>
                <div className="flex items-center space-x-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{gamificationStatus.streak}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
