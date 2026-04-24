const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  // Multi-dimensional feedback
  dimensions: {
    confidence: {
      score: { type: Number, min: 0, max: 10 },
      details: String,
      improvements: [String]
    },
    clarity: {
      score: { type: Number, min: 0, max: 10 },
      details: String,
      improvements: [String]
    },
    technical: {
      score: { type: Number, min: 0, max: 10 },
      details: String,
      knowledgeGaps: [String],
      improvements: [String]
    },
    communication: {
      score: { type: Number, min: 0, max: 10 },
      fillerWords: {
        count: Number,
        words: [String]
      },
      pace: String,
      structure: String,
      improvements: [String]
    },
    problem_solving: {
      score: { type: Number, min: 0, max: 10 },
      approach: String,
      optimization: String,
      improvements: [String]
    }
  },
  // Communication analysis (voice)
  communicationAnalysis: {
    speakingSpeed: { type: Number, min: 0, max: 10 },
    hesitationCount: Number,
    toneAnalysis: String,
    articulation: String,
    voiceConfidence: Number
  },
  // Question-specific feedback
  questionFeedback: [{
    questionId: String,
    question: String,
    answer: String,
    scores: {
      relevance: Number,
      depth: Number,
      examples: Number
    },
    feedback: String,
    modelAnswer: String
  }],
  // Actionable insights
  actionItems: [{
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    category: String,
    description: String,
    resources: [String]
  }],
  // Comparative analysis
  comparison: {
    previousScore: Number,
    improvement: Number,
    trend: { type: String, enum: ['improving', 'declining', 'stable'] }
  },
  // AI-generated summary
  aiSummary: {
    overallAssessment: String,
    keyStrengths: [String],
    priorityAreas: [String],
    preparationTips: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
