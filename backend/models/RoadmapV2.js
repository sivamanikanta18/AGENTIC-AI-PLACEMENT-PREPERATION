const mongoose = require('mongoose');

// Adaptive adjustment history
const adjustmentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { 
    type: String, 
    enum: ['insert', 'remove', 'modify', 'reorder', 'difficulty_change'],
    required: true 
  },
  reason: { type: String, required: true },
  trigger: { 
    type: String, 
    enum: ['performance', 'missed_tasks', 'interview_feedback', 'resume_gap', 'user_request', 'time_based'],
    required: true 
  },
  details: {
    affectedDays: [{ type: Number }],
    affectedTopics: [{ type: String }],
    originalSchedule: mongoose.Schema.Types.Mixed,
    newSchedule: mongoose.Schema.Types.Mixed
  },
  aiConfidence: { type: Number, min: 0, max: 100 }
}, { _id: true });

// Task within a day
const dayTaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  smartTaskRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SmartTask' },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['locked', 'available', 'in_progress', 'completed', 'skipped', 'overdue'],
    default: 'available'
  },
  
  // Timing
  scheduledTime: { type: String }, // "09:00 AM"
  estimatedDuration: { type: Number }, // Minutes
  actualTimeSpent: { type: Number, default: 0 },
  
  // Completion tracking
  completedAt: { type: Date },
  score: { type: Number }, // Quiz or task score
  xpEarned: { type: Number, default: 0 },
  
  // User notes
  notes: { type: String },
  reflection: { type: String } // What user learned
}, { _id: true });

// Day plan
const dayPlanSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: Date, required: true },
  
  // Focus for the day
  focus: { type: String, required: true },
  theme: { type: String }, // e.g., "Arrays Deep Dive"
  
  // Tasks
  tasks: [dayTaskSchema],
  
  // Day stats
  stats: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }
  },
  
  // Day status
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'skipped', 'overdue'],
    default: 'pending'
  },
  
  // Skills covered
  skills: [{ type: String }],
  
  // AI insights for the day
  aiInsight: { type: String },
  
  // Estimated XP
  estimatedXP: { type: Number, default: 100 }
}, { _id: true });

// Milestone
const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  targetDate: { type: Date, required: true },
  criteria: [{ type: String }],
  
  // Progress
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  
  // Rewards
  xpReward: { type: Number, default: 0 },
  badge: { type: String },
  unlocks: [{ type: String }] // Topics or features unlocked
}, { _id: true });

// Performance tracking for adaptation
const performanceSnapshotSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  
  // Interview performance
  interviewScores: {
    technical: { type: Number },
    communication: { type: Number },
    overall: { type: Number }
  },
  
  // Coding performance
  codingStats: {
    problemsSolved: { type: Number },
    successRate: { type: Number },
    averageTime: { type: Number }
  },
  
  // Quiz performance
  quizStats: {
    averageScore: { type: Number },
    totalQuizzes: { type: Number }
  },
  
  // Task completion
  taskStats: {
    completionRate: { type: Number },
    onTimeRate: { type: Number },
    skippedRate: { type: Number }
  },
  
  // Identified weak areas
  weakAreas: [{ type: String }],
  
  // Strong areas
  strongAreas: [{ type: String }],
  
  // Readiness score
  readinessScore: { type: Number, min: 0, max: 100 }
}, { _id: true });

