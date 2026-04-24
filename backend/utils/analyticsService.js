const UserActivity = require('../models/UserActivity');

/**
 * Analytics Service for tracking user activities and generating reports
 */
class AnalyticsService {
  
  /**
   * Track a user activity
   */
  static async trackActivity(userId, type, action, metadata = {}, duration = 0, score = null, result = null) {
    try {
      const activity = new UserActivity({
        userId,
        type,
        action,
        metadata,
        duration,
        score,
        result
      });
      
      await activity.save();
      console.log(`[Analytics] Tracked: ${type} - ${action} for user ${userId}`);
      return activity;
    } catch (error) {
      console.error('[Analytics] Track activity error:', error.message);
      return null;
    }
  }
  
  /**
   * Start tracking an activity (for duration tracking)
   */
  static async startActivity(userId, type, action, metadata = {}) {
    try {
      const activity = new UserActivity({
        userId,
        type,
        action,
        metadata,
        startedAt: new Date()
      });
      
      await activity.save();
      return activity._id; // Return activity ID to update later
    } catch (error) {
      console.error('[Analytics] Start activity error:', error.message);
      return null;
    }
  }
  
  /**
   * Complete an activity and calculate duration
   */
  static async completeActivity(activityId, score = null, result = null, metadataUpdates = {}) {
    try {
      const activity = await UserActivity.findById(activityId);
      if (!activity) return null;
      
      const completedAt = new Date();
      const duration = Math.round((completedAt - activity.startedAt) / 1000); // in seconds
      
      activity.completedAt = completedAt;
      activity.duration = duration;
      activity.score = score;
      activity.result = result;
      
      if (Object.keys(metadataUpdates).length > 0) {
        activity.metadata = { ...activity.metadata, ...metadataUpdates };
      }
      
      await activity.save();
      console.log(`[Analytics] Completed: ${activity.action} in ${duration}s`);
      return activity;
    } catch (error) {
      console.error('[Analytics] Complete activity error:', error.message);
      return null;
    }
  }
  
  /**
   * Get user dashboard stats
   */
  static async getUserDashboard(userId) {
    try {
      // Total time spent
      const timeStats = await UserActivity.getTotalTimeSpent(userId);
      
      // Activity breakdown by type
      const typeStats = await UserActivity.getUserStats(userId, 30);
      
      // Daily activity for the last 7 days
      const dailyActivity = await UserActivity.getDailyActivity(userId, 7);
      
      // Recent activities
      const recentActivities = await UserActivity.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      // Calculate streak
      const streak = await this.calculateStreak(userId);
      
      // Interview stats
      const interviewStats = await this.getInterviewStats(userId);
      
      // Coding stats
      const codingStats = await this.getCodingStats(userId);
      
      return {
        totalTimeSpent: timeStats.totalSeconds,
        totalActivities: timeStats.totalActivities,
        currentStreak: streak,
        typeBreakdown: typeStats,
        dailyActivity,
        recentActivities,
        interviewStats,
        codingStats,
        lastActive: recentActivities[0]?.createdAt || null
      };
    } catch (error) {
      console.error('[Analytics] Dashboard error:', error.message);
      return null;
    }
  }
  
