const mongoose = require('mongoose');

// Template day structure
const templateDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  focus: { type: String, required: true },
  theme: { type: String },
  
  // Task templates (will be instantiated as SmartTasks)
  tasks: [{
    type: { 
      type: String, 
      enum: ['concept', 'coding', 'quiz', 'project', 'revision', 'interview', 'mock_test'],
      required: true 
    },
    category: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true 
    },
    estimatedDuration: { type: Number, required: true },
    requiresResources: { type: Boolean, default: true },
    requiresQuiz: { type: Boolean, default: true },
    problemCount: { type: Number, default: 3 }
  }],
  
  skills: [{ type: String }],
  estimatedXP: { type: Number, default: 100 },
  
  // AI prompt for dynamic content generation
  aiPrompt: { type: String }
}, { _id: true });

// Company-specific details
const companySpecificSchema = new mongoose.Schema({
  company: { type: String, required: true },
  
  // Interview pattern
  interviewRounds: [{ type: String }], // e.g., ['aptitude', 'coding', 'technical', 'hr']
  typicalDuration: { type: String }, // "3-4 hours"
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard', 'very_hard'],
    required: true 
  },
  
  // Selection criteria
  selectionCriteria: {
    aptitudeWeight: { type: Number, default: 20 }, // Percentage
    codingWeight: { type: Number, default: 40 },
    technicalWeight: { type: Number, default: 30 },
    communicationWeight: { type: Number, default: 10 }
  },
  
  // Preparation focus
  focusAreas: [{ type: String }],
  
  // Previous year patterns
  frequentlyAskedTopics: [{ type: String }],
  questionTypes: [{ type: String }],
  
  // Cutoffs (if available)
  aptitudeCutoff: { type: Number },
  codingCutoff: { type: Number },
  
  // Special requirements
  eligibilityCriteria: {
    minCGPA: { type: Number },
    branches: [{ type: String }],
    backlogsAllowed: { type: Boolean, default: false }
  }
}, { _id: true });

