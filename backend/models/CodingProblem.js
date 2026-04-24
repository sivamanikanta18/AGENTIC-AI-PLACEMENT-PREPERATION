const mongoose = require('mongoose');

const codingProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  category: {
    type: String,
    enum: ['arrays', 'strings', 'linked_list', 'trees', 'graphs', 'dynamic_programming', 'sorting', 'searching', 'recursion', 'backtracking', 'greedy', 'hash_table', 'heap', 'stack', 'queue', 'math', 'bit_manipulation', 'system_design'],
    required: true
  },
  tags: [String],
  companyTags: [String],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: { type: Boolean, default: false }
  }],
  hints: [{
    order: Number,
    content: String,
    xpCost: { type: Number, default: 0 }
  }],
  solution: {
    approach: String,
    timeComplexity: String,
    spaceComplexity: String,
    code: {
      javascript: String,
      python: String,
      java: String,
      cpp: String
    }
  },
  optimalApproaches: [String],
  commonMistakes: [String],
  interviewFrequency: {
    faang: { type: Number, min: 0, max: 10 },
    service: { type: Number, min: 0, max: 10 },
    startup: { type: Number, min: 0, max: 10 }
  },
  // Source tracking
  source: {
    type: String,
    enum: ['comprehensive-set', 'ai-generated', 'ai-generated-mock', 'user-created'],
    default: 'comprehensive-set'
  },
  generatedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  topicInfo: {
    name: String,
    sno: Number,
    recommendedDays: Number
  },
  isMockTest: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  leetcodeId: String,
  leetcodeUrl: String
}, {
  timestamps: true
});

// User attempts
const codingAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingProblem',
    required: true
  },
  code: String,
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp']
  },
  status: {
    type: String,
    enum: ['attempted', 'solved', 'failed', 'submitted'],
    default: 'attempted'
  },
  results: {
    passed: Number,
    failed: Number,
    total: Number,
    executionTime: Number,
    memoryUsed: Number
  },
  hintsUsed: Number,
  timeSpent: Number, // in seconds
  submissions: [{
    code: String,
    status: String,
    timestamp: Date
  }],
  feedback: {
    timeComplexity: String,
    spaceComplexity: String,
    codeQuality: Number,
    optimizationLevel: Number,
    suggestions: [String],
    overallScore: Number,
    correctness: Number
  },
  xpEarned: { type: Number, default: 0 },
  // Mock test tracking
  isMockTest: { type: Boolean, default: false },
  mockTestSessionId: String,
  difficulty: String // for mock test level tracking
}, {
  timestamps: true
});

module.exports = {
  CodingProblem: mongoose.model('CodingProblem', codingProblemSchema),
  CodingAttempt: mongoose.model('CodingAttempt', codingAttemptSchema)
};