// Main RoadmapV2 schema
const roadmapV2Schema = new mongoose.Schema({
  // Basic info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Roadmap identification
  name: { type: String, required: true },
  description: { type: String },
  
  // Type classification
  type: { 
    type: String, 
    enum: [
      'role_based',      // Software Developer, Data Analyst, etc.
      'company_specific', // TCS, Amazon, Google, etc.
      'skill_focused',   // DSA only, System Design only
      'exam_prep',       // GATE, CAT, etc.
      'custom',          // User custom
      'emergency'        // Last minute prep
    ],
    required: true 
  },
  
  // Sub-type
  subtype: { type: String }, // e.g., "software_developer", "amazon", "dsa_crash"
  
  // Target configuration
  target: {
    role: { type: String },
    companies: [{ type: String }],
    skills: [{ type: String }],
    difficulty: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
      default: 'mixed'
    },
    examDate: { type: Date }, // Target interview/exam date
    preparationDuration: { type: Number, required: true } // Days
  },
  
  // Schedule
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyPlans: [dayPlanSchema],
    milestones: [milestoneSchema]
  },
  
  // Progress tracking
  progress: {
    overallCompletion: { type: Number, default: 0, min: 0, max: 100 },
    daysCompleted: { type: Number, default: 0 },
    totalDays: { type: Number, required: true },
    streakDays: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActive: { type: Date },
    
    // Task counts
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    skippedTasks: { type: Number, default: 0 },
    overdueTasks: { type: Number, default: 0 },
    
    // XP and gamification
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }]
  },
  
  // Performance history for AI adaptation
  performanceHistory: [performanceSnapshotSchema],
  
  // Adaptive adjustments log
  adjustments: [adjustmentSchema],
  
  // AI insights
  aiInsights: {
    originalPlan: { type: String },
    adaptationStrategy: { type: String },
    successProbability: { type: Number, min: 0, max: 100 },
    estimatedReadinessDate: { type: Date },
    personalizedTips: [{ type: String }],
    
    // Dynamic insights
    currentFocus: [{ type: String }],
    predictedWeaknesses: [{ type: String }],
    recommendedAccelerations: [{ type: String }],
    
    // Company-specific insights
    companyPatterns: {
      frequentlyAsked: [{ type: String }],
      preparationTips: { type: String },
      interviewStages: [{ type: String }]
    }
  },
  
  // Topic coverage
  topicCoverage: [{
    topic: { type: String },
    category: { type: String },
    days: [{ type: Number }],
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    }
  }],
  
  // Settings
  settings: {
    intensity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'extreme'],
      default: 'medium'
    },
    dailyStudyHours: { type: Number, default: 4 },
    preferredStudyTime: { type: String, default: 'morning' },
    weekendsOff: { type: Boolean, default: false },
    reminderEnabled: { type: Boolean, default: true },
    autoAdjust: { type: Boolean, default: true }
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  
  // Source tracking
  generatedFrom: {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    feedbackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' }
  },
  
  // Metadata
  version: { type: Number, default: 1 },
  parentRoadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapV2' }, // For branched roadmaps
  isTemplate: { type: Boolean, default: false },
  isForked: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
roadmapV2Schema.index({ userId: 1, status: 1 });
roadmapV2Schema.index({ userId: 1, type: 1 });
roadmapV2Schema.index({ userId: 1, 'schedule.startDate': -1 });
roadmapV2Schema.index({ 'schedule.endDate': 1 });
roadmapV2Schema.index({ type: 1, subtype: 1 });
roadmapV2Schema.index({ isTemplate: 1 });

// Instance methods
roadmapV2Schema.methods.getDayPlan = function(dayNumber) {
  return this.schedule.dailyPlans.find(d => d.day === dayNumber);
};

roadmapV2Schema.methods.getTask = function(dayNumber, taskId) {
  const day = this.getDayPlan(dayNumber);
  return day?.tasks.find(t => t.taskId === taskId);
};

roadmapV2Schema.methods.updateTaskStatus = async function(dayNumber, taskId, status, updates = {}) {
  const day = this.getDayPlan(dayNumber);
  if (!day) return false;
  
  const task = day.tasks.find(t => t.taskId === taskId);
  if (!task) return false;
  
  // Update task
  task.status = status;
  Object.assign(task, updates);
  
  if (status === 'completed') {
    task.completedAt = new Date();
    this.progress.completedTasks++;
    this.progress.totalXP += task.xpEarned || 50;
    
    // Update day stats
    day.stats.completedTasks++;
    day.stats.totalXP += task.xpEarned || 50;
  }
  
  // Recalculate progress
  this.recalculateProgress();
  this.progress.lastActive = new Date();
  
  await this.save();
  return true;
};

