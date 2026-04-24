const SmartTask = require('../models/SmartTask');
const TopicMastery = require('../models/TopicMastery');
const RoadmapV2 = require('../models/RoadmapV2');
const RoadmapTemplate = require('../models/RoadmapTemplate');
const AIService = require('../utils/aiService');
const crypto = require('crypto');

/**
 * Advanced Roadmap Generation Service
 * Handles AI-powered roadmap creation with deduplication and personalization
 */
class RoadmapGenerationService {
  
  /**
   * Main method to generate a personalized roadmap
   */
  static async generateRoadmap(userId, options) {
    const {
      type = 'role_based',
      subtype = 'software_developer',
      targetRole,
      company,
      duration = 60,
      intensity = 'medium',
      focusAreas = [],
      resumeData,
      feedbackData,
      preferences = {}
    } = options;
    
    console.log(`[RoadmapGeneration] Starting generation for user ${userId}`);
    console.log(`[RoadmapGeneration] Type: ${type}, Subtype: ${subtype}, Duration: ${duration}`);
    
    try {
      // Step 1: Get or create template
      const template = await this.getOrCreateTemplate(type, subtype, duration);
      
      // Step 2: Analyze user profile and performance
      const userProfile = await this.buildUserProfile(userId, resumeData, feedbackData);
      
      // Step 3: Get user's topic history to avoid duplicates
      const topicHistory = await this.getTopicHistory(userId);
      
      // Step 4: Generate personalized schedule
      const schedule = await this.generateSchedule(template, userProfile, topicHistory, duration);
      
      // Step 5: Create SmartTasks with deduplication
      const enrichedSchedule = await this.enrichWithSmartTasks(schedule, userProfile, topicHistory);
      
      // Step 6: Calculate AI insights
      const aiInsights = await this.generateInsights(enrichedSchedule, userProfile);
      
      // Step 7: Create the roadmap
      const roadmap = await this.createRoadmapDocument(userId, {
        template,
        schedule: enrichedSchedule,
        aiInsights,
        options,
        userProfile
      });
      
      // Step 8: Update user's topic mastery
      await this.initializeTopicMastery(userId, enrichedSchedule);
      
      console.log(`[RoadmapGeneration] Successfully created roadmap ${roadmap._id}`);
      
      return {
        success: true,
        roadmapId: roadmap._id,
        roadmap,
        message: this.generateSuccessMessage(type, subtype, userProfile.weakAreas)
      };
      
    } catch (error) {
      console.error('[RoadmapGeneration] Error:', error);
      throw error;
    }
  }
  
  /**
   * Get or create a roadmap template
   */
  static async getOrCreateTemplate(type, subtype, duration) {
    let template = await RoadmapTemplate.findOne({
      type,
      subtype,
      'structure.duration': duration,
      isActive: true
    });
    
    if (!template) {
      // Generate template using AI
      template = await this.generateTemplateWithAI(type, subtype, duration);
    }
    
    return template;
  }
  
