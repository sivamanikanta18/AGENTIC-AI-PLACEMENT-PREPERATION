const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const AIService = require('../utils/aiService');
const AnalyticsService = require('../utils/analyticsService');

// Create new interview session
router.post('/start', auth, async (req, res) => {
  try {
    const { type, companyMode, difficulty, pressureSettings } = req.body;

    // Get resume context
    const resume = await Resume.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const resumeContext = resume ? {
      skills: resume.analysis.skills_detected?.map(s => s.name) || [],
      projects: resume.analysis.projects_summary?.map(p => p.name) || [],
      experience: resume.analysis.experience_summary ? [resume.analysis.experience_summary] : [],
      weakAreas: resume.analysis.weak_areas || []
    } : { skills: [], projects: [], experience: [], weakAreas: [] };

    const sessionId = uuidv4();
    
    const interview = new Interview({
      userId: req.user._id,
      sessionId,
      type: type || 'mixed',
      companyMode: companyMode || 'general',
      difficulty: difficulty || 'adaptive',
      pressureSettings: pressureSettings || {
        timerEnabled: true,
        interruptionsEnabled: true,
        strictMode: false
      },
      resumeContext,
      status: 'active',
      metrics: {
        startTime: new Date()
      }
    });

    await interview.save();

    // Generate first question
    const firstQuestion = await AIService.generateInterviewQuestion({
      type: type === 'mixed' ? 'technical' : type,
      difficulty: difficulty || 'medium',
      resumeContext,
      previousAnswers: [],
      companyMode: companyMode || 'general'
    });

    // Add question to interview
    interview.questions.push({
      ...firstQuestion,
      askedAt: new Date()
    });
    await interview.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalInterviews': 1 }
    });

    // Track activity
    await AnalyticsService.trackActivity(
      req.user._id,
      'interview',
      'started_interview',
      { sessionId, interviewId: interview._id, type, companyMode }
    );

    res.json({
      success: true,
      sessionId,
      interviewId: interview._id,
      question: firstQuestion,
      settings: interview.pressureSettings
    });
  } catch (error) {
    console.error('Interview start error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit answer and get next question
router.post('/answer', auth, async (req, res) => {
  try {
    const { interviewId, questionId, answer, timeTaken } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Find the question
    const questionIndex = interview.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = interview.questions[questionIndex];

    // Save answer
    question.answer = {
      text: answer,
      submittedAt: new Date(),
      timeTaken
    };

    // Evaluate answer
    const feedback = await AIService.evaluateAnswer(
      question.question,
      answer,
      {
        expectedAnswerPoints: question.expectedAnswerPoints
      }
    );

    question.feedback = feedback;
    interview.currentQuestionIndex = questionIndex + 1;

    // Track confidence trend
    interview.metrics.confidenceTrend.push(feedback.confidence);
    interview.metrics.difficultyProgression.push(question.difficulty);

    await interview.save();

    // Track answer submission
    await AnalyticsService.trackActivity(
      req.user._id,
      'interview',
      'submitted_answer',
      { 
        interviewId: interview._id, 
        questionId,
        score: feedback.score,
        timeTaken 
      },
      timeTaken,
      feedback.score
    );

    // Check if interview should end (e.g., after 8-10 questions)
    if (interview.questions.length >= 8) {
      // End interview
      interview.status = 'completed';
      interview.metrics.endTime = new Date();
      interview.metrics.totalDuration = Math.floor(
        (interview.metrics.endTime - interview.metrics.startTime) / 1000
      );

      // Calculate final evaluation
      const allScores = interview.questions.map(q => q.feedback?.score || 0);
      const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

      interview.finalEvaluation = {
        overallScore: Math.round(avgScore * 10),
        technicalScore: Math.round(
          interview.questions
            .filter(q => q.type === 'technical')
            .map(q => q.feedback?.technical_accuracy || 0)
            .reduce((a, b) => a + b, 0) / 
          Math.max(1, interview.questions.filter(q => q.type === 'technical').length) * 10
        ),
        communicationScore: Math.round(
          allScores.reduce((a, b) => a + b, 0) / allScores.length * 10
        ),
        confidenceScore: Math.round(
          interview.questions.map(q => q.feedback?.confidence || 0).reduce((a, b) => a + b, 0) / 
          interview.questions.length * 10
        ),
        strengths: feedback.strengths || [],
        weaknesses: feedback.issues || [],
        summary: `Interview completed with average score of ${avgScore.toFixed(1)}/10`
      };

      await interview.save();

      // Generate comprehensive feedback
      await generateFeedbackReport(interview);

      // Update user stats
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.completedInterviews': 1 }
      });

      // Track completed interview
      await AnalyticsService.trackActivity(
        req.user._id,
        'interview',
        'completed_interview',
        { 
          interviewId: interview._id,
          finalScore: interview.finalEvaluation.overallScore,
          totalQuestions: interview.questions.length
        },
        interview.metrics.totalDuration,
        interview.finalEvaluation.overallScore,
        interview.finalEvaluation.overallScore >= 70 ? 'success' : 'partial'
      );

      // Emit completion via socket
      const io = req.app.get('io');
      io.to(interview.sessionId).emit('interview_completed', {
        interviewId: interview._id,
        evaluation: interview.finalEvaluation
      });

      return res.json({
        completed: true,
        evaluation: interview.finalEvaluation,
        feedback
      });
    }

    // Generate next question based on feedback
    const previousAnswers = interview.questions.map(q => ({
      question: q.question,
      answer: q.answer?.text || '',
      score: q.feedback?.score || 5
    }));

    const nextDifficulty = feedback.nextDifficulty || 'same';
    const questionTypes = interview.type === 'mixed' 
      ? ['technical', 'hr', 'behavioral'] 
      : [interview.type];
    const nextType = questionTypes[interview.questions.length % questionTypes.length];

    // Get list of already asked questions to avoid repetition
    const askedQuestions = interview.questions.map(q => q.question);
    
    const nextQuestion = await AIService.generateInterviewQuestion({
      type: nextType,
      difficulty: nextDifficulty,
      resumeContext: interview.resumeContext,
      previousAnswers,
      companyMode: interview.companyMode,
      askedQuestions // Pass asked questions to avoid repetition
    });

    // Add to interview
    interview.questions.push({
      ...nextQuestion,
      askedAt: new Date()
    });
    await interview.save();

    // Simulate pressure - AI interruptions
    let interruption = null;
    if (interview.pressureSettings.interruptionsEnabled && Math.random() > 0.7) {
      const interruptions = [
        "Can you be more concise?",
        "Explain with a real example",
        "How is this better than alternatives?",
        "What's the time complexity?",
        "Can you simplify that explanation?"
      ];
      interruption = {
        questionIndex: questionIndex,
        type: 'interruption',
        message: interruptions[Math.floor(Math.random() * interruptions.length)],
        timestamp: new Date()
      };
      interview.interruptions.push(interruption);
      await interview.save();
    }

    // Emit via socket for real-time updates
    const io = req.app.get('io');
    io.to(interview.sessionId).emit('answer_received', {
      questionId,
      feedback,
      interruption
    });

    res.json({
      feedback,
      nextQuestion,
      interruption,
      progress: {
        current: interview.questions.length,
        total: 8
      }
    });
  } catch (error) {
    console.error('Answer submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get interview status
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.interviewId,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current question
router.get('/:interviewId/current', auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.interviewId,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const currentQuestion = interview.questions[interview.currentQuestionIndex];

    res.json({
      question: currentQuestion,
      progress: {
        current: interview.currentQuestionIndex + 1,
        total: 8
      },
      settings: interview.pressureSettings
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get interview history
router.get('/history/all', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({
      userId: req.user._id,
      status: 'completed'
    })
    .select('type companyMode finalEvaluation metrics.startTime metrics.endTime createdAt')
    .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Pause interview
router.post('/:interviewId/pause', auth, async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      {
        _id: req.params.interviewId,
        userId: req.user._id
      },
      { status: 'paused' },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ success: true, status: 'paused' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Resume interview
router.post('/:interviewId/resume', auth, async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      {
        _id: req.params.interviewId,
        userId: req.user._id
      },
      { status: 'active' },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const currentQuestion = interview.questions[interview.currentQuestionIndex];

    res.json({
      success: true,
      status: 'active',
      question: currentQuestion
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate AI debate
router.post('/debate', auth, async (req, res) => {
  try {
    const { topic, userArgument, round, history } = req.body;

    const debateResponse = await AIService.generateDebateResponse(
      topic,
      userArgument,
      round || 1,
      history
    );

    res.json(debateResponse);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to generate feedback report
async function generateFeedbackReport(interview) {
  try {
    const feedbackData = await AIService.generateFeedbackReport({
      questions: interview.questions,
      finalEvaluation: interview.finalEvaluation,
      metrics: interview.metrics
    });

    const feedback = new Feedback({
      userId: interview.userId,
      interviewId: interview._id,
      ...feedbackData
    });

    await feedback.save();
    return feedback;
  } catch (error) {
    console.error('Feedback generation error:', error);
  }
}

module.exports = router;
