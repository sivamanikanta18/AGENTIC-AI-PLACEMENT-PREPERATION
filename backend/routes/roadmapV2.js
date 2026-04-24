const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RoadmapGenerationService = require('../services/RoadmapGenerationService');
const AdaptiveEngine = require('../services/AdaptiveEngine');
const RoadmapV2 = require('../models/RoadmapV2');
const RoadmapTemplate = require('../models/RoadmapTemplate');
const SmartTask = require('../models/SmartTask');
const TopicMastery = require('../models/TopicMastery');

/**
 * POST /api/roadmaps - Generate new roadmap
 * Supports: role-based, company-specific, skill-focused, emergency modes
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      type = 'role_based',
      subtype,
      targetRole,
      company,
      duration = 60,
      intensity = 'medium',
      focusAreas = [],
      preferences = {}
    } = req.body;

    console.log(`[RoadmapV2] Generating roadmap for user ${req.user._id}`);
    console.log(`[RoadmapV2] Type: ${type}, Subtype: ${subtype}`);

    // Get resume and feedback data for personalization
    const Resume = require('../models/Resume');
    const Feedback = require('../models/Feedback');
    
    const [resume, feedback] = await Promise.all([
      Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
      Feedback.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
    ]);

    // Generate roadmap using the new service
    const result = await RoadmapGenerationService.generateRoadmap(
      req.user._id,
      {
        type,
        subtype,
        targetRole,
        company,
        duration,
        intensity,
        focusAreas,
        preferences,
        resumeData: resume,
        feedbackData: feedback
      }
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('[RoadmapV2] Generation error:', error);
    res.status(500).json({
      error: 'Failed to generate roadmap',
      message: error.message
    });
  }
});

/**
 * GET /api/roadmaps - List all user roadmaps
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;
    
    const roadmaps = await RoadmapV2.find(query)
      .select('name type status progress target schedule.startDate schedule.endDate createdAt')
      .sort({ createdAt: -1 });
    
    // Get stats
    const stats = await RoadmapV2.getStats(req.user._id);
    
    res.json({
      roadmaps,
      stats,
      total: roadmaps.length
    });
  } catch (error) {
    console.error('[RoadmapV2] List error:', error);
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

/**
 * GET /api/roadmaps/stats - Get roadmap statistics
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await RoadmapV2.getStats(req.user._id);
    
    // Get topic mastery summary
    const topicMastery = await TopicMastery.findOne({ userId: req.user._id });
    
    res.json({
      ...stats,
      topicMastery: topicMastery ? {
        totalTopics: topicMastery.summary.totalTopics,
        masteredTopics: topicMastery.summary.masteredTopics,
        averageMastery: topicMastery.summary.averageMastery,
        weakAreas: topicMastery.getWeakTopics(50).slice(0, 5),
        strongAreas: topicMastery.getStrongTopics(80).slice(0, 5)
      } : null
    });
  } catch (error) {
    console.error('[RoadmapV2] Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/roadmaps/templates - Get available roadmap templates
 */