  /**
   * Build comprehensive user profile for personalization
   */
  static async buildUserProfile(userId, resumeData, feedbackData) {
    const profile = {
      userId,
      currentLevel: 'beginner',
      strongAreas: [],
      weakAreas: [],
      completedTopics: [],
      preferredLearningStyle: 'mixed',
      availableHoursPerDay: 4,
      targetDate: null
    };
    
    // Get topic mastery
    const topicMastery = await TopicMastery.findOne({ userId });
    if (topicMastery) {
      const strong = topicMastery.getStrongTopics(70);
      const weak = topicMastery.getWeakTopics(50);
      
      profile.strongAreas = strong.map(t => t.topic);
      profile.weakAreas = weak.map(t => t.topic);
      profile.completedTopics = topicMastery.topics
        .filter(t => t.completedTasks > 0)
        .map(t => t.topic);
      
      // Calculate average mastery
      const avgMastery = topicMastery.summary.averageMastery;
      if (avgMastery > 70) profile.currentLevel = 'advanced';
      else if (avgMastery > 40) profile.currentLevel = 'intermediate';
    }
    
    // Analyze resume gaps
    if (resumeData?.analysis) {
      profile.resumeGaps = resumeData.analysis.weak_areas || [];
      profile.resumeSkills = resumeData.analysis.skills_detected?.map(s => s.name) || [];
      
      // Add resume gaps to weak areas if not already covered
      profile.resumeGaps.forEach(gap => {
        if (!profile.weakAreas.includes(gap)) {
          profile.weakAreas.push(gap);
        }
      });
    }
    
    // Analyze feedback
    if (feedbackData?.dimensions) {
      const dims = feedbackData.dimensions;
      
      if (dims.technical?.score < 7) profile.weakAreas.push('Technical Knowledge');
      if (dims.communication?.score < 7) profile.weakAreas.push('Communication');
      if (dims.problemSolving?.score < 7) profile.weakAreas.push('Problem Solving');
      
      profile.feedbackActionItems = feedbackData.actionItems || [];
    }
    
    return profile;
  }
  
  /**
   * Get user's topic history to avoid duplicate tasks
   */
  static async getTopicHistory(userId) {
    const history = {
      completedTopics: new Set(),
      topicHashes: new Set(),
      masteredTopics: new Set()
    };
    
    // Get all SmartTasks the user has interacted with
    const tasks = await SmartTask.find({
      [`progress.${userId}.status`]: { $in: ['completed', 'in_progress'] }
    });
    
    tasks.forEach(task => {
      history.completedTopics.add(task.topic);
      history.topicHashes.add(task.topicHash);
      
      const progress = task.progress.get(userId);
      if (progress?.status === 'completed') {
        history.masteredTopics.add(task.topic);
      }
    });
    
    // Also check topic mastery
    const mastery = await TopicMastery.findOne({ userId });
    if (mastery) {
      mastery.topics.forEach(topic => {
        if (topic.masteryLevel >= 80) {
          history.masteredTopics.add(topic.topic);
        }
        if (topic.completedTasks > 0) {
          history.completedTopics.add(topic.topic);
        }
      });
    }
    
    return history;
  }
  
  /**
   * Check if a topic would create a duplicate task
   */
  static isDuplicate(topic, difficulty, type, topicHistory) {
    // Check if topic is mastered
    if (topicHistory.masteredTopics.has(topic)) {
      return { isDuplicate: true, reason: 'topic_mastered' };
    }
    
    // Check if similar topic already completed
    if (topicHistory.completedTopics.has(topic)) {
      return { isDuplicate: true, reason: 'topic_completed' };
    }
    
    // Check hash for exact duplicate
    const hash = this.generateTopicHash(topic, difficulty, type);
    if (topicHistory.topicHashes.has(hash)) {
      return { isDuplicate: true, reason: 'exact_duplicate' };
    }
    
    return { isDuplicate: false };
  }
  
  /**
   * Generate hash for deduplication
   */
  static generateTopicHash(topic, difficulty, type) {
    return crypto
      .createHash('md5')
      .update(`${topic.toLowerCase().trim()}-${difficulty}-${type}`)
      .digest('hex');
  }
  
