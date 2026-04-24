const RoadmapV2 = require('../models/RoadmapV2');
const TopicMastery = require('../models/TopicMastery');
const SmartTask = require('../models/SmartTask');
const AIService = require('../utils/aiService');

/**
 * AI-Powered Adaptive Roadmap Engine
 * Dynamically adjusts roadmaps based on user performance, missed tasks, and interview feedback
 */
class AdaptiveEngine {
  
  /**
   * Main adaptation method - analyze and adjust roadmap
   */
  static async adaptRoadmap(roadmapId, userId) {
    console.log(`[AdaptiveEngine] Analyzing roadmap ${roadmapId} for user ${userId}`);
    
    try {
      // Step 1: Load roadmap and user data
      const roadmap = await RoadmapV2.findById(roadmapId);
      if (!roadmap) throw new Error('Roadmap not found');
      
      const topicMastery = await TopicMastery.getOrCreate(userId);
      
      // Step 2: Collect performance data
      const performanceData = await this.collectPerformanceData(roadmap, userId);
      
      // Step 3: Analyze for adaptations
      const adaptations = await this.analyzeForAdaptations(roadmap, performanceData, topicMastery);
      
      // Step 4: Apply adaptations if any
      if (adaptations.length > 0) {
        console.log(`[AdaptiveEngine] Applying ${adaptations.length} adaptations`);
        
        for (const adaptation of adaptations) {
          await this.applyAdaptation(roadmap, adaptation, userId);
        }
        
        // Recalculate progress after adaptations
        roadmap.recalculateProgress();
        roadmap.version++;
        await roadmap.save();
        
        // Update AI insights
        roadmap.aiInsights.currentFocus = adaptations
          .filter(a => a.type === 'insert' || a.type === 'reinforce')
          .map(a => a.details.topic);
        
        await roadmap.save();
        
        return {
          success: true,
          adaptationsApplied: adaptations.length,
          adaptations: adaptations,
          message: `Roadmap adapted with ${adaptations.length} changes`
        };
      }
      
      return {
        success: true,
        adaptationsApplied: 0,
        message: 'No adaptations needed - you\'re on track!'
      };
      
    } catch (error) {
      console.error('[AdaptiveEngine] Error:', error);
      throw error;
    }
  }
  
  /**
   * Collect comprehensive performance data
   */
  static async collectPerformanceData(roadmap, userId) {
    const data = {
      completedTasks: [],
      missedTasks: [],
      overdueTasks: [],
      quizScores: [],
      problemAttempts: [],
      timeSpent: {},
      streakData: {
        current: roadmap.progress.currentStreak,
        longest: roadmap.progress.longestStreak
      },
      weakTopics: [],
      strongTopics: [],
      interviewScores: [],
      codingPerformance: {
        solved: 0,
        attempted: 0,
        successRate: 0
      }
    };
    
    // Analyze daily plans
    for (const day of roadmap.schedule.dailyPlans) {
      for (const task of day.tasks) {
        const smartTask = await SmartTask.findById(task.smartTaskRef);
        if (!smartTask) continue;
        
        const progress = smartTask.progress.get(userId.toString());
        
        if (task.status === 'completed' || progress?.status === 'completed') {
          data.completedTasks.push({
            taskId: task.taskId,
            topic: smartTask.topic,
            category: smartTask.category,
            day: day.day,
            score: progress?.quizScore || 0,
            timeSpent: progress?.timeSpent || 0
          });
          
          if (progress?.quizScore) {
            data.quizScores.push({
              topic: smartTask.topic,
              score: progress.quizScore,
              difficulty: smartTask.difficulty
            });
          }
        } else if (day.date < new Date() && task.status !== 'completed') {
          // Task is overdue
          data.overdueTasks.push({
            taskId: task.taskId,
            topic: smartTask.topic,
            category: smartTask.category,
            day: day.day,
            daysOverdue: Math.floor((new Date() - day.date) / (1000 * 60 * 60 * 24))
          });
        }
      }
    }
    
    // Get weak and strong topics from mastery
    const weakTopics = topicMastery.getWeakTopics(50);
    const strongTopics = topicMastery.getStrongTopics(80);
    
    data.weakTopics = weakTopics.map(t => ({
      topic: t.topic,
      masteryLevel: t.masteryLevel,
      completedTasks: t.completedTasks,
      priority: t.priority
    }));
    
    data.strongTopics = strongTopics.map(t => ({
      topic: t.topic,
      masteryLevel: t.masteryLevel
    }));
    
    // Calculate averages
    if (data.quizScores.length > 0) {
      data.averageQuizScore = data.quizScores.reduce((sum, q) => sum + q.score, 0) / data.quizScores.length;
    }
    
    if (data.completedTasks.length > 0) {
      data.totalTimeSpent = data.completedTasks.reduce((sum, t) => sum + t.timeSpent, 0);
    }
    
    return data;
  }
  