router.get('/templates', auth, async (req, res) => {
  try {
    const { type, company } = req.query;
    
    let templates;
    
    if (company) {
      templates = await RoadmapTemplate.getForCompany(company);
    } else if (type) {
      templates = await RoadmapTemplate.getByType(type);
    } else {
      templates = await RoadmapTemplate.find({
        isActive: true,
        isPublic: true
      }).sort({ 'successMetrics.interviewSuccessRate': -1 });
    }
    
    // Group by type for frontend display
    const grouped = templates.reduce((acc, template) => {
      if (!acc[template.type]) acc[template.type] = [];
      acc[template.type].push(template);
      return acc;
    }, {});
    
    res.json({
      templates,
      grouped,
      types: Object.keys(grouped),
      companies: [...new Set(templates.filter(t => t.type === 'company_specific').map(t => t.companyDetails?.company))]
    });
  } catch (error) {
    console.error('[RoadmapV2] Templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/roadmaps/templates/recommended - Get recommended templates for user
 */
router.get('/templates/recommended', auth, async (req, res) => {
  try {
    // Get user profile
    const User = require('../models/User');
    const Resume = require('../models/Resume');
    
    const [user, resume] = await Promise.all([
      User.findById(req.user._id),
      Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
    ]);
    
    const userProfile = {
      targetRole: user?.targetRole || 'Software Developer',
      currentLevel: resume?.analysis?.proficiency || 'beginner',
      weakAreas: resume?.analysis?.weak_areas || []
    };
    
    const templates = await RoadmapTemplate.getRecommended(userProfile);
    
    res.json({
      templates,
      basedOn: {
        role: userProfile.targetRole,
        level: userProfile.currentLevel,
        weakAreas: userProfile.weakAreas.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('[RoadmapV2] Recommended templates error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * GET /api/roadmaps/:id - Get specific roadmap with full details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const roadmap = await RoadmapV2.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('schedule.dailyPlans.tasks.smartTaskRef');
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    // Get upcoming tasks
    const upcomingTasks = roadmap.getUpcomingTasks(7);
    
    // Get overdue tasks
    const overdueTasks = roadmap.getOverdueTasks();
    
    // Get weak areas
    const weakAreas = roadmap.getWeakAreas();
    
    res.json({
      roadmap,
      upcomingTasks,
      overdueTasks,
      weakAreas,
      canAdapt: roadmap.settings?.autoAdjust !== false
    });
  } catch (error) {
    console.error('[RoadmapV2] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch roadmap' });
  }
});

/**
 * POST /api/roadmaps/:id/adapt - Trigger AI adaptation
 */
router.post('/:id/adapt', auth, async (req, res) => {
  try {
    const { emergencyReason } = req.body;
    
    if (emergencyReason) {
      // Emergency adaptation
      const result = await AdaptiveEngine.emergencyAdaptation(
        req.params.id,
        emergencyReason
      );
      return res.json({ success: true, message: 'Emergency adaptation applied' });
    }
    
    // Regular adaptation
    const result = await AdaptiveEngine.adaptRoadmap(
      req.params.id,
      req.user._id
    );
    
    res.json(result);
  } catch (error) {
    console.error('[RoadmapV2] Adaptation error:', error);
    res.status(500).json({ error: 'Failed to adapt roadmap' });
  }
});

/**
 * GET /api/roadmaps/:id/adaptations - Get adaptation history
 */
router.get('/:id/adaptations', auth, async (req, res) => {
  try {
    const roadmap = await RoadmapV2.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('adjustments version');
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    res.json({
      adaptations: roadmap.adjustments,
      total: roadmap.adjustments.length,
      currentVersion: roadmap.version
    });
  } catch (error) {
    console.error('[RoadmapV2] Adaptations error:', error);
    res.status(500).json({ error: 'Failed to fetch adaptations' });
  }
});

/**
 * POST /api/roadmaps/:id/tasks/:taskId/complete - Mark task as complete
 */
router.post('/:id/tasks/:taskId/complete', auth, async (req, res) => {
  try {
    const { dayNumber, score, notes, timeSpent } = req.body;
    
    const roadmap = await RoadmapV2.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    // Update task in roadmap
    const success = await roadmap.updateTaskStatus(
      dayNumber,
      req.params.taskId,
      'completed',
      { score, notes, actualTimeSpent: timeSpent }
    );
    
    if (!success) {
      return res.status(400).json({ error: 'Task not found' });
    }
    
    // Update SmartTask progress
    const smartTask = await SmartTask.findOne({ taskId: req.params.taskId });
    if (smartTask) {
      smartTask.progress.set(req.user._id.toString(), {
        status: 'completed',
        completedAt: new Date(),
        score,
        notes,
        timeSpent
      });
      await smartTask.save();
    }
    
    // Update topic mastery
    const topicMastery = await TopicMastery.getOrCreate(req.user._id);
    await topicMastery.updateTopicProgress(smartTask?.topic || 'General', {
      completedTasks: { $inc: 1 },
      masteryLevel: score || 70
    });
    
    // Award XP
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'gamification.xp': smartTask?.xpReward || 50 }
    });
    
    res.json({
      success: true,
      xpEarned: smartTask?.xpReward || 50,
      progress: roadmap.progress,
      message: 'Task completed successfully!'
    });
  } catch (error) {
    console.error('[RoadmapV2] Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

/**
 * POST /api/roadmaps/:id/tasks/:taskId/quiz/submit - Submit quiz answers
 */
router.post('/:id/tasks/:taskId/quiz/submit', auth, async (req, res) => {
  try {
    const { answers, dayNumber } = req.body;
    
    const smartTask = await SmartTask.findOne({ taskId: req.params.taskId });
    if (!smartTask || !smartTask.quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Calculate score
    let correct = 0;
    const results = smartTask.quiz.questions.map((q, index) => {
      const isCorrect = answers[index] === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        question: q.question,
        yourAnswer: answers[index],
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });
    
    const score = Math.round((correct / smartTask.quiz.questions.length) * 100);
    const passed = score >= smartTask.quiz.passingScore;
    
    // Update progress
    const progress = smartTask.progress.get(req.user._id.toString()) || {};
    progress.quizScore = score;
    progress.quizAttempts = (progress.quizAttempts || 0) + 1;
    smartTask.progress.set(req.user._id.toString(), progress);
    await smartTask.save();
    
    res.json({
      score,
      passed,
      results,
      totalQuestions: smartTask.quiz.questions.length,
      correctAnswers: correct,
      xpEarned: passed ? 30 : 10
    });
  } catch (error) {
    console.error('[RoadmapV2] Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

/**
 * GET /api/roadmaps/:id/progress - Get detailed progress analytics
 */
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const roadmap = await RoadmapV2.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    // Calculate detailed metrics
    const metrics = {
      overall: {
        completion: roadmap.progress.overallCompletion,
        daysCompleted: roadmap.progress.daysCompleted,
        totalDays: roadmap.progress.totalDays,
        currentStreak: roadmap.progress.currentStreak,
        longestStreak: roadmap.progress.longestStreak
      },
      tasks: {
        total: roadmap.progress.totalTasks,
        completed: roadmap.progress.completedTasks,
        skipped: roadmap.progress.skippedTasks || 0,
        overdue: roadmap.progress.overdueTasks || 0,
        completionRate: roadmap.progress.totalTasks > 0
          ? Math.round((roadmap.progress.completedTasks / roadmap.progress.totalTasks) * 100)
          : 0
      },
      xp: {
        earned: roadmap.progress.totalXP,
        level: roadmap.progress.level,
        badges: roadmap.progress.badges
      },
      topicCoverage: roadmap.topicCoverage.map(tc => ({
        topic: tc.topic,
        status: tc.status,
        days: tc.days.length,
        completed: tc.days.filter(d => {
          const day = roadmap.schedule.dailyPlans.find(p => p.day === d);
          return day?.status === 'completed';
        }).length
      }))
    };
    
    // Get performance history
    const performanceHistory = roadmap.performanceHistory.slice(-5);
    
    res.json({
      metrics,
      performanceHistory,
      aiInsights: roadmap.aiInsights
    });
  } catch (error) {
    console.error('[RoadmapV2] Progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * GET /api/roadmaps/:id/upcoming - Get upcoming tasks
 */
router.get('/:id/upcoming', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const roadmap = await RoadmapV2.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    const upcoming = roadmap.getUpcomingTasks(parseInt(days));
    
    res.json({
      upcomingTasks: upcoming,
      count: upcoming.length,
      days
    });
  } catch (error) {
    console.error('[RoadmapV2] Upcoming error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming tasks' });
  }
});

/**
 * PUT /api/roadmaps/:id - Update roadmap settings
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { settings, status } = req.body;
    
    const roadmap = await RoadmapV2.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        ...(settings && { settings: { ...settings } }),
        ...(status && { status }),
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    res.json({
      success: true,
      roadmap,
      message: 'Roadmap updated successfully'
    });
  } catch (error) {
    console.error('[RoadmapV2] Update error:', error);
    res.status(500).json({ error: 'Failed to update roadmap' });
  }
});

/**
 * DELETE /api/roadmaps/:id - Archive/delete roadmap
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const roadmap = await RoadmapV2.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'archived' },
      { new: true }
    );
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    res.json({
      success: true,
      message: 'Roadmap archived successfully'
    });
  } catch (error) {
    console.error('[RoadmapV2] Delete error:', error);
    res.status(500).json({ error: 'Failed to archive roadmap' });
  }
});

module.exports = router;