  /**
   * Generate personalized schedule with deduplication
   */
  static async generateSchedule(template, userProfile, topicHistory, duration) {
    const dailyPlans = [];
    const usedTopics = new Set();
    
    // Get topic distribution from template or generate
    const topicDistribution = template.topicDistribution || 
      this.generateTopicDistribution(duration, userProfile);
    
    let currentDay = 1;
    
    for (const dist of topicDistribution) {
      const daysForCategory = Math.floor((dist.percentage / 100) * duration);
      
      for (let i = 0; i < daysForCategory; i++) {
        if (currentDay > duration) break;
        
        // Select topics for this day
        const dayTopics = await this.selectTopicsForDay(
          dist.category,
          userProfile,
          topicHistory,
          usedTopics,
          2 // Topics per day
        );
        
        if (dayTopics.length === 0) {
          // Fallback: use weak areas
          dayTopics.push(...userProfile.weakAreas.slice(0, 2));
        }
        
        dayTopics.forEach(t => usedTopics.add(t));
        
        dailyPlans.push({
          day: currentDay,
          date: new Date(Date.now() + (currentDay - 1) * 24 * 60 * 60 * 1000),
          focus: dist.category,
          theme: dayTopics.join(' & '),
          tasks: [], // Will be populated later
          skills: dayTopics,
          estimatedXP: 100 + (dayTopics.length * 20)
        });
        
        currentDay++;
      }
    }
    
    return {
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      dailyPlans,
      milestones: template.structure?.milestones || this.generateMilestones(duration)
    };
  }
  
  /**
   * Select topics for a day with deduplication
   */
  static async selectTopicsForDay(category, userProfile, topicHistory, usedTopics, count) {
    const candidates = [];
    
    // Priority 1: Weak areas not yet covered
    const weakNotCovered = userProfile.weakAreas.filter(
      t => !usedTopics.has(t) && !topicHistory.masteredTopics.has(t)
    );
    candidates.push(...weakNotCovered);
    
    // Priority 2: Resume gaps
    const resumeGaps = (userProfile.resumeGaps || []).filter(
      t => !usedTopics.has(t) && !topicHistory.masteredTopics.has(t)
    );
    candidates.push(...resumeGaps);
    
    // Priority 3: AI suggestions
    if (candidates.length < count) {
      const aiTopics = await this.getAISuggestedTopics(category, userProfile);
      const newTopics = aiTopics.filter(
        t => !usedTopics.has(t) && !candidates.includes(t)
      );
      candidates.push(...newTopics);
    }
    
    return candidates.slice(0, count);
  }
  
  /**
   * Enrich schedule with SmartTasks
   */
  static async enrichWithSmartTasks(schedule, userProfile, topicHistory) {
    for (const day of schedule.dailyPlans) {
      const tasks = [];
      
      for (const topic of day.skills) {
        // Check for duplicate
        const duplicateCheck = this.isDuplicate(
          topic, 
          this.selectDifficulty(userProfile, topic), 
          'concept',
          topicHistory
        );
        
        if (duplicateCheck.isDuplicate) {
          console.log(`[RoadmapGeneration] Skipping duplicate: ${topic} (${duplicateCheck.reason})`);
          
          // Try to find related but different topic
          const alternativeTopic = await this.findAlternativeTopic(topic, day.skills);
          if (alternativeTopic) {
            tasks.push(await this.createOrGetSmartTask(alternativeTopic, userProfile));
          }
        } else {
          tasks.push(await this.createOrGetSmartTask(topic, userProfile));
        }
      }
      
      // Add practice tasks
      tasks.push(...await this.createPracticeTasks(day.skills, userProfile));
      
      day.tasks = tasks.map((task, index) => ({
        taskId: task.taskId,
        smartTaskRef: task._id,
        status: 'available',
        estimatedDuration: task.estimatedTime,
        scheduledTime: this.calculateScheduledTime(index),
        xpReward: task.xpReward
      }));
    }
    
    return schedule;
  }
  
