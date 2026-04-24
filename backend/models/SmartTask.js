const mongoose = require('mongoose');

// Resource schema for curated learning materials
const resourceSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['video', 'article', 'documentation', 'course', 'book', 'podcast'],
    required: true 
  },
  title: { type: String, required: true },
  url: { type: String, required: true },
  source: { type: String, required: true }, // YouTube, Medium, GeeksforGeeks, etc.
  duration: { type: String }, // "15 mins", "2 hours"
  quality: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  thumbnail: { type: String }, // For videos
  description: { type: String },
  isFree: { type: Boolean, default: true }
});

// Practice problem schema
const problemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    required: true 
  },
  platform: { 
    type: String, 
    enum: ['LeetCode', 'HackerRank', 'CodeChef', 'Codeforces', 'GeeksforGeeks'],
    required: true 
  },
  url: { type: String, required: true },
  hints: [{ type: String }],
  solution: { type: String }, // Optional solution link
  estimatedTime: { type: Number }, // Minutes
  topic: { type: String },
  isPremium: { type: Boolean, default: false }
});

// Quiz question schema
const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index of correct option
  explanation: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
});

// Quiz schema
const quizSchema = new mongoose.Schema({
  questions: [quizQuestionSchema],
  passingScore: { type: Number, default: 70 }, // Percentage
  timeLimit: { type: Number, default: 15 }, // Minutes
  maxAttempts: { type: Number, default: 3 }
});

// User progress for a task
const taskProgressSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['locked', 'available', 'in_progress', 'completed', 'skipped'],
    default: 'available'
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0 }, // Minutes
  quizScore: { type: Number }, // Percentage
  quizAttempts: { type: Number, default: 0 },
  problemsSolved: [{ type: String }], // Problem IDs
  resourcesViewed: [{ type: String }], // Resource indices
  notes: { type: String },
  feedback: { type: String } // User feedback on task
}, { _id: false });

// Main SmartTask schema
const smartTaskSchema = new mongoose.Schema({
  // Identification
  taskId: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  
  // Classification
  type: { 
    type: String, 
    enum: [
      'concept',      // Learn a concept
      'coding',       // Practice coding
      'quiz',         // Take quiz
      'project',      // Build project
      'revision',     // Revise topic
      'interview',    // Interview prep
      'mock_test',    // Mock test
      'video_lecture' // Watch video
    ],
    required: true 
  },
  category: { 
    type: String, 
    enum: [
      'dsa', 'system_design', 'dbms', 'os', 'networking', 
      'oops', 'java', 'python', 'javascript', 'aptitude',
      'hr', 'project_management', 'devops'
    ],
    required: true 
  },
  
  // Difficulty progression
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true 
  },
  difficultyScore: { type: Number, min: 1, max: 10 }, // 1-10 scale
  
  // Dependencies for skill tree
  prerequisites: [{ type: String }], // Task IDs that must be completed first
  unlocks: [{ type: String }], // Task IDs unlocked after completion
  
  // Content
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: {
    explanation: { type: String, required: true },
    keyPoints: [{ type: String }],
    codeExample: { type: String },
    visualDiagram: { type: String }, // URL to diagram/image
    cheatSheet: [{ type: String }]
  },
  
  // Learning resources
  resources: [resourceSchema],
  
  // Practice problems
  problems: [problemSchema],
  
  // Quiz
  quiz: quizSchema,
  
  // Estimated time
  estimatedTime: { type: Number, required: true }, // Minutes
  
  // Gamification
  xpReward: { type: Number, default: 50 },
  badges: [{ type: String }],
  streakBonus: { type: Boolean, default: false },
  
  // Meta
  createdBy: { type: String, default: 'AI' }, // AI or manual
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  
  // For deduplication
  topicHash: { type: String }, // Hash of topic + difficulty for duplicate detection
  
  // User-specific progress (embedded for performance)
  progress: {
    type: Map,
    of: taskProgressSchema,
    default: new Map()
  }
}, {
  timestamps: true
});

// Indexes for performance
smartTaskSchema.index({ taskId: 1 });
smartTaskSchema.index({ category: 1, difficulty: 1 });
smartTaskSchema.index({ topicHash: 1 });
smartTaskSchema.index({ 'prerequisites': 1 });
smartTaskSchema.index({ 'unlocks': 1 });

// Static methods
smartTaskSchema.statics.findByCategory = function(category, difficulty) {
  return this.find({ category, difficulty, isActive: true }).sort({ difficultyScore: 1 });
};

smartTaskSchema.statics.findAvailableTasks = function(userId, completedTasks) {
  return this.find({
    taskId: { $nin: completedTasks },
    prerequisites: { $not: { $elemMatch: { $nin: completedTasks } } },
    isActive: true
  });
};

smartTaskSchema.statics.checkDuplicate = async function(topic, difficulty, type) {
  const hash = require('crypto')
    .createHash('md5')
    .update(`${topic}-${difficulty}-${type}`)
    .digest('hex');
  
  return this.findOne({ topicHash: hash });
};

module.exports = mongoose.model('SmartTask', smartTaskSchema);