roadmapV2Schema.methods.recalculateProgress = function() {
  const totalTasks = this.schedule.dailyPlans.reduce((sum, day) => sum + day.tasks.length, 0);
  const completedTasks = this.schedule.dailyPlans.reduce(
    (sum, day) => sum + day.tasks.filter(t => t.status === 'completed').length, 
    0
  );
  
  this.progress.totalTasks = totalTasks;
  this.progress.completedTasks = completedTasks;
  this.progress.overallCompletion = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  // Update days completed
  this.progress.daysCompleted = this.schedule.dailyPlans.filter(
    day => day.tasks.every(t => t.status === 'completed')
  ).length;
};

roadmapV2Schema.methods.applyAdaptation = async function(adaptation) {
  this.adjustments.push(adaptation);
  
  // Apply the actual changes based on type
  switch (adaptation.type) {
    case 'insert':
      // Insert extra days/tasks
      break;
    case 'remove':
      // Remove/replace tasks
      break;
    case 'modify':
      // Modify existing tasks
      break;
    case 'reorder':
      // Reorder tasks
      break;
    case 'difficulty_change':
      // Adjust difficulty
      break;
  }
  
  this.version++;
  await this.save();
};

roadmapV2Schema.methods.getUpcomingTasks = function(days = 7) {
  const today = new Date();
  const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.schedule.dailyPlans
    .filter(day => day.date >= today && day.date <= future)
    .flatMap(day => day.tasks.map(task => ({
      ...task.toObject(),
      day: day.day,
      date: day.date,
      focus: day.focus
    })));
};

roadmapV2Schema.methods.getOverdueTasks = function() {
  const today = new Date();
  
  return this.schedule.dailyPlans
    .filter(day => day.date < today && day.status !== 'completed')
    .flatMap(day => day.tasks
      .filter(task => task.status !== 'completed')
      .map(task => ({
        ...task.toObject(),
        day: day.day,
        date: day.date,
        daysOverdue: Math.floor((today - day.date) / (1000 * 60 * 60 * 24))
      }))
    );
};

roadmapV2Schema.methods.getWeakAreas = function() {
  const latestPerformance = this.performanceHistory[this.performanceHistory.length - 1];
  return latestPerformance?.weakAreas || [];
};

// Static methods
roadmapV2Schema.statics.getActiveRoadmaps = function(userId) {
  return this.find({ userId, status: { $in: ['active', 'paused'] } })
    .sort({ createdAt: -1 });
};

roadmapV2Schema.statics.getCompletedRoadmaps = function(userId) {
  return this.find({ userId, status: 'completed' })
    .sort({ updatedAt: -1 });
};

roadmapV2Schema.statics.getTemplates = function(type, subtype) {
  const query = { isTemplate: true };
  if (type) query.type = type;
  if (subtype) query.subtype = subtype;
  
  return this.find(query).sort({ 'progress.overallCompletion': -1 });
};

roadmapV2Schema.statics.getStats = async function(userId) {
  const roadmaps = await this.find({ userId });
  
  return {
    total: roadmaps.length,
    active: roadmaps.filter(r => r.status === 'active').length,
    completed: roadmaps.filter(r => r.status === 'completed').length,
    totalXP: roadmaps.reduce((sum, r) => sum + r.progress.totalXP, 0),
    averageCompletion: roadmaps.length > 0 
      ? Math.round(roadmaps.reduce((sum, r) => sum + r.progress.overallCompletion, 0) / roadmaps.length)
      : 0,
    byType: roadmaps.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {})
  };
};

module.exports = mongoose.model('RoadmapV2', roadmapV2Schema);