  /**
   * Create or get existing SmartTask
   */
  static async createOrGetSmartTask(topic, userProfile) {
    const difficulty = this.selectDifficulty(userProfile, topic);
    const type = 'concept';
    
    // Check if task already exists
    const existingTask = await SmartTask.findOne({
      topic: { $regex: new RegExp(topic, 'i') },
      difficulty,
      type
    });
    
    if (existingTask) {
      return existingTask;
    }
    
    // Generate new SmartTask with AI
    const taskData = await this.generateSmartTaskWithAI(topic, difficulty, userProfile);
    
    const smartTask = new SmartTask({
      taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: taskData.topic || topic,
      type,
      category: this.categorizeTopic(topic),
      difficulty,
      difficultyScore: this.getDifficultyScore(difficulty),
      title: taskData.title || `${topic} - ${difficulty}`,
      description: taskData.description,
      content: {
        explanation: taskData.explanation,
        keyPoints: taskData.keyPoints || [],
        codeExample: taskData.codeExample || '',
        cheatSheet: taskData.cheatSheet || []
      },
      resources: taskData.resources || [],
      problems: taskData.problems || [],
      quiz: {
        questions: taskData.quiz?.questions || [],
        passingScore: 70
      },
      estimatedTime: taskData.estimatedTime || 60,
      xpReward: this.calculateXPReward(difficulty),
      topicHash: this.generateTopicHash(topic, difficulty, type)
    });
    
    await smartTask.save();
    return smartTask;
  }
  
  /**
   * Generate SmartTask content using AI
   */
  static async generateSmartTaskWithAI(topic, difficulty, userProfile) {
    const prompt = `
Generate a comprehensive learning task for: ${topic}

Target Difficulty: ${difficulty}
User Level: ${userProfile.currentLevel}

Create structured learning content with:
1. Clear, engaging title
2. 2-3 paragraph explanation suitable for ${difficulty} level
3. 5 key bullet points to remember
4. Code example (if applicable)
5. 3 curated learning resources (mix of video, article, documentation)
6. 3 practice problems with difficulty progression
7. 5 quiz questions with answers and explanations

Format as JSON:
{
  "title": "string",
  "description": "string",
  "explanation": "string",
  "keyPoints": ["string"],
  "codeExample": "string",
  "resources": [{"type", "title", "url", "source", "duration"}],
  "problems": [{"title", "difficulty", "platform", "url", "hints"}],
  "quiz": {"questions": [{"question", "options", "correctAnswer", "explanation"}]},
  "estimatedTime": number
}
`;
    
    try {
      const aiResponse = await AIService.generateContent(prompt, { temperature: 0.7 });
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('[RoadmapGeneration] AI generation failed:', error);
      // Fallback content
      return this.getFallbackTaskContent(topic, difficulty);
    }
  }
  
  /**
   * Generate AI insights for the roadmap
   */
  static async generateInsights(schedule, userProfile) {
    const weakAreas = userProfile.weakAreas.slice(0, 5);
    const estimatedReadiness = this.calculateReadiness(schedule, userProfile);
    
    return {
      originalPlan: `Personalized ${schedule.dailyPlans.length}-day roadmap`,
      adaptationStrategy: `Focus on ${weakAreas.join(', ')}`,
      successProbability: Math.min(95, 60 + (userProfile.strongAreas.length * 5)),
      estimatedReadinessDate: new Date(Date.now() + schedule.dailyPlans.length * 24 * 60 * 60 * 1000),
      personalizedTips: [
        `Prioritize ${weakAreas[0] || 'core concepts'} in first 2 weeks`,
        'Practice coding daily for at least 1 hour',
        'Review previous topics every weekend',
        `Leverage your strength in ${userProfile.strongAreas[0] || 'problem solving'}`,
        'Take mock interviews after week 3'
      ],
      currentFocus: weakAreas.slice(0, 3),
      predictedWeaknesses: this.predictWeaknesses(schedule),
      recommendedAccelerations: this.recommendAccelerations(schedule, userProfile)
    };
  }
  
