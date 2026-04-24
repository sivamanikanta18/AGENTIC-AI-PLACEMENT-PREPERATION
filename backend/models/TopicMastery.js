const mongoose = require('mongoose');

// Individual topic mastery tracking
const topicSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      'dsa', 'system_design', 'dbms', 'os', 'networking', 
      'oops', 'java', 'python', 'javascript', 'aptitude',
      'hr', 'project_management', 'devops'
    ],
    required: true 
  },
  
  // Mastery level (0-100)
  masteryLevel: { type: Number, default: 0, min: 0, max: 100 },
  
  // Level classification
  level: { 
    type: String, 
    enum: ['unstarted', 'beginner', 'intermediate', 'advanced', 'expert'],
    default: 'unstarted'
  },
  
  // Progress tracking
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  totalProblems: { type: Number, default: 0 },
  solvedProblems: { type: Number, default: 0 },
  
  // Performance metrics
  averageQuizScore: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // Minutes
  streakDays: { type: Number, default: 0 },
  lastStudied: { type: Date },
  
  // Weak areas within topic
  weakSubtopics: [{ type: String }],
  strongSubtopics: [{ type: String }],
  
  // Task history
  taskHistory: [{
    taskId: { type: String },
    completedAt: { type: Date },
    score: { type: Number },
    timeSpent: { type: Number }
  }],
  
  // Resources used
  resourcesUsed: [{
    resourceId: { type: String },
    type: { type: String },
    completedAt: { type: Date }
  }],
  
  // XP earned in this topic
  xpEarned: { type: Number, default: 0 },
  
  // Achievement in topic
  badges: [{ type: String }],
  
  // Priority for study
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
});

// Main TopicMastery schema
const topicMasterySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // All topics mastery
  topics: [topicSchema],
  
  // Summary stats
  summary: {
    totalTopics: { type: Number, default: 0 },
    masteredTopics: { type: Number, default: 0 }, // >80% mastery
    inProgressTopics: { type: Number, default: 0 },
    averageMastery: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    totalXPEarned: { type: Number, default: 0 }
  },
  
  // Recommendations (AI-generated)
  recommendations: [{
    topic: { type: String },
    action: { type: String }, // 'focus', 'review', 'practice'
    reason: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    suggestedTasks: [{ type: String }],
    generatedAt: { type: Date, default: Date.now }
  }],
  
  // Skill tree progress
  skillTreeProgress: {
    nodesUnlocked: { type: Number, default: 0 },
    nodesCompleted: { type: Number, default: 0 },
    currentFocus: [{ type: String }], // Topics user should focus on
    nextUnlocks: [{ type: String }] // Topics about to unlock
  },
  
  // Learning velocity
  analytics: {
    fastestTopic: { type: String },
    slowestTopic: { type: String },
    averageTimePerTopic: { type: Number },
    peakLearningHours: [{ type: Number }], // Hours of day
    preferredLearningDays: [{ type: String }], // Days of week
    weeklyProgress: [{
      week: { type: String },
      masteryGain: { type: Number },
      tasksCompleted: { type: Number }
    }]
  },
  
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
topicMasterySchema.index({ userId: 1 });
topicMasterySchema.index({ userId: 1, 'topics.topic': 1 });
topicMasterySchema.index({ 'topics.masteryLevel': -1 });
topicMasterySchema.index({ 'topics.priority': 1 });

// Instance methods
topicMasterySchema.methods.updateTopicProgress = async function(topicName, updates) {
  const topic = this.topics.find(t => t.topic === topicName);
  if (topic) {
    Object.assign(topic, updates);
    topic.lastStudied = new Date();
    
    // Update mastery level based on progress
    if (topic.totalTasks > 0) {
      const completionRate = (topic.completedTasks / topic.totalTasks) * 100;
      const problemRate = topic.totalProblems > 0 
        ? (topic.solvedProblems / topic.totalProblems) * 100 
        : 0;
      const quizWeight = topic.averageQuizScore * 0.3;
      
      topic.masteryLevel = Math.round((completionRate * 0.4) + (problemRate * 0.3) + quizWeight);
      
      // Update level
      if (topic.masteryLevel >= 90) topic.level = 'expert';
      else if (topic.masteryLevel >= 70) topic.level = 'advanced';
      else if (topic.masteryLevel >= 40) topic.level = 'intermediate';
      else if (topic.masteryLevel > 0) topic.level = 'beginner';
      
      // Check if mastered
      if (topic.masteryLevel >= 80) {
        topic.badges.push('topic_master');
      }
    }
    
    this.lastUpdated = new Date();
    await this.save();
  }
};

topicMasterySchema.methods.getWeakTopics = function(threshold = 50) {
  return this.topics
    .filter(t => t.masteryLevel < threshold && t.completedTasks > 0)
    .sort((a, b) => a.masteryLevel - b.masteryLevel);
};

topicMasterySchema.methods.getStrongTopics = function(threshold = 80) {
  return this.topics
    .filter(t => t.masteryLevel >= threshold)
    .sort((a, b) => b.masteryLevel - a.masteryLevel);
};

topicMasterySchema.methods.getRecommendedTopics = function() {
  // Topics with high priority and not yet mastered
  return this.topics
    .filter(t => t.priority === 'high' && t.masteryLevel < 80)
    .sort((a, b) => b.masteryLevel - a.masteryLevel);
};

topicMasterySchema.methods.getSkillGapAnalysis = function(targetLevel = 'advanced') {
  const levelThresholds = {
    'beginner': 20,
    'intermediate': 40,
    'advanced': 70,
    'expert': 90
  };
  
  const threshold = levelThresholds[targetLevel] || 70;
  
  return {
    belowTarget: this.topics.filter(t => t.masteryLevel < threshold),
    atTarget: this.topics.filter(t => t.masteryLevel >= threshold && t.masteryLevel < threshold + 20),
    aboveTarget: this.topics.filter(t => t.masteryLevel >= threshold + 20)
  };
};

// Static methods
topicMasterySchema.statics.getOrCreate = async function(userId) {
  let mastery = await this.findOne({ userId });
  if (!mastery) {
    mastery = new this({ userId, topics: [] });
    await mastery.save();
  }
  return mastery;
};

topicMasterySchema.statics.getLeaderboard = async function(category, limit = 10) {
  return this.aggregate([
    { $match: { 'topics.category': category } },
    { $unwind: '$topics' },
    { $match: { 'topics.category': category } },
    { $sort: { 'topics.masteryLevel': -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        name: '$user.name',
        topic: '$topics.topic',
        masteryLevel: '$topics.masteryLevel',
        level: '$topics.level',
        xpEarned: '$topics.xpEarned'
      }
    }
  ]);
};

module.exports = mongoose.model('TopicMastery', topicMasterySchema);
