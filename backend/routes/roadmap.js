const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Roadmap = require('../models/Roadmap');
const Feedback = require('../models/Feedback');
const Resume = require('../models/Resume');
const User = require('../models/User');
const AIService = require('../utils/aiService');

// Generate new placement-focused roadmap
router.post('/generate', auth, async (req, res) => {
  try {
    const { targetRole, timeline, focusAreas } = req.body;

    // Get latest feedback and resume analysis
    const [latestFeedback, resume, user] = await Promise.all([
      Feedback.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
      Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
      User.findById(req.user._id)
    ]);

    // Check if user has uploaded resume
    if (!resume) {
      return res.status(400).json({ 
        error: 'Please upload your resume first to generate a personalized roadmap',
        message: 'Resume analysis is required to identify weak areas and create targeted preparation plan'
      });
    }

    const userProfile = {
      name: user.name,
      role: user.role,
      profile: user.profile,
      stats: user.stats,
      currentLevel: user.gamification.level,
      weakAreas: resume?.analysis?.weak_areas || ['System Design', 'Data Structures', 'Algorithms'],
      skills: resume?.analysis?.skills_detected?.map(s => s.name) || []
    };

    const feedbackData = latestFeedback ? {
      dimensions: latestFeedback.dimensions,
      actionItems: latestFeedback.actionItems,
      aiSummary: latestFeedback.aiSummary
    } : null;

    // Generate placement-focused roadmap with AI
    const roadmapData = await AIService.generateRoadmap(
      userProfile,
      feedbackData,
      targetRole || 'Software Developer'
    );

    // Create roadmap document
    const roadmap = new Roadmap({
      userId: req.user._id,
      generatedFrom: {
        feedbackId: latestFeedback?._id,
        resumeAnalysisId: resume?._id
      },
      target: {
        role: targetRole || 'Software Developer',
        timeline: timeline || roadmapData.schedule?.totalDays + ' days',
        focusAreas: focusAreas || roadmapData.target?.focusAreas || []
      },
      schedule: {
        startDate: new Date(),
        endDate: new Date(Date.now() + (roadmapData.schedule?.totalDays || 30) * 24 * 60 * 60 * 1000),
        dailyPlan: roadmapData.schedule?.dailyPlan?.map((day, index) => ({
          day: day.day || index + 1,
          date: new Date(Date.now() + index * 24 * 60 * 60 * 1000),
          focus: day.focus || 'Practice',
          tasks: day.tasks || [],
          skills: day.skills || [],
          estimatedXP: day.estimatedXP || 100
        })) || []
      },
      skillPath: roadmapData.skillPath || [],
      milestones: roadmapData.milestones?.map(m => ({
        ...m,
        targetDate: new Date(Date.now() + (m.estimatedDays || 7) * 24 * 60 * 60 * 1000)
      })) || [],
      progress: {
        totalDays: roadmapData.schedule?.totalDays || 30
      },
      aiInsights: roadmapData.aiInsights || {}
    });

    await roadmap.save();

    res.json({
      success: true,
      roadmapId: roadmap._id,
      roadmap,
      message: `Placement roadmap created! Focusing on your weak areas: ${userProfile.weakAreas.slice(0, 3).join(', ')}${userProfile.weakAreas.length > 3 ? ' and more' : ''}`,
      focusAreas: userProfile.weakAreas
    });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current roadmap
router.get('/current', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });

    if (!roadmap) {
      return res.status(404).json({ error: 'No roadmap found' });
    }

    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get roadmap by ID
router.get('/:roadmapId', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.roadmapId,
      userId: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get today's plan
router.get('/today/plan', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });

    if (!roadmap) {
      return res.status(404).json({ error: 'No roadmap found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysPlan = roadmap.schedule.dailyPlan.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });

    if (!todaysPlan) {
      return res.json({
        message: 'No specific plan for today',
        dayNumber: Math.floor((today - roadmap.schedule.startDate) / (1000 * 60 * 60 * 24)) + 1,
        overallProgress: roadmap.progress
      });
    }

    res.json({
      day: todaysPlan,
      overallProgress: roadmap.progress
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark task as completed
router.post('/task/complete', auth, async (req, res) => {
  try {
    const { roadmapId, dayNumber, taskIndex } = req.body;

    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      userId: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    const day = roadmap.schedule.dailyPlan.find(d => d.day === dayNumber);
    if (!day || !day.tasks[taskIndex]) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Mark task complete
    day.tasks[taskIndex].completed = true;
    day.tasks[taskIndex].completedAt = new Date();

    // Update progress
    const totalTasks = roadmap.schedule.dailyPlan.reduce((sum, d) => sum + d.tasks.length, 0);
    const completedTasks = roadmap.schedule.dailyPlan.reduce(
      (sum, d) => sum + d.tasks.filter(t => t.completed).length, 
      0
    );
    roadmap.progress.overallCompletion = Math.round((completedTasks / totalTasks) * 100);
    roadmap.progress.daysCompleted = roadmap.schedule.dailyPlan.filter(
      d => d.tasks.every(t => t.completed)
    ).length;

    await roadmap.save();

    // Award XP and update streak
    const xpEarned = Math.round(day.estimatedXP / day.tasks.length);
    const user = await User.findById(req.user._id);
    
    // Update streak
    const lastActive = user.gamification.lastActive;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastActiveDate = lastActive ? new Date(lastActive).setHours(0,0,0,0) : null;
    const yesterdayDate = yesterday.setHours(0,0,0,0);
    const todayDate = today.setHours(0,0,0,0);
    
    let streakBonus = 0;
    let streakMessage = '';
    
    if (!lastActiveDate) {
      // First activity
      user.gamification.streak = 1;
      streakMessage = 'Streak started! 🔥';
    } else if (lastActiveDate === yesterdayDate) {
      // Continued streak
      user.gamification.streak += 1;
      streakBonus = Math.min(user.gamification.streak * 5, 50); // Max 50 bonus
      streakMessage = `${user.gamification.streak} day streak! 🔥 (+${streakBonus} bonus XP)`;
      
      // Award streak badge at 7 days
      if (user.gamification.streak === 7 && !user.gamification.badges.includes('streak_keeper')) {
        user.gamification.badges.push('streak_keeper');
        user.gamification.achievements.push({
          type: 'streak_keeper',
          title: 'Streak Keeper',
          description: 'Maintain a 7-day streak',
          date: new Date()
        });
      }
    } else if (lastActiveDate !== todayDate) {
      // Reset streak (missed a day)
      user.gamification.streak = 1;
      streakMessage = 'Streak reset. Starting fresh! 🔥';
    } else {
      // Already active today
      streakMessage = `${user.gamification.streak} day streak continues! 🔥`;
    }
    
    user.gamification.lastActive = new Date();
    user.gamification.xp += xpEarned + streakBonus;
    await user.save();

    res.json({
      success: true,
      xpEarned,
      streakBonus,
      totalXP: xpEarned + streakBonus,
      streak: user.gamification.streak,
      streakMessage,
      progress: roadmap.progress
    });
  } catch (error) {
    console.error('Task completion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update roadmap progress
router.post('/:roadmapId/progress', auth, async (req, res) => {
  try {
    const { daysCompleted, streakDays } = req.body;

    const roadmap = await Roadmap.findOneAndUpdate(
      {
        _id: req.params.roadmapId,
        userId: req.user._id
      },
      {
        $set: {
          'progress.daysCompleted': daysCompleted,
          'progress.streakDays': streakDays,
          'progress.lastActive': new Date()
        }
      },
      { new: true }
    );

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    res.json({ success: true, progress: roadmap.progress });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all roadmaps
router.get('/all/list', auth, async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id })
      .select('target.role target.timeline progress createdAt')
      .sort({ createdAt: -1 });

    res.json(roadmaps);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Force regenerate with placement-focused roadmap
router.post('/force-generate', auth, async (req, res) => {
  try {
    // Delete old roadmaps
    await Roadmap.deleteMany({ userId: req.user._id });
    
    const { targetRole } = req.body;
    
    // Get resume to analyze weak areas
    const Resume = require('../models/Resume');
    const User = require('../models/User');
    
    const [resume, user] = await Promise.all([
      Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
      User.findById(req.user._id)
    ]);
    
    // Create user profile for personalized roadmap
    const userProfile = {
      name: user?.name || 'User',
      weakAreas: resume?.analysis?.weak_areas || ['System Design', 'Data Structures', 'Algorithms'],
      skills: resume?.analysis?.skills_detected?.map(s => s.name) || [],
      stats: user?.stats || {}
    };
    
    // Generate placement-focused roadmap
    const AIService = require('../utils/aiService');
    const roadmapData = AIService.generatePlacementRoadmap(userProfile, targetRole);
    
    // Create roadmap document
    const roadmap = new Roadmap({
      userId: req.user._id,
      generatedFrom: {
        resumeAnalysisId: resume?._id
      },
      target: {
        role: targetRole || roadmapData.target.role,
        companies: roadmapData.target.companies,
        timeline: roadmapData.target.timeline,
        focusAreas: roadmapData.target.focusAreas
      },
      schedule: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dailyPlan: roadmapData.schedule.dailyPlan.map((day, index) => ({
          day: day.day,
          date: new Date(Date.now() + index * 24 * 60 * 60 * 1000),
          focus: day.focus,
          tasks: day.tasks,
          skills: day.skills,
          estimatedXP: day.estimatedXP
        }))
      },
      skillPath: roadmapData.skillPath,
      milestones: roadmapData.milestones.map(m => ({
        ...m,
        targetDate: new Date(Date.now() + (m.estimatedDays || 7) * 24 * 60 * 60 * 1000)
      })),
      progress: {
        totalDays: 30
      },
      aiInsights: roadmapData.aiInsights
    });

    await roadmap.save();

    res.json({
      success: true,
      roadmapId: roadmap._id,
      roadmap,
      message: `Personalized roadmap created focusing on: ${userProfile.weakAreas.join(', ')}`
    });
  } catch (error) {
    console.error('Force generate error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
