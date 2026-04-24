const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['technical', 'hr', 'behavioral', 'mixed', 'coding', 'debate'],
    required: true
  },
  companyMode: {
    type: String,
    enum: ['faang', 'service_based', 'startup', 'general'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'adaptive'],
    default: 'adaptive'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'completed', 'abandoned'],
    default: 'pending'
  },
  // Resume-based context
  resumeContext: {
    skills: [String],
    projects: [String],
    experience: [String],
    weakAreas: [String]
  },
  // Interview flow
  questions: [{
    id: String,
    type: { type: String, enum: ['technical', 'hr', 'behavioral', 'coding', 'follow_up'] },
    question: String,
    category: String,
    difficulty: String,
    expectedAnswerPoints: [String],
    hints: [String],
    timeLimit: Number, // in seconds
    askedAt: Date,
    answer: {
      text: String,
      audioUrl: String,
      submittedAt: Date,
      timeTaken: Number // in seconds
    },
    feedback: {
      score: { type: Number, min: 0, max: 10 },
      confidence: Number,
      clarity: Number,
      technical_accuracy: Number,
      communication: Number,
      issues: [String],
      suggestions: [String],
      aiResponse: String
    }
  }],
  currentQuestionIndex: { type: Number, default: 0 },
  // Pressure simulation settings
  pressureSettings: {
    timerEnabled: { type: Boolean, default: true },
    interruptionsEnabled: { type: Boolean, default: true },
    strictMode: { type: Boolean, default: false }
  },
  // Real-time tracking
  interruptions: [{
    questionIndex: Number,
    type: String,
    message: String,
    timestamp: Date
  }],
  // Overall interview metrics
  metrics: {
    startTime: Date,
    endTime: Date,
    totalDuration: Number, // in seconds
    averageResponseTime: Number,
    confidenceTrend: [Number],
    difficultyProgression: [String]
  },
  // Final evaluation
  finalEvaluation: {
    overallScore: { type: Number, min: 0, max: 100 },
    technicalScore: Number,
    communicationScore: Number,
    confidenceScore: Number,
    strengths: [String],
    weaknesses: [String],
    summary: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
