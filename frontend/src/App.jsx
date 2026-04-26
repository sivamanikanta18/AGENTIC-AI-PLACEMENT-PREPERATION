import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ResumeUploadPage from './pages/ResumeUploadPage'
import InterviewPage from './pages/InterviewPage'
import InterviewConfigPage from './pages/InterviewConfigPage'
import FeedbackPage from './pages/FeedbackPage'
import CodingPage from './pages/CodingPage'
import RoadmapPage from './pages/RoadmapPage'
import GamificationPage from './pages/GamificationPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DebatePage from './pages/DebatePage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const { isAuthenticated, refreshUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser()
    }
  }, [isAuthenticated, refreshUser])

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />

        {/* Protected Routes */}
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resume" element={<ResumeUploadPage />} />
          <Route path="/interview" element={<InterviewConfigPage />} />
          <Route path="/interview/session" element={<InterviewPage />} />
          <Route path="/feedback/:interviewId" element={<FeedbackPage />} />
          <Route path="/coding" element={<CodingPage />} />
          <Route path="/coding/:problemId" element={<CodingPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/debate" element={<DebatePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
