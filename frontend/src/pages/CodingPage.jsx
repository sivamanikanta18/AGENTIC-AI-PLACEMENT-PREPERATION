import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Code2, Play, CheckCircle, Clock, BookOpen, Trophy, Filter, ChevronRight, Star, Zap, 
  ExternalLink, Target, Flame, Award, BarChart3, ArrowRight, X, Timer, AlertCircle 
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import useAppStore from '../store/appStore'
import toast from 'react-hot-toast'
import axios from 'axios'

const categories = [
  { id: 'recursion', label: 'Recursion', color: 'bg-blue-100 text-blue-700' },
  { id: 'hashing', label: 'Hashing', color: 'bg-green-100 text-green-700' },
  { id: 'two_pointers', label: 'Two Pointers', color: 'bg-purple-100 text-purple-700' },
  { id: 'backtracking', label: 'Backtracking', color: 'bg-amber-100 text-amber-700' },
  { id: 'dynamic_programming', label: 'Dynamic Programming', color: 'bg-red-100 text-red-700' },
  { id: 'greedy', label: 'Greedy', color: 'bg-pink-100 text-pink-700' },
  { id: 'heaps', label: 'Heaps', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'tries', label: 'Tries', color: 'bg-cyan-100 text-cyan-700' },
]

const difficulties = [
  { id: 'easy', label: 'Easy', color: 'bg-green-100 text-green-700' },
  { id: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { id: 'hard', label: 'Hard', color: 'bg-red-100 text-red-700' },
]

function CodingPage() {
  const { codingProblems, fetchCodingProblems, submitCodingSolution, isCodingLoading } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  
  // Mock Test State
  const [showMockTestModal, setShowMockTestModal] = useState(false)
  const [mockTestConfig, setMockTestConfig] = useState({
    difficulty: 'adaptive',
    questionCount: 3,
    companyMode: 'general',
    timeLimit: 45,
    categories: [],
    focusAreas: []
  })
  const [mockTestSession, setMockTestSession] = useState(null)
  const [mockTestLoading, setMockTestLoading] = useState(false)
  const [mockTestResults, setMockTestResults] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [activeTab, setActiveTab] = useState('practice') // 'practice' or 'mock'
  const [testResults, setTestResults] = useState(null) // Store test results after submit
  const [showingResults, setShowingResults] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState(0) // Selected test case index
  
  // Run Code State
  const [runMode, setRunMode] = useState(false) // Toggle between practice mode and run mode
  const [runOutput, setRunOutput] = useState('') // Console output
  const [runError, setRunError] = useState('') // Error output
  const [isRunning, setIsRunning] = useState(false) // Code execution loading
  const [runStdin, setRunStdin] = useState('') // Custom input
  const [showConsole, setShowConsole] = useState(false) // Show/hide console panel

  useEffect(() => {
    fetchCodingProblems({ category: selectedCategory, difficulty: selectedDifficulty })
      .catch(() => toast.error('Failed to load problems'))
  }, [selectedCategory, selectedDifficulty, fetchCodingProblems])

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem)
    setCode(`function solution(${problem.examples?.[0]?.input?.split('=')[0]?.trim() || 'input'}) {\n  // Write your solution here\n  \n}`)
    setSubmissionResult(null)
  }

  const handleSubmit = async () => {
    if (!selectedProblem || !code.trim()) return

    setIsSubmitting(true)
    try {
      const result = await submitCodingSolution(selectedProblem._id, code, language)
      setSubmissionResult(result)
      if (result.status === 'solved') {
        toast.success('Problem solved! +' + result.xpEarned + ' XP')
      } else {
        toast('Keep trying! Check the feedback below.')
      }
    } catch (error) {
      toast.error('Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Run Code Function - Execute code with Piston API
  const runCode = async () => {
    if (!selectedProblem || !code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setRunOutput('')
    setRunError('')
    setShowConsole(true)

    try {
      const response = await axios.post('/coding-exec/execute', {
        code,
        language,
        stdin: runStdin
      })

      const result = response.data

      if (result.success) {
        setRunOutput(result.output || '(No output)')
        toast.success(`Code executed in ${result.executionTime}ms`)
      } else {
        setRunError(result.error || result.stderr || 'Execution failed')
        if (result.output) {
          setRunOutput(result.output)
        }
        toast.error(result.error || 'Execution failed')
      }
    } catch (error) {
      console.error('Run code error:', error)
      setRunError(error.response?.data?.error || 'Failed to execute code')
      toast.error('Failed to execute code')
    } finally {
      setIsRunning(false)
    }
  }

  // Run code with problem test cases
  const runCodeWithTests = async () => {
    if (!selectedProblem || !code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setRunMode(true)
    setTestResults(null)
    setShowingResults(false)

    try {
      const response = await axios.post('/coding-exec/run-tests', {
        code,
        language,
        problemId: selectedProblem._id,
        stdin: runStdin
      })

      const result = response.data
      
      setTestResults({
        testResults: {
          passed: result.passed,
          failed: result.total - result.passed,
          total: result.total,
          details: result.testResults.map(tr => ({
            testCase: tr.testCase,
            passed: tr.passed,
            input: tr.input,
            expectedOutput: tr.expectedOutput,
            actualOutput: tr.actualOutput,
            error: tr.error
          })),
          executionTime: result.totalExecutionTime
        },
        evaluation: {
          score: Math.round((result.passed / result.total) * 10),
          feedback: result.passed === result.total 
            ? 'All test cases passed!'
            : `${result.passed}/${result.total} test cases passed`,
          timeComplexity: 'O(n)', // Simplified
          spaceComplexity: 'O(1)'
        },
        allPassed: result.allPassed,
        canSubmit: result.passed > 0
      })
      
      setShowingResults(true)
      // Auto-select first failed test
      const firstFailedIndex = result.testResults.findIndex(t => !t.passed)
      setSelectedTestCase(firstFailedIndex >= 0 ? firstFailedIndex : 0)

      if (result.allPassed) {
        toast.success(`All ${result.total} test cases passed!`)
      } else {
        toast(`${result.passed}/${result.total} tests passed`)
      }
    } catch (error) {
      console.error('Run tests error:', error)
      toast.error('Failed to run tests')
    } finally {
      setIsRunning(false)
    }
  }

  // Mock Test Functions
  // Run tests without submitting (LeetCode style)
  const runMockTestCode = async () => {
    if (!mockTestSession || !code.trim()) return

    // Reset results state to allow multiple runs
    setShowingResults(false)
    setTestResults(null)
    
    setIsSubmitting(true)
    try {
      const timeSpent = (mockTestConfig.timeLimit * 60 - timeRemaining) / 60
      
      const response = await axios.post('/coding-mock/run', {
        sessionId: mockTestSession.sessionId,
        code,
        language,
        timeSpent
      })

      setTestResults(response.data)
      setShowingResults(true)
      // Auto-select first failed test case, or first test case if all passed
      const firstFailedIndex = response.data.testResults?.details?.findIndex(t => !t.passed);
      setSelectedTestCase(firstFailedIndex >= 0 ? firstFailedIndex : 0)
      
      // Store last run for submission
      setMockTestSession(prev => ({
        ...prev,
        lastRun: {
          code,
          language,
          timeSpent,
          evaluation: response.data.evaluation,
          testResults: response.data.testResults
        }
      }))
      
      const passedCount = response.data.testResults?.passed || 0
      const totalCount = response.data.testResults?.total || 0
      
      if (passedCount === totalCount) {
        toast.success(`All ${totalCount} tests passed! Click Submit to continue.`)
      } else {
        toast(`${passedCount}/${totalCount} tests passed. Fix and run again.`)
      }
    } catch (error) {
      toast.error('Failed to run tests')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit final answer
  const submitMockTestSolution = async () => {
    if (!mockTestSession) return

    setIsSubmitting(true)
    try {
      const response = await axios.post('/coding-mock/submit', {
        sessionId: mockTestSession.sessionId,
        lastRun: mockTestSession.lastRun
      })

      if (response.data.completed) {
        setMockTestResults(response.data)
        setMockTestSession(null)
        setSelectedProblem(null)
        toast.success(`Test completed! Final Score: ${response.data.finalScore}/10`)
      } else {
        // Next problem
        setSelectedProblem(response.data.problem)
        setMockTestSession(prev => ({ ...prev, currentIndex: response.data.currentIndex }))
        setCode(`function solution(${response.data.problem.examples?.[0]?.input?.split('=')[0]?.trim() || 'input'}) {\n  // Write your solution here\n  \n}`)
        setShowingResults(false)
        setTestResults(null)
        setSelectedTestCase(0)
        toast(`Problem ${response.data.currentIndex} of ${response.data.total}`)
      }
    } catch (error) {
      toast.error('Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startMockTest = async () => {
    setMockTestLoading(true)
    try {
      const response = await axios.post('/coding-mock/start', mockTestConfig)
      setMockTestSession(response.data)
      setSelectedProblem(response.data.problem)
      setTimeRemaining(response.data.timeLimit * 60)
      setActiveTab('mock')
      setShowMockTestModal(false)
      setCode(`function solution(${response.data.problem.examples?.[0]?.input?.split('=')[0]?.trim() || 'input'}) {\n  // Write your solution here\n  \n}`)
      toast.success(`Mock test started! Problem 1 of ${response.data.total}`)
    } catch (error) {
      toast.error('Failed to start mock test')
    } finally {
      setMockTestLoading(false)
    }
  }


  // Timer effect for mock test
  useEffect(() => {
    let interval
    if (activeTab === 'mock' && timeRemaining > 0 && mockTestSession) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            toast.error('Time\'s up!')
            // Auto-submit when time runs out
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeTab, timeRemaining, mockTestSession])

  // Handle auto-submit when timer reaches 0 - just submit and show results, don't advance
  useEffect(() => {
    if (activeTab === 'mock' && timeRemaining === 0 && mockTestSession && !isSubmitting && !showingResults) {
      submitMockTestSolution()
    }
  }, [timeRemaining, activeTab, mockTestSession, isSubmitting, showingResults])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const closeMockTestResults = () => {
    setMockTestResults(null)
    setActiveTab('practice')
    setSelectedProblem(null)
    fetchCodingProblems()
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Coding Practice</h1>
        <p className="text-gray-600">Sharpen your coding skills with AI-generated problems and real-time feedback.</p>
      </motion.div>

      {!selectedProblem ? (
        <>
          {/* Filters and Mock Test */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  value={selectedDifficulty} 
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none"
                >
                  <option value="">All Difficulties</option>
                  {difficulties.map(diff => <option key={diff.id} value={diff.id}>{diff.label}</option>)}
                </select>
              </div>
            </div>
            
            {/* Start Mock Test Button */}
            <button
              onClick={() => setShowMockTestModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Target className="w-5 h-5" />
              <span>Take Mock Test</span>
            </button>
          </motion.div>

          {/* Problems Grid */}
          {isCodingLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(codingProblems || []).map((problem, index) => (
                <motion.div
                  key={problem._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleProblemSelect(problem)}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      problem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      problem.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {problem.difficulty}
                    </span>
                    {problem.solved && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{problem.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                      {problem.category?.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Coding Interface */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-2 gap-6">
          {/* Problem Description */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-gray-900">{selectedProblem.title}</h2>
                  {selectedProblem.leetcodeUrl && (
                    <a 
                      href={selectedProblem.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-full transition-colors"
                    >
                      <span>View on LeetCode</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedProblem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Back to list
                </button>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedProblem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  selectedProblem.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedProblem.difficulty}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">
                  {selectedProblem.category?.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed">{selectedProblem.description}</p>

              {/* Examples */}
              {(selectedProblem.examples || []).map((example, i) => (
                <div key={i} className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">Example {i + 1}:</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Input:</span> {example.input}</p>
                    <p><span className="text-gray-500">Output:</span> {example.output}</p>
                    {example.explanation && (
                      <p><span className="text-gray-500">Explanation:</span> {example.explanation}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Constraints */}
              {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-gray-900 mb-2">Constraints:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {selectedProblem.constraints.map((constraint, i) => (
                      <li key={i}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              {selectedProblem.hints && selectedProblem.hints.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="font-medium text-amber-800 mb-2">Hints available:</p>
                  <p className="text-sm text-amber-700">
                    Using hints will cost {selectedProblem.hints[0]?.xpCost || 50} XP
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5 text-gray-600" />
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-sm font-medium bg-transparent focus:outline-none"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                {activeTab === 'mock' ? (
                  // LeetCode style: Run and Submit buttons for mock test
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={runMockTestCode}
                      disabled={isSubmitting}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50 border border-gray-300"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Run</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={submitMockTestSolution}
                      disabled={isSubmitting || !showingResults || !testResults?.canSubmit}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:bg-gray-300"
                    >
                      {isSubmitting && showingResults ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Submit</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Regular practice mode with Run Code feature
                  <div className="flex items-center space-x-2">
                    {/* Run Button - executes code */}
                    <button 
                      onClick={runCode}
                      disabled={isRunning}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50 border border-gray-300"
                    >
                      {isRunning ? (
                        <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Run</span>
                        </>
                      )}
                    </button>
                    
                    {/* Run Tests Button - runs against test cases */}
                    <button 
                      onClick={runCodeWithTests}
                      disabled={isRunning}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50 border border-blue-300"
                    >
                      {isRunning ? (
                        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Test</span>
                        </>
                      )}
                    </button>
                    
                    {/* Submit Button */}
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="btn-primary py-2 px-4 text-sm flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>Submit</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Editor */}
              <Editor
                height="400px"
                language={language}
                value={code}
                onChange={setCode}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
              
              {/* Show Console Button (when hidden) */}
              {!showConsole && (
                <button
                  onClick={() => setShowConsole(true)}
                  className="mt-4 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Show Console
                </button>
              )}
              
              {/* Console / Output Panel */}
              {showConsole && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
                  {/* Console Header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Console</span>
                      {isRunning && (
                        <span className="text-xs text-blue-600 animate-pulse">Running...</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Custom Input Toggle */}
                      <button
                        onClick={() => setShowConsole(!showConsole)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                  
                  {/* Custom Input */}
                  <div className="p-3 border-b border-gray-100">
                    <label className="text-xs text-gray-500 mb-1 block">Custom Input (stdin):</label>
                    <textarea
                      value={runStdin}
                      onChange={(e) => setRunStdin(e.target.value)}
                      placeholder="Enter input for your program..."
                      className="w-full h-16 p-2 text-sm font-mono bg-gray-50 rounded border border-gray-200 resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Output */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Output:</span>
                      {runOutput && (
                        <button
                          onClick={() => setRunOutput('')}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto font-mono text-sm ${
                      runError ? 'bg-red-50 border border-red-200' : 'bg-gray-900 text-green-400'
                    }`}>
                      {runError ? (
                        <div className="text-red-600">
                          <p className="font-semibold mb-1">Error:</p>
                          <pre className="whitespace-pre-wrap">{runError}</pre>
                        </div>
                      ) : runOutput ? (
                        <pre className="whitespace-pre-wrap">{runOutput}</pre>
                      ) : (
                        <span className="text-gray-500 italic">Click "Run" to see output...</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submission Result */}
            {submissionResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${
                  submissionResult.status === 'solved' ? 'bg-green-50 border border-green-200' :
                  submissionResult.status === 'attempted' ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center space-x-2 mb-3">
                  {submissionResult.status === 'solved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Zap className="w-5 h-5 text-amber-600" />
                  )}
                  <span className={`font-semibold ${
                    submissionResult.status === 'solved' ? 'text-green-800' :
                    submissionResult.status === 'attempted' ? 'text-amber-800' :
                    'text-red-800'
                  }`}>
                    {submissionResult.status === 'solved' ? 'Accepted!' :
                     submissionResult.status === 'attempted' ? 'Partially Correct' :
                     'Not Quite Right'}
                  </span>
                  {submissionResult.xpEarned > 0 && (
                    <span className="ml-auto text-sm font-medium text-green-600">
                      +{submissionResult.xpEarned} XP
                    </span>
                  )}
                </div>

                {/* Test Results */}
                {submissionResult.testResults && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Tests passed: {submissionResult.testResults.passed} / {submissionResult.testResults.total}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(submissionResult.testResults.passed / submissionResult.testResults.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* AI Feedback */}
                {submissionResult.aiFeedback && (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Time Complexity:</span> {submissionResult.aiFeedback.timeComplexity}</p>
                    <p><span className="font-medium">Space Complexity:</span> {submissionResult.aiFeedback.spaceComplexity}</p>
                    {submissionResult.aiFeedback.suggestions?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Suggestions:</p>
                        <ul className="list-disc list-inside text-gray-600">
                          {submissionResult.aiFeedback.suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Mock Test Results Display */}
            {activeTab === 'mock' && showingResults && testResults && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl border-2 ${
                  testResults.testResults?.passed === testResults.testResults?.total
                    ? 'bg-green-50 border-green-300' 
                    : testResults.testResults?.passed > 0
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {testResults.testResults?.passed === testResults.testResults?.total ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : testResults.testResults?.passed > 0 ? (
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <X className="w-6 h-6 text-red-600" />
                    )}
                    <span className={`font-bold text-lg ${
                      testResults.testResults?.passed === testResults.testResults?.total
                        ? 'text-green-800'
                        : testResults.testResults?.passed > 0
                          ? 'text-amber-800'
                          : 'text-red-800'
                    }`}>
                      {testResults.testResults?.passed === testResults.testResults?.total
                        ? 'All Tests Passed!' 
                        : `${testResults.testResults?.passed || 0}/${testResults.testResults?.total || 0} Tests Passed`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${
                      (testResults.evaluation?.score || 0) >= 7 ? 'text-green-600' :
                      (testResults.evaluation?.score || 0) >= 4 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {testResults.evaluation?.score || 0}/10
                    </span>
                    <p className="text-xs text-gray-500">
                      Score
                    </p>
                  </div>
                </div>

                {/* Test Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Test Progress</span>
                    <span className={`font-medium ${
                      testResults.testResults?.passed === testResults.testResults?.total 
                        ? 'text-green-600' 
                        : 'text-amber-600'
                    }`}>
                      {testResults.testResults?.passed || 0}/{testResults.testResults?.total || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        testResults.testResults?.passed === testResults.testResults?.total
                          ? 'bg-green-500'
                          : testResults.testResults?.passed > 0
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${((testResults.testResults?.passed || 0) / (testResults.testResults?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* LeetCode Style Test Results */}
                {testResults.testResults?.details && testResults.testResults.details.length > 0 && (
                  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                    {/* Header with overall status */}
                    <div className={`px-4 py-3 border-b ${
                      testResults.allPassed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {testResults.allPassed ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-bold text-green-700">Accepted</span>
                            </>
                          ) : (
                            <>
                              <X className="w-5 h-5 text-red-600" />
                              <span className="font-bold text-red-700">Wrong Answer</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Runtime: {testResults.testResults.executionTime?.toFixed(0) || 0} ms
                        </div>
                      </div>
                    </div>
                    
                    {/* Test Case Tabs */}
                    <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
                      {testResults.testResults.details.map((test, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTestCase(i)}
                          className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors min-w-fit ${
                            selectedTestCase === i
                              ? test.passed
                                ? 'bg-white border-t-2 border-green-500 text-green-600'
                                : 'bg-white border-t-2 border-red-500 text-red-600'
                              : test.passed
                                ? 'text-gray-600 hover:bg-gray-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {test.passed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span>Case {i + 1}</span>
                          {!test.passed && selectedTestCase !== i && (
                            <span className="ml-1 text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded">!</span>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Selected Test Case Details */}
                    {(() => {
                      const test = testResults.testResults.details[selectedTestCase];
                      if (!test) return null;
                      
                      // Get all failed tests
                      const failedTests = testResults.testResults.details.filter(t => !t.passed);
                      
                      return (
                        <div className="p-4 space-y-4">
                          {/* Status Badge */}
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              test.passed 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {test.passed ? '✓ Accepted' : '✗ Wrong Answer'}
                            </span>
                            {test.error && (
                              <span className="text-sm text-red-600">{test.error}</span>
                            )}
                          </div>
                          
                          {/* Input */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Input</p>
                            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-800 border border-gray-200">
                              <pre className="whitespace-pre-wrap">{test.input}</pre>
                            </div>
                          </div>
                          
                          {/* Your Output */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Output</p>
                            <div className={`rounded-lg p-3 font-mono text-sm border ${
                              test.passed 
                                ? 'bg-gray-50 text-gray-800 border-gray-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              <pre className="whitespace-pre-wrap">{test.actualOutput}</pre>
                            </div>
                          </div>
                          
                          {/* Expected Output */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expected</p>
                            <div className="bg-green-50 rounded-lg p-3 font-mono text-sm text-green-800 border border-green-200">
                              <pre className="whitespace-pre-wrap">{test.expectedOutput}</pre>
                            </div>
                          </div>
                          
                          {/* Diff View for failed tests */}
                          {!test.passed && (
                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-sm text-amber-800">
                                <span className="font-semibold">💡 Tip:</span> Your output differs from expected. 
                                Check the logic for handling &quot;{test.input}&quot;
                              </p>
                            </div>
                          )}
                          
                          {/* All Failed Tests Summary */}
                          {failedTests.length > 0 && (
                            <div className="mt-6 border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center">
                                <X className="w-4 h-4 mr-1" />
                                Failed Tests Summary ({failedTests.length})
                              </h4>
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {failedTests.map((failedTest, idx) => (
                                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-red-800">Case {failedTest.testCase}</span>
                                      <button 
                                        onClick={() => setSelectedTestCase(failedTest.testCase - 1)}
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        View Details →
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="text-gray-500">Input:</span>
                                        <code className="block text-gray-700 truncate">{failedTest.input}</code>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Expected:</span>
                                        <code className="block text-green-700">{failedTest.expectedOutput}</code>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-gray-500">Your Output:</span>
                                        <code className="block text-red-700">{failedTest.actualOutput}</code>
                                      </div>
                                    </div>
                                    {failedTest.error && (
                                      <p className="mt-2 text-xs text-red-600">{failedTest.error}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* AI Feedback */}
                {testResults.evaluation?.feedback && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 mb-3">
                      <span className="font-medium text-gray-900">AI Analysis:</span> {testResults.evaluation.feedback}
                    </p>
                    
                    {/* Suggestions */}
                    {testResults.evaluation?.suggestions && testResults.evaluation.suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggestions:</p>
                        <ul className="space-y-1">
                          {testResults.evaluation.suggestions.map((suggestion, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start space-x-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Complexity Analysis */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Time Complexity</p>
                    <p className={`font-semibold ${
                      testResults.evaluation?.timeComplexity === 'Unknown' 
                        ? 'text-gray-500' 
                        : 'text-blue-600'
                    }`}>
                      {testResults.evaluation?.timeComplexity || 'Analyzing...'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Space Complexity</p>
                    <p className={`font-semibold ${
                      testResults.evaluation?.spaceComplexity === 'Unknown' 
                        ? 'text-gray-500' 
                        : 'text-purple-600'
                    }`}>
                      {testResults.evaluation?.spaceComplexity || 'Analyzing...'}
                    </p>
                  </div>
                </div>

                {/* Status Message */}
                <div className={`p-3 rounded-lg text-center font-medium ${
                  testResults.allPassed 
                    ? 'bg-green-100 text-green-800' 
                    : testResults.canSubmit
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.allPassed 
                    ? '✅ All tests passed! Click Submit to continue to next problem.'
                    : testResults.canSubmit
                      ? '⚠️ Some tests failed. You can still submit or fix and Run again.'
                      : '❌ No tests passed. Fix your code and Run again.'}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Mock Test Configuration Modal */}
      {showMockTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Coding Mock Test</h2>
                  <p className="text-sm text-gray-500">AI-generated problems based on your level</p>
                </div>
              </div>
              <button onClick={() => setShowMockTestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                <select
                  value={mockTestConfig.difficulty}
                  onChange={(e) => setMockTestConfig(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="easy">Easy - Beginner friendly</option>
                  <option value="medium">Medium - Intermediate level</option>
                  <option value="hard">Hard - Advanced level</option>
                  <option value="adaptive">Adaptive - Adjusts to your level</option>
                </select>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Problems</label>
                <div className="flex space-x-2">
                  {[2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setMockTestConfig(prev => ({ ...prev, questionCount: num }))}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        mockTestConfig.questionCount === num
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Focus</label>
                <select
                  value={mockTestConfig.companyMode}
                  onChange={(e) => setMockTestConfig(prev => ({ ...prev, companyMode: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="general">General (All Companies)</option>
                  <option value="Google">Google - Algorithm heavy</option>
                  <option value="Amazon">Amazon - System design focus</option>
                  <option value="Facebook">Facebook - Clean code focus</option>
                  <option value="Microsoft">Microsoft - Robust solutions</option>
                  <option value="Apple">Apple - Memory efficiency</option>
                </select>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time per Problem</label>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{mockTestConfig.timeLimit} minutes each</span>
                </div>
              </div>
            </div>

            <button
              onClick={startMockTest}
              disabled={mockTestLoading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {mockTestLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Start Mock Test</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}

      {/* Mock Test Results Modal */}
      {mockTestResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Test Completed!</h2>
              <p className="text-gray-500">Here&apos;s how you performed</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{mockTestResults.finalScore}/10</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{mockTestResults.passedCount}/{mockTestResults.totalProblems}</p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">+{mockTestResults.xpEarned}</p>
                <p className="text-sm text-gray-600">XP Earned</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-900">Problem Breakdown:</h3>
              {mockTestResults.detailedResults?.map((result, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{result.problem}</p>
                    <p className="text-xs text-gray-500">{result.timeComplexity} | {result.spaceComplexity}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.score >= 7 ? 'bg-green-100 text-green-700' :
                    result.score >= 4 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.score}/10
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={closeMockTestResults}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Continue Practice
            </button>
          </motion.div>
        </div>
      )}

      {/* Mock Test Timer Banner */}
      {activeTab === 'mock' && mockTestSession && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg z-40 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5" />
            <span className="font-mono text-xl font-bold">{formatTime(timeRemaining)}</span>
          </div>
          <div className="h-6 w-px bg-white/30" />
          <div className="text-sm">
            Problem {mockTestSession.currentIndex} of {mockTestSession.total}
          </div>
          <div className="h-6 w-px bg-white/30" />
          <div className="text-sm font-medium">
            {mockTestSession.testInfo?.difficulty === 'adaptive' ? 'Adaptive' : mockTestSession.testInfo?.difficulty} | {mockTestSession.testInfo?.companyMode}
          </div>
        </div>
      )}
    </div>
  )
}

export default CodingPage
