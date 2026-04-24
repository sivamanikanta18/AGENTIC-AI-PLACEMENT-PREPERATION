const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Interview = require('../models/Interview');

// Get feedback for specific interview
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      interviewId: req.params.interviewId,
      userId: req.user._id
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all feedback history
router.get('/history/all', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user._id })
      .populate('interviewId', 'type companyMode finalEvaluation')
      .sort({ createdAt: -1 });

    res.json(feedbacks || []);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get improvement trends
router.get('/trends/improvement', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: 1 })
      .select('dimensions createdAt');

    if (!feedbacks || feedbacks.length === 0) {
      return res.json({
        trends: {
          confidence: [],
          clarity: [],
          technical: [],
          communication: [],
          problem_solving: []
        },
        totalInterviews: 0,
        improvement: {
          overall: '0%',
          confidence: '0%',
          technical: '0%',
          communication: '0%'
        }
      });
    }

    const trends = {
      confidence: [],
      clarity: [],
      technical: [],
      communication: [],
      problem_solving: []
    };

    feedbacks.forEach(f => {
      const date = f.createdAt.toISOString().split('T')[0];
      if (f.dimensions) {
        trends.confidence.push({ date, score: f.dimensions.confidence?.score || 0 });
        trends.clarity.push({ date, score: f.dimensions.clarity?.score || 0 });
        trends.technical.push({ date, score: f.dimensions.technical?.score || 0 });
        trends.communication.push({ date, score: f.dimensions.communication?.score || 0 });
        trends.problem_solving.push({ date, score: f.dimensions.problem_solving?.score || 0 });
      }
    });

    res.json({
      trends,
      totalInterviews: feedbacks.length,
      improvement: calculateImprovement(trends)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get detailed comparison with previous
router.get('/compare/:interviewId', auth, async (req, res) => {
  try {
    const currentFeedback = await Feedback.findOne({
      interviewId: req.params.interviewId,
      userId: req.user._id
    });

    if (!currentFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Get previous feedback
    const previousFeedback = await Feedback.findOne({
      userId: req.user._id,
      createdAt: { $lt: currentFeedback.createdAt }
    })
    .sort({ createdAt: -1 });

    const comparison = {
      current: currentFeedback.dimensions,
      previous: previousFeedback?.dimensions || null,
      changes: {}
    };

    if (previousFeedback) {
      const dimensions = ['confidence', 'clarity', 'technical', 'communication', 'problem_solving'];
      dimensions.forEach(dim => {
        const current = currentFeedback.dimensions[dim]?.score || 0;
        const previous = previousFeedback.dimensions[dim]?.score || 0;
        comparison.changes[dim] = {
          change: current - previous,
          percentage: previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0
        };
      });
    }

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get action items
router.get('/action-items/all', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const allActionItems = [];
    feedbacks.forEach(f => {
      if (f.actionItems) {
        allActionItems.push(...f.actionItems);
      }
    });

    // Group by priority
    const grouped = {
      high: allActionItems.filter(item => item.priority === 'high'),
      medium: allActionItems.filter(item => item.priority === 'medium'),
      low: allActionItems.filter(item => item.priority === 'low')
    };

    res.json({
      total: allActionItems.length,
      grouped,
      recent: allActionItems.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get skill-specific feedback
router.get('/skills/:skillName', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      userId: req.user._id,
      'questionFeedback': {
        $elemMatch: {
          'question': { $regex: req.params.skillName, $options: 'i' }
        }
      }
    });

    const skillFeedback = [];
    feedbacks.forEach(f => {
      f.questionFeedback?.forEach(qf => {
        if (qf.question.toLowerCase().includes(req.params.skillName.toLowerCase())) {
          skillFeedback.push(qf);
        }
      });
    });

    res.json({
      skill: req.params.skillName,
      feedbackCount: skillFeedback.length,
      averageScore: skillFeedback.reduce((a, b) => a + (b.scores?.technical || 0), 0) / Math.max(1, skillFeedback.length),
      feedback: skillFeedback
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

function calculateImprovement(trends) {
  const result = {};
  
  Object.keys(trends).forEach(key => {
    const data = trends[key];
    if (data.length >= 2) {
      const first = data[0].score;
      const last = data[data.length - 1].score;
      result[key] = {
        change: last - first,
        trend: last > first ? 'improving' : last < first ? 'declining' : 'stable'
      };
    }
  });

  return result;
}

module.exports = router;