  /**
   * Create the final roadmap document
   */
  static async createRoadmapDocument(userId, data) {
    const { template, schedule, aiInsights, options, userProfile } = data;
    
    const roadmap = new RoadmapV2({
      userId,
      name: `${template.displayName || options.subtype} Roadmap`,
      description: `Personalized ${options.duration}-day preparation plan`,
      type: options.type,
      subtype: options.subtype,
      target: {
        role: options.targetRole,
        companies: options.company ? [options.company] : [],
        skills: userProfile.weakAreas.slice(0, 5),
        difficulty: userProfile.currentLevel,
        preparationDuration: options.duration
      },
      schedule,
      progress: {
        totalDays: schedule.dailyPlans.length,
        totalTasks: schedule.dailyPlans.reduce((sum, d) => sum + d.tasks.length, 0)
      },
      aiInsights,
      settings: {
        intensity: options.intensity,
        dailyStudyHours: userProfile.availableHoursPerDay,
        autoAdjust: true
      },
      status: 'active',
      generatedFrom: {
        resumeId: options.resumeData?._id,
        feedbackId: options.feedbackData?._id
      }
    });
    
    await roadmap.save();
    return roadmap;
  }
  
  /**
   * Initialize topic mastery tracking
   */
  static async initializeTopicMastery(userId, schedule) {
    const mastery = await TopicMastery.getOrCreate(userId);
    
    // Extract all topics from schedule
    const allTopics = new Set();
    schedule.dailyPlans.forEach(day => {
      day.skills.forEach(skill => allTopics.add(skill));
    });
    
    // Add topics that aren't already tracked
    for (const topic of allTopics) {
      const exists = mastery.topics.find(t => t.topic === topic);
      if (!exists) {
        mastery.topics.push({
          topic,
          category: this.categorizeTopic(topic),
          masteryLevel: 0,
          level: 'unstarted',
          priority: 'medium'
        });
      }
    }
    
    mastery.summary.totalTopics = mastery.topics.length;
    await mastery.save();
  }
  
  // Helper methods
  
  static selectDifficulty(userProfile, topic) {
    // If topic is in weak areas, start with beginner/intermediate
    if (userProfile.weakAreas.includes(topic)) {
      return userProfile.currentLevel === 'beginner' ? 'beginner' : 'intermediate';
    }
    
    // If topic is strong, go advanced
    if (userProfile.strongAreas.includes(topic)) {
      return 'advanced';
    }
    
    return 'intermediate';
  }
  
