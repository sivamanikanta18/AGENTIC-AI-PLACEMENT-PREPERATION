const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');
const Resume = require('../models/Resume');
const Roadmap = require('../models/Roadmap');
const { CodingAttempt } = require('../models/CodingProblem');
const AIService = require('../utils/aiService');

// Helper to get default empty stats
const getEmptyStats = () => ({
  interviews: {
    total: 0,
    completed: 0,
    completionRate: 0,
    averageScore: 0
  },
  coding: {
    totalProblems: 0,
    solved: 0,
    attempts: 0,
    recentAttempts: []
  },
  timeSpent: 0
});

// Get main dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all relevant data in parallel
    const [
      user,
      interviews,
      latestFeedback,
      resume,
      roadmap,
      codingAttempts
    ] = await Promise.all([
      User.findById(userId).select('-password'),
      Interview.find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5),
      Feedback.findOne({ userId }).sort({ createdAt: -1 }),
      Resume.findOne({ userId }).sort({ createdAt: -1 }),
      Roadmap.findOne({ userId }).sort({ createdAt: -1 }),
      CodingAttempt.find({ userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    // Calculate skill progression
    const skillProgression = await calculateSkillProgression(userId);

    // Calculate readiness score
    const readinessData = await calculateReadiness(user);

    // Interview stats
    const interviewStats = {
      total: user.stats.totalInterviews,
      completed: user.stats.completedInterviews,
      completionRate: user.stats.totalInterviews > 0
        ? Math.round((user.stats.completedInterviews / user.stats.totalInterviews) * 100)
        : 0,
      averageScore: interviews.length > 0
        ? Math.round(interviews.reduce((sum, i) => sum + (i.finalEvaluation?.overallScore || 0), 0) / interviews.length)
        : 0
    };

    // Coding stats
    const codingStats = {
      totalProblems: user.stats.totalCodingProblems,
      solved: user.stats.solvedProblems,
      attempts: codingAttempts.length,
      recentAttempts: codingAttempts.map(a => ({
        problemId: a.problemId,
        status: a.status,
        date: a.createdAt,
        xpEarned: a.xpEarned
      }))
    };

    // Weekly activity
    const weeklyActivity = await getWeeklyActivity(userId);

    // Weak to strong transitions
    const weakToStrong = await getWeakToStrongTransitions(userId);

    res.json({
      user: {
        name: user.name,
        level: user.gamification.level,
        xp: user.gamification.xp,
        streak: user.gamification.streak,
        badges: user.gamification.badges,
        readiness: readinessData
      },
      stats: {
        interviews: interviewStats,
        coding: codingStats,
        timeSpent: user.stats.timeSpent
      },
      recentInterviews: interviews.map(i => ({
        id: i._id,
        type: i.type,
        companyMode: i.companyMode,
        score: i.finalEvaluation?.overallScore,
        date: i.createdAt
      })),
      skillProgression,
      weakToStrong,
      weeklyActivity,
      latestFeedback: latestFeedback ? {
        overallScore: Object.values(latestFeedback.dimensions || {}).reduce(
          (sum, dim) => sum + (dim?.score || 0), 0
        ) / 5,
        keyAreas: latestFeedback.aiSummary?.priorityAreas || [],
        date: latestFeedback.createdAt
      } : null,
      roadmap: roadmap ? {
        id: roadmap._id,
        progress: roadmap.progress,
        target: roadmap.target
      } : null,
      resumeAnalysis: resume ? {
        skills: resume.analysis.skills_detected?.length || 0,
        weakAreas: resume.analysis.weak_areas?.length || 0,
        confidence: resume.analysis.confidence_score
      } : null
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get readiness score
router.get('/readiness', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const readinessData = await calculateReadiness(user);
    res.json(readinessData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get analytics data
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '30days' } = req.query;

    const startDate = new Date();
    if (timeframe === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (timeframe === '90days') startDate.setDate(startDate.getDate() - 90);

    const interviews = await Interview.find({
      userId,
      status: 'completed',
      createdAt: { $gte: startDate }
    });

    const feedbacks = await Feedback.find({
      userId,
      createdAt: { $gte: startDate }
    });

    // Performance trends
    const performanceTrends = interviews.map(i => ({
      date: i.createdAt,
      overall: i.finalEvaluation?.overallScore,
      technical: i.finalEvaluation?.technicalScore,
      communication: i.finalEvaluation?.communicationScore
    }));

    // Skill improvement matrix
    const skillMatrix = {};
    feedbacks.forEach(f => {
      f.questionFeedback?.forEach(qf => {
        const category = qf.question?.split(' ').slice(0, 3).join(' ') || 'General';
        if (!skillMatrix[category]) {
          skillMatrix[category] = { scores: [], count: 0 };
        }
        skillMatrix[category].scores.push(qf.scores?.technical || qf.scores?.relevance || 0);
        skillMatrix[category].count++;
      });
    });

    // Calculate averages
    Object.keys(skillMatrix).forEach(key => {
      const scores = skillMatrix[key].scores;
      skillMatrix[key].average = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    // Get weekly activity breakdown
    const weeklyActivity = await getWeeklyActivityDetailed(userId, startDate);
    
    // Calculate time spent (estimate: 30 min per interview, 20 min per coding problem)
    const timeSpent = (interviews.length * 0.5) + (await CodingAttempt.countDocuments({ 
      userId, 
      createdAt: { $gte: startDate } 
    }) * 0.33);

    // Get weak to strong transitions
    const weakToStrong = await getWeakToStrongTransitionsDetailed(userId);

    res.json({
      timeframe,
      interviewCount: interviews.length,
      feedbackCount: feedbacks.length,
      timeSpent,
      performanceTrends,
      skillMatrix,
      weeklyActivity,
      weakToStrong,
      improvementRate: calculateImprovementRate(performanceTrends)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get activity heatmap data
router.get('/activity', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const last6Months = new Date();
    last6Months.setMonth(last6Months.getMonth() - 6);

    const [interviews, codingAttempts, roadmapProgress] = await Promise.all([
      Interview.find({ userId, status: 'completed', createdAt: { $gte: last6Months } }),
      CodingAttempt.find({ userId, createdAt: { $gte: last6Months } }),
      Roadmap.findOne({ userId })
    ]);

    // Create daily activity map
    const activityMap = {};

    interviews.forEach(i => {
      const date = i.createdAt.toISOString().split('T')[0];
      if (!activityMap[date]) activityMap[date] = { interviews: 0, coding: 0, tasks: 0 };
      activityMap[date].interviews++;
    });

    codingAttempts.forEach(c => {
      const date = c.createdAt.toISOString().split('T')[0];
      if (!activityMap[date]) activityMap[date] = { interviews: 0, coding: 0, tasks: 0 };
      activityMap[date].coding++;
    });

    // Add completed tasks from roadmap
    if (roadmapProgress?.schedule?.dailyPlan) {
      roadmapProgress.schedule.dailyPlan.forEach(day => {
        const completedTasks = day.tasks.filter(t => t.completed).length;
        if (completedTasks > 0) {
          const date = new Date(day.date).toISOString().split('T')[0];
          if (!activityMap[date]) activityMap[date] = { interviews: 0, coding: 0, tasks: 0 };
          activityMap[date].tasks += completedTasks;
        }
      });
    }

    res.json({
      activity: activityMap,
      streak: req.user.gamification.streak,
      totalActiveDays: Object.keys(activityMap).length
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper functions
async function calculateReadiness(user) {
  const userData = {
    stats: user.stats,
    level: user.gamification.level,
    completedInterviews: user.stats.completedInterviews,
    solvedProblems: user.stats.solvedProblems
  };

  return await AIService.calculateReadiness(userData);
}

async function calculateSkillProgression(userId) {
  const feedbacks = await Feedback.find({ userId })
    .sort({ createdAt: 1 })
    .select('dimensions createdAt');

  const progression = {
    confidence: [],
    clarity: [],
    technical: [],
    communication: [],
    problem_solving: []
  };

  feedbacks.forEach(f => {
    const date = f.createdAt.toISOString().split('T')[0];
    if (f.dimensions) {
      Object.keys(progression).forEach(key => {
        if (f.dimensions[key]?.score) {
          progression[key].push({ date, score: f.dimensions[key].score });
        }
      });
    }
  });

  return progression;
}

async function getWeeklyActivity(userId) {
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const [interviews, coding] = await Promise.all([
    Interview.countDocuments({ userId: userId, status: 'completed', createdAt: { $gte: last7Days } }),
    CodingAttempt.countDocuments({ userId: userId, createdAt: { $gte: last7Days } })
  ]);

  return { interviews, coding, daysActive: Math.min(interviews + coding, 7) };
}

async function getWeakToStrongTransitions(userId) {
  const feedbacks = await Feedback.find({ userId })
    .sort({ createdAt: 1 })
    .select('dimensions.technical.score aiSummary.priorityAreas createdAt');

  const transitions = [];
  
  if (feedbacks.length >= 2) {
    const earlyWeak = feedbacks.slice(0, Math.ceil(feedbacks.length / 2));
    const recent = feedbacks.slice(Math.floor(feedbacks.length / 2));

    const earlyAvg = earlyWeak.reduce((sum, f) => sum + (f.dimensions?.technical?.score || 0), 0) / earlyWeak.length;
    const recentAvg = recent.reduce((sum, f) => sum + (f.dimensions?.technical?.score || 0), 0) / recent.length;

    if (recentAvg > earlyAvg + 1) {
      transitions.push({
        area: 'Technical Skills',
        improvement: recentAvg - earlyAvg,
        fromScore: earlyAvg,
        toScore: recentAvg
      });
    }
  }

  return transitions;
}

function calculateImprovementRate(trends) {
  if (trends.length < 2) return 0;
  
  const first = trends[0].overall || 0;
  const last = trends[trends.length - 1].overall || 0;
  
  return first > 0 ? ((last - first) / first * 100).toFixed(1) : 0;
}

async function getWeeklyActivityDetailed(userId, startDate) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const [interviews, coding] = await Promise.all([
      Interview.countDocuments({ 
        userId, 
        status: 'completed',
        createdAt: { $gte: dayStart, $lte: dayEnd }
      }),
      CodingAttempt.countDocuments({ 
        userId,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      })
    ]);
    
    result.push({
      name: days[date.getDay()],
      day: days[date.getDay()],
      interviews,
      coding,
      hours: (interviews * 0.5 + coding * 0.33).toFixed(1)
    });
  }
  
  return result;
}

async function getWeakToStrongTransitionsDetailed(userId) {
  const feedbacks = await Feedback.find({ userId })
    .sort({ createdAt: 1 })
    .select('dimensions aiSummary.priorityAreas createdAt');

  const transitions = [];
  
  if (feedbacks.length >= 2) {
    const midPoint = Math.floor(feedbacks.length / 2);
    const early = feedbacks.slice(0, midPoint);
    const recent = feedbacks.slice(midPoint);

    const skillAreas = ['technical', 'communication', 'confidence', 'clarity', 'problem_solving'];
    
    skillAreas.forEach(area => {
      const earlyScores = early.map(f => f.dimensions?.[area]?.score || 0).filter(s => s > 0);
      const recentScores = recent.map(f => f.dimensions?.[area]?.score || 0).filter(s => s > 0);
      
      if (earlyScores.length > 0 && recentScores.length > 0) {
        const earlyAvg = earlyScores.reduce((a, b) => a + b, 0) / earlyScores.length;
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        
        if (recentAvg > earlyAvg + 0.5) {
          const skillNames = {
            technical: 'Technical Skills',
            communication: 'Communication',
            confidence: 'Confidence',
            clarity: 'Answer Clarity',
            problem_solving: 'Problem Solving'
          };
          
          transitions.push({
            skill: skillNames[area],
            from: Math.round(earlyAvg * 10),
            to: Math.round(recentAvg * 10),
            improvement: Math.round(((recentAvg - earlyAvg) / earlyAvg) * 100)
          });
        }
      }
    });
  }

  return transitions.slice(0, 3); // Return top 3 improvements
}

module.exports = router;
