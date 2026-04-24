import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Building2, Gauge, Timer, AlertCircle, ChevronRight, Info } from 'lucide-react'
import useAppStore from '../store/appStore'
import toast from 'react-hot-toast'

const interviewTypes = [
  { id: 'technical', label: 'Technical Interview', icon: '💻', description: 'Focus on coding, system design, and technical concepts' },
  { id: 'hr', label: 'HR Interview', icon: '👔', description: 'Cultural fit, behavioral questions, and motivation' },
  { id: 'behavioral', label: 'Behavioral Interview', icon: '🗣️', description: 'Past experiences, STAR method, and soft skills' },
  { id: 'mixed', label: 'Mixed Interview', icon: '🎯', description: 'Combination of technical, HR, and behavioral questions' },
]

const companyModes = [
  { id: 'faang', label: 'FAANG Style', icon: '🔥', description: 'Focus on DSA, system design, and problem-solving' },
  { id: 'service_based', label: 'Service Based', icon: '🏢', description: 'Emphasis on fundamentals and consistency' },
  { id: 'startup', label: 'Startup', icon: '🚀', description: 'Practical skills, projects, and adaptability' },
  { id: 'general', label: 'General', icon: '🌐', description: 'Balanced approach across all areas' },
]

const difficulties = [
  { id: 'easy', label: 'Easy', description: 'Fundamental concepts, suitable for beginners' },
  { id: 'medium', label: 'Medium', description: 'Moderate difficulty, industry standard' },
  { id: 'hard', label: 'Hard', description: 'Advanced questions for experienced candidates' },
  { id: 'adaptive', label: 'Adaptive', description: 'AI adjusts difficulty based on your performance' },
]

function InterviewConfigPage() {
  const navigate = useNavigate()
  const { startInterview } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    type: 'mixed',
    companyMode: 'general',
    difficulty: 'adaptive',
    pressureSettings: {
      timerEnabled: true,
      interruptionsEnabled: true,
      strictMode: false
    }
  })

  const handleStartInterview = async () => {
    setIsLoading(true)
    try {
      const result = await startInterview(config)
      if (result.success) {
        toast.success('Interview started!')
        navigate('/interview/session')
      }
    } catch (error) {
      toast.error('Failed to start interview')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure Your Interview</h1>
        <p className="text-gray-600">Customize the mock interview experience to match your preparation needs.</p>
      </motion.div>

      {/* Interview Type */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Mic className="w-5 h-5 mr-2" />
          Interview Type
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {interviewTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setConfig({ ...config, type: type.id })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                config.type === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Company Mode */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Company Type
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {companyModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setConfig({ ...config, companyMode: mode.id })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                config.companyMode === mode.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{mode.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{mode.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Difficulty */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Gauge className="w-5 h-5 mr-2" />
          Difficulty Level
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              onClick={() => setConfig({ ...config, difficulty: diff.id })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                config.difficulty === diff.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <p className="font-semibold text-gray-900">{diff.label}</p>
              <p className="text-xs text-gray-600 mt-2">{diff.description}</p>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Pressure Simulation Settings */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Timer className="w-5 h-5 mr-2" />
          Pressure Simulation
        </h2>
        <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.pressureSettings.timerEnabled}
                onChange={(e) => setConfig({
                  ...config,
                  pressureSettings: { ...config.pressureSettings, timerEnabled: e.target.checked }
                })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <p className="font-medium text-gray-900">Enable Timer</p>
                <p className="text-sm text-gray-600">Time limit for each answer</p>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.pressureSettings.interruptionsEnabled}
                onChange={(e) => setConfig({
                  ...config,
                  pressureSettings: { ...config.pressureSettings, interruptionsEnabled: e.target.checked }
                })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <p className="font-medium text-gray-900">AI Interruptions</p>
                <p className="text-sm text-gray-600">Real-time follow-up questions and challenges</p>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.pressureSettings.strictMode}
                onChange={(e) => setConfig({
                  ...config,
                  pressureSettings: { ...config.pressureSettings, strictMode: e.target.checked }
                })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <p className="font-medium text-gray-900">Strict Mode</p>
                <p className="text-sm text-gray-600">No hints, no retries - simulate real pressure</p>
              </div>
            </div>
          </label>
        </div>
      </motion.section>

      {/* Info Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3"
      >
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">What to expect</p>
          <p className="text-sm text-blue-700 mt-1">
            This interview will consist of 8 questions. The AI will adapt based on your answers. 
            You will receive detailed feedback after completion.
          </p>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <button
          onClick={handleStartInterview}
          disabled={isLoading}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Starting Interview...</span>
            </>
          ) : (
            <>
              <span>Start Mock Interview</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}

export default InterviewConfigPage
