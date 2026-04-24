import { create } from 'zustand'
import axios from 'axios'

const useAppStore = create((set, get) => ({
  // Dashboard data
  dashboardData: null,
  isLoadingDashboard: false,

  // Interview state
  currentInterview: null,
  currentQuestion: null,
  interviewHistory: [],
  isInterviewLoading: false,

  // Resume state
  resumeAnalysis: null,
  isResumeLoading: false,

  // Roadmap state
  currentRoadmap: null,
  isRoadmapLoading: false,

  // Coding state
  codingProblems: [],
  currentProblem: null,
  codingHistory: [],
  isCodingLoading: false,

  // Feedback state
  feedbackData: null,
  feedbackHistory: [],
  isFeedbackLoading: false,

  // Gamification state
  gamificationStatus: null,
  leaderboard: [],
  isGamificationLoading: false,

  // Actions
  fetchDashboard: async () => {
    set({ isLoadingDashboard: true })
    try {
      const response = await axios.get('/analytics/dashboard')
      set({ dashboardData: response.data.dashboard, isLoadingDashboard: false })
      return response.data.dashboard
    } catch (error) {
      set({ isLoadingDashboard: false })
      throw error
    }
  },

  // Resume actions
  uploadResume: async (file) => {
    set({ isResumeLoading: true })
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const response = await axios.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      set({ resumeAnalysis: response.data.analysis, isResumeLoading: false })
      return response.data
    } catch (error) {
      set({ isResumeLoading: false })
      throw error
    }
  },

  fetchResumeAnalysis: async () => {
    set({ isResumeLoading: true })
    try {
      const response = await axios.get('/resume/analysis')
      set({ resumeAnalysis: response.data.analysis, isResumeLoading: false })
      return response.data
    } catch (error) {
      set({ isResumeLoading: false })
      throw error
    }
  },

  // Interview actions
  startInterview: async (config) => {
    set({ isInterviewLoading: true })
    try {
      const response = await axios.post('/interview/start', config)
      set({ 
        currentInterview: response.data, 
        currentQuestion: response.data.question,
        isInterviewLoading: false 
      })
      return response.data
    } catch (error) {
      set({ isInterviewLoading: false })
      throw error
    }
  },

  submitAnswer: async (interviewId, questionId, answer, timeTaken) => {
    try {
      const response = await axios.post('/interview/answer', {
        interviewId,
        questionId,
        answer,
        timeTaken
      })
      
      if (response.data.completed) {
        set({ 
          currentInterview: null, 
          currentQuestion: null 
        })
      } else {
        set({ currentQuestion: response.data.nextQuestion })
      }
      
      return response.data
    } catch (error) {
      throw error
    }
  },

  fetchInterviewHistory: async () => {
    try {
      const response = await axios.get('/interview/history/all')
      set({ interviewHistory: response.data })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Feedback actions
  fetchFeedback: async (interviewId) => {
    set({ isFeedbackLoading: true })
    try {
      const response = await axios.get(`/feedback/${interviewId}`)
      set({ feedbackData: response.data, isFeedbackLoading: false })
      return response.data
    } catch (error) {
      set({ isFeedbackLoading: false })
      throw error
    }
  },

  fetchFeedbackHistory: async () => {
    try {
      const response = await axios.get('/feedback/history/all')
      set({ feedbackHistory: response.data })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Roadmap actions
  generateRoadmap: async (targetRole, timeline) => {
    set({ isRoadmapLoading: true })
    try {
      const response = await axios.post('/roadmap/generate', {
        targetRole,
        timeline
      })
      set({ currentRoadmap: response.data.roadmap, isRoadmapLoading: false })
      return response.data
    } catch (error) {
      set({ isRoadmapLoading: false })
      throw error
    }
  },

  fetchCurrentRoadmap: async () => {
    set({ isRoadmapLoading: true })
    try {
      const response = await axios.get('/roadmap/current')
      set({ currentRoadmap: response.data, isRoadmapLoading: false })
      return response.data
    } catch (error) {
      // If 404, set currentRoadmap to null explicitly
      if (error.response?.status === 404) {
        set({ currentRoadmap: null, isRoadmapLoading: false })
        return null
      }
      set({ isRoadmapLoading: false })
      throw error
    }
  },

  completeTask: async (roadmapId, dayNumber, taskIndex) => {
    try {
      const response = await axios.post('/roadmap/task/complete', {
        roadmapId,
        dayNumber,
        taskIndex
      })
      // Refresh roadmap after completion
      const currentRoadmap = get().currentRoadmap
      if (currentRoadmap && currentRoadmap._id === roadmapId) {
        await get().fetchCurrentRoadmap()
      }
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Coding actions
  fetchCodingProblems: async (filters = {}) => {
    set({ isCodingLoading: true })
    try {
      const params = new URLSearchParams(filters)
      const response = await axios.get(`/coding/problems?${params}`)
      set({ codingProblems: response.data, isCodingLoading: false })
      return response.data
    } catch (error) {
      set({ isCodingLoading: false })
      throw error
    }
  },

  fetchProblem: async (problemId) => {
    try {
      const response = await axios.get(`/coding/problems/${problemId}`)
      set({ currentProblem: response.data })
      return response.data
    } catch (error) {
      throw error
    }
  },

  submitCodingSolution: async (problemId, code, language) => {
    try {
      const response = await axios.post('/coding/submit', {
        problemId,
        code,
        language
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Gamification actions
  fetchGamificationStatus: async () => {
    set({ isGamificationLoading: true })
    try {
      const response = await axios.get('/gamification/status')
      set({ gamificationStatus: response.data, isGamificationLoading: false })
      return response.data
    } catch (error) {
      set({ isGamificationLoading: false })
      throw error
    }
  },

  fetchLeaderboard: async (timeframe = 'all') => {
    try {
      const response = await axios.get(`/gamification/leaderboard?timeframe=${timeframe}`)
      set({ leaderboard: response.data })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Reset states
  resetInterview: () => set({ currentInterview: null, currentQuestion: null }),
  clearResumeAnalysis: () => set({ resumeAnalysis: null }),
  clearFeedback: () => set({ feedbackData: null })
}))

export default useAppStore
