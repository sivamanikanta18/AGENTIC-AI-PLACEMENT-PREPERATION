const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedFrom: {
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
    feedbackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
    resumeAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }
  },
  // Target information
  target: {
    role: String,
    companies: [String],
    timeline: String, // e.g., "3 months"
    focusAreas: [String]
  },
  // Daily/Weekly schedule
  schedule: {
    startDate: Date,
    endDate: Date,
    dailyPlan: [{
      day: Number,
      date: Date,
      focus: String,
      tasks: [{
        type: { type: String, enum: ['learning', 'practice', 'interview', 'coding', 'revision', 'rest'] },
        title: String,
        description: String,
        duration: Number, // in minutes
        resources: [{
          type: { type: String, enum: ['video', 'article', 'problem', 'mock', 'documentation'] },
          title: String,
          url: String
        }],
        completed: { type: Boolean, default: false },
        completedAt: Date
      }],
      skills: [String],
      estimatedXP: { type: Number, default: 0 }
    }]
  },
  // Skill progression path
  skillPath: [{
    skill: String,
    currentLevel: { type: String, enum: ['none', 'beginner', 'intermediate', 'advanced'] },
    targetLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    resources: [String],
    practiceProblems: [String],
    estimatedDays: Number
  }],
  // Milestones
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    criteria: [String],
    completed: { type: Boolean, default: false },
    completedAt: Date,
    xpReward: Number
  }],
  // Progress tracking
  progress: {
    overallCompletion: { type: Number, default: 0, min: 0, max: 100 },
    daysCompleted: { type: Number, default: 0 },
    totalDays: Number,
    streakDays: { type: Number, default: 0 },
    lastActive: Date
  },
  // Adaptive adjustments
  adjustments: [{
    date: Date,
    reason: String,
    changes: String,
    triggeredBy: String
  }],
  // AI insights
  aiInsights: {
    reasoning: String,
    difficultyAssessment: String,
    successProbability: { type: Number, min: 0, max: 100 },
    alternativePaths: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
