const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// XP thresholds for levels
const LEVEL_THRESHOLDS = {
  Beginner: 0,
  Intermediate: 1000,
  Advanced: 3000,
  Expert: 7000
};

// Badge definitions
const BADGE_DEFINITIONS = {
  first_interview: { name: 'First Interview', icon: '🎯', description: 'Complete your first mock interview' },
  interview_master: { name: 'Interview Master', icon: '🏆', description: 'Complete 10 mock interviews' },
  code_warrior: { name: 'Code Warrior', icon: '💻', description: 'Solve 20 coding problems' },
  streak_keeper: { name: 'Streak Keeper', icon: '🔥', description: 'Maintain a 7-day streak' },
  perfect_score: { name: 'Perfect Score', icon: '⭐', description: 'Score 9+ in an interview' },
  resume_pro: { name: 'Resume Pro', icon: '📄', description: 'Upload and analyze your resume' },
  feedback_seeker: { name: 'Feedback Seeker', icon: '📊', description: 'Review 5 feedback reports' },
  roadmap_follower: { name: 'Roadmap Follower', icon: '🗺️', description: 'Complete 7 days of your roadmap' },
  quick_learner: { name: 'Quick Learner', icon: '🚀', description: 'Improve by 20% in one week' },
  night_owl: { name: 'Night Owl', icon: '🦉', description: 'Practice after 10 PM' },
  early_bird: { name: 'Early Bird', icon: '🐦', description: 'Practice before 8 AM' },
  debate_champion: { name: 'Debate Champion', icon: '🗣️', description: 'Win an AI debate' }
};

