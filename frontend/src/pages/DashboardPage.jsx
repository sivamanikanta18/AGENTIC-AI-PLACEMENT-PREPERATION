import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  Zap, 
  ChevronRight, 
  Star,
  Flame,
  Mic,
  Code,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import useAppStore from '../store/appStore'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function DashboardPage() {
  const { dashboardData, isLoadingDashboard, fetchDashboard } = useAppStore()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchDashboard().catch(() => toast.error('Failed to load dashboard'))
  }, [fetchDashboard])

  if (!mounted || isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Use real data from analytics API
  const data = dashboardData || {}
  
  // Extract stats from analytics data
  const interviewStats = data.interviewStats || { completedInterviews: 0, averageScore: 0 }
  const codingStats = data.codingStats || { passedProblems: 0, totalProblems: 0, passRate: 0 }
  const totalTimeSpent = data.totalTimeSpent || 0
  const currentStreak = data.currentStreak || 0
  const recentActivities = data.recentActivities || []
  const recentInterviews = data.recentActivities?.filter(a => a.type === 'interview') || []
  
  // Calculate readiness score based on activity
  const readinessScore = Math.min(
    Math.round((interviewStats.completedInterviews * 5) + (codingStats.passedProblems * 2) + (currentStreak * 3)),
    100
  )
  
  const readiness = {
    score: readinessScore,
    status: readinessScore >= 70 ? 'Ready' : readinessScore >= 40 ? 'Improving' : 'Not Ready'
  }
  
  // Transform daily activity for chart
  const dailyActivity = data.dailyActivity || []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().getDay()
  
  const progressData = dayNames.map((day, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const dayData = dailyActivity.find(d => d._id?.date === dateStr)
    return {
      name: day,
      score: dayData ? Math.round((dayData.count || 0) * 10) : 0
    }
  })

  // Skills data based on actual performance
  const avgInterviewScore = interviewStats.averageScore || 0
  const codingPassRate = codingStats.passRate || 0
  
  const skillsData = [
    { subject: 'Technical', A: Math.round(codingPassRate), fullMark: 100 },
    { subject: 'Communication', A: Math.round(avgInterviewScore), fullMark: 100 },
    { subject: 'Problem Solving', A: Math.round((codingPassRate + avgInterviewScore) / 2), fullMark: 100 },
    { subject: 'Confidence', A: Math.min(readinessScore, 100), fullMark: 100 },
    { subject: 'Consistency', A: Math.min(currentStreak * 10, 100), fullMark: 100 },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready': return 'text-green-500 bg-green-50'
      case 'Improving': return 'text-amber-500 bg-amber-50'
      default: return 'text-red-500 bg-red-50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-gray-600">
          {interviewStats.completedInterviews > 0 
            ? `You've completed ${interviewStats.completedInterviews} interview${interviewStats.completedInterviews > 1 ? 's' : ''} and solved ${codingStats.passedProblems || 0} coding problems. Keep up the great work!`
            : "Start your first mock interview or coding practice to begin tracking your progress!"}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Interviews Completed */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Interviews
            </span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{interviewStats.completedInterviews || 0}</p>
          <p className="text-gray-600 text-sm mt-1">Completed</p>
          <div className="mt-3 flex items-center text-sm text-blue-600">
            <Star className="w-4 h-4 mr-1" />
            <span>{interviewStats.averageScore?.toFixed(1) || 0} avg score</span>
          </div>
        </motion.div>

        {/* Coding Problems */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Code className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              {codingStats.passRate || 0}% Pass Rate
            </span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{codingStats.passedProblems || 0}</p>
          <p className="text-gray-600 text-sm mt-1">Problems Solved</p>
          <div className="mt-3 flex items-center text-sm text-amber-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{codingStats.totalProblems || 0} attempted</span>
          </div>
        </motion.div>

        {/* Practice Time */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
              Time Invested
            </span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {Math.floor((totalTimeSpent || 0) / 3600)}h {Math.floor(((totalTimeSpent || 0) % 3600) / 60)}m
          </p>
          <p className="text-gray-600 text-sm mt-1">Total Practice</p>
          <div className="mt-3 flex items-center text-sm text-emerald-600">
            <Zap className="w-4 h-4 mr-1" />
            <span>{Math.floor((totalTimeSpent || 0) / 60)} minutes total</span>
          </div>
        </motion.div>

        {/* Current Streak */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-rose-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded-full">
              Daily Streak
            </span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{currentStreak || 0}</p>
          <p className="text-gray-600 text-sm mt-1">Days Active</p>
          <div className="mt-3 flex items-center text-sm text-rose-600">
            <Award className="w-4 h-4 mr-1" />
            <span>{currentStreak >= 7 ? 'On fire!' : currentStreak >= 3 ? 'Good momentum!' : 'Keep going!'}</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
                  <p className="text-sm text-gray-500">Your daily activity across all practice areas</p>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#1d4ed8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Skills Radar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Skills Assessment</h3>
                <p className="text-sm text-gray-500">Your performance across key areas</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillsData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar name="Skills" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Interviews */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Link to="/analytics" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {(recentActivities || []).slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'interview' ? 'bg-blue-100' :
                      activity.type === 'coding' ? 'bg-amber-100' :
                      activity.type === 'resume_upload' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      {activity.type === 'interview' ? <Mic className={`w-5 h-5 text-blue-600`} /> :
                       activity.type === 'coding' ? <Code className={`w-5 h-5 text-amber-600`} /> :
                       activity.type === 'resume_upload' ? <FileText className={`w-5 h-5 text-green-600`} /> :
                       <Zap className={`w-5 h-5 text-purple-600`} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {activity.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {activity.score && (
                      <span className={`text-lg font-semibold ${
                        activity.score >= 7 ? 'text-green-600' :
                        activity.score >= 4 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {activity.score.toFixed(1)}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      activity.result === 'success' ? 'bg-green-100 text-green-700' :
                      activity.result === 'failure' ? 'bg-red-100 text-red-700' :
                      activity.result === 'partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {activity.result || activity.type}
                    </span>
                  </div>
                </div>
              ))}
              {(recentActivities || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No activities yet. Start practicing to track your progress!</p>
                  <div className="flex justify-center gap-3 mt-4">
                    <Link to="/interview" className="btn-primary inline-flex">
                      Start Interview
                    </Link>
                    <Link to="/coding" className="btn-secondary inline-flex">
                      Practice Coding
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Readiness Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Placement Readiness</h3>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                  <circle cx="64" cy="64" r="56" stroke="white" strokeWidth="8" fill="none" strokeDasharray={`${readiness.score * 3.52} 351.86`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{readiness.score}</span>
                  <span className="text-xs text-white/70">out of 100</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${
                readiness.status === 'Ready' ? 'bg-green-400 text-green-900' :
                readiness.status === 'Improving' ? 'bg-amber-400 text-amber-900' :
                'bg-red-400 text-red-900'
              }`}>
                {readiness.status}
              </span>
            </div>
            <Link to="/roadmap" className="flex items-center justify-center text-white/80 hover:text-white text-sm transition-colors">
              View Improvement Roadmap
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/interview" className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-100 hover:shadow-md">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Start Mock Interview</span>
                  <span className="text-xs text-gray-500">Practice with AI feedback</span>
                </div>
              </Link>
              <Link to="/coding" className="flex items-center space-x-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all border border-amber-100 hover:shadow-md">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Practice Coding</span>
                  <span className="text-xs text-gray-500">Solve problems & improve</span>
                </div>
              </Link>
              <Link to="/resume" className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:from-emerald-100 hover:to-green-100 transition-all border border-emerald-100 hover:shadow-md">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Analyze Resume</span>
                  <span className="text-xs text-gray-500">AI-powered feedback</span>
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Streak Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-6 shadow-sm border border-orange-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Daily Streak</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{currentStreak || 0} days</p>
            <p className="text-gray-600 text-sm mb-4">
              {currentStreak >= 7 
                ? "🔥 Amazing! You're on fire!" 
                : currentStreak >= 3 
                ? "👏 Good momentum! Keep it up!" 
                : "💪 Start practicing daily to build your streak!"}
            </p>
            <div className="flex space-x-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                  i < (currentStreak || 0) ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white text-gray-400 border border-gray-200'
                }`}>
                  {day}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
