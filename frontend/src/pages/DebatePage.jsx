import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Sparkles, RotateCcw, Trophy, Lightbulb } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const debateTopics = [
  { id: 'normalization', topic: 'Is database normalization always beneficial?', category: 'Database' },
  { id: 'microservices', topic: 'Are microservices always better than monoliths?', category: 'Architecture' },
  { id: 'typescript', topic: 'Should all JavaScript projects use TypeScript?', category: 'Language' },
  { id: 'rest-graphql', topic: 'Will GraphQL completely replace REST APIs?', category: 'APIs' },
  { id: 'ai-coding', topic: 'Will AI replace human programmers?', category: 'Future Tech' },
  { id: 'cloud', topic: 'Is multi-cloud always better than single cloud?', category: 'Cloud' },
]

function DebatePage() {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [messages, setMessages] = useState([])
  const [userArgument, setUserArgument] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [round, setRound] = useState(1)
  const [debateScore, setDebateScore] = useState(0)

  const startDebate = async (topic) => {
    setSelectedTopic(topic)
    setMessages([{
      role: 'ai',
      content: `Let's debate: "${topic.topic}"\n\nI'll challenge your arguments. What's your position on this topic?`,
      round: 1
    }])
    setRound(1)
    setDebateScore(0)
    setUserArgument('')
  }

  const submitArgument = async () => {
    if (!userArgument.trim()) return

    const userMessage = { role: 'user', content: userArgument, round }
    setMessages([...messages, userMessage])
    setIsLoading(true)

    try {
      const history = messages.map(m => `${m.role}: ${m.content}`).join('\n')
      const response = await axios.post('/api/interview/debate', {
        topic: selectedTopic.topic,
        userArgument: userArgument,
        round,
        history
      })

      const aiMessage = {
        role: 'ai',
        content: response.data.response,
        round: round + 1,
        followUp: response.data.followUpQuestion
      }

      setMessages(prev => [...prev, aiMessage])
      setDebateScore(prev => Math.max(prev, response.data.debateScore || 0))
      setRound(prev => prev + 1)
      setUserArgument('')
    } catch (error) {
      toast.error('Failed to get AI response')
    } finally {
      setIsLoading(false)
    }
  }

  const resetDebate = () => {
    setSelectedTopic(null)
    setMessages([])
    setUserArgument('')
    setRound(1)
    setDebateScore(0)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Debate Mode</h1>
        <p className="text-gray-600">Challenge yourself with intellectual debates on technical topics. The AI will test your reasoning and argumentation skills.</p>
      </motion.div>

      {!selectedTopic ? (
        /* Topic Selection */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-4">
          {debateTopics.map((topic, index) => (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => startDebate(topic)}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-left card-hover"
            >
              <span className="inline-block px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-xs font-medium mb-3">
                {topic.category}
              </span>
              <h3 className="font-semibold text-gray-900">{topic.topic}</h3>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        /* Debate Interface */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Current Topic</p>
              <h2 className="font-semibold text-gray-900">{selectedTopic.topic}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Round</p>
                <p className="text-xl font-bold text-primary-600">{round}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Score</p>
                <p className="text-xl font-bold text-secondary-600">{debateScore}/10</p>
              </div>
              <button 
                onClick={resetDebate}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user' 
                        ? 'bg-primary-500 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}>
                      {message.role === 'ai' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-gray-500">AI Debater</span>
                        </div>
                      )}
                      <p className="leading-relaxed">{message.content}</p>
                      {message.followUp && (
                        <div className="mt-3 p-3 bg-white/50 rounded-lg">
                          <p className="text-sm font-medium flex items-center">
                            <Lightbulb className="w-4 h-4 mr-1" />
                            Follow-up: {message.followUp}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-none p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex space-x-3">
                <textarea
                  value={userArgument}
                  onChange={(e) => setUserArgument(e.target.value)}
                  placeholder="Present your argument..."
                  className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitArgument()
                    }
                  }}
                />
                <button
                  onClick={submitArgument}
                  disabled={!userArgument.trim() || isLoading}
                  className="btn-primary px-4 flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Debate Tips
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Support your arguments with examples and evidence</li>
              <li>• Consider trade-offs and edge cases</li>
              <li>• Acknowledge counter-arguments and address them</li>
              <li>• Stay concise but thorough in your reasoning</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default DebatePage