  static categorizeTopic(topic) {
    const categories = {
      'dsa': ['array', 'string', 'linked list', 'tree', 'graph', 'dp', 'sorting', 'searching'],
      'system_design': ['system design', 'scalability', 'microservices', 'database design'],
      'dbms': ['database', 'sql', 'nosql', 'normalization', 'indexing'],
      'oops': ['class', 'object', 'inheritance', 'polymorphism', 'encapsulation'],
      'os': ['process', 'thread', 'memory', 'scheduling', 'deadlock'],
      'networking': ['http', 'tcp', 'ip', 'network', 'protocol'],
      'aptitude': ['aptitude', 'reasoning', 'verbal', 'quantitative']
    };
    
    const lowerTopic = topic.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => lowerTopic.includes(k))) {
        return category;
      }
    }
    
    return 'general';
  }
  
  static getDifficultyScore(difficulty) {
    const scores = { beginner: 3, intermediate: 6, advanced: 9, expert: 10 };
    return scores[difficulty] || 5;
  }
  
  static calculateXPReward(difficulty) {
    const rewards = { beginner: 50, intermediate: 75, advanced: 100, expert: 150 };
    return rewards[difficulty] || 50;
  }
  
  static calculateScheduledTime(index) {
    const times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '07:00 PM'];
    return times[index % times.length];
  }
  
  static generateMilestones(duration) {
    return [
      { title: 'Foundation Complete', day: Math.floor(duration * 0.25), description: 'Basic concepts mastered' },
      { title: 'Halfway There', day: Math.floor(duration * 0.5), description: '50% of roadmap completed' },
      { title: 'Advanced Topics', day: Math.floor(duration * 0.75), description: 'Entering advanced phase' },
      { title: 'Interview Ready', day: duration, description: 'Ready for placement interviews' }
    ];
  }
  
  static generateTopicDistribution(duration, userProfile) {
    const categories = [
      { category: 'dsa', percentage: 40 },
      { category: 'system_design', percentage: 15 },
      { category: 'dbms', percentage: 10 },
      { category: 'oops', percentage: 10 },
      { category: 'os', percentage: 10 },
      { category: 'networking', percentage: 10 },
      { category: 'aptitude', percentage: 5 }
    ];
    
    // Adjust based on weak areas
    const adjusted = categories.map(c => {
      if (userProfile.weakAreas.some(w => this.categorizeTopic(w) === c.category)) {
        return { ...c, percentage: Math.min(c.percentage * 1.3, 50) };
      }
      return c;
    });
    
    return adjusted;
  }
  
  static async findAlternativeTopic(originalTopic, contextTopics) {
    // Find related but different topic
    const relatedTopics = {
      'arrays': ['two pointers', 'sliding window'],
      'linked list': ['fast slow pointers', 'circular linked list'],
      'trees': ['binary search tree', 'tree traversal'],
      'dynamic programming': ['memoization', 'tabulation']
    };
    
    const alternatives = relatedTopics[originalTopic.toLowerCase()];
    if (alternatives) {
      return alternatives.find(a => !contextTopics.includes(a)) || alternatives[0];
    }
    
    return null;
  }
  
  static async createPracticeTasks(topics, userProfile) {
    const practiceTasks = [];
    
    for (const topic of topics) {
      const existingTask = await SmartTask.findOne({
        topic: { $regex: new RegExp(topic, 'i') },
        type: 'coding'
      });
      
      if (existingTask) {
        practiceTasks.push({
          taskId: existingTask.taskId,
          smartTaskRef: existingTask._id,
          status: 'available',
          estimatedDuration: 45,
          xpReward: 40
        });
      }
    }
    
    return practiceTasks;
  }
  
  static calculateReadiness(schedule, userProfile) {
    const totalTopics = schedule.dailyPlans.reduce(
      (sum, d) => sum + d.skills.length, 0
    );
    const weakAreasToCover = userProfile.weakAreas.length;
    
    return Math.min(95, Math.round((weakAreasToCover / totalTopics) * 100));
  }
  
  static predictWeaknesses(schedule) {
    const commonWeaknesses = [
      'Time complexity analysis',
      'Space optimization',
      'Edge case handling',
      'System design tradeoffs',
      'Database query optimization'
    ];
    
    return commonWeaknesses.slice(0, 3);
  }
  
  static recommendAccelerations(schedule, userProfile) {
    const recommendations = [];
    
    if (userProfile.currentLevel === 'beginner') {
      recommendations.push('Start with 2 topics per day');
    } else if (userProfile.currentLevel === 'advanced') {
      recommendations.push('Skip basic concepts, focus on advanced topics');
    }
    
    if (userProfile.weakAreas.includes('System Design')) {
      recommendations.push('Add extra system design practice sessions');
    }
    
    return recommendations;
  }
  
  static generateSuccessMessage(type, subtype, weakAreas) {
    const areaText = weakAreas.length > 0 
      ? `focusing on your weak areas: ${weakAreas.slice(0, 3).join(', ')}` 
      : 'tailored to your profile';
    
    return `Your ${subtype.replace(/_/g, ' ')} roadmap is ready, ${areaText}!`;
  }
  
  static getFallbackTaskContent(topic, difficulty) {
    return {
      title: `${topic} - ${difficulty}`,
      description: `Learn ${topic} at ${difficulty} level`,
      explanation: `${topic} is an important concept in computer science. Study the basics and practice problems.`,
      keyPoints: [`Key aspect of ${topic}`, `Common patterns in ${topic}`, `Practice is essential`],
      resources: [],
      problems: [],
      quiz: { questions: [] },
      estimatedTime: 60
    };
  }
  
  static async generateTemplateWithAI(type, subtype, duration) {
    // Implementation for generating new template
    // This would create a template document using AI
    return null;
  }
  
  static async getAISuggestedTopics(category, userProfile) {
    // Get AI suggestions for topics in this category
    return [];
  }
}

module.exports = RoadmapGenerationService;
