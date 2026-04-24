import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Clock, Send, AlertCircle, Pause, Play, X, ChevronRight, Sparkles, Volume2, VolumeX, MicOff } from 'lucide-react'
import useAppStore from '../store/appStore'
import toast from 'react-hot-toast'

function InterviewPage() {
  const navigate = useNavigate()
  const { currentInterview, currentQuestion, submitAnswer, resetInterview } = useAppStore()
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(120)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [interruption, setInterruption] = useState(null)
  const [questionHistory, setQuestionHistory] = useState([])
  const timerRef = useRef(null)
  const textareaRef = useRef(null)
  
  // Voice Assistant States
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)

  useEffect(() => {
    if (!currentInterview || !currentQuestion) {
      navigate('/interview')
      return
    }

    setTimeLeft(currentQuestion.timeLimit || 120)
    setAnswer('')
    setFeedback(null)
    setShowFeedback(false)
    setInterruption(null)
  }, [currentInterview, currentQuestion, navigate])

  useEffect(() => {
    if (!isPaused && timeLeft > 0 && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(timerRef.current)
  }, [isPaused, isSubmitting])

  // Simulate AI interruption
  useEffect(() => {
    if (currentInterview?.pressureSettings?.interruptionsEnabled && timeLeft < currentQuestion?.timeLimit * 0.5 && !interruption) {
      const interruptions = [
        "Can you be more concise?",
        "Explain with a real example",
        "How is this better than alternatives?",
        "What's the time complexity?",
        "Can you simplify that explanation?"
      ]
      const randomInterruption = interruptions[Math.floor(Math.random() * interruptions.length)]
      
      if (Math.random() > 0.7) {
        setInterruption(randomInterruption)
        toast(randomInterruption, { icon: '💬', duration: 5000 })
        if (voiceEnabled) speakText(randomInterruption)
      }
    }
  }, [timeLeft, currentQuestion, currentInterview, interruption, voiceEnabled])

  // Initialize Voice Assistant
  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser. Use Chrome/Edge.')
      setVoiceEnabled(false)
      return
    }

    if (!('speechSynthesis' in window)) {
      toast.error('Speech synthesis not supported.')
      setVoiceEnabled(false)
      return
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setAnswer(prev => prev + ' ' + finalTranscript.trim())
        setTranscript('')
      } else {
        setTranscript(interimTranscript)
      }
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'no-speech') {
        toast.error(`Voice error: ${event.error}`)
      }
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Auto-speak question when it changes
  useEffect(() => {
    if (voiceEnabled && currentQuestion?.question && !showFeedback) {
      const timer = setTimeout(() => {
        speakText(currentQuestion.question)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentQuestion, voiceEnabled, showFeedback])

  // Text-to-Speech function
  const speakText = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha'))
    if (preferredVoice) utterance.voice = preferredVoice
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  // Start/Stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not available')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      toast.success('Voice input stopped')
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast.success('Listening... Speak your answer', { icon: '🎤' })
      } catch (error) {
        toast.error('Could not start voice recognition')
      }
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting) return

    setIsSubmitting(true)
    clearInterval(timerRef.current)

    const timeTaken = (currentQuestion?.timeLimit || 120) - timeLeft

    try {
      const result = await submitAnswer(
        currentInterview.interviewId,
        currentQuestion.id,
        answer,
        timeTaken
      )

      if (result.completed) {
        toast.success('Interview completed!')
        navigate(`/feedback/${currentInterview.interviewId}`)
      } else {
        setFeedback(result.feedback)
        setShowFeedback(true)
        setQuestionHistory([...questionHistory, {
          question: currentQuestion.question,
          answer,
          feedback: result.feedback
        }])
      }
    } catch (error) {
      toast.error('Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    setShowFeedback(false)
    setInterruption(null)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const total = currentQuestion?.timeLimit || 120
    const percentage = (timeLeft / total) * 100
    if (percentage > 50) return 'text-green-600'
    if (percentage > 25) return 'text-amber-600'
    return 'text-red-600'
  }

  if (!currentInterview || !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No active interview. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-4 py-2 bg-primary-50 rounded-full">
            <Mic className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700 capitalize">
              {currentInterview.type} Interview
            </span>
          </div>
          <span className="text-sm text-gray-500">
            Question {questionHistory.length + 1} of 8
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {currentInterview.pressureSettings?.timerEnabled && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-mono font-bold ${getTimerColor()} bg-gray-50`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          
          {/* Voice Toggle */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled)
              if (voiceEnabled) {
                window.speechSynthesis.cancel()
                setIsSpeaking(false)
              }
              toast(voiceEnabled ? 'Voice assistant disabled' : 'Voice assistant enabled')
            }}
            className={`p-2 rounded-lg transition-colors ${
              voiceEnabled 
                ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={voiceEnabled ? 'Voice ON - Click to disable' : 'Voice OFF - Click to enable'}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => {
              resetInterview()
              navigate('/interview')
            }}
            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div 
          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${((questionHistory.length + 1) / 8) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {!showFeedback ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            {/* Question Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium capitalize">
                  {currentQuestion.type} • {currentQuestion.difficulty}
                </span>
                {currentQuestion.category && (
                  <span className="text-sm text-gray-500">{currentQuestion.category}</span>
                )}
              </div>
              
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900 leading-relaxed flex-1">
                  {currentQuestion.question}
                </h2>
                <button
                  onClick={() => speakText(currentQuestion.question)}
                  disabled={isSpeaking || !voiceEnabled}
                  className={`ml-4 p-2 rounded-lg transition-colors flex-shrink-0 ${
                    isSpeaking 
                      ? 'bg-primary-100 text-primary-600 animate-pulse' 
                      : voiceEnabled
                        ? 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={voiceEnabled ? "Read question aloud" : "Voice disabled"}
                >
                  {isSpeaking ? <Volume2 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              {/* AI Interruption */}
              {interruption && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 font-medium">{interruption}</p>
                </motion.div>
              )}
            </div>

            {/* Answer Input */}
            <div className="p-6">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here... Or click the mic button to speak 🎤"
                  className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none pr-14"
                  disabled={isSubmitting || isPaused}
                />
                
                {/* Voice Input Button */}
                <button
                  onClick={toggleListening}
                  disabled={isSubmitting || isPaused || !voiceEnabled}
                  className={`absolute right-3 bottom-3 p-3 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-lg'
                      : voiceEnabled
                        ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Live Transcript */}
              {isListening && transcript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700"
                >
                  <span className="font-medium">Hearing:</span> {transcript}...
                </motion.div>
              )}
              
              {/* Voice Status */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center space-x-2 text-red-500"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-medium">Listening... Speak your answer</span>
                </motion.div>
              )}
              
              {/* Hints */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Hints (if you need them)
                  </p>
                  <ul className="space-y-1">
                    {currentQuestion.hints.map((hint, index) => (
                      <li key={index} className="text-sm text-gray-600 pl-4">
                        • {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || isSubmitting}
                className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI is evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Feedback Card */
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-secondary-50">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Feedback</h3>
              <p className="text-gray-600">Here is how you performed on this question</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall', value: feedback?.score, color: 'primary' },
                  { label: 'Confidence', value: feedback?.confidence, color: 'secondary' },
                  { label: 'Clarity', value: feedback?.clarity, color: 'green' },
                  { label: 'Technical', value: feedback?.technical_accuracy, color: 'amber' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">{item.value || 0}/10</p>
                    <p className="text-sm text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Issues & Suggestions */}
              {feedback?.issues && feedback.issues.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <h4 className="font-semibold text-red-800 mb-2">Areas to Improve</h4>
                  <ul className="space-y-1">
                    {feedback.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-700">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback?.suggestions && feedback.suggestions.length > 0 && (
                <div className="p-4 bg-green-50 rounded-xl">
                  <h4 className="font-semibold text-green-800 mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-green-700">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Response */}
              {feedback?.aiResponse && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">Interviewer Would Say</h4>
                  <p className="text-blue-700">{feedback.aiResponse}</p>
                </div>
              )}
            </div>

            {/* Next Button */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleNextQuestion}
                className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
              >
                <span>Next Question</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InterviewPage
