import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Brain, 
  Target, 
  TrendingUp, 
  Award, 
  MessageCircle,
  ChevronRight,
  Star,
  FileText,
  Map
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Resume Analysis',
    description: 'Upload your resume and get instant AI analysis of your skills, gaps, and improvement areas.'
  },
  {
    icon: MessageCircle,
    title: 'Adaptive Mock Interviews',
    description: 'Experience real interview scenarios with AI that adapts to your skill level and responses.'
  },
  {
    icon: Target,
    title: 'Personalized Roadmaps',
    description: 'Get AI-generated study plans tailored to your goals, timeline, and current skill level.'
  },
  {
    icon: TrendingUp,
    title: 'Multi-Dimensional Feedback',
    description: 'Receive detailed feedback on confidence, clarity, technical accuracy, and communication.'
  },
  {
    icon: Award,
    title: 'Gamified Learning',
    description: 'Earn XP, unlock badges, and compete on leaderboards as you improve your skills.'
  },
  {
    icon: Zap,
    title: 'Real-Time Pressure Simulation',
    description: 'Practice with countdown timers, AI interruptions, and time-limited responses.'
  }
]

const stats = [
  { value: '50K+', label: 'Students Helped' },
  { value: '95%', label: 'Success Rate' },
  { value: '100K+', label: 'Mock Interviews' },
  { value: '4.9/5', label: 'User Rating' }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer at Google',
    quote: 'PrepSense AI helped me identify my weak areas in system design. The personalized roadmap was a game-changer.',
    avatar: 'SC'
  },
  {
    name: 'Rahul Patel',
    role: 'Full Stack Developer',
    quote: 'The adaptive mock interviews felt incredibly real. The AI caught my hesitation patterns and helped me improve.',
    avatar: 'RP'
  },
  {
    name: 'Emily Rodriguez',
    role: 'New Graduate',
    quote: 'From 3 rejections to 5 offers! The resume analysis helped me fix issues I never knew existed.',
    avatar: 'ER'
  }
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">PrepSense AI</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
              <Link to="/register" className="btn-primary">Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
                <Star className="w-4 h-4 fill-current" />
                <span>Trusted by 50,000+ students</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Master Your Tech Interviews with <span className="gradient-text">AI-Powered Coaching</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Not just practice — a system that thinks like an interviewer, analyzes like a mentor, and guides like a coach.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                <Link to="/register" className="btn-primary flex items-center space-x-2 text-lg">
                  <span>Start Free Trial</span>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-100 to-secondary-100 p-8">
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                  <p className="text-gray-600">PrepSense AI Dashboard</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="text-center">
                <p className="text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-gray-600 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Ace Your Interviews</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and guidance you need to prepare effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Your Journey to Interview Success</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Upload Resume', desc: 'AI analyzes your skills and gaps' },
              { step: 2, title: 'Start Interview', desc: 'Adaptive AI conducts mock interviews' },
              { step: 3, title: 'Get Feedback', desc: 'Multi-dimensional performance insights' },
              { step: 4, title: 'Follow Roadmap', desc: 'Personalized improvement plan' }
            ].map((item, index) => (
              <motion.div key={item.step} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.2 }} viewport={{ once: true }} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={testimonial.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-1 text-amber-400 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Interview Performance?</h2>
          <p className="text-xl text-gray-600 mb-8">Join 50,000+ students who have landed their dream jobs with PrepSense AI.</p>
          <Link to="/register" className="btn-primary text-lg inline-flex items-center space-x-2">
            <span>Get Started For Free</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">PrepSense AI</span>
            </div>
            <p className="text-gray-400 text-sm">2024 PrepSense AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