  /**
   * Analyze data and generate adaptation recommendations
   */
  static async analyzeForAdaptations(roadmap, performanceData, topicMastery) {
    const adaptations = [];
    
    // Rule 1: Weak Topic Reinforcement
    if (performanceData.weakTopics.length > 0) {
      const criticalWeakTopics = performanceData.weakTopics
        .filter(t => t.masteryLevel < 30 && t.completedTasks < 2)
        .slice(0, 3);
      
      for (const topic of criticalWeakTopics) {
        adaptations.push({
          type: 'insert',
          priority: 'high',
          trigger: 'weak_performance',
          reason: `Low mastery (${topic.masteryLevel}%) in ${topic.topic} - needs reinforcement`,
          details: {
            topic: topic.topic,
            days: 2,
            insertAfter: this.findBestInsertionPoint(roadmap, topic.topic),
            tasks: ['concept', 'practice', 'quiz']
          },
          aiConfidence: 90
        });
      }
    }
    
    // Rule 2: Missed Tasks Recovery
    if (performanceData.overdueTasks.length > 0) {
      const overdueTopics = [...new Set(performanceData.overdueTasks.map(t => t.topic))];
      
      adaptations.push({
        type: 'reorder',
        priority: 'high',
        trigger: 'missed_tasks',
        reason: `${performanceData.overdueTasks.length} tasks overdue - reorganizing schedule`,
        details: {
          overdueCount: performanceData.overdueTasks.length,
          affectedTopics: overdueTopics,
          strategy: 'compress_upcoming'
        },
        aiConfidence: 85
      });
    }
    
    // Rule 3: Skip Mastered Topics
    const masteredTopics = performanceData.strongTopics.filter(t => t.masteryLevel >= 85);
    if (masteredTopics.length > 0) {
      const topicsToSkip = masteredTopics.map(t => t.topic);
      
      // Find days with only mastered topics
      const skippableDays = roadmap.schedule.dailyPlans.filter(day => {
        const dayTopics = day.skills || [];
        return dayTopics.every(topic => topicsToSkip.includes(topic));
      });
      
      if (skippableDays.length > 0) {
        adaptations.push({
          type: 'compress',
          priority: 'medium',
          trigger: 'topic_mastered',
          reason: `${masteredTopics.length} topics already mastered - compressing schedule`,
          details: {
            masteredTopics: topicsToSkip,
            daysToCompress: skippableDays.length,
            freedUpDays: skippableDays.map(d => d.day)
          },
          aiConfidence: 80
        });
      }
    }
    
    // Rule 4: Difficulty Adjustment
    if (performanceData.averageQuizScore > 85) {
      adaptations.push({
        type: 'difficulty_change',
        priority: 'medium',
        trigger: 'high_performance',
        reason: 'Consistently high scores - increasing difficulty',
        details: {
          currentAverage: performanceData.averageQuizScore,
          newDifficulty: 'advanced',
          applyTo: 'upcoming_tasks'
        },
        aiConfidence: 75
      });
    } else if (performanceData.averageQuizScore < 50) {
      adaptations.push({
        type: 'difficulty_change',
        priority: 'high',
        trigger: 'low_performance',
        reason: 'Struggling with current difficulty - adding foundational topics',
        details: {
          currentAverage: performanceData.averageQuizScore,
          newDifficulty: 'beginner',
          applyTo: 'upcoming_tasks',
          addFundamentals: true
        },
        aiConfidence: 85
      });
    }
    
    // Rule 5: Resume Gap Focus
    const resumeGaps = roadmap.aiInsights?.predictedWeaknesses || [];
    if (resumeGaps.length > 0) {
      const uncoveredGaps = resumeGaps.filter(gap => 
        !performanceData.completedTasks.some(t => 
          t.topic.toLowerCase().includes(gap.toLowerCase())
        )
      );
      
      if (uncoveredGaps.length > 0) {
        adaptations.push({
          type: 'insert',
          priority: 'high',
          trigger: 'resume_gap',
          reason: `Resume gaps not yet addressed: ${uncoveredGaps.join(', ')}`,
          details: {
            gaps: uncoveredGaps,
            insertBefore: roadmap.schedule.endDate,
            dedicatedDays: Math.min(3, uncoveredGaps.length)
          },
          aiConfidence: 90
        });
      }
    }
    
    // Rule 6: Interview Readiness Preparation
    const daysUntilEnd = Math.ceil((roadmap.schedule.endDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd <= 14 && daysUntilEnd > 0) {
      adaptations.push({
        type: 'modify',
        priority: 'high',
        trigger: 'time_based',
        reason: `Interview approaching in ${daysUntilEnd} days - switching to revision mode`,
        details: {
          remainingDays: daysUntilEnd,
          strategy: 'revision_focus',
          focusAreas: performanceData.weakTopics.slice(0, 3).map(t => t.topic),
          addMockInterviews: true
        },
        aiConfidence: 95
      });
    }
    
    // Rule 7: Streak Recovery
    if (roadmap.progress.currentStreak === 0 && roadmap.progress.longestStreak > 3) {
      adaptations.push({
        type: 'modify',
        priority: 'medium',
        trigger: 'streak_broken',
        reason: 'Study streak broken - adjusting to easier restart',
        details: {
          reduceDailyLoad: true,
          focusOn: 'quick_wins',
          motivationalMessage: true
        },
        aiConfidence: 70
      });
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return adaptations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
  
  /**
   * Apply a specific adaptation to the roadmap
   */
  static async applyAdaptation(roadmap, adaptation, userId) {
    switch (adaptation.type) {
      case 'insert':
        await this.insertExtraDays(roadmap, adaptation.details);
        break;
        
      case 'reorder':
        await this.reorderSchedule(roadmap, adaptation.details);
        break;
        
      case 'compress':
        await this.compressSchedule(roadmap, adaptation.details);
        break;
        
      case 'difficulty_change':
        await this.adjustDifficulty(roadmap, adaptation.details);
        break;
        
      case 'modify':
        await this.modifySchedule(roadmap, adaptation.details, userId);
        break;
        
      case 'reinforce':
        await this.reinforceTopic(roadmap, adaptation.details);
        break;
    }
    
    // Log the adaptation
    roadmap.adjustments.push({
      date: new Date(),
      type: adaptation.type,
      reason: adaptation.reason,
      trigger: adaptation.trigger,
      details: adaptation.details,
      aiConfidence: adaptation.aiConfidence
    });
    
    await roadmap.save();
  }
  
  /**
   * Insert extra days for weak topics
   */
  static async insertExtraDays(roadmap, details) {
    const { topic, days, insertAfter, tasks } = details;
    
    // Find insertion point
    let insertIndex = roadmap.schedule.dailyPlans.findIndex(
      d => d.day === insertAfter
    ) + 1;
    
    if (insertIndex === 0) insertIndex = roadmap.schedule.dailyPlans.length;
    
    // Generate new days
    const newDays = [];
    for (let i = 0; i < days; i++) {
      const dayNumber = insertIndex + i + 1;
      newDays.push({
        day: dayNumber,
        date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000),
        focus: topic,
        theme: `${topic} Deep Dive ${i + 1}`,
        tasks: [], // Will be populated with SmartTasks
        skills: [topic],
        estimatedXP: 150,
        aiInsight: `Extra practice day for ${topic} based on performance analysis`
      });
    }
    
    // Insert new days and renumber subsequent days
    roadmap.schedule.dailyPlans.splice(insertIndex, 0, ...newDays);
    
    // Renumber all days
    for (let i = 0; i < roadmap.schedule.dailyPlans.length; i++) {
      roadmap.schedule.dailyPlans[i].day = i + 1;
    }
    
    // Update total days
    roadmap.progress.totalDays = roadmap.schedule.dailyPlans.length;
    roadmap.schedule.endDate = roadmap.schedule.dailyPlans[roadmap.schedule.dailyPlans.length - 1].date;
    
    console.log(`[AdaptiveEngine] Inserted ${days} days for ${topic}`);
  }
  
  /**
   * Reorder schedule to prioritize overdue tasks
   */
  static async reorderSchedule(roadmap, details) {
    const { affectedTopics, strategy } = details;
    
    if (strategy === 'compress_upcoming') {
      // Mark overdue tasks for priority and compress upcoming easy tasks
      for (const day of roadmap.schedule.dailyPlans) {
        const isOverdue = day.date < new Date() && day.status !== 'completed';
        
        if (isOverdue) {
          // Prioritize overdue tasks
          for (const task of day.tasks) {
            task.priority = 'urgent';
          }
        }
      }
    }
    
    console.log(`[AdaptiveEngine] Reordered schedule for ${affectedTopics.length} topics`);
  }
  
  /**
   * Compress schedule by removing/skipping mastered topics
   */
  static async compressSchedule(roadmap, details) {
    const { masteredTopics, daysToCompress, freedUpDays } = details;
    
    // Mark days with mastered topics as compressed
    for (const day of roadmap.schedule.dailyPlans) {
      if (freedUpDays.includes(day.day)) {
        // Replace tasks with quick revision
        day.tasks = day.tasks.map(task => ({
          ...task,
          status: 'compressed',
          compressedReason: 'topic_mastered'
        }));
        
        day.focus = 'Quick Revision';
        day.aiInsight = `Compressed: ${day.skills.join(', ')} already mastered`;
      }
    }
    
    console.log(`[AdaptiveEngine] Compressed ${daysToCompress} days`);
  }
  
  /**
   * Adjust difficulty of upcoming tasks
   */
  static async adjustDifficulty(roadmap, details) {
    const { newDifficulty, applyTo } = details;
    
    if (applyTo === 'upcoming_tasks') {
      const today = new Date();
      
      for (const day of roadmap.schedule.dailyPlans) {
        if (day.date >= today) {
          for (const task of day.tasks) {
            // Update task difficulty preference (actual SmartTask update needed)
            task.preferredDifficulty = newDifficulty;
          }
          
          day.aiInsight = `Difficulty adjusted to ${newDifficulty} based on performance`;
        }
      }
    }
    
    console.log(`[AdaptiveEngine] Adjusted difficulty to ${newDifficulty}`);
  }
  
  /**
   * Modify schedule based on specific needs
   */
  static async modifySchedule(roadmap, details, userId) {
    const { strategy, focusAreas, addMockInterviews } = details;
    
    if (strategy === 'revision_focus') {
      // Mark upcoming days as revision mode
      const today = new Date();
      const upcomingDays = roadmap.schedule.dailyPlans.filter(d => d.date >= today);
      
      for (const day of upcomingDays) {
        // Add revision tasks for weak areas
        const revisionTasks = focusAreas.map(topic => ({
          taskId: `revision_${topic}_${day.day}`,
          status: 'available',
          estimatedDuration: 30,
          focus: 'revision',
          topic
        }));
        
        day.tasks.unshift(...revisionTasks);
        day.focus = 'Revision Mode';
        day.aiInsight = `Revision focus: ${focusAreas.join(', ')}`;
      }
    }
    
    if (addMockInterviews) {
      // Add mock interview tasks to final days
      const lastWeek = roadmap.schedule.dailyPlans.slice(-7);
      
      for (const day of lastWeek) {
        day.tasks.push({
          taskId: `mock_interview_${day.day}`,
          status: 'available',
          estimatedDuration: 60,
          focus: 'interview_practice'
        });
      }
    }
    
    console.log(`[AdaptiveEngine] Modified schedule with strategy: ${strategy}`);
  }
  
  /**
   * Reinforce a specific topic
   */
  static async reinforceTopic(roadmap, details) {
    const { topic, reinforcementDays } = details;
    
    // Similar to insert but specifically for reinforcement
    console.log(`[AdaptiveEngine] Reinforcing topic: ${topic}`);
  }
  
  /**
   * Find best insertion point for new days
   */
  static findBestInsertionPoint(roadmap, topic) {
    // Find day where related topics are being covered
    const relatedDay = roadmap.schedule.dailyPlans.find(day => 
      day.skills.some(skill => 
        skill.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    if (relatedDay) {
      return relatedDay.day;
    }
    
    // Default: insert after current day
    const currentDay = this.getCurrentDay(roadmap);
    return currentDay > 0 ? currentDay : 1;
  }
  
  /**
   * Get current day of roadmap
   */
  static getCurrentDay(roadmap) {
    const today = new Date();
    const day = roadmap.schedule.dailyPlans.find(d => {
      const dayDate = new Date(d.date);
      return dayDate.toDateString() === today.toDateString();
    });
    
    return day?.day || Math.floor((today - roadmap.schedule.startDate) / (1000 * 60 * 60 * 24)) + 1;
  }
  
  /**
   * Get AI-powered adaptation suggestions
   */
  static async getAIAdaptationSuggestions(roadmap, performanceData) {
    const prompt = `
Analyze this roadmap and performance data to suggest adaptations:

Roadmap Type: ${roadmap.type}
Progress: ${roadmap.progress.overallCompletion}%
Remaining Days: ${Math.ceil((roadmap.schedule.endDate - new Date()) / (1000 * 60 * 60 * 24))}

Performance Summary:
- Completed Tasks: ${performanceData.completedTasks.length}
- Overdue Tasks: ${performanceData.overdueTasks.length}
- Average Quiz Score: ${performanceData.averageQuizScore || 'N/A'}%
- Weak Topics: ${performanceData.weakTopics.map(t => t.topic).join(', ')}
- Strong Topics: ${performanceData.strongTopics.map(t => t.topic).join(', ')}

Suggest 2-3 specific adaptations to improve the roadmap.

Format as JSON:
{
  "adaptations": [
    {
      "type": "insert|compress|reorder|modify",
      "reason": "string",
      "priority": "high|medium|low",
      "details": {}
    }
  ],
  "recommendations": ["string"]
}
`;
    
    try {
      const response = await AIService.generateContent(prompt, { temperature: 0.7 });
      const suggestions = JSON.parse(response);
      return suggestions.adaptations || [];
    } catch (error) {
      console.error('[AdaptiveEngine] AI suggestions failed:', error);
      return [];
    }
  }
  
  /**
   * Weekly adaptation check - run this periodically
   */
  static async runWeeklyAdaptation() {
    console.log('[AdaptiveEngine] Running weekly adaptation check...');
    
    const activeRoadmaps = await RoadmapV2.find({
      status: 'active',
      'settings.autoAdjust': true
    });
    
    for (const roadmap of activeRoadmaps) {
      try {
        // Check if last adaptation was more than 7 days ago
        const lastAdaptation = roadmap.adjustments[roadmap.adjustments.length - 1];
        const daysSinceLastAdaptation = lastAdaptation 
          ? Math.floor((new Date() - lastAdaptation.date) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (daysSinceLastAdaptation >= 7) {
          await this.adaptRoadmap(roadmap._id, roadmap.userId);
        }
      } catch (error) {
        console.error(`[AdaptiveEngine] Failed to adapt roadmap ${roadmap._id}:`, error);
      }
    }
    
    console.log(`[AdaptiveEngine] Weekly check complete. Processed ${activeRoadmaps.length} roadmaps.`);
  }
  
  /**
   * Emergency adaptation - for last-minute changes
   */
  static async emergencyAdaptation(roadmapId, reason) {
    const emergencyStrategies = {
      'exam_in_7_days': {
        type: 'modify',
        priority: 'critical',
        details: {
          strategy: 'intensive_revision',
          focusOnlyOnWeakAreas: true,
          skipAllNewTopics: true,
          doubleMockInterviews: true
        }
      },
      'failed_mock_interview': {
        type: 'insert',
        priority: 'critical',
        details: {
          days: 3,
          focus: 'interview_recovery',
          insertBefore: 'end'
        }
      },
      'low_confidence': {
        type: 'modify',
        priority: 'high',
        details: {
          strategy: 'confidence_building',
          focusOnQuickWins: true,
          reduceDailyLoad: true
        }
      }
    };
    
    const strategy = emergencyStrategies[reason];
    if (!strategy) return;
    
    const roadmap = await RoadmapV2.findById(roadmapId);
    if (!roadmap) return;
    
    await this.applyAdaptation(roadmap, strategy, roadmap.userId);
    await roadmap.save();
    
    console.log(`[AdaptiveEngine] Emergency adaptation applied: ${reason}`);
  }
}

module.exports = AdaptiveEngine;