// Main RoadmapTemplate schema
const roadmapTemplateSchema = new mongoose.Schema({
  // Identification
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: { type: String, required: true },
  
  // Classification
  type: { 
    type: String, 
    enum: [
      'role_based',
      'company_specific',
      'skill_focused',
      'exam_prep',
      'emergency',
      'revision'
    ],
    required: true 
  },
  
  // Sub-type
  subtype: { 
    type: String, 
    required: true 
  }, // e.g., "software_developer", "amazon", "30_day_sprint"
  
  // Tags for filtering
  tags: [{ type: String }],
  
  // Target audience
  targetAudience: {
    roles: [{ type: String }],
    experienceLevels: [{ type: String }], // 'fresher', '1-3years', etc.
    companies: [{ type: String }],
    difficulty: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
      default: 'mixed'
    }
  },
  
  // Structure
  structure: {
    duration: { type: Number, required: true }, // Days
    intensity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'extreme'],
      required: true 
    },
    dailyHours: { type: Number, required: true },
    templateDays: [templateDaySchema],
    milestones: [{
      title: { type: String },
      day: { type: Number },
      description: { type: String },
      xpReward: { type: Number, default: 0 }
    }]
  },
  
  // Skill tree structure
  skillTree: {
    nodes: [{
      id: { type: String },
      name: { type: String },
      category: { type: String },
      difficulty: { type: String },
      prerequisites: [{ type: String }],
      unlocks: [{ type: String }],
      day: { type: Number }
    }],
    unlocks: [{
      nodeId: { type: String },
      requiredMastery: { type: Number, default: 80 }
    }]
  },
  
  // Company-specific details (if applicable)
  companyDetails: companySpecificSchema,
  
  // Topic distribution
  topicDistribution: [{
    category: { type: String },
    percentage: { type: Number }, // 0-100
    days: { type: Number },
    topics: [{ type: String }]
  }],
  
  // AI generation configuration
  aiConfig: {
    model: { type: String, default: 'gemini' },
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 2048 },
    
    // Base prompt template
    basePrompt: { type: String },
    
    // Context to include
    includeResume: { type: Boolean, default: true },
    includeFeedback: { type: Boolean, default: true },
    includePerformance: { type: Boolean, default: true }
  },
  
  // Validation rules
  validationRules: {
    minPrerequisites: [{ type: String }], // Required before starting
    recommendedSkills: [{ type: String }],
    estimatedOutcome: { type: String } // Expected result
  },
  
  // Success metrics (from users who completed)
  successMetrics: {
    averageCompletion: { type: Number, default: 0 },
    averageSatisfaction: { type: Number, default: 0 }, // 1-5
    interviewSuccessRate: { type: Number, default: 0 }, // Percentage
    totalUsers: { type: Number, default: 0 },
    completedUsers: { type: Number, default: 0 }
  },
  
  // Metadata
  version: { type: Number, default: 1 },
  author: { type: String, default: 'AI' },
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  
  // SEO/Discovery
  searchKeywords: [{ type: String }],
  difficultyRating: { type: Number, min: 1, max: 5 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
roadmapTemplateSchema.index({ type: 1, subtype: 1 });
roadmapTemplateSchema.index({ isActive: 1, isPublic: 1 });
roadmapTemplateSchema.index({ 'targetAudience.roles': 1 });
roadmapTemplateSchema.index({ 'targetAudience.companies': 1 });
roadmapTemplateSchema.index({ tags: 1 });

// Static methods
roadmapTemplateSchema.statics.getByType = function(type) {
  return this.find({ type, isActive: true, isPublic: true })
    .sort({ 'successMetrics.averageSatisfaction': -1 });
};

roadmapTemplateSchema.statics.getForCompany = function(company) {
  return this.find({ 
    type: 'company_specific', 
    'companyDetails.company': company,
    isActive: true 
  });
};

roadmapTemplateSchema.statics.getForRole = function(role) {
  return this.find({
    type: 'role_based',
    'targetAudience.roles': role,
    isActive: true
  });
};

roadmapTemplateSchema.statics.getRecommended = function(userProfile) {
  const query = { isActive: true, isPublic: true };
  
  // Match by role
  if (userProfile.targetRole) {
    query['targetAudience.roles'] = userProfile.targetRole;
  }
  
  // Filter by difficulty
  if (userProfile.currentLevel) {
    query['targetAudience.difficulty'] = { $in: [userProfile.currentLevel, 'mixed'] };
  }
  
  return this.find(query)
    .sort({ 'successMetrics.interviewSuccessRate': -1 })
    .limit(5);
};

// Pre-defined templates
const PREDEFINED_TEMPLATES = {
  // Role-based
  'software_developer_60': {
    type: 'role_based',
    subtype: 'software_developer',
    displayName: 'Software Developer - 60 Day Plan',
    duration: 60,
    focus: ['DSA', 'System Design', 'OOP', 'DBMS', 'Operating Systems']
  },
  
  'data_analyst_45': {
    type: 'role_based',
    subtype: 'data_analyst',
    displayName: 'Data Analyst - 45 Day Plan',
    duration: 45,
    focus: ['SQL', 'Python', 'Statistics', 'Data Visualization', 'Excel']
  },
  
  // Company-specific
  'tcs_nqt_30': {
    type: 'company_specific',
    subtype: 'tcs',
    displayName: 'TCS NQT - 30 Day Preparation',
    duration: 30,
    company: 'TCS',
    focus: ['Aptitude', 'Verbal', 'Reasoning', 'Basic Coding']
  },
  
  'amazon_sde_60': {
    type: 'company_specific',
    subtype: 'amazon',
    displayName: 'Amazon SDE - 60 Day Preparation',
    duration: 60,
    company: 'Amazon',
    focus: ['Advanced DSA', 'System Design', 'Behavioral', 'Leadership Principles']
  },
  
  // Emergency modes
  'placement_sprint_30': {
    type: 'emergency',
    subtype: '30_day_sprint',
    displayName: '30-Day Placement Sprint',
    duration: 30,
    intensity: 'extreme',
    focus: ['High Yield Topics', 'Mock Interviews', 'Resume Building']
  },
  
  'revision_14': {
    type: 'revision',
    subtype: 'quick_revision',
    displayName: '14-Day Quick Revision',
    duration: 14,
    intensity: 'high',
    focus: ['Weak Areas', 'Important Topics', 'Practice Problems']
  }
};

// Initialize templates
roadmapTemplateSchema.statics.initializeTemplates = async function() {
  const templates = Object.entries(PREDEFINED_TEMPLATES);
  
  for (const [key, template] of templates) {
    await this.findOneAndUpdate(
      { name: key },
      { ...template, name: key, isActive: true },
      { upsert: true, new: true }
    );
  }
  
  console.log(`[RoadmapTemplate] Initialized ${templates.length} templates`);
};

module.exports = mongoose.model('RoadmapTemplate', roadmapTemplateSchema);
