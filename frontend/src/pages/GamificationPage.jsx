import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Flame, Award, Zap, TrendingUp, Users, Target, Lock, CheckCircle } from 'lucide-react'
import useAppStore from '../store/appStore'
import toast from 'react-hot-toast'

const badgeDefinitions = {
  first_interview: { name: 'First Interview', description: 'Complete your first mock interview', icon: '🎯', color: 'bg-blue-100' },
  interview_master: { name: 'Interview Master', description: 'Complete 10 mock interviews', icon: '🏆', color: 'bg-purple-100' },
  code_warrior: { name: 'Code Warrior', description: 'Solve 20 coding problems', icon: '💻', color: 'bg-green-100' },
  streak_keeper: { name: 'Streak Keeper', description: 'Maintain a 7-day streak', icon: '🔥', color: 'bg-orange-100' },
  perfect_score: { name: 'Perfect Score', description: 'Score 9+ in an interview', icon: '⭐', color: 'bg-yellow-100' },
  resume_pro: { name: 'Resume Pro', description: 'Upload and analyze your resume', icon: '📄', color: 'bg-pink-100' },
}

const levelThresholds = {
  Beginner: { min: 0, max: 1000, color: 'from-gray-400 to-gray-500' },
  Intermediate: { min: 1000, max: 3000, color: 'from-blue-400 to-blue-600' },
  Advanced: { min: 3000, max: 7000, color: 'from-purple-400 to-purple-600' },
  Expert: { min: 7000, max: Infinity, color: 'from-amber-400 to-orange-500' },
}

function GamificationPage() {
  const { gamificationStatus, leaderboard, fetchGamificationStatus, fetchLeaderboard } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchGamificationStatus().catch(() => {})
    fetchLeaderboard().catch(() => {})
  }, [fetchGamificationStatus, fetchLeaderboard])

  const getProgressToNextLevel = () => {
    if (!gamificationStatus) return 0
    const level = gamificationStatus.level
    const xp = gamificationStatus.xp
    const thresholds = levelThresholds[level]
    if (!thresholds || thresholds.max === Infinity) return 100
    return Math.round(((xp - thresholds.min) / (thresholds.max - thresholds.min)) * 100)
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements & Rewards</h1>
        <p className="text-gray-600">Track your progress, earn badges, and compete with others.</p>
      </motion.div>

      {/* XP & Level Card */}
      {gamificationStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className={`bg-gradient-to-r ${levelThresholds[gamificationStatus.level]?.color || 'from-gray-400 to-gray-500'} rounded-2xl p-8 text-white`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <p className="text-white/80 text-sm mb-1">Current Level</p>
              <h2 className="text-3xl font-bold mb-2">{gamificationStatus.level}</h2>
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-bold">{gamificationStatus.xp.toLocaleString()}</span>
                <span className="text-white/60">XP</span>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress to {gamificationStatus.nextLevel}</span>
                <span>{gamificationStatus.xpToNextLevel.toLocaleString()} XP needed</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${gamificationStatus.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-center">
                <Flame className="w-8 h-8 mx-auto mb-1" />
                <p className="text-2xl font-bold">{gamificationStatus.streak}</p>
                <p className="text-xs text-white/80">Day Streak</p>
              </div>
              <div className="text-center">
                <Award className="w-8 h-8 mx-auto mb-1" />
                <p className="text-2xl font-bold">{gamificationStatus.badges?.length || 0}</p>
                <p className="text-xs text-white/80">Badges</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        {['overview', 'badges', 'leaderboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{gamificationStatus?.xp || 0}</p>
            <p className="text-gray-600">Total XP</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <Flame className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{gamificationStatus?.streak || 0}</p>
            <p className="text-gray-600">Day Streak</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{gamificationStatus?.badges?.length || 0}</p>
            <p className="text-gray-600">Badges Earned</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{gamificationStatus?.level || 'Beginner'}</p>
            <p className="text-gray-600">Current Level</p>
          </div>
        </motion.div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(badgeDefinitions).map(([key, badge], index) => {
            const isEarned = gamificationStatus?.badges?.some(b => b.name === badge.name)
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-xl border ${
                  isEarned ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-14 h-14 rounded-xl ${badge.color} flex items-center justify-center text-3xl`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                      {isEarned && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                    {isEarned && (
                      <p className="text-xs text-green-600 mt-2">+100 XP earned</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Top Performers
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {(leaderboard?.leaderboard || []).map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index < 3 ? (
                      <Trophy className={`w-5 h-5 ${
                        index === 0 ? 'text-amber-600' :
                        index === 1 ? 'text-gray-600' :
                        'text-orange-600'
                      }`} />
                    ) : (
                      user.rank
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{user.xp.toLocaleString()} XP</p>
                  <p className="text-sm text-gray-500">{user.badgeCount} badges</p>
                </div>
              </div>
            ))}
          </div>
          
          {leaderboard?.userRank && (
            <div className="p-4 bg-primary-50 border-t border-primary-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                    {leaderboard.userRank}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">You</p>
                    <p className="text-sm text-gray-500">{leaderboard.userStats?.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{leaderboard.userStats?.xp?.toLocaleString()} XP</p>
                  <p className="text-sm text-gray-500">Your rank</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default GamificationPage