  /**
   * Calculate user streak (consecutive days with activity)
   */
  static async calculateStreak(userId) {
    try {
      const activities = await UserActivity.aggregate([
        {
          $match: { userId: new require('mongoose').Types.ObjectId(userId) }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          }
        },
        { $sort: { _id: -1 } }
      ]);
      
      if (activities.length === 0) return 0;
      
      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < activities.length - 1; i++) {
        const current = new Date(activities[i]._id);
        const next = new Date(activities[i + 1]._id);
        
        const diffDays = (current - next) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
      
      // Check if last activity was today or yesterday
      const lastActivity = new Date(activities[0]._id);
      const daysSince = (today - lastActivity) / (1000 * 60 * 60 * 24);
      
      if (daysSince > 1) {
        return 0; // Streak broken
      }
      
      return streak;
    } catch (error) {
      console.error('[Analytics] Streak calculation error:', error.message);
      return 0;
    }
  }
  
  /**
   * Get interview-specific stats
   */
  static async getInterviewStats(userId) {
    try {
      const interviews = await UserActivity.find({
        userId,
        type: 'interview'
      }).sort({ createdAt: -1 });
      
      const totalInterviews = interviews.filter(a => a.action === 'started_interview').length;
      const completedInterviews = interviews.filter(a => a.action === 'completed_interview').length;
      const avgScore = interviews
        .filter(a => a.score !== null)
        .reduce((sum, a) => sum + a.score, 0) / (interviews.filter(a => a.score !== null).length || 1);
      
      const totalDuration = interviews.reduce((sum, a) => sum + (a.duration || 0), 0);
      
      return {
        totalInterviews,
        completedInterviews,
        averageScore: Math.round(avgScore * 10) / 10,
        totalTimeMinutes: Math.round(totalDuration / 60)
      };
    } catch (error) {
      console.error('[Analytics] Interview stats error:', error.message);
      return null;
    }
  }
  
  /**
   * Get coding-specific stats
   */
  static async getCodingStats(userId) {
    try {
      const coding = await UserActivity.find({
        userId,
        type: { $in: ['coding', 'mock_test'] }
      }).sort({ createdAt: -1 });
      
      const totalProblems = coding.filter(a => 
        a.action === 'submitted_solution' || a.action === 'completed_problem'
      ).length;
      
      const passedProblems = coding.filter(a => 
        (a.action === 'submitted_solution' || a.action === 'completed_problem') && 
        a.result === 'success'
      ).length;
      
      const totalDuration = coding.reduce((sum, a) => sum + (a.duration || 0), 0);
      
      return {
        totalProblems,
        passedProblems,
        passRate: totalProblems > 0 ? Math.round((passedProblems / totalProblems) * 100) : 0,
        totalTimeMinutes: Math.round(totalDuration / 60)
      };
    } catch (error) {
      console.error('[Analytics] Coding stats error:', error.message);
      return null;
    }
  }
  
  /**
   * Get user activity summary for admin/analytics
   */
  static async getSystemStats(days = 7) {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const stats = await UserActivity.aggregate([
        {
          $match: { createdAt: { $gte: since } }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $addToSet: '$userId' },
            totalActivities: { $sum: 1 },
            avgDuration: { $avg: '$duration' }
          }
        }
      ]);
      
      const activityByType = await UserActivity.aggregate([
        {
          $match: { createdAt: { $gte: since } }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);
      
      return {
        activeUsers: stats[0]?.totalUsers?.length || 0,
        totalActivities: stats[0]?.totalActivities || 0,
        avgActivityDuration: Math.round((stats[0]?.avgDuration || 0) / 60), // minutes
        activityByType
      };
    } catch (error) {
      console.error('[Analytics] System stats error:', error.message);
      return null;
    }
  }

  /**
   * Generate comprehensive feedback report based on user's entire performance
   */
  static async generateComprehensiveFeedback(userId) {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get all activities
      const activities = await UserActivity.find({
        userId: new require('mongoose').Types.ObjectId(userId),
        createdAt: { $gte: since }
      }).sort({ createdAt: -1 });
      
      // Calculate metrics
      const interviewActivities = activities.filter(a => a.type === 'interview');
      const codingActivities = activities.filter(a => a.type === 'coding' || a.type === 'mock_test');
      const resumeActivities = activities.filter(a => a.type === 'resume_upload');
      
      const completedInterviews = interviewActivities.filter(a => a.action === 'completed_interview');
      const submittedSolutions = codingActivities.filter(a => a.action === 'submitted_solution');
      
      const avgInterviewScore = completedInterviews.length > 0 
        ? completedInterviews.reduce((sum, a) => sum + (a.score || 0), 0) / completedInterviews.length 
        : 0;
      
      const avgCodingScore = submittedSolutions.length > 0
        ? submittedSolutions.reduce((sum, a) => sum + (a.score || 0), 0) / submittedSolutions.length
        : 0;
      
      const passedProblems = submittedSolutions.filter(a => a.result === 'success').length;
      
      // Time distribution
      const timeByType = activities.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + (a.duration || 0);
        return acc;
      }, {});
      
      // Streak info
      const streak = await this.calculateStreak(userId);
      
      // Generate AI feedback (mock for now, can be enhanced with real AI)
      const feedback = {
        overall: {
          score: Math.round((avgInterviewScore + avgCodingScore) / 2) || 0,
          level: this.getPerformanceLevel(avgInterviewScore, avgCodingScore),
          trend: this.calculateTrend(activities)
        },
        interviews: {
          total: completedInterviews.length,
          averageScore: Math.round(avgInterviewScore * 10) / 10,
          strengths: this.identifyInterviewStrengths(interviewActivities),
          weaknesses: this.identifyInterviewWeaknesses(interviewActivities),
          recommendations: this.generateInterviewRecommendations(completedInterviews)
        },
        coding: {
          totalProblems: submittedSolutions.length,
          passed: passedProblems,
          passRate: submittedSolutions.length > 0 ? Math.round((passedProblems / submittedSolutions.length) * 100) : 0,
          averageScore: Math.round(avgCodingScore * 10) / 10,
          strengths: this.identifyCodingStrengths(codingActivities),
          weaknesses: this.identifyCodingWeaknesses(codingActivities),
          recommendations: this.generateCodingRecommendations(codingActivities)
        },
        engagement: {
          daysActive: [...new Set(activities.map(a => a.createdAt.toDateString()))].length,
          totalTimeHours: Math.round((Object.values(timeByType).reduce((a, b) => a + b, 0) / 3600) * 10) / 10,
          currentStreak: streak,
          consistency: this.calculateConsistency(activities)
        },
        resume: {
          uploads: resumeActivities.length,
          lastUpload: resumeActivities[0]?.createdAt || null,
          confidence: resumeActivities[0]?.metadata?.confidenceScore || null
        },
        actionItems: this.generateActionItems(activities, avgInterviewScore, avgCodingScore),
        generatedAt: new Date()
      };
      
      return feedback;
    } catch (error) {
      console.error('[Analytics] Comprehensive feedback error:', error.message);
      return null;
    }
  }
  
  static getPerformanceLevel(interviewScore, codingScore) {
    const avg = (interviewScore + codingScore) / 2;
    if (avg >= 8) return 'Expert';
    if (avg >= 6) return 'Advanced';
    if (avg >= 4) return 'Intermediate';
    return 'Beginner';
  }
  
  static calculateTrend(activities) {
    const recent = activities.slice(0, 10);
    const older = activities.slice(10, 20);
    
    const recentAvg = recent.filter(a => a.score).reduce((sum, a) => sum + a.score, 0) / (recent.filter(a => a.score).length || 1);
    const olderAvg = older.filter(a => a.score).reduce((sum, a) => sum + a.score, 0) / (older.filter(a => a.score).length || 1);
    
    if (recentAvg > olderAvg + 1) return 'improving';
    if (recentAvg < olderAvg - 1) return 'declining';
    return 'stable';
  }
  
  static identifyInterviewStrengths(activities) {
    const goodScores = activities.filter(a => a.score >= 7);
    if (goodScores.length === 0) return [];
    return ['Consistent performance', 'Good communication', 'Technical knowledge'];
  }
  
  static identifyInterviewWeaknesses(activities) {
    const poorScores = activities.filter(a => a.score && a.score < 5);
    if (poorScores.length === 0) return ['Practice more behavioral questions'];
    return ['System design questions', 'Time management', 'Edge case handling'];
  }
  
  static generateInterviewRecommendations(interviews) {
    if (interviews.length < 3) {
      return ['Complete at least 5 mock interviews to get accurate assessment'];
    }
    return [
      'Practice STAR method for behavioral questions',
      'Review system design fundamentals',
      'Work on explaining thought process clearly'
    ];
  }
  
  static identifyCodingStrengths(activities) {
    const passed = activities.filter(a => a.result === 'success');
    if (passed.length > 5) return ['Algorithm efficiency', 'Code readability', 'Problem decomposition'];
    return ['Basic understanding', 'Consistent practice'];
  }
  
  static identifyCodingWeaknesses(activities) {
    const failed = activities.filter(a => a.result === 'failure');
    if (failed.length > 3) return ['Edge cases', 'Time complexity optimization', 'Debug skills'];
    return ['Need more practice on hard problems'];
  }
  
  static generateCodingRecommendations(activities) {
    return [
      'Practice daily for 30 minutes minimum',
      'Focus on data structures first',
      'Review solutions after submission',
      'Practice explaining your code'
    ];
  }
  
  static calculateConsistency(activities) {
    const days = [...new Set(activities.map(a => a.createdAt.toDateString()))].length;
    if (days >= 20) return 'Excellent';
    if (days >= 10) return 'Good';
    if (days >= 5) return 'Moderate';
    return 'Low';
  }
  
  static generateActionItems(activities, interviewScore, codingScore) {
    const items = [];
    
    if (interviewScore < 5) {
      items.push({ priority: 'high', action: 'Schedule more mock interviews', category: 'interview' });
    }
    if (codingScore < 5) {
      items.push({ priority: 'high', action: 'Practice easy problems daily', category: 'coding' });
    }
    if (activities.filter(a => a.type === 'interview').length < 3) {
      items.push({ priority: 'medium', action: 'Complete at least 3 mock interviews', category: 'interview' });
    }
    if (activities.filter(a => a.type === 'coding').length < 5) {
      items.push({ priority: 'medium', action: 'Solve 5 coding problems this week', category: 'coding' });
    }
    
    return items.length > 0 ? items : [{ priority: 'low', action: 'Keep up the good work!', category: 'general' }];
  }
}

module.exports = AnalyticsService;
