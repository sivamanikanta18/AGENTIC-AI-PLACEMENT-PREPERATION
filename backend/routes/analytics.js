const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const AnalyticsService = require('../utils/analyticsService');
const UserActivity = require('../models/UserActivity');

/**
 * GET /api/analytics/dashboard
 * Get user dashboard with all stats
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const dashboard = await AnalyticsService.getUserDashboard(req.user._id);
    
    if (!dashboard) {
      return res.status(500).json({ error: 'Failed to load dashboard' });
    }
    
    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

/**
 * GET /api/analytics/stats
 * Get user activity stats
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const [typeStats, totalTime, dailyActivity] = await Promise.all([
      UserActivity.getUserStats(req.user._id, days),
      UserActivity.getTotalTimeSpent(req.user._id),
      UserActivity.getDailyActivity(req.user._id, 7)
    ]);
    
    res.json({
      success: true,
      stats: {
        typeBreakdown: typeStats,
        totalTimeSpent: totalTime.totalSeconds,
        totalActivities: totalTime.totalActivities,
        dailyActivity
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

/**
 * GET /api/analytics/activities
 * Get recent user activities
 */
router.get('/activities', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // Optional filter by type
    
    const query = { userId: req.user._id };
    if (type) query.type = type;
    
    const activities = await UserActivity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: 'Failed to load activities' });
  }
});

/**
 * GET /api/analytics/interview
 * Get interview-specific stats
 */
router.get('/interview', auth, async (req, res) => {
  try {
    const stats = await AnalyticsService.getInterviewStats(req.user._id);
    
    // Get recent interview sessions
    const recentInterviews = await UserActivity.find({
      userId: req.user._id,
      type: 'interview',
      action: 'completed_interview'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      stats,
      recentInterviews
    });
  } catch (error) {
    console.error('Interview analytics error:', error);
    res.status(500).json({ error: 'Failed to load interview stats' });
  }
});

/**
 * GET /api/analytics/coding
 * Get coding-specific stats
 */
router.get('/coding', auth, async (req, res) => {
  try {
    const stats = await AnalyticsService.getCodingStats(req.user._id);
    
    // Get recent coding submissions
    const recentSubmissions = await UserActivity.find({
      userId: req.user._id,
      type: { $in: ['coding', 'mock_test'] },
      action: { $in: ['submitted_solution', 'completed_problem'] }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    res.json({
      success: true,
      stats,
      recentSubmissions
    });
  } catch (error) {
    console.error('Coding analytics error:', error);
    res.status(500).json({ error: 'Failed to load coding stats' });
  }
});

/**
 * GET /api/analytics/streak
 * Get user streak info
 */
router.get('/streak', auth, async (req, res) => {
  try {
    const streak = await AnalyticsService.calculateStreak(req.user._id);
    
    // Get activity dates for calendar view
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activities = await UserActivity.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          duration: { $sum: '$duration' }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.json({
      success: true,
      streak,
      activityDays: activities
    });
  } catch (error) {
    console.error('Streak error:', error);
    res.status(500).json({ error: 'Failed to load streak' });
  }
});

/**
 * POST /api/analytics/track
 * Track a user activity (for frontend events)
 */
router.post('/track', auth, async (req, res) => {
  try {
    const { type, action, metadata, duration, score, result } = req.body;
    
    if (!type || !action) {
      return res.status(400).json({ error: 'Type and action are required' });
    }
    
    const activity = await AnalyticsService.trackActivity(
      req.user._id,
      type,
      action,
      metadata || {},
      duration || 0,
      score,
      result
    );
    
    if (!activity) {
      return res.status(500).json({ error: 'Failed to track activity' });
    }
    
    res.json({
      success: true,
      activityId: activity._id
    });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Failed to track activity' });
  }
});

/**
 * PUT /api/analytics/activity/:id
 * Update an activity (e.g., complete with score)
 */
router.put('/activity/:id', auth, async (req, res) => {
  try {
    const { score, result, metadata } = req.body;
    
    const activity = await AnalyticsService.completeActivity(
      req.params.id,
      score,
      result,
      metadata || {}
    );
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Verify ownership
    if (activity.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

/**
 * GET /api/analytics/feedback
 * Get comprehensive feedback report based on user's entire performance
 */
router.get('/feedback', auth, async (req, res) => {
  try {
    const feedback = await AnalyticsService.generateComprehensiveFeedback(req.user._id);
    
    if (!feedback) {
      return res.status(500).json({ error: 'Failed to generate feedback' });
    }
    
    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

module.exports = router;
