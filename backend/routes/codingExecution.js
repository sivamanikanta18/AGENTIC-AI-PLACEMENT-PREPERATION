/**
 * Code Execution Routes
 * Provides endpoints for running code and test cases
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { executeCode, runTests, isServiceAvailable } = require('../utils/codeExecution');
const CodingProblem = require('../models/CodingProblem');

/**
 * POST /api/coding/execute
 * Execute code with optional stdin
 */
router.post('/execute', auth, async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Code and language are required' 
      });
    }

    // Check service availability
    const isAvailable = await isServiceAvailable();
    if (!isAvailable) {
      return res.status(503).json({
        error: 'Code execution service temporarily unavailable',
        output: '',
        stderr: ''
      });
    }

    // Execute code
    const result = await executeCode(code, language, stdin);

    res.json({
      success: result.success,
      output: result.output,
      stderr: result.stderr,
      error: result.error,
      executionTime: result.executionTime,
      memory: result.memory
    });

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      error: 'Failed to execute code',
      output: '',
      stderr: error.message
    });
  }
});

/**
 * POST /api/coding/run-tests
 * Run code against test cases for a specific problem
 */
router.post('/run-tests', auth, async (req, res) => {
  try {
    const { code, language, problemId, stdin = '' } = req.body;

    // Validate input
    if (!code || !language || !problemId) {
      return res.status(400).json({
        error: 'Code, language, and problemId are required'
      });
    }

    // Fetch problem to get test cases
    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        error: 'Problem not found'
      });
    }

    // Build test cases from problem examples
    const testCases = problem.examples.map((ex, index) => ({
      testCase: index + 1,
      input: stdin || ex.input || '',
      expectedOutput: ex.output || ''
    }));

    // If no examples, create a default test case
    if (testCases.length === 0) {
      testCases.push({
        testCase: 1,
        input: stdin,
        expectedOutput: ''
      });
    }

    // Run tests
    const results = await runTests(code, language, testCases);

    res.json({
      success: results.allPassed,
      passed: results.passed,
      total: results.total,
      testResults: results.results,
      totalExecutionTime: results.totalExecutionTime,
      problem: {
        title: problem.title,
        difficulty: problem.difficulty
      }
    });

  } catch (error) {
    console.error('Run tests error:', error);
    res.status(500).json({
      error: 'Failed to run tests',
      testResults: []
    });
  }
});

/**
 * GET /api/coding/languages
 * Get supported languages
 */
router.get('/languages', auth, async (req, res) => {
  try {
    const languages = Object.keys(require('../utils/codeExecution').LANGUAGE_VERSIONS);
    res.json({
      languages: languages.map(lang => ({
        id: lang,
        name: lang.charAt(0).toUpperCase() + lang.slice(1),
        version: require('../utils/codeExecution').LANGUAGE_VERSIONS[lang]
      }))
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Failed to get languages' });
  }
});

/**
 * POST /api/coding/validate
 * Validate code syntax (basic check)
 */
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language required' });
    }

    // Basic syntax validation
    let isValid = true;
    let errors = [];

    if (language === 'java') {
      // Check for basic Java structure
      if (!code.includes('class')) {
        isValid = false;
        errors.push('Java code must contain a class declaration');
      }
      if (!code.includes('public') && !code.includes('private')) {
        isValid = false;
        errors.push('Java methods should have access modifiers');
      }
    } else if (language === 'javascript') {
      // Check for basic JS issues
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        isValid = false;
        errors.push('Mismatched braces');
      }
    }

    res.json({
      valid: isValid,
      errors,
      warnings: []
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

module.exports = router;
