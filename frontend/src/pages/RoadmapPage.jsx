import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map, CheckCircle, Circle, Clock, Target, Calendar, ChevronRight, Sparkles, BookOpen, Code, Mic, Award } from 'lucide-react'
import useAppStore from '../store/appStore'
import { toast } from 'react-hot-toast'

const taskIcons = {
  learning: BookOpen,
  practice: Code,
  interview: Mic,
  coding: Code,
  revision: BookOpen,
  rest: Clock
}

function RoadmapPage() {
  const [renderError, setRenderError] = useState(null)
  
  try {
    return <RoadmapContent />
  } catch (err) {
    console.error('Roadmap render error:', err)
    setRenderError(err.message)
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{err.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Reload Page
        </button>
      </div>
    )
  }
}

function RoadmapContent() {
  const { currentRoadmap, fetchCurrentRoadmap, generateRoadmap, completeTask, isRoadmapLoading } = useAppStore()
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [targetRole, setTargetRole] = useState('Software Developer')
  const [timeline, setTimeline] = useState('30 days')
  const [completingTask, setCompletingTask] = useState(null)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)
  
  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [activeTab, setActiveTab] = useState('explanation') // 'explanation', 'resources', 'quiz'

  useEffect(() => {
    setMounted(true)
    console.log('[RoadmapPage] Component mounted')
    
    const loadRoadmap = async () => {
      try {
        setError(null)
        console.log('[RoadmapPage] Fetching roadmap...')
        const roadmap = await fetchCurrentRoadmap()
        console.log('[RoadmapPage] Roadmap fetched:', roadmap ? 'SUCCESS' : 'NO ROADMAP')
        if (roadmap) {
          console.log('[RoadmapPage] Roadmap ID:', roadmap._id)
          console.log('[RoadmapPage] Tasks count:', roadmap.schedule?.dailyPlan?.[0]?.tasks?.length || 0)
        }
      } catch (err) {
        console.error('[RoadmapPage] Failed to load roadmap:', err)
        setError('Failed to load roadmap: ' + (err.message || 'Unknown error'))
      }
    }
    loadRoadmap()
  }, [fetchCurrentRoadmap])

  // Debug logging
  useEffect(() => {
    console.log('[RoadmapPage] State update:', { 
      hasRoadmap: !!currentRoadmap, 
      isLoading: isRoadmapLoading, 
      hasError: !!error,
      isMounted: mounted 
    })
  }, [currentRoadmap, isRoadmapLoading, error, mounted])

  const handleGenerate = async () => {
    try {
      await generateRoadmap(targetRole, timeline)
      toast.success('Roadmap generated!')
      setShowGenerateModal(false)
    } catch (error) {
      toast.error('Failed to generate roadmap')
    }
  }

  const getDayStatus = (day) => {
    const completedTasks = day.tasks?.filter(t => t.completed).length || 0
    const totalTasks = day.tasks?.length || 0
    if (completedTasks === totalTasks && totalTasks > 0) return 'completed'
    if (completedTasks > 0) return 'in-progress'
    return 'pending'
  }

  // Open task detail modal
  const handleStartTask = (day, task, dayIndex, taskIndex) => {
    console.log('[RoadmapPage] Opening task modal:', { 
      dayNumber: day?.day, 
      taskTitle: task?.title, 
      dayIndex, 
      taskIndex,
      hasRoadmap: !!currentRoadmap 
    })
    
    if (!day || !task) {
      console.error('[RoadmapPage] Cannot open task - missing day or task data')
      toast.error('Task data not available')
      return
    }
    
    setSelectedTask({ day, task, dayIndex, taskIndex })
    setActiveTab('explanation')
    setShowTaskModal(true)
    console.log('[RoadmapPage] Task modal opened')
  }
  
  // Actually complete the task
  const handleCompleteTask = async () => {
    console.log('[RoadmapPage] Attempting to complete task...')
    
    if (!selectedTask) {
      console.error('[RoadmapPage] No task selected')
      toast.error('No task selected')
      return
    }
    
    if (!currentRoadmap) {
      console.error('[RoadmapPage] No roadmap available')
      toast.error('Roadmap not available')
      return
    }
    
    const { day, task, dayIndex, taskIndex } = selectedTask
    const taskKey = `${dayIndex}-${taskIndex}`
    
    console.log('[RoadmapPage] Completing task:', { 
      roadmapId: currentRoadmap._id, 
      dayNumber: day.day, 
      taskIndex,
      taskTitle: task.title 
    })
    
    setCompletingTask(taskKey)
    
    try {
      const result = await completeTask(currentRoadmap._id, day.day, taskIndex)
      console.log('[RoadmapPage] Task completed successfully:', result)
      
      // Show streak message if available
      if (result?.streakMessage) {
        toast.success(result.streakMessage, { duration: 4000 })
        setTimeout(() => {
          toast.success(`🎉 Task completed! +${result.totalXP || 50} XP total`, { duration: 3000 })
        }, 500)
      } else {
        toast.success(`🎉 Task completed! +${result?.xpEarned || 50} XP`)
      }
      
      setShowTaskModal(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('[RoadmapPage] Complete task error:', error)
      console.error('[RoadmapPage] Error details:', error.response?.data || error.message)
      toast.error('Failed to complete task: ' + (error.response?.data?.error || error.message || 'Unknown error'))
    } finally {
      setCompletingTask(null)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Roadmap</h1>
            <p className="text-gray-600">Personalized study plan to help you reach your interview goals.</p>
          </div>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate New Roadmap</span>
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-16 bg-red-50 rounded-2xl shadow-sm border border-red-100"
        >
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs font-mono">
        Debug: Roadmap={currentRoadmap ? 'yes' : 'no'} | Schedule={currentRoadmap?.schedule ? 'yes' : 'no'} | DailyPlan={currentRoadmap?.schedule?.dailyPlan?.length || 0} | Error={error || 'none'} | Loading={isRoadmapLoading ? 'yes' : 'no'}
      </div>

      {isRoadmapLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading roadmap...</span>
        </div>
      ) : !currentRoadmap ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Roadmap Yet</h3>
          <p className="text-gray-600 mb-6">Generate a personalized roadmap based on your skills and goals.</p>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary"
          >
            Create My Roadmap
          </button>
        </motion.div>
      ) : currentRoadmap && currentRoadmap.schedule && currentRoadmap.schedule.dailyPlan ? (
        <>
          {/* Progress Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-6 text-white"
          >
            <div className="grid md:grid-cols-5 gap-6">
              <div>
                <p className="text-white/80 text-sm">Target Role</p>
                <p className="text-xl font-bold">{currentRoadmap.target?.role}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm">Timeline</p>
                <p className="text-xl font-bold">{currentRoadmap.target?.timeline}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm">Progress</p>
                <div className="flex items-center space-x-2">
                  <p className="text-xl font-bold">{currentRoadmap.progress?.overallCompletion || 0}%</p>
                  <div className="w-24 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${currentRoadmap.progress?.overallCompletion || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm">Days Completed</p>
                <p className="text-xl font-bold">{currentRoadmap.progress?.daysCompleted || 0} / {currentRoadmap.progress?.totalDays}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 flex items-center space-x-3">
                <div className="text-3xl">🔥</div>
                <div>
                  <p className="text-white/80 text-xs">Daily Streak</p>
                  <p className="text-2xl font-bold">{currentRoadmap.streak || 1} days</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Daily Plan */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Days List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Daily Schedule
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(currentRoadmap.schedule?.dailyPlan || []).slice(0, 14).map((day, index) => {
                  const status = getDayStatus(day)
                  return (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        status === 'completed' ? 'bg-green-50 border-green-200' :
                        status === 'in-progress' ? 'bg-primary-50 border-primary-200' :
                        'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : status === 'in-progress' ? (
                            <Circle className="w-5 h-5 text-primary-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">Day {day.day}</p>
                            <p className="text-sm text-gray-500">{day.focus}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {day.tasks?.filter(t => t.completed).length || 0}/{day.tasks?.length || 0}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Today Tasks</h3>
                    <p className="text-gray-600 text-sm">Complete these to maintain your streak</p>
                  </div>
                  <div className="px-4 py-2 bg-primary-50 rounded-lg">
                    <span className="text-primary-700 font-medium">
                      +{currentRoadmap.schedule?.dailyPlan?.[0]?.estimatedXP || 100} XP
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {(currentRoadmap.schedule?.dailyPlan?.[0]?.tasks || []).map((task, taskIndex) => {
                    const TaskIcon = taskIcons[task.type] || BookOpen
                    const day = currentRoadmap.schedule?.dailyPlan?.[0]
                    return (
                      <motion.div
                        key={taskIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: taskIndex * 0.1 }}
                        className={`p-4 rounded-xl border transition-all ${
                          task.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            task.completed ? 'bg-green-100' : 'bg-primary-100'
                          }`}>
                            <TaskIcon className={`w-5 h-5 ${task.completed ? 'text-green-600' : 'text-primary-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                                {task.title}
                              </p>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                task.type === 'rest' ? 'bg-gray-200 text-gray-600' :
                                task.type === 'interview' ? 'bg-purple-100 text-purple-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {task.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            <div className="flex items-center space-x-4 mt-3">
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {task.duration} min
                              </span>
                              {!task.completed ? (
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleStartTask(day, task, 0, taskIndex)
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                                >
                                  Start Task
                                </button>
                              ) : (
                                <span className="text-sm text-green-600 font-medium flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Skill Focus */}
                {(currentRoadmap.schedule?.dailyPlan?.[0]?.skills || []).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">Skills Focus:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentRoadmap.schedule.dailyPlan[0].skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Milestones */}
          {(currentRoadmap.milestones || []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Milestones
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {(currentRoadmap.milestones || []).slice(0, 6).map((milestone, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border ${
                      milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {milestone.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Target className="w-5 h-5 text-gray-400" />
                      )}
                      <p className={`font-medium ${milestone.completed ? 'text-green-800' : 'text-gray-900'}`}>
                        {milestone.title}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                    {milestone.xpReward && (
                      <p className="text-sm text-amber-600 mt-2 font-medium">+{milestone.xpReward} XP</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      ) : currentRoadmap ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-16 bg-amber-50 rounded-2xl shadow-sm border border-amber-100"
        >
          <Map className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Roadmap Data Missing</h3>
          <p className="text-gray-600 mb-6">Your roadmap exists but the schedule data is missing. Please regenerate your roadmap.</p>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary"
          >
            Regenerate Roadmap
          </button>
        </motion.div>
      ) : null}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generate New Roadmap</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="14 days">2 Weeks</option>
                  <option value="30 days">1 Month</option>
                  <option value="60 days">2 Months</option>
                  <option value="90 days">3 Months</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isRoadmapLoading}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                {isRoadmapLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Detail Modal - AI Powered */}
      {showTaskModal && selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setShowTaskModal(false)}
          onComplete={handleCompleteTask}
          isCompleting={completingTask !== null}
        />
      )}
    </div>
  )
}

// AI-Powered Task Detail Modal Component
function TaskDetailModal({ task, onClose, onComplete, isCompleting }) {
  const [activeTab, setActiveTab] = useState('learn')
  const [quizAnswers, setQuizAnswers] = useState({})
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  
  // Generate AI content based on task
  const aiContent = generateAIContent(task.task.title, task.task.type)
  
  // Handle quiz submission
  const handleQuizSubmit = () => {
    let score = 0
    aiContent.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) score++
    })
    setQuizScore(score)
    setShowQuizResults(true)
  }
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  Day {task.day.day}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium capitalize">
                  {task.task.type}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  {task.task.duration} mins
                </span>
              </div>
              <h2 className="text-2xl font-bold">{task.task.title}</h2>
              <p className="text-blue-100 mt-1 text-sm">{task.task.description}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'learn', label: '📚 Learn', icon: BookOpen },
            { id: 'resources', label: '🔗 Resources', icon: Code },
            { id: 'practice', label: '💻 Practice', icon: Target },
            { id: 'quiz', label: '📝 Quiz (10 Qs)', icon: Award }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.label.split(' ')[0]}</span>
              <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          
          {/* LEARN TAB */}
          {activeTab === 'learn' && (
            <div className="space-y-6">
              {/* AI Explanation Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  AI-Generated Explanation
                </h3>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aiContent.explanation}</p>
                </div>
              </div>

              {/* Key Concepts */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <h4 className="font-bold text-amber-900 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Key Concepts
                  </h4>
                  <ul className="space-y-2">
                    {aiContent.keyConcepts.map((concept, i) => (
                      <li key={i} className="flex items-start text-sm text-amber-800">
                        <span className="mr-2 text-amber-600">▸</span>
                        {concept}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Learning Objectives
                  </h4>
                  <ul className="space-y-2">
                    {aiContent.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start text-sm text-green-800">
                        <span className="mr-2 text-green-600">✓</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Code Example */}
              {aiContent.codeExample && (
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                    <span className="text-xs text-gray-400 font-mono">example.js</span>
                    <span className="text-xs text-green-400">JavaScript</span>
                  </div>
                  <pre className="p-4 text-sm text-gray-300 font-mono overflow-x-auto">
                    <code>{aiContent.codeExample}</code>
                  </pre>
                </div>
              )}

              {/* Real-World Application */}
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-2">🌍 Real-World Application</h4>
                <p className="text-sm text-purple-800">{aiContent.realWorldApplication}</p>
              </div>
            </div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Curated Learning Resources</h3>
              
              {aiContent.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all group border border-gray-200 hover:border-blue-300"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${resource.bgColor}`}>
                    {resource.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700">{resource.title}</p>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">{resource.type}</span>
                    </div>
                    <p className="text-sm text-gray-500">{resource.source} • {resource.duration}</p>
                    <p className="text-xs text-gray-400 mt-1">{resource.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </a>
              ))}
            </div>
          )}

          {/* PRACTICE TAB */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Practice Problems</h3>
              
              {aiContent.problems.map((problem, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        problem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {problem.difficulty}
                      </span>
                      <span className="text-sm text-gray-500">Problem {idx + 1}</span>
                    </div>
                    <a 
                      href={problem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Solve Now
                    </a>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{problem.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{problem.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📝 {problem.platform}</span>
                    <span>⏱️ {problem.estimatedTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Knowledge Check</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  10 Questions
                </span>
              </div>

              {!showQuizResults ? (
                <>
                  {aiContent.quiz.map((q, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <div className="flex items-start space-x-3 mb-4">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="font-medium text-gray-900">{q.question}</p>
                      </div>
                      <div className="space-y-2 ml-11">
                        {q.options.map((option, optIdx) => (
                          <label 
                            key={optIdx}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                              quizAnswers[idx] === optIdx 
                                ? 'bg-blue-100 border-2 border-blue-500' 
                                : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${idx}`}
                              className="mr-3 text-blue-600"
                              checked={quizAnswers[idx] === optIdx}
                              onChange={() => setQuizAnswers({...quizAnswers, [idx]: optIdx})}
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < 10}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Quiz ({Object.keys(quizAnswers).length}/10 answered)
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-4 ${
                    quizScore >= 7 ? 'bg-green-100 text-green-600' : 
                    quizScore >= 5 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-red-100 text-red-600'
                  }`}>
                    {quizScore}/10
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {quizScore >= 7 ? '🎉 Great job!' : quizScore >= 5 ? '👍 Good effort!' : '💪 Keep practicing!'}
                  </h4>
                  <p className="text-gray-600 mb-6">
                    {quizScore >= 7 
                      ? 'You have a solid understanding of this topic.' 
                      : 'Review the learning materials and try again.'}
                  </p>
                  <button 
                    onClick={() => {
                      setShowQuizResults(false)
                      setQuizAnswers({})
                      setQuizScore(0)
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Complete this task to earn{' '}
              <span className="font-bold text-gray-900">+{task.task.xp || 50} XP</span>
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Close
            </button>
            <button 
              onClick={onComplete}
              disabled={isCompleting}
              className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center shadow-lg shadow-green-500/30"
            >
              {isCompleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark Complete
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// AI Content Generation Function
function generateAIContent(title, type) {
  // Extract topic from title
  const topic = title.replace(/^(Learn|Practice|Review)\s+/i, '').trim()
  
  // Generate context-aware content
  const contentDatabase = {
    explanation: generateExplanation(topic),
    keyConcepts: generateKeyConcepts(topic),
    objectives: generateObjectives(topic),
    codeExample: generateCodeExample(topic),
    realWorldApplication: generateRealWorldApplication(topic),
    resources: generateResources(topic),
    problems: generateProblems(topic),
    quiz: generateQuiz(topic)
  }
  
  return contentDatabase
}

// Helper functions to generate AI-like content
function generateExplanation(topic) {
  const explanations = {
    'cloud computing': `Cloud computing is the delivery of computing services—including servers, storage, databases, networking, software, and analytics—over the Internet ("the cloud"). 

It offers faster innovation, flexible resources, and economies of scale. You typically pay only for cloud services you use, helping you lower your operating costs, run your infrastructure more efficiently, and scale as your business needs change.

Key benefits include:
• Cost savings (no upfront hardware investment)
• Scalability (scale up or down as needed)
• Reliability (data backup and disaster recovery)
• Performance (global network of secure datacenters)`,
    
    'machine learning': `Machine Learning is a subset of Artificial Intelligence that enables systems to learn and improve from experience without being explicitly programmed. 

It focuses on developing computer programs that can access data and use it to learn for themselves. The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future.

Types of Machine Learning:
• Supervised Learning: Learning with labeled data
• Unsupervised Learning: Finding patterns in unlabeled data
• Reinforcement Learning: Learning through trial and error`,

    'default': `${topic} is a fundamental concept in modern software development and computer science. Understanding this topic is crucial for building efficient, scalable, and maintainable applications.

This learning module covers the core principles, practical implementations, and best practices. You'll explore both theoretical foundations and hands-on applications through curated resources and practice problems.

By the end of this module, you'll be able to:
• Understand the fundamental concepts and architecture
• Implement solutions in real-world scenarios
• Optimize performance and handle edge cases
• Apply industry best practices and design patterns`
  }
  
  return explanations[topic.toLowerCase()] || explanations['default']
}

function generateKeyConcepts(topic) {
  const concepts = {
    'cloud computing': [
      'Infrastructure as a Service (IaaS)',
      'Platform as a Service (PaaS)',
      'Software as a Service (SaaS)',
      'Public, Private, and Hybrid clouds',
      'Virtualization and containers',
      'Auto-scaling and load balancing'
    ],
    'machine learning': [
      'Features and Labels',
      'Training and Testing datasets',
      'Overfitting and Underfitting',
      'Model evaluation metrics',
      'Feature engineering',
      'Cross-validation techniques'
    ],
    'default': [
      `Core ${topic} fundamentals`,
      'Architecture and design patterns',
      'Performance optimization techniques',
      'Security best practices',
      'Testing and debugging strategies',
      'Integration with other technologies'
    ]
  }
  
  return concepts[topic.toLowerCase()] || concepts['default']
}

function generateObjectives(topic) {
  return [
    `Understand fundamental ${topic} concepts and architecture`,
    `Apply ${topic} principles to solve real-world problems`,
    `Implement efficient and optimized solutions`,
    `Evaluate and select appropriate tools and frameworks`,
    `Pass the comprehensive quiz with 70%+ score`
  ]
}

function generateCodeExample(topic) {
  const examples = {
    'cloud computing': `// AWS SDK Example - Upload file to S3
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const uploadFile = async (fileName, fileContent) => {
  const params = {
    Bucket: 'my-bucket',
    Key: fileName,
    Body: fileContent
  };
  
  try {
    const result = await s3.upload(params).promise();
    console.log('File uploaded:', result.Location);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};`,

    'machine learning': `// Simple Linear Regression with Python
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import numpy as np

# Prepare data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 5, 4, 5])

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)
print(f'Accuracy: {model.score(X_test, y_test)}')`,

    'default': `// Example implementation
function solveProblem(input) {
  // Step 1: Validate input
  if (!input || input.length === 0) {
    return null;
  }
  
  // Step 2: Process data
  const processed = input.map(item => ({
    ...item,
    computed: item.value * 2
  }));
  
  // Step 3: Apply business logic
  const result = processed.filter(item => 
    item.computed > threshold
  );
  
  // Step 4: Return optimized result
  return result.sort((a, b) => b.computed - a.computed);
}`
  }
  
  return examples[topic.toLowerCase()] || examples['default']
}

function generateRealWorldApplication(topic) {
  const applications = {
    'cloud computing': 'Netflix uses cloud computing to stream videos to millions of users worldwide. By leveraging AWS, they can handle massive traffic spikes during popular show releases, scale infrastructure automatically, and serve content from datacenters closest to each user for minimal buffering.',
    
    'machine learning': 'Spotify uses machine learning to power its recommendation engine. By analyzing listening patterns, user behavior, and song features, their ML models predict what songs users will enjoy, creating personalized playlists like Discover Weekly that keep millions of users engaged.',
    
    'default': `${topic} is used by major tech companies like Google, Amazon, and Facebook to build scalable, high-performance applications. Startups use it to quickly prototype and launch products, while enterprises rely on it for mission-critical systems serving millions of users.`
  }
  
  return applications[topic.toLowerCase()] || applications['default']
}

function generateResources(topic) {
  const youtubeQuery = encodeURIComponent(`${topic} tutorial for beginners`)
  
  return [
    {
      title: `${topic} - Complete Tutorial`,
      type: 'Video',
      source: 'YouTube',
      duration: '45 mins',
      description: 'Comprehensive beginner-friendly tutorial covering all fundamentals',
      url: `https://www.youtube.com/results?search_query=${youtubeQuery}`,
      bgColor: 'bg-red-100',
      icon: <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
    },
    {
      title: `${topic} Fundamentals`,
      type: 'Article',
      source: 'GeeksforGeeks',
      duration: '15 min read',
      description: 'In-depth article with examples and practice problems',
      url: `https://www.geeksforgeeks.org/?s=${encodeURIComponent(topic)}`,
      bgColor: 'bg-green-100',
      icon: <BookOpen className="w-6 h-6 text-green-600" />
    },
    {
      title: `Interactive ${topic} Course`,
      type: 'Course',
      source: 'freeCodeCamp',
      duration: '3 hours',
      description: 'Hands-on interactive coding lessons',
      url: `https://www.freecodecamp.org/search?query=${encodeURIComponent(topic)}`,
      bgColor: 'bg-blue-100',
      icon: <Code className="w-6 h-6 text-blue-600" />
    },
    {
      title: `${topic} Documentation`,
      type: 'Docs',
      source: 'Official Docs',
      duration: 'Reference',
      description: 'Official documentation and API reference',
      url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' documentation')}`,
      bgColor: 'bg-purple-100',
      icon: <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    }
  ]
}

function generateProblems(topic) {
  const topicSlug = topic.toLowerCase().replace(/\s+/g, '-')
  
  return [
    {
      title: `Basic ${topic} Implementation`,
      difficulty: 'Easy',
      platform: 'LeetCode',
      url: `https://leetcode.com/problemset/all/?search=${topicSlug}`,
      description: `Implement a basic solution demonstrating core ${topic} concepts.`,
      estimatedTime: '20-30 mins'
    },
    {
      title: `${topic} Optimization Challenge`,
      difficulty: 'Medium',
      platform: 'HackerRank',
      url: `https://www.hackerrank.com/domains/algorithms?filters%5Bsubdomains%5D%5B%5D=${topicSlug}`,
      description: `Optimize an existing solution for better time/space complexity.`,
      estimatedTime: '30-45 mins'
    },
    {
      title: `Real-world ${topic} Application`,
      difficulty: 'Medium',
      platform: 'CodePen',
      url: 'https://codepen.io/search/pens?q=' + encodeURIComponent(topic),
      description: `Build a practical application using ${topic} principles.`,
      estimatedTime: '45-60 mins'
    }
  ]
}

function generateQuiz(topic) {
  const baseQuestions = [
    {
      question: `What is the primary purpose of ${topic} in software development?`,
      options: [
        'To increase code complexity',
        'To solve specific technical problems efficiently',
        'To make applications run slower',
        'To reduce code readability'
      ],
      correctAnswer: 1
    },
    {
      question: `Which of the following is a key benefit of using ${topic}?`,
      options: [
        'Increased technical debt',
        'Improved scalability and performance',
        'Harder maintenance',
        'More bugs in production'
      ],
      correctAnswer: 1
    },
    {
      question: `When implementing ${topic}, what should be your first consideration?`,
      options: [
        'Write code as quickly as possible',
        'Understand requirements and constraints',
        'Ignore edge cases',
        'Skip testing'
      ],
      correctAnswer: 1
    },
    {
      question: `What is a common anti-pattern when working with ${topic}?`,
      options: [
        'Following best practices',
        'Over-engineering simple solutions',
        'Writing clean code',
        'Documenting your work'
      ],
      correctAnswer: 1
    },
    {
      question: `How do you typically test ${topic} implementations?`,
      options: [
        'Only test happy paths',
        'Unit tests, integration tests, and edge cases',
        'Never test',
        'Test only after production deployment'
      ],
      correctAnswer: 1
    },
    {
      question: `What is the time complexity of a basic ${topic} operation?`,
      options: ['O(1)', 'O(n)', 'O(log n)', 'Depends on implementation'],
      correctAnswer: 3
    },
    {
      question: `Which factor is most important when optimizing ${topic}?`,
      options: [
        'Using the newest framework',
        'Understanding the problem constraints',
        'Adding more servers always',
        'Ignoring user feedback'
      ],
      correctAnswer: 1
    },
    {
      question: `What is the best practice for documenting ${topic} code?`,
      options: [
        'No documentation needed',
        'Clear comments explaining why, not what',
        'Write documentation after leaving the company',
        'Use only abbreviations'
      ],
      correctAnswer: 1
    },
    {
      question: `How do you handle errors in ${topic} applications?`,
      options: [
        'Ignore all errors',
        'Implement proper error handling and logging',
        'Show stack traces to users',
        'Crash silently'
      ],
      correctAnswer: 1
    },
    {
      question: `What should you do before deploying ${topic} to production?`,
      options: [
        'Test it on your machine only',
        'Run comprehensive tests, review security, and monitor',
        'Deploy Friday evening',
        'Skip code review'
      ],
      correctAnswer: 1
    }
  ]
  
  return baseQuestions
}

export default RoadmapPage
