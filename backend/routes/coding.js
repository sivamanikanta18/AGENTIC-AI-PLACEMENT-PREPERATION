const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { CodingProblem, CodingAttempt } = require('../models/CodingProblem');
const User = require('../models/User');
const Resume = require('../models/Resume');
const AIService = require('../utils/aiService');
const AnalyticsService = require('../utils/analyticsService');
const { seedCodingProblems } = require('../utils/seedCodingProblems');

// Seed problems on first request if empty
async function ensureProblemsExist() {
  const count = await CodingProblem.countDocuments();
  if (count === 0) {
    console.log('🌱 Database empty, seeding coding problems...');
    await seedCodingProblems();
  }
}

// Get database stats - problems are stored in MongoDB
router.get('/stats', async (req, res) => {
  try {
    const total = await CodingProblem.countDocuments();
    const byDifficulty = await CodingProblem.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    const byCategory = await CodingProblem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalProblems: total,
      byDifficulty: byDifficulty.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      storage: 'MongoDB Database - Persistent',
      seeding: total > 0 ? 'Not needed - problems exist' : 'Required on first run'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get personalized problems based on resume analysis
router.get('/personalized', auth, async (req, res) => {
  try {
    await ensureProblemsExist();
    
    const user = await User.findById(req.user._id);
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // Get user's weak areas and skill level
    const weakAreas = resume?.analysis?.weak_areas || [];
    const detectedSkills = resume?.analysis?.skills_detected?.map(s => s.name.toLowerCase()) || [];
    const userLevel = user.gamification.level || 'Beginner';
    
    // Map weak areas to problem categories
    const categoryMapping = {
      'data structures': ['arrays', 'linked_list', 'trees', 'graphs'],
      'algorithms': ['dynamic_programming', 'sorting', 'recursion', 'backtracking'],
      'system design': ['system_design'],
      'problem solving': ['arrays', 'dynamic_programming', 'greedy'],
      'complexity analysis': ['arrays', 'sorting'],
      'javascript': ['arrays', 'strings'],
      'python': ['arrays', 'strings'],
      'java': ['arrays', 'linked_list'],
      'react': [],
      'database': [],
      'sql': [],
      'api design': [],
      'oop': [],
      'testing': []
    };
    
    // Determine target categories based on weak areas
    let targetCategories = [];
    weakAreas.forEach(area => {
      const areaLower = area.toLowerCase();
      for (const [key, categories] of Object.entries(categoryMapping)) {
        if (areaLower.includes(key)) {
          targetCategories.push(...categories);
        }
      }
    });
    
    // Remove duplicates
    targetCategories = [...new Set(targetCategories)];
    
    // If no specific weak areas, use default categories
    if (targetCategories.length === 0) {
      targetCategories = ['arrays', 'strings', 'linked_list'];
    }
    
    // Determine difficulty based on user level
    let difficultyFilter = {};
    if (userLevel === 'Beginner') {
      difficultyFilter = { difficulty: 'easy' };
    } else if (userLevel === 'Intermediate') {
      difficultyFilter = { difficulty: { $in: ['easy', 'medium'] } };
    } else {
      difficultyFilter = { difficulty: { $in: ['medium', 'hard'] } };
    }
    
    // Get problems from weak areas first
    const weakAreaProblems = await CodingProblem.find({
      category: { $in: targetCategories },
      ...difficultyFilter
    }).limit(5);
    
    // Get user's attempted problems
    const attemptedProblemIds = await CodingAttempt.distinct('problemId', { userId: req.user._id });
    
    // Get recommended problems not yet attempted
    const recommendedProblems = await CodingProblem.find({
      _id: { $nin: attemptedProblemIds },
      ...difficultyFilter
    }).sort({ 'interviewFrequency.faang': -1 }).limit(10);
    
    res.json({
      personalized: {
        weakAreas: weakAreas.slice(0, 3),
        recommendedCategories: targetCategories,
        problems: weakAreaProblems
      },
      recommended: recommendedProblems,
      userLevel,
      stats: {
        totalAttempted: attemptedProblemIds.length,
        totalAvailable: await CodingProblem.countDocuments()
      }
    });
    
  } catch (error) {
    console.error('Personalized problems error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all problems
router.get('/problems', auth, async (req, res) => {
  try {
    await ensureProblemsExist();
    
    const { difficulty, category, company } = req.query;
    
    let query = {};
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (company) query.companyTags = company;

    const problems = await CodingProblem.find(query)
      .select('-solution -testCases.expectedOutput')
      .sort({ difficulty: 1, category: 1 });

    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get problem by ID
router.get('/problems/:id', auth, async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.id)
      .select('-solution -testCases');

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Get user's previous attempts
    const attempts = await CodingAttempt.find({
      userId: req.user._id,
      problemId: req.params.id
    }).sort({ createdAt: -1 });

    res.json({
      problem,
      attempts: attempts.map(a => ({
        status: a.status,
        date: a.createdAt,
        results: a.results
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get problem with solution (after solving or using hint)
router.get('/problems/:id/solution', auth, async (req, res) => {
  try {
    const { language } = req.query;
    
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Check if user has attempted or used a hint
    const hasAttempt = await CodingAttempt.findOne({
      userId: req.user._id,
      problemId: req.params.id
    });

    if (!hasAttempt) {
      return res.status(403).json({ error: 'Attempt the problem first or use a hint' });
    }

    res.json({
      approach: problem.solution?.approach,
      timeComplexity: problem.solution?.timeComplexity,
      spaceComplexity: problem.solution?.spaceComplexity,
      code: problem.solution?.code?.[language || 'javascript']
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate AI-powered personalized problem
router.post('/generate-ai', auth, async (req, res) => {
  try {
    const { focusArea } = req.body;
    const user = await User.findById(req.user._id);
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // Build context for AI
    const weakAreas = resume?.analysis?.weak_areas || ['Data Structures', 'Algorithms'];
    const skills = resume?.analysis?.skills_detected?.map(s => s.name) || [];
    
    const context = {
      userLevel: user.gamification.level,
      weakAreas: weakAreas.slice(0, 3),
      skills: skills.slice(0, 5),
      focusArea: focusArea || weakAreas[0] || 'Data Structures',
      targetCompanies: resume?.analysis?.target_companies || ['FAANG', 'Startups']
    };

    const problemData = await AIService.generatePersonalizedProblem(context);

    // Save generated problem
    const problem = new CodingProblem({
      ...problemData,
      source: 'ai-generated',
      generatedFor: req.user._id,
      tags: [problemData.difficulty, problemData.category, 'ai-generated']
    });

    await problem.save();

    // Return without solution
    const { solution, testCases, ...problemWithoutSolution } = problem.toObject();
    res.json({
      ...problemWithoutSolution,
      personalizedContext: {
        whyRecommended: `Based on your weak area: ${context.focusArea}`,
        relevanceToPlacement: `Common in ${context.targetCompanies.join(', ')} interviews`,
        difficultyMatchedTo: `Your ${context.userLevel} level`
      }
    });
  } catch (error) {
    console.error('AI problem generation error:', error);
    res.status(500).json({ error: 'Failed to generate problem' });
  }
});

// Submit solution
router.post('/submit', auth, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Run tests (simplified - in production, use a sandbox)
    const testResults = runTests(code, language, problem.testCases);

    // AI evaluation
    const aiFeedback = await AIService.evaluateCodingSolution(
      problem,
      code,
      language
    );

    const passed = testResults.passed;
    const total = testResults.total;
    const status = passed === total ? 'solved' : passed > 0 ? 'attempted' : 'failed';

    // Calculate XP
    let xpEarned = 0;
    if (status === 'solved') {
      xpEarned = problem.difficulty === 'easy' ? 100 : problem.difficulty === 'medium' ? 200 : 350;
    } else if (passed > 0) {
      xpEarned = Math.floor((passed / total) * 50);
    }

    // Save attempt
    const attempt = new CodingAttempt({
      userId: req.user._id,
      problemId,
      code,
      language,
      status,
      results: testResults,
      feedback: aiFeedback,
      xpEarned
    });

    await attempt.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.totalCodingProblems': 1,
        'stats.solvedProblems': status === 'solved' ? 1 : 0,
        'gamification.xp': xpEarned
      }
    });

    // Track coding activity
    await AnalyticsService.trackActivity(
      req.user._id,
      'coding',
      'submitted_solution',
      { 
        problemId,
        difficulty: problem.difficulty,
        language,
        passed,
        total
      },
      null,
      aiFeedback.correctness || 0,
      status === 'solved' ? 'success' : passed > 0 ? 'partial' : 'failure'
    );

    res.json({
      success: true,
      status,
      testResults,
      aiFeedback,
      xpEarned
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get hint
router.get('/problems/:id/hint', auth, async (req, res) => {
  try {
    const { order = 0 } = req.query;
    const problem = await CodingProblem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const hint = problem.hints[order];
    if (!hint) {
      return res.status(404).json({ error: 'No more hints available' });
    }

    // Track hint usage
    await CodingAttempt.findOneAndUpdate(
      { userId: req.user._id, problemId: req.params.id },
      { $inc: { hintsUsed: 1 } },
      { upsert: true, new: true }
    );

    // Deduct XP for using hint
    if (hint.xpCost > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'gamification.xp': -hint.xpCost }
      });
    }

    res.json({
      hint: hint.content,
      order: hint.order,
      xpCost: hint.xpCost
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's coding history
router.get('/history', auth, async (req, res) => {
  try {
    const attempts = await CodingAttempt.find({ userId: req.user._id })
      .populate('problemId', 'title difficulty category')
      .sort({ createdAt: -1 });

    const stats = {
      total: attempts.length,
      solved: attempts.filter(a => a.status === 'solved').length,
      attempted: attempts.filter(a => a.status === 'attempted').length,
      byDifficulty: {
        easy: attempts.filter(a => a.problemId?.difficulty === 'easy' && a.status === 'solved').length,
        medium: attempts.filter(a => a.problemId?.difficulty === 'medium' && a.status === 'solved').length,
        hard: attempts.filter(a => a.problemId?.difficulty === 'hard' && a.status === 'solved').length
      },
      byCategory: {}
    };

    // Group by category
    attempts.forEach(a => {
      const cat = a.problemId?.category || 'Unknown';
      if (!stats.byCategory[cat]) {
        stats.byCategory[cat] = { total: 0, solved: 0 };
      }
      stats.byCategory[cat].total++;
      if (a.status === 'solved') {
        stats.byCategory[cat].solved++;
      }
    });

    res.json({
      attempts: attempts.slice(0, 20),
      stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recommended problems
router.get('/recommended', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const solvedProblems = await CodingAttempt.find({
      userId: req.user._id,
      status: 'solved'
    }).distinct('problemId');

    // Get problems user hasn't solved
    const problems = await CodingProblem.find({
      _id: { $nin: solvedProblems }
    })
    .select('-solution -testCases')
    .limit(10);

    // Get weak areas from resume
    const Resume = require('../models/Resume');
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    const weakCategories = resume?.analysis?.weak_areas?.map(w => w.toLowerCase()) || [];

    // Sort by relevance to weak areas
    const scored = problems.map(p => {
      let score = 0;
      if (weakCategories.some(w => p.category?.toLowerCase().includes(w))) {
        score += 10;
      }
      if (p.difficulty === 'medium') score += 5;
      if (user.gamification.level === 'Beginner' && p.difficulty === 'easy') score += 8;
      if (user.gamification.level === 'Advanced' && p.difficulty === 'hard') score += 8;
      return { problem: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json(scored.slice(0, 5).map(s => s.problem));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all topics with problem counts
router.get('/topics', auth, async (req, res) => {
  try {
    const { getTopicsInfo } = require('../utils/comprehensiveProblems');
    const topicsInfo = getTopicsInfo();
    
    // Get actual counts from DB
    const dbCounts = await CodingProblem.aggregate([
      { $match: { source: 'comprehensive-set' } },
      { $group: { 
        _id: '$topicInfo.name', 
        count: { $sum: 1 },
        easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } }
      }}
    ]);
    
    const enrichedTopics = topicsInfo.map(topic => {
      const dbInfo = dbCounts.find(d => d._id === topic.name);
      return {
        ...topic,
        actualCount: dbInfo?.count || 0,
        difficultyBreakdown: dbInfo ? {
          easy: dbInfo.easy,
          medium: dbInfo.medium,
          hard: dbInfo.hard
        } : { easy: 0, medium: 0, hard: 0 }
      };
    });
    
    res.json({
      topics: enrichedTopics,
      totalProblems: enrichedTopics.reduce((sum, t) => sum + t.actualCount, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get problems by topic
router.get('/topics/:topicKey', auth, async (req, res) => {
  try {
    await ensureProblemsExist();
    const { getProblemsByTopic } = require('../utils/comprehensiveProblems');
    
    const topicProblems = getProblemsByTopic(req.params.topicKey);
    if (!topicProblems || topicProblems.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Get full details from DB
    const titles = topicProblems.map(p => p.title);
    const dbProblems = await CodingProblem.find({
      title: { $in: titles },
      source: 'comprehensive-set'
    }).select('-solution -testCases.expectedOutput');
    
    // Create lookup map
    const dbMap = new Map(dbProblems.map(p => [p.title, p]));
    
    // Merge DB data with comprehensive data
    const enriched = topicProblems.map(p => ({
      ...p,
      _id: dbMap.get(p.title)?._id,
      isInDB: !!dbMap.get(p.title)
    }));
    
    res.json({
      topic: req.params.topicKey,
      problems: enriched,
      total: enriched.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// MIXED GENERATION: Get problems from DB + AI generation
router.post('/generate-mixed', auth, async (req, res) => {
  try {
    const { count = 5, focusTopics = [], difficulty } = req.body;
    const user = await User.findById(req.user._id);
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    
    const { getProblemsForUserLevel, getProblemsByTopic } = require('../utils/comprehensiveProblems');
    
    // 1. Get user's weak areas
    const weakAreas = resume?.analysis?.weak_areas || ['Data Structures', 'Algorithms'];
    const userLevel = user.gamification.level || 'Beginner';
    
    // 2. Determine how many from DB vs AI
    const dbCount = Math.ceil(count * 0.6); // 60% from database (existing problems)
    const aiCount = count - dbCount; // 40% AI-generated
    
    // 3. Get problems from comprehensive database
    let dbProblems = [];
    if (focusTopics.length > 0) {
      // Get from specific topics
      focusTopics.forEach(topic => {
        const topicProblems = getProblemsByTopic(topic)
          .filter(p => !difficulty || p.difficulty === difficulty);
        dbProblems.push(...topicProblems);
      });
    } else {
      // Get based on weak areas and level
      dbProblems = getProblemsForUserLevel(userLevel, weakAreas);
    }
    
    // Remove duplicates and limit
    dbProblems = dbProblems
      .filter((p, i, arr) => arr.findIndex(t => t.title === p.title) === i)
      .slice(0, dbCount);
    
    // 4. Generate AI problems for variety and depth
    const aiProblems = [];
    const aiContexts = focusTopics.length > 0 
      ? focusTopics.map(t => ({ topic: t, area: t }))
      : weakAreas.slice(0, aiCount).map(area => ({ topic: 'mixed', area }));
    
    for (let i = 0; i < Math.min(aiCount, aiContexts.length); i++) {
      try {
        const context = {
          userLevel,
          weakAreas: [aiContexts[i].area],
          skills: resume?.analysis?.skills_detected?.map(s => s.name) || [],
          focusArea: aiContexts[i].area,
          targetCompanies: resume?.analysis?.target_companies || ['FAANG', 'Startups']
        };
        
        const aiProblem = await AIService.generatePersonalizedProblem(context);
        aiProblems.push({
          ...aiProblem,
          source: 'ai-generated',
          isAIGenerated: true,
          generatedContext: context
        });
      } catch (err) {
        console.log(`AI generation failed for index ${i}, skipping...`);
      }
    }
    
    // 5. Mix and shuffle
    const mixed = [...dbProblems, ...aiProblems].sort(() => Math.random() - 0.5);
    
    // 6. Save AI problems to DB
    for (const problem of aiProblems) {
      try {
        const existing = await CodingProblem.findOne({ 
          title: problem.title,
          source: 'ai-generated'
        });
        if (!existing) {
          const newProblem = new CodingProblem(problem);
          await newProblem.save();
        }
      } catch (err) {
        console.log('Failed to save AI problem:', err.message);
      }
    }
    
    res.json({
      problems: mixed,
      generationInfo: {
        total: mixed.length,
        fromDatabase: dbProblems.length,
        aiGenerated: aiProblems.length,
        basedOn: {
          weakAreas: weakAreas.slice(0, 3),
          userLevel,
          focusTopics: focusTopics.length > 0 ? focusTopics : 'auto-detected from resume'
        }
      }
    });
  } catch (error) {
    console.error('Mixed generation error:', error);
    res.status(500).json({ error: 'Failed to generate problems' });
  }
});

// Get daily practice set (mixed from DB, personalized)
router.get('/daily-practice', auth, async (req, res) => {
  try {
    await ensureProblemsExist();
    
    const user = await User.findById(req.user._id);
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    const { getProblemsForUserLevel } = require('../utils/comprehensiveProblems');
    
    // Get weak areas
    const weakAreas = resume?.analysis?.weak_areas || ['Data Structures', 'Algorithms'];
    const userLevel = user.gamification.level || 'Beginner';
    
    // Get user's solved problems
    const solvedIds = await CodingAttempt.distinct('problemId', { 
      userId: req.user._id,
      status: 'solved'
    });
    
    // Get 3 problems from weak areas
    const recommendedProblems = getProblemsForUserLevel(userLevel, weakAreas)
      .filter(p => !solvedIds.includes(p._id))
      .slice(0, 3);
    
    // Get 2 easy warm-up problems
    const warmUpProblems = await CodingProblem.find({
      difficulty: 'easy',
      _id: { $nin: solvedIds }
    }).limit(2).select('-solution -testCases');
    
    // Get 1 challenging problem
    const challengeDifficulty = userLevel === 'Advanced' ? 'hard' : 'medium';
    const challengeProblem = await CodingProblem.findOne({
      difficulty: challengeDifficulty,
      _id: { $nin: solvedIds },
      'interviewFrequency.faang': { $gte: 7 }
    }).select('-solution -testCases');
    
    res.json({
      warmUp: warmUpProblems,
      recommended: recommendedProblems,
      challenge: challengeProblem,
      total: warmUpProblems.length + recommendedProblems.length + (challengeProblem ? 1 : 0),
      basedOn: {
        weakAreas: weakAreas.slice(0, 3),
        userLevel
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to run tests
function runTests(code, language, testCases) {
  // In production, this would use a secure sandbox
  // For now, return mock results
  const passed = Math.floor(Math.random() * (testCases.length + 1));
  
  return {
    passed,
    failed: testCases.length - passed,
    total: testCases.length,
    executionTime: Math.random() * 100,
    memoryUsed: Math.random() * 50,
    details: testCases.map((tc, i) => ({
      testCase: i + 1,
      passed: i < passed,
      input: tc.input,
      // Don't reveal expected output until solved
      output: i < passed ? tc.expectedOutput : null
    }))
  };
}

module.exports = router;
