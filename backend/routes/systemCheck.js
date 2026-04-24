const express = require('express');
const router = express.Router();
const AIService = require('../utils/aiService');

// Comprehensive system health check
router.get('/health', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    aiProvider: process.env.AI_PROVIDER || 'not set',
    tests: {}
  };

  // Test 1: Resume Analysis
  try {
    const resumeText = `
      John Doe
      Software Engineer with 3 years experience
      Skills: JavaScript, React, Node.js, Python
      Worked at Google as Frontend Developer
      Projects: E-commerce platform, Dashboard app
      Education: B.Tech Computer Science
    `;
    const resumeResult = await AIService.analyzeResume(resumeText);
    results.tests.resumeAnalysis = {
      status: '✅ WORKING',
      skillsDetected: resumeResult.skills_detected?.length || 0,
      confidenceScore: resumeResult.confidence_score
    };
  } catch (error) {
    results.tests.resumeAnalysis = {
      status: '❌ FAILED',
      error: error.message
    };
  }

  // Test 2: Interview Question Generation
  try {
    const question = await AIService.generateInterviewQuestion({
      type: 'technical',
      difficulty: 'medium',
      resumeContext: { skills: ['JavaScript', 'React'], weakAreas: ['System Design'] },
      previousAnswers: [],
      companyMode: 'general'
    });
    results.tests.questionGeneration = {
      status: '✅ WORKING',
      question: question.question?.substring(0, 50) + '...'
    };
  } catch (error) {
    results.tests.questionGeneration = {
      status: '❌ FAILED',
      error: error.message
    };
  }

  // Test 3: Answer Evaluation
  try {
    const evaluation = await AIService.evaluateAnswer(
      'What is React?',
      'React is a JavaScript library for building user interfaces.',
      { expectedAnswerPoints: ['Component-based', 'Virtual DOM'] }
    );
    results.tests.answerEvaluation = {
      status: '✅ WORKING',
      score: evaluation.score
    };
  } catch (error) {
    results.tests.answerEvaluation = {
      status: '❌ FAILED',
      error: error.message
    };
  }

  // Test 4: Readiness Calculation
  try {
    const readiness = await AIService.calculateReadiness({
      stats: { completedInterviews: 5, solvedProblems: 10 },
      level: 'Intermediate',
      completedInterviews: 5,
      solvedProblems: 10
    });
    results.tests.readinessCalculation = {
      status: '✅ WORKING',
      score: readiness.score,
      status: readiness.status
    };
  } catch (error) {
    results.tests.readinessCalculation = {
      status: '❌ FAILED',
      error: error.message
    };
  }

  // Test 5: Coding Problem Generation
  try {
    const problem = await AIService.generateCodingProblem('medium', 'arrays', 'intermediate');
    results.tests.codingProblem = {
      status: '✅ WORKING',
      title: problem.title
    };
  } catch (error) {
    results.tests.codingProblem = {
      status: '❌ FAILED',
      error: error.message
    };
  }

  // Test 6: AI Debate
  try {
    const debate = await AIService.generateDebateResponse(
      'React vs Vue',
      'React is better because of its ecosystem',
      1,
      null
    );
    results.tests.aiDebate = {
      status: '✅ WORKING',
      response: debate.response?.substring(0, 50) + '...'
    };
  } catch (error) {
    results.tests.aiDebate = {
      status: '❌ FAILED',
      error: error.message
    };
  }

  // Summary
  const totalTests = Object.keys(results.tests).length;
  const passedTests = Object.values(results.tests).filter(t => t.status === '✅ WORKING').length;
  
  results.summary = {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    health: passedTests === totalTests ? '✅ ALL SYSTEMS OPERATIONAL' : 
            passedTests > totalTests / 2 ? '⚠️ PARTIAL FUNCTIONALITY' : '❌ SYSTEM DEGRADED'
  };

  res.json(results);
});

module.exports = router;
