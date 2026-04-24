import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        toast.success('Welcome back!')
        navigate('/dashboard')
      } else {
        toast.error(result.error || 'Login failed')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-200/30 rounded-full" />
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-indigo-200/30 rounded-full" />
        <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-purple-200/30 rounded-full" />
        <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-blue-200/30 rounded-full" />
        {/* Beaker/Flask Icon */}
        <div className="absolute top-1/4 right-10 text-blue-200/40">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M9 3L7 17H17L15 3H9Z" />
            <path d="M6 17H18V19C18 20.1046 17.1046 21 16 21H8C6.89543 21 6 20.1046 6 19V17Z" />
            <path d="M12 7V13" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        {/* Clock Icon */}
        <div className="absolute top-1/3 left-10 text-blue-200/40">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6V12L15 15" />
          </svg>
        </div>
        {/* Lightbulb Icon */}
        <div className="absolute bottom-1/3 right-20 text-blue-200/40">
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M9 21H15" />
            <path d="M12 17V21" />
            <path d="M8 17H16C17.1046 17 18 16.1046 18 15C18 13.5 17 12.5 16 12C14.5 11 14 9 14 8C14 5.79086 12.2091 4 10 4C7.79086 4 6 5.79086 6 8C6 9 5.5 11 4 12C3 12.5 2 13.5 2 15C2 16.1046 2.89543 17 4 17H8Z" />
          </svg>
        </div>
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Logo Section */}
          <div className="text-center mb-8">
            {/* Shield Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 22S3 18 3 7V3L12 2L21 3V7C21 18 12 22 12 22Z" />
                  <path d="M12 7V17" />
                  <path d="M8 11L12 7L16 11" />
                </svg>
              </div>
            </div>
            
            {/* Brand Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              <span className="text-blue-700">PREP</span>
              <span className="text-red-600">SENSE</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">AI Interview Preparation Platform</p>
            
            {/* Tagline */}
            <div className="mt-3 inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
              Powered by Groq AI
            </div>
            
            {/* Portal Title */}
            <h2 className="text-xl font-semibold text-gray-800 mt-6">
              LOGIN PORTAL
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all outline-none"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" 
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-violet-600 hover:text-violet-700 font-semibold">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-800 hover:to-indigo-800 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>SIGN IN TO WORKSPACE</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New User?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              to="/register"
              className="block w-full py-3 text-center border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all"
            >
              CREATE ACCOUNT
            </Link>
          </div>
        </motion.div>
      </div>
    )
}

export default LoginPage