// Get user gamification status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Calculate progress to next level
    const currentLevel = user.gamification.level;
    const currentXP = user.gamification.xp;
    
    const levels = Object.keys(LEVEL_THRESHOLDS);
    const currentLevelIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentLevelIndex + 1];
    
    const xpForCurrentLevel = LEVEL_THRESHOLDS[currentLevel];
    const xpForNextLevel = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : null;
    
    const progress = xpForNextLevel 
      ? ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
      : 100;

    res.json({
      level: currentLevel,
      xp: currentXP,
      xpToNextLevel: xpForNextLevel ? xpForNextLevel - currentXP : 0,
      progress: Math.min(Math.max(progress, 0), 100),
      nextLevel: nextLevel || 'Max Level',
      streak: user.gamification.streak,
      badges: user.gamification.badges,
      achievements: user.gamification.achievements,
      lastActive: user.gamification.lastActive
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Award XP
router.post('/award-xp', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const user = await User.findById(req.user._id);
    const oldLevel = user.gamification.level;
    
    // Add XP
    user.gamification.xp += amount;
    
    // Check for level up
    const newLevel = calculateLevel(user.gamification.xp);
    if (newLevel !== oldLevel) {
      user.gamification.level = newLevel;
      user.gamification.achievements.push({
        name: `Level Up: ${newLevel}`,
        description: `Reached ${newLevel} level with ${user.gamification.xp} XP`,
        earnedAt: new Date()
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      xpAwarded: amount,
      totalXP: user.gamification.xp,
      levelUp: newLevel !== oldLevel ? newLevel : null,
      currentLevel: newLevel
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Award badge
router.post('/award-badge', auth, async (req, res) => {
  try {
    const { badgeId } = req.body;
    
    const badgeDef = BADGE_DEFINITIONS[badgeId];
    if (!badgeDef) {
      return res.status(400).json({ error: 'Invalid badge ID' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if already has badge
    const hasBadge = user.gamification.badges.some(b => b.name === badgeDef.name);
    if (hasBadge) {
      return res.json({ success: false, message: 'Badge already earned' });
    }
    
    // Add badge
    user.gamification.badges.push({
      name: badgeDef.name,
      icon: badgeDef.icon,
      earnedAt: new Date()
    });
    
    // Add achievement
    user.gamification.achievements.push({
      name: `Badge Earned: ${badgeDef.name}`,
      description: badgeDef.description,
      earnedAt: new Date()
    });
    
    // Award XP for badge
    user.gamification.xp += 100;
    
    await user.save();
    
    res.json({
      success: true,
      badge: badgeDef,
      xpAwarded: 100,
      totalXP: user.gamification.xp
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update streak
router.post('/update-streak', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const lastActive = new Date(user.gamification.lastActive);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if streak continues
    const lastActiveDate = new Date(lastActive.setHours(0, 0, 0, 0));
    const yesterdayDate = new Date(yesterday.setHours(0, 0, 0, 0));
    const todayDate = new Date(today.setHours(0, 0, 0, 0));
    
    if (lastActiveDate.getTime() === yesterdayDate.getTime()) {
      // Continued streak
      user.gamification.streak += 1;
      
      // Award streak badge at 7 days
      if (user.gamification.streak === 7) {
        await awardBadgeInternal(user._id, 'streak_keeper');
      }
    } else if (lastActiveDate.getTime() !== todayDate.getTime()) {
      // Reset streak
      user.gamification.streak = 1;
    }
    
    user.gamification.lastActive = new Date();
    await user.save();
    
    res.json({
      success: true,
      streak: user.gamification.streak,
      xpEarned: user.gamification.streak > 1 ? 10 * user.gamification.streak : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { timeframe = 'all' } = req.query;
    
    let query = {};
    if (timeframe === 'weekly') {
      query['gamification.lastActive'] = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'monthly') {
      query['gamification.lastActive'] = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }
    
    const topUsers = await User.find(query)
      .select('name gamification.xp gamification.level gamification.badges')
      .sort({ 'gamification.xp': -1 })
      .limit(20);
    
    const ranked = topUsers.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      xp: u.gamification.xp,
      level: u.gamification.level,
      badgeCount: u.gamification.badges.length
    }));
    
    // Get current user's rank
    const userRank = await User.countDocuments({
      'gamification.xp': { $gt: req.user.gamification.xp }
    }) + 1;
    
    res.json({
      leaderboard: ranked,
      userRank,
      userStats: {
        name: req.user.name,
        xp: req.user.gamification.xp,
        level: req.user.gamification.level
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all available badges
router.get('/badges', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const earnedBadges = user.gamification.badges.map(b => b.name);
    
    const allBadges = Object.entries(BADGE_DEFINITIONS).map(([id, badge]) => ({
      id,
      ...badge,
      earned: earnedBadges.includes(badge.name),
      earnedAt: null
    }));
    
    res.json(allBadges);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check and auto-award achievements
router.post('/check-achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const newlyAwarded = [];
    
    // Check interview achievements
    if (user.stats.completedInterviews === 1) {
      const result = await awardBadgeInternal(user._id, 'first_interview');
      if (result) newlyAwarded.push(result);
    }
    
    if (user.stats.completedInterviews >= 10) {
      const result = await awardBadgeInternal(user._id, 'interview_master');
      if (result) newlyAwarded.push(result);
    }
    
    // Check coding achievements
    if (user.stats.solvedProblems >= 20) {
      const result = await awardBadgeInternal(user._id, 'code_warrior');
      if (result) newlyAwarded.push(result);
    }
    
    // Check resume achievement
    const Resume = require('../models/Resume');
    const hasResume = await Resume.exists({ userId: user._id });
    if (hasResume) {
      const result = await awardBadgeInternal(user._id, 'resume_pro');
      if (result) newlyAwarded.push(result);
    }
    
    res.json({
      checked: true,
      newlyAwarded
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper functions
function calculateLevel(xp) {
  if (xp >= LEVEL_THRESHOLDS.Expert) return 'Expert';
  if (xp >= LEVEL_THRESHOLDS.Advanced) return 'Advanced';
  if (xp >= LEVEL_THRESHOLDS.Intermediate) return 'Intermediate';
  return 'Beginner';
}

async function awardBadgeInternal(userId, badgeId) {
  try {
    const badgeDef = BADGE_DEFINITIONS[badgeId];
    if (!badgeDef) return null;
    
    const user = await User.findById(userId);
    
    // Check if already has badge
    const hasBadge = user.gamification.badges.some(b => b.name === badgeDef.name);
    if (hasBadge) return null;
    
    // Add badge
    user.gamification.badges.push({
      name: badgeDef.name,
      icon: badgeDef.icon,
      earnedAt: new Date()
    });
    
    // Award XP
    user.gamification.xp += 100;
    
    await user.save();
    
    return {
      badge: badgeDef,
      xpAwarded: 100
    };
  } catch (error) {
    console.error('Badge award error:', error);
    return null;
  }
}

module.exports = router;
