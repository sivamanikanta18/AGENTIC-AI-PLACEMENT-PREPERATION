import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Calendar, Target, Clock, Award, ChevronDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import axios from 'axios'
import toast from 'react-hot-toast'

function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [timeframe, setTimeframe] = useState('30days')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/analytics/dashboard')
      setAnalyticsData(response.data.dashboard)
    } catch (error) {
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  // Transform API data for charts
  const performanceData = analyticsData?.performanceTrends?.length > 0 
    ? analyticsData.performanceTrends.map((t, i) => ({
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        overall: t.overall || 0,
        technical: t.technical || 0,
        communication: t.communication || 0
      }))
    : [];

  const skillData = analyticsData?.skillMatrix 
    ? Object.entries(analyticsData.skillMatrix).map(([subject, data]) => ({
        subject: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
        A: Math.round(data.average || 0),
        fullMark: 100
      })).slice(0, 8)
    : [];

  const activityData = analyticsData?.weeklyActivity?.length > 0
    ? analyticsData.weeklyActivity.map(day => ({
        day: day.name || day.day,
        interviews: day.interviews || 0,
        coding: day.coding || 0,
        hours: (day.hours || 0).toFixed(1)
      }))
    : [];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
            <p className="text-gray-600">Track your progress and identify areas for improvement.</p>
          </div>
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Interviews Completed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData?.interviewStats?.completedInterviews || 0}</p>
          <p className="text-gray-600">Interviews Completed</p>
        </motion.div>

        {/* Coding Problems */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {analyticsData?.codingStats?.passRate || 0}% pass
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData?.codingStats?.passedProblems || 0}</p>
          <p className="text-gray-600">Problems Solved</p>
        </motion.div>

        {/* Practice Time */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {((analyticsData?.totalTimeSpent || 0) / 3600).toFixed(1)}h
          </p>
          <p className="text-gray-600">Total Practice Time</p>
        </motion.div>

        {/* Current Streak */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData?.currentStreak || 0}</p>
          <p className="text-gray-600">Day Streak</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Performance Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData.length > 0 ? performanceData : [{ date: 'No Data', overall: 0, technical: 0, communication: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} name="Overall" />
                <Line type="monotone" dataKey="technical" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} name="Technical" />
                <Line type="monotone" dataKey="communication" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Communication" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Skill Assessment */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills Matrix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillData.length > 0 ? skillData : [{ subject: 'No Data', A: 0, fullMark: 100 }]}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar name="Current" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="interviews" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Interviews" />
                <Bar dataKey="coding" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Coding Problems" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Time Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Time Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Mock Interviews', hours: 12, color: 'bg-blue-500', percentage: 48 },
              { label: 'Coding Practice', hours: 8, color: 'bg-purple-500', percentage: 32 },
              { label: 'Study & Learning', hours: 4.5, color: 'bg-green-500', percentage: 18 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-sm text-gray-500">{item.hours}h ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`${item.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Weak to Strong Transitions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Skills You Have Improved
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {(analyticsData?.weakToStrong || []).length > 0 ? analyticsData.weakToStrong.map((item, index) => (
            <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="font-semibold text-green-900 mb-3">{item.skill}</p>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{item.from}</p>
                  <p className="text-xs text-gray-500">Before</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(item.to, 100)}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{item.to}</p>
                  <p className="text-xs text-green-600">+{item.improvement}%</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-3 p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Complete more interviews to see your skill improvements!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsPage
