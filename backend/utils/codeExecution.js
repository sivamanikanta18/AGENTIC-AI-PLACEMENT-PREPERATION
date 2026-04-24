/**
 * Code Execution Service using Piston API
 * Supports multiple languages with secure sandbox execution
 */

const axios = require('axios');

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language version mappings for Piston
const LANGUAGE_VERSIONS = {
  javascript: '18.15.0',
  python: '3.10.0',
  java: '15.0.2',
  cpp: '10.2.0',
  c: '10.2.0',
  go: '1.16.2',
  rust: '1.68.2'
};

// File extension mappings
const FILE_EXTENSIONS = {
  javascript: 'js',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rs'
};

/**
 * Execute code using Piston API
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language
 * @param {string} stdin - Standard input (optional)
 * @returns {Promise<Object>} Execution result
 */
async function executeCode(code, language, stdin = '') {
  try {
    // Validate language
    if (!LANGUAGE_VERSIONS[language]) {
      return {
        success: false,
        error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_VERSIONS).join(', ')}`,
        output: '',
        stderr: '',
        executionTime: 0
      };
    }

    // Prepare request payload
    const payload = {
      language: language === 'cpp' || language === 'c' ? 'cpp' : language,
      version: LANGUAGE_VERSIONS[language],
      files: [
        {
          content: code
        }
      ],
      stdin: stdin,
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1
    };

    // Special handling for Java (class name must match)
    if (language === 'java') {
      // Check if code has public class
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      if (classMatch) {
        payload.files[0].name = `${classMatch[1]}.java`;
      } else {
        // Wrap in Main class if no public class found
        payload.files[0].content = `public class Main {\n${code}\n}`;
        payload.files[0].name = 'Main.java';
      }
    }

    console.log(`[CodeExecution] Running ${language} code...`);
    const startTime = Date.now();

    // Call Piston API
    const response = await axios.post(`${PISTON_API_URL}/execute`, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const executionTime = Date.now() - startTime;
    const result = response.data;

    // Process result
    if (result.run && result.run.code === 0) {
      // Successful execution
      return {
        success: true,
        output: result.run.output || '',
        stderr: result.run.stderr || '',
        error: '',
        executionTime: executionTime,
        memory: result.run.memory || 0,
        compileOutput: result.compile?.output || ''
      };
    } else if (result.compile && result.compile.code !== 0) {
      // Compilation error
      return {
        success: false,
        output: '',
        stderr: result.compile.stderr || result.compile.output || '',
        error: 'Compilation Error',
        executionTime: executionTime,
        memory: 0,
        compileOutput: result.compile.output || ''
      };
    } else {
      // Runtime error
      return {
        success: false,
        output: result.run?.output || '',
        stderr: result.run?.stderr || '',
        error: result.run?.signal || 'Runtime Error',
        executionTime: executionTime,
        memory: result.run?.memory || 0,
        compileOutput: result.compile?.output || ''
      };
    }

  } catch (error) {
    console.error('[CodeExecution] Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Execution timeout (30s limit exceeded)',
        output: '',
        stderr: '',
        executionTime: 30000
      };
    }

    return {
      success: false,
      error: `Execution failed: ${error.message}`,
      output: '',
      stderr: '',
      executionTime: 0
    };
  }
}

/**
 * Run code against test cases
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {Array} testCases - Array of test cases with input and expectedOutput
 * @returns {Promise<Object>} Test results
 */
async function runTests(code, language, testCases) {
  const results = [];
  let passed = 0;
  let totalExecutionTime = 0;

  for (const testCase of testCases) {
    const result = await executeCode(code, language, testCase.input);
    
    const actualOutput = result.output.trim();
    const expectedOutput = testCase.expectedOutput.trim();
    const testPassed = actualOutput === expectedOutput && result.success;

    if (testPassed) passed++;
    totalExecutionTime += result.executionTime;

    results.push({
      testCase: testCase.testCase || results.length + 1,
      input: testCase.input,
      expectedOutput: expectedOutput,
      actualOutput: actualOutput,
      passed: testPassed,
      error: result.error,
      stderr: result.stderr,
      executionTime: result.executionTime
    });
  }

  return {
    passed,
    total: testCases.length,
    results,
    totalExecutionTime,
    allPassed: passed === testCases.length
  };
}

/**
 * Check if Piston API is available
 * @returns {Promise<boolean>}
 */
async function isServiceAvailable() {
  try {
    const response = await axios.get(`${PISTON_API_URL}/runtimes`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('[CodeExecution] Service unavailable:', error.message);
    return false;
  }
}

module.exports = {
  executeCode,
  runTests,
  isServiceAvailable,
  LANGUAGE_VERSIONS,
  FILE_EXTENSIONS
};
