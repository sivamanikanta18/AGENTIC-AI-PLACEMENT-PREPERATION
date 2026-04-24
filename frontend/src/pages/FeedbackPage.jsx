import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, TrendingUp, MessageSquare, Target, Award, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import useAppStore from '../store/appStore'
import toast from 'react-hot-toast'

function FeedbackPage() {
  const { interviewId } = useParams()
  const { feedbackData, fetchFeedback, isFeedbackLoading } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (interviewId) {
      fetchFeedback(interviewId).catch(() => toast.error('Failed to load feedback'))
    }
  }, [interviewId, fetchFeedback])

  if (!mounted || isFeedbackLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!feedbackData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No feedback available</p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const dimensions = feedbackData.dimensions || {}
  
  const radarData = [
    { subject: 'Confidence', A: (dimensions.confidence?.score || 0) * 10, fullMark: 100 },
    { subject: 'Clarity', A: (dimensions.clarity?.score || 0) * 10, fullMark: 100 },
    { subject: 'Technical', A: (dimensions.technical?.score || 0) * 10, fullMark: 100 },
    { subject: 'Communication', A: (dimensions.communication?.score || 0) * 10, fullMark: 100 },
    { subject: 'Problem Solving', A: (dimensions.problem_solving?.score || 0) * 10, fullMark: 100 },
  ]

  const overallScore = Math.round(
    Object.values(dimensions).reduce((sum, dim) => sum + (dim?.score || 0), 0) / 5 * 10
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Feedback Report</h1>
        <p className="text-gray-600">Detailed analysis of your mock interview performance</p>
      </motion.div>

      {/* Overall Score Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-8 text-white"
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <p className="text-white/80 mb-2">Overall Performance Score</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-6xl font-bold">{overallScore}</span>
              <span className="text-2xl text-white/60">/100</span>
            </div>
            <p className="text-white/80 mt-2">
              {overallScore >= 80 ? 'Excellent performance!' : 
               overallScore >= 60 ? 'Good progress, keep improving!' : 
               'Keep practicing, you will get there!'}
            </p>
          </div>
          
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar name="Performance" dataKey="A" stroke="white" fill="white" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Dimensions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Confidence */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Confidence</h3>
              <p className="text-2xl font-bold text-gray-900">{dimensions.confidence?.score || 0}/10</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{dimensions.confidence?.details}</p>
          {dimensions.confidence?.improvements?.length > 0 && (
            <ul className="space-y-1">
              {dimensions.confidence.improvements.map((imp, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start">
                  <Target className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                  {imp}
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Clarity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Clarity</h3>
              <p className="text-2xl font-bold text-gray-900">{dimensions.clarity?.score || 0}/10</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{dimensions.clarity?.details}</p>
          {dimensions.clarity?.improvements?.length > 0 && (
            <ul className="space-y-1">
              {dimensions.clarity.improvements.map((imp, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start">
                  <Target className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                  {imp}
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Technical */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Technical Accuracy</h3>
              <p className="text-2xl font-bold text-gray-900">{dimensions.technical?.score || 0}/10</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{dimensions.technical?.details}</p>
          {dimensions.technical?.knowledgeGaps?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-600 mb-1">Knowledge Gaps:</p>
              <ul className="space-y-1">
                {dimensions.technical.knowledgeGaps.map((gap, i) => (
                  <li key={i} className="text-sm text-red-600 flex items-start">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Communication */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Communication</h3>
              <p className="text-2xl font-bold text-gray-900">{dimensions.communication?.score || 0}/10</p>
            </div>
          </div>
          <div className="space-y-2">
            {dimensions.communication?.pace && (
              <p className="text-sm text-gray-600"><span className="font-medium">Pace:</span> {dimensions.communication.pace}</p>
            )}
            {dimensions.communication?.structure && (
              <p className="text-sm text-gray-600"><span className="font-medium">Structure:</span> {dimensions.communication.structure}</p>
            )}
            {dimensions.communication?.fillerWords?.count > 0 && (
              <p className="text-sm text-amber-600">
                <span className="font-medium">Filler words detected:</span> {dimensions.communication.fillerWords.count}
              </p>
            )}
          </div>
        </motion.div>

        {/* Problem Solving */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Problem Solving</h3>
              <p className="text-2xl font-bold text-gray-900">{dimensions.problem_solving?.score || 0}/10</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {dimensions.problem_solving?.approach && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Approach</p>
                <p className="text-sm text-gray-600">{dimensions.problem_solving.approach}</p>
              </div>
            )}
            {dimensions.problem_solving?.optimization && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Optimization</p>
                <p className="text-sm text-gray-600">{dimensions.problem_solving.optimization}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* AI Summary */}
      {feedbackData.aiSummary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Assessment Summary</h3>
          <p className="text-gray-700 mb-6 leading-relaxed">{feedbackData.aiSummary.overallAssessment}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Key Strengths
              </h4>
              <ul className="space-y-2">
                {(feedbackData.aiSummary.keyStrengths || []).map((strength, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-1.5" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-amber-700 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Priority Areas
              </h4>
              <ul className="space-y-2">
                {(feedbackData.aiSummary.priorityAreas || []).map((area, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 mt-1.5" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Items */}
      {feedbackData.actionItems && feedbackData.actionItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
          <div className="space-y-3">
            {feedbackData.actionItems.map((item, index) => (
              <div key={index} className={`p-4 rounded-xl ${
                item.priority === 'high' ? 'bg-red-50 border border-red-100' :
                item.priority === 'medium' ? 'bg-amber-50 border border-amber-100' :
                'bg-blue-50 border border-blue-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.priority === 'high' ? 'bg-red-200 text-red-800' :
                    item.priority === 'medium' ? 'bg-amber-200 text-amber-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {item.priority} Priority
                  </span>
                  <span className="text-sm text-gray-500">{item.category}</span>
                </div>
                <p className="text-gray-700">{item.description}</p>
                {item.resources && item.resources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.resources.map((resource, i) => (
                      <span key={i} className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {resource}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex flex-wrap gap-4">
        <Link to="/interview" className="btn-primary">
          Start New Interview
        </Link>
        <Link to="/roadmap" className="btn-secondary">
          View Improvement Roadmap
        </Link>
        <button 
          onClick={() => window.print()} 
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download Report</span>
        </button>
      </motion.div>
    </div>
  )
}

export default FeedbackPage
