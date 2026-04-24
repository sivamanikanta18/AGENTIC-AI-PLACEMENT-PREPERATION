import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Zap, Target, TrendingUp, Award } from 'lucide-react'
import useAppStore from '../store/appStore'
import toast from 'react-hot-toast'

function ResumeUploadPage() {
  const { resumeAnalysis, uploadResume, fetchResumeAnalysis, isResumeLoading } = useAppStore()
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchResumeAnalysis().catch(() => {})
  }, [fetchResumeAnalysis])

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload PDF, DOC, DOCX, or TXT files only')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    try {
      await uploadResume(file)
      toast.success('Resume analyzed successfully!')
    } catch (error) {
      toast.error('Failed to analyze resume')
    } finally {
      setIsUploading(false)
    }
  }, [uploadResume])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  })

  const getSkillLevelColor = (proficiency) => {
    switch (proficiency?.toLowerCase()) {
      case 'expert': return 'bg-purple-100 text-purple-700'
      case 'advanced': return 'bg-blue-100 text-blue-700'
      case 'intermediate': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis</h1>
        <p className="text-gray-600">Upload your resume to get AI-powered insights on your skills and areas for improvement.</p>
      </motion.div>

      {/* Upload Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          {isUploading || isResumeLoading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900">Analyzing your resume...</p>
              <p className="text-gray-500">Our AI is extracting insights</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
              </p>
              <p className="text-gray-500 mb-4">or click to browse files</p>
              <p className="text-sm text-gray-400">Supports PDF, DOC, DOCX, TXT (max 10MB)</p>
            </>
          )}
        </div>
      </motion.div>

      {/* Analysis Results */}
      {resumeAnalysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          {/* Confidence Score */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resume Confidence Score</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                resumeAnalysis.confidence_score >= 70 ? 'bg-green-100 text-green-700' :
                resumeAnalysis.confidence_score >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {resumeAnalysis.confidence_score}/100
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  resumeAnalysis.confidence_score >= 70 ? 'bg-green-500' :
                  resumeAnalysis.confidence_score >= 50 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${resumeAnalysis.confidence_score}%` }}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Skills Detected */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Skills Detected</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(resumeAnalysis.skills_detected || []).map((skill, index) => (
                  <span 
                    key={index} 
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillLevelColor(skill.proficiency)}`}
                  >
                    {skill.name} {skill.proficiency && `• ${skill.proficiency}`}
                  </span>
                ))}
                {(resumeAnalysis.skills_detected || []).length === 0 && (
                  <p className="text-gray-500">No skills detected. Try uploading a more detailed resume.</p>
                )}
              </div>
            </div>

            {/* Weak Areas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {(resumeAnalysis.weak_areas || []).map((area, index) => (
                  <li key={index} className="flex items-start space-x-2 text-gray-700">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{area}</span>
                  </li>
                ))}
                {(resumeAnalysis.weak_areas || []).length === 0 && (
                  <li className="text-green-600 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Great job! No major weak areas detected.</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Strengths */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Your Strengths</h3>
              </div>
              <ul className="space-y-2">
                {(resumeAnalysis.strengths || []).map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
                {(resumeAnalysis.strengths || []).length === 0 && (
                  <p className="text-gray-500">No specific strengths highlighted yet.</p>
                )}
              </ul>
            </div>

            {/* Risk Flags */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {(resumeAnalysis.risk_flags || []).map((flag, index) => (
                  <li key={index} className="flex items-start space-x-2 text-gray-700">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </li>
                ))}
                {(resumeAnalysis.skill_gaps || []).map((gap, index) => (
                  <li key={`gap-${index}`} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{gap.skill}</p>
                    <p className="text-sm text-gray-600">{gap.recommendation}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                      gap.importance === 'high' ? 'bg-red-100 text-red-700' :
                      gap.importance === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {gap.importance} priority
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Experience Summary */}
          {resumeAnalysis.experience_summary && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience Summary</h3>
              <p className="text-gray-700">{resumeAnalysis.experience_summary}</p>
            </div>
          )}

          {/* Projects */}
          {(resumeAnalysis.projects_summary || []).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {resumeAnalysis.projects_summary.map((project, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(project.technologies || []).map((tech, i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                    {project.complexity && (
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                        project.complexity === 'high' ? 'bg-purple-100 text-purple-700' :
                        project.complexity === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.complexity} complexity
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default ResumeUploadPage
