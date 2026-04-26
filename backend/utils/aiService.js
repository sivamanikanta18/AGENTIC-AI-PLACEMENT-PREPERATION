const OpenAI = require('openai');

// AI Provider Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const MOCK_MODE = false; // Always use real AI and database
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Silent in production
if (!IS_PRODUCTION) {
  // console.log('[AI Service] Provider:', AI_PROVIDER.toUpperCase());
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Google Gemini API helper
async function callGeminiAPI(prompt, temperature = 0.7) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not configured');
  }
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: 2048
        }
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    if (!IS_PRODUCTION) {
      // console.error('[Gemini API Error]:', response.status);
    }
    throw new Error(`Gemini API error ${response.status}`);
  }
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Groq API helper with retry logic
async function callGroqAPI(prompt, temperature = 0.7, retries = 2) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  
  // Try different models in order of preference
  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  ];
  
  for (const model of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: 'You are an expert AI assistant.' },
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: 2048
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.choices?.[0]?.message?.content || '';
        }
        
        // If rate limited, wait and retry
        if (response.status === 429 && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
          continue;
        }
        
        // If other error, try next model
        break;
        
      } catch (error) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
  
  throw new Error('All Groq models failed or rate limited');
}

// Unified AI call function
async function callAI(prompt, temperature = 0.7, retries = 2) {
  if (MOCK_MODE) {
    return null;
  }
  
  if (AI_PROVIDER === 'google') {
    return await callGeminiAPI(prompt, temperature);
  } else if (AI_PROVIDER === 'groq') {
    return await callGroqAPI(prompt, temperature, retries);
  } else {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature
    });
    return completion.choices[0].message.content;
  }
}

// Mock data generators
const mockResumeAnalysis = {
  skills_detected: [
    { name: "JavaScript", proficiency: "Intermediate", category: "technical" },
    { name: "React", proficiency: "Intermediate", category: "technical" },
    { name: "Node.js", proficiency: "Beginner", category: "technical" },
    { name: "Communication", proficiency: "Advanced", category: "soft" }
  ],
  weak_areas: ["System Design", "Database Optimization", "Cloud Technologies"],
  risk_flags: ["Limited project diversity", "No metrics in project descriptions"],
  strengths: ["Good problem-solving approach", "Clear communication style"],
  experience_summary: "2+ years of frontend development with focus on React applications",
  projects_summary: [
    { name: "E-commerce Dashboard", technologies: ["React", "Redux"], complexity: "medium" }
  ],
  education: [{ degree: "B.Tech Computer Science", institution: "Your University", year: "2023" }],
  skill_gaps: [
    { skill: "System Design", importance: "high", recommendation: "Practice design problems on LeetCode" },
    { skill: "Docker", importance: "medium", recommendation: "Complete Docker basics course" }
  ],
  overclaimed_skills: [],
  confidence_score: 65
};

const mockInterviewQuestion = {
  question: "Explain how you would optimize a React application that has performance issues. What tools and techniques would you use?",
  type: "technical",
  difficulty: "medium",
  category: "React Performance",
  expected_topics: ["React.memo", "useMemo", "useCallback", "Chrome DevTools", "lazy loading"],
  hints: ["Consider memoization techniques", "Think about code splitting"],
  timeLimit: 120,
  followUpQuestions: ["How would you measure the improvement?"]
};

const mockAnswerEvaluation = {
  score: 7,
  technical_accuracy: 7,
  clarity: 8,
  confidence: 6,
  issues: ["Could have mentioned specific metrics", "Missed edge case handling"],
  suggestions: ["Include quantifiable results in examples", "Practice more STAR format"],
  aiResponse: "Good answer! You covered the main points. Let's dive deeper into the monitoring aspect.",
  followUpQuestion: "How would you handle a situation where the optimization breaks other features?"
};

const mockFeedbackReport = {
  overall_score: 72,
  dimensions: {
    confidence: { score: 6.5, details: "Good eye contact and clear voice" },
    clarity: { score: 7.5, details: "Well-structured answers" },
    technical: { score: 7, score: 7, details: "Solid technical knowledge" },
    communication: { score: 8, details: "Excellent articulation" },
    problem_solving: { score: 7, approach: "Methodical approach" }
  },
  aiSummary: {
    overallAssessment: "Strong performance with room for growth in technical depth.",
    keyStrengths: ["Clear communication", "Structured thinking"],
    priorityAreas: ["System design knowledge", "Edge case handling"]
  },
  actionItems: [
    { priority: "high", category: "Technical", description: "Practice system design problems", resources: ["LeetCode", "System Design Primer"] }
  ]
};

// Generate 30-day mock roadmap with daily plans
const generateMockRoadmap = () => {
  const dailyPlan = [];
  const focuses = [
    "React Fundamentals", "JavaScript Deep Dive", "System Design Basics", "Data Structures",
    "Algorithm Practice", "Frontend Optimization", "Backend Concepts", "Database Design",
    "API Design", "Testing Strategies", "DevOps Basics", "Cloud Fundamentals",
    "Behavioral Prep", "Resume Polish", "Mock Interview 1", "Mock Interview 2",
    "Coding Practice", "Problem Solving", "Advanced React", "State Management",
    "Performance Tuning", "Security Basics", "Scalability", "Microservices",
    "Containerization", "CI/CD", "Monitoring", "Soft Skills", "Final Review", "Rest Day"
  ];
  
  for (let i = 1; i <= 30; i++) {
    const focus = focuses[(i - 1) % focuses.length];
    const tasks = [
      { title: `Learn ${focus} fundamentals`, type: "learning", duration: 60, completed: false },
      { title: `Practice ${focus} exercises`, type: "practice", duration: 45, completed: false },
      { title: i % 3 === 0 ? "Mock Interview" : "Quiz", type: i % 3 === 0 ? "interview" : "practice", duration: 30, completed: false }
    ];
    
    dailyPlan.push({
      day: i,
      focus,
      tasks,
      skills: [focus.split(" ")[0]],
      estimatedXP: 100 + Math.floor(Math.random() * 100)
    });
  }
  
  return {
    schedule: {
      totalDays: 30,
      dailyPlan
    },
    target: {
      role: "Software Developer",
      companies: ["Google", "Microsoft", "Amazon", "Meta"],
      timeline: "30 days",
      focusAreas: ["DSA", "System Design", "Behavioral"]
    },
    skillPath: [
      { skill: "Data Structures", currentLevel: "intermediate", targetLevel: "advanced", estimatedDays: 7 },
      { skill: "System Design", currentLevel: "beginner", targetLevel: "intermediate", estimatedDays: 10 },
      { skill: "React", currentLevel: "intermediate", targetLevel: "advanced", estimatedDays: 5 }
    ],
    milestones: [
      { title: "Complete Week 1", description: "Finish all week 1 tasks", criteria: ["Complete 7 days"], xpReward: 500, completed: false, estimatedDays: 7 },
      { title: "First Interview", description: "Complete your first mock interview", criteria: ["Score > 7"], xpReward: 100, completed: false, estimatedDays: 3 },
      { title: "DSA Master", description: "Solve 50 problems", criteria: ["50 problems solved"], xpReward: 1000, completed: false, estimatedDays: 14 },
      { title: "System Design Ready", description: "Complete system design course", criteria: ["Design 3 systems"], xpReward: 800, completed: false, estimatedDays: 21 },
      { title: "Interview Ready", description: "Score > 8 in 3 consecutive interviews", criteria: ["3 high scores"], xpReward: 1500, completed: false, estimatedDays: 28 }
    ],
    aiInsights: {
      reasoning: "Based on your profile, you need to focus on system design and advanced algorithms.",
      difficultyAssessment: "Moderate - You have good fundamentals but need depth.",
      successProbability: 75,
      alternativePaths: ["Focus on frontend roles", "Consider devops positions"]
    }
  };
};

const mockRoadmap = generateMockRoadmap();

const mockCodingProblem = {
  title: "Two Sum",
  description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  difficulty: "easy",
  category: "arrays",
  examples: [
    { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9" }
  ],
  constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
  hints: [{ text: "Consider using a hash map for O(n) solution", xpCost: 50 }],
  solution: "Use hash map to store complements"
};

const mockCodingEvaluation = {
  correctness: 90,
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  codeQuality: 8,
  optimizationLevel: 7,
  suggestions: ["Good solution!", "Consider edge cases"],
  feedback: "Well implemented solution with good time complexity."
};

class AIService {
  // Resume Analysis
  static async analyzeResume(resumeText) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock resume analysis');
      return { ...mockResumeAnalysis, confidence_score: Math.floor(Math.random() * 30) + 60 };
    }
    
    const prompt = `Analyze this resume and extract structured insights. 

IMPORTANT: Use ONLY these exact values for enums:
- proficiency: MUST be one of: "Beginner", "Intermediate", "Advanced", "Expert" (use "Beginner" instead of "Basic" or "Learning")
- category: MUST be one of: "technical", "soft", "domain"
- complexity: MUST be one of: "low", "medium", "high"
- importance: MUST be one of: "high", "medium", "low" (all lowercase)

Return a JSON object with this exact structure:
{
  "skills_detected": [
    {"name": "skill name", "proficiency": "Beginner|Intermediate|Advanced|Expert", "category": "technical|soft|domain"}
  ],
  "weak_areas": ["list of weak areas"],
  "risk_flags": ["potential issues like overclaiming"],
  "strengths": ["key strengths"],
  "experience_summary": "brief summary",
  "projects_summary": [
    {"name": "project name", "technologies": ["tech1"], "complexity": "low|medium|high"}
  ],
  "education": [
    {"degree": "degree name", "institution": "institution name", "year": "year"}
  ],
  "skill_gaps": [
    {"skill": "skill name", "importance": "high|medium|low", "recommendation": "what to do"}
  ],
  "overclaimed_skills": ["skills that seem exaggerated"],
  "confidence_score": number between 0-100
}

Resume text:
${resumeText}`;

    try {
      const content = await callAI(prompt, 0.3);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Normalize enum values to match database schema
        return this.normalizeResumeAnalysis(result);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Resume analysis error:', error.message);
      console.error('Full error:', error);
      // Return fallback mock data instead of empty data
      return this.getDefaultResumeAnalysis();
    }
  }

  // Generate Interview Question
  static async generateInterviewQuestion(context) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock interview question');
      return { ...mockInterviewQuestion, id: `q-${Date.now()}` };
    }
    
    const { type, difficulty, resumeContext, previousAnswers, companyMode, askedQuestions = [] } = context;
    
    const prompt = `Act as a strict interviewer conducting a ${companyMode} style interview.
    
Question type: ${type}
Target difficulty: ${difficulty}

Candidate context from resume:
- Skills: ${resumeContext.skills?.join(', ') || 'N/A'}
- Projects: ${resumeContext.projects?.join(', ') || 'N/A'}
- Experience: ${resumeContext.experience?.join(', ') || 'N/A'}
- Weak areas to focus on: ${resumeContext.weakAreas?.join(', ') || 'N/A'}

${previousAnswers?.length > 0 ? `Previous answers context:
${previousAnswers.map((a, i) => `Q${i+1}: ${a.question}
A${i+1}: ${a.answer} (Score: ${a.score}/10)`).join('\n\n')}` : ''}

${askedQuestions?.length > 0 ? `IMPORTANT - DO NOT REPEAT these already asked questions:
${askedQuestions.map((q, i) => `${i+1}. ${q.substring(0, 100)}...`).join('\n')}` : ''}

Generate ONE interview question that:
1. ${type === 'technical' ? 'Tests technical knowledge and problem-solving' : type === 'hr' ? 'Assesses cultural fit and motivation' : 'Evaluates past behavior and soft skills'}
2. ${difficulty === 'adaptive' ? 'Adjusts difficulty based on previous performance' : `Is at ${difficulty} difficulty level`}
3. ${companyMode === 'faang' ? 'Focuses on DSA and system design' : companyMode === 'service_based' ? 'Tests fundamentals and consistency' : 'Focuses on practical skills and projects'}
4. Is COMPLETELY DIFFERENT from any previously asked questions listed above

Return JSON:
{
  "id": "unique-id",
  "question": "the question text",
  "category": "specific category",
  "difficulty": "easy|medium|hard",
  "expectedAnswerPoints": ["point 1", "point 2", "point 3"],
  "hints": ["hint 1", "hint 2"],
  "timeLimit": seconds
}`;

    try {
      const content = await callAI(prompt, 0.7);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Question generation error:', error);
      return this.getDefaultQuestion(type);
    }
  }

  // Evaluate Answer
  static async evaluateAnswer(question, answer, context) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock answer evaluation');
      return { ...mockAnswerEvaluation, score: Math.floor(Math.random() * 4) + 6 };
    }
    
    const prompt = `Evaluate this interview answer rigorously.

Question: ${question}
Candidate's Answer: ${answer}
${context.expectedAnswerPoints ? `Expected points to cover: ${context.expectedAnswerPoints.join(', ')}` : ''}

Provide detailed feedback as JSON:
{
  "score": number 0-10,
  "confidence": number 0-10,
  "clarity": number 0-10,
  "technical_accuracy": number 0-10,
  "communication": number 0-10,
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "filler_words": {"count": number, "words": ["word1"]},
  "missing_points": ["point not covered"],
  "strengths": ["strength 1"],
  "aiResponse": "what interviewer would say next",
  "nextDifficulty": "easier|same|harder"
}`;

    try {
      const content = await callAI(prompt, 0.4);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Answer evaluation error:', error);
      return this.getDefaultFeedback();
    }
  }

  // Generate Feedback Report
  static async generateFeedbackReport(interviewData) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock feedback report');
      return mockFeedbackReport;
    }
    
    const prompt = `Generate a comprehensive feedback report based on this interview data:
${JSON.stringify(interviewData, null, 2)}

Provide detailed multi-dimensional feedback as JSON:
{
  "dimensions": {
    "confidence": {"score": 0-10, "details": "...", "improvements": ["..."]},
    "clarity": {"score": 0-10, "details": "...", "improvements": ["..."]},
    "technical": {"score": 0-10, "details": "...", "knowledgeGaps": ["..."], "improvements": ["..."]},
    "communication": {"score": 0-10, "fillerWords": {"count": 0, "words": []}, "pace": "...", "structure": "...", "improvements": ["..."]},
    "problem_solving": {"score": 0-10, "approach": "...", "optimization": "...", "improvements": ["..."]}
  },
  "actionItems": [
    {"priority": "high|medium|low", "category": "...", "description": "...", "resources": ["..."]}
  ],
  "aiSummary": {
    "overallAssessment": "...",
    "keyStrengths": ["..."],
    "priorityAreas": ["..."],
    "preparationTips": ["..."]
  }
}`;

    try {
      const content = await callAI(prompt, 0.4);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Feedback generation error:', error);
      return this.getDefaultFullFeedback();
    }
  }

  // Generate Roadmap
  static async generateRoadmap(userProfile, feedbackData, targetRole) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock roadmap');
      return this.generatePlacementRoadmap(userProfile, targetRole);
    }
    
    const prompt = `Create a personalized 30-day PLACEMENT PREPARATION roadmap to crack interviews for a ${targetRole} position.

CRITICAL: Analyze the user's profile and create a TARGETED plan focusing on:
1. Their WEAK AREAS from resume analysis - prioritize these
2. Missing skills for the target role
3. Interview-specific preparation (technical + behavioral)
4. Realistic daily schedule with mix of learning, coding, and mock interviews

User Profile:
${JSON.stringify(userProfile, null, 2)}

Feedback Data:
${JSON.stringify(feedbackData, null, 2)}

IMPORTANT GUIDELINES:
- Week 1-2: Focus on FUNDAMENTALS and weak areas from resume
- Week 3: Intensive CODING PRACTICE and system design
- Week 4: MOCK INTERVIEWS, behavioral prep, and revision
- Include specific LeetCode problems, system design topics, and company-specific prep
- Each day should have 3-4 tasks: Learning (60min) + Coding (90min) + Interview Practice (30min)

Generate a detailed roadmap as JSON:
{
  "target": {
    "role": "${targetRole}",
    "companies": ["Google", "Microsoft", "Amazon", "Meta", "Startups"],
    "timeline": "30 days",
    "focusAreas": ["DSA", "System Design", "Projects", "Behavioral"]
  },
  "schedule": {
    "totalDays": 30,
    "dailyPlan": [
      {
        "day": 1,
        "focus": "topic based on weak areas",
        "tasks": [
          {
            "type": "learning|practice|interview|coding|revision|rest",
            "title": "Specific task title",
            "description": "Detailed description with resources",
            "duration": 60,
            "resources": [{"type": "video|article|problem|mock|documentation", "title": "Resource name", "url": "optional url"}]
          }
        ],
        "skills": ["relevant skills"],
        "estimatedXP": 150
      }
    ]
  },
  "skillPath": [
    {
      "skill": "specific skill from weak areas",
      "currentLevel": "beginner|intermediate",
      "targetLevel": "intermediate|advanced",
      "resources": ["LeetCode", "Books", "Courses"],
      "practiceProblems": ["Problem names"],
      "estimatedDays": 7
    }
  ],
  "milestones": [
    {
      "title": "Achievement name",
      "description": "What needs to be done",
      "criteria": ["Specific criteria"],
      "xpReward": 500,
      "estimatedDays": 7
    }
  ],
  "aiInsights": {
    "reasoning": "Why this plan was created based on their profile",
    "difficultyAssessment": "How difficult based on current skills",
    "successProbability": 75,
    "alternativePaths": ["Other role options if needed"]
  }
}`;

    try {
      const content = await callAI(prompt, 0.5);
      if (!content) throw new Error('Empty AI response');
      
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // Validate it has required fields
          if (parsed.schedule && parsed.schedule.dailyPlan && parsed.schedule.dailyPlan.length > 0) {
            return parsed;
          }
        } catch (parseErr) {
          console.log('JSON parse failed, using fallback');
        }
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Roadmap generation error:', error.message);
      console.log('✅ Using placement-focused roadmap generator');
      return this.generatePlacementRoadmap(userProfile, targetRole);
    }
  }

  // Generate Coding Problem
  static async generateCodingProblem(difficulty, category, userLevel) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock coding problem');
      return { ...mockCodingProblem, difficulty, category };
    }
    
    const prompt = `Generate a ${difficulty} coding problem for ${category} category.
Target user level: ${userLevel}

Return as JSON:
{
  "title": "Problem Title",
  "description": "Detailed problem description with examples",
  "difficulty": "easy|medium|hard",
  "category": "${category}",
  "examples": [
    {"input": "...", "output": "...", "explanation": "..."}
  ],
  "constraints": ["constraint1", "constraint2"],
  "hints": [
    {"order": 1, "content": "...", "xpCost": 50}
  ],
  "solution": {
    "approach": "...",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)"
  },
  "testCases": [
    {"input": "...", "expectedOutput": "...", "isHidden": false}
  ]
}`;

    try {
      const content = await callAI(prompt, 0.6);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Coding problem generation error:', error);
      return this.getDefaultCodingProblem(category);
    }
  }

  // Evaluate Coding Solution
  static async evaluateCodingSolution(problem, solution, language) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock coding evaluation');
      return mockCodingEvaluation;
    }
    
    const prompt = `Evaluate this coding solution:

Problem: ${problem.title}
Description: ${problem.description}

Solution (${language}):
${solution}

Evaluate and return JSON:
{
  "correctness": number 0-100,
  "timeComplexity": "assessed complexity",
  "spaceComplexity": "assessed complexity",
  "codeQuality": number 0-10,
  "optimizationLevel": number 0-10,
  "suggestions": ["improvement1", "improvement2"],
  "feedback": "detailed feedback"
}`;

    try {
      const content = await callAI(prompt, 0.4);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Code evaluation error:', error);
      return this.getDefaultCodeFeedback();
    }
  }

  // AI Debate Mode
  static async generateDebateResponse(topic, userArgument, round, history) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock debate response');
      return {
        response: `Interesting point about "${topic}". However, have you considered the scalability implications? In production environments, this approach might face challenges with high concurrency.`,
        pointsAddressed: ["Main argument", "Technical feasibility"],
        weaknessesSpotted: ["Scalability concerns"],
        followUpQuestion: "How would your approach handle 10,000 concurrent users?",
        debateScore: Math.floor(Math.random() * 3) + 6
      };
    }
    
    const prompt = `Engage in a technical debate on: "${topic}"

Round: ${round}
User's argument: ${userArgument}
${history ? `Previous exchanges:\n${history}` : ''}

Respond as a challenging but fair debate opponent. Challenge weak points, acknowledge strong arguments, and push the user to think deeper. Keep response under 150 words.

Return JSON:
{
  "response": "your counter-argument or challenge",
  "pointsAddressed": ["point1", "point2"],
  "weaknessesSpotted": ["weakness1"],
  "followUpQuestion": "question to push deeper thinking",
  "debateScore": number 0-10
}`;

    try {
      const content = await callAI(prompt, 0.7);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Debate error:', error);
      return {
        response: "That's an interesting point. Can you elaborate on the trade-offs involved?",
        pointsAddressed: [],
        weaknessesSpotted: [],
        followUpQuestion: "What are the potential drawbacks of your approach?",
        debateScore: 5
      };
    }
  }

  // Calculate Readiness Score
  static async calculateReadiness(userData) {
    if (MOCK_MODE) {
      console.log('[MOCK MODE] Using mock readiness calculation');
      return {
        score: 65,
        status: 'Improving',
        breakdown: { technical: 70, communication: 60, problemSolving: 65, experience: 65 },
        criticalGaps: ['System Design', 'Advanced Algorithms'],
        recommendations: ['Practice mock interviews', 'Complete coding problems']
      };
    }
    
    const prompt = `Calculate a placement readiness score (0-100) based on:
${JSON.stringify(userData, null, 2)}

Return JSON:
{
  "score": number 0-100,
  "status": "Ready|Improving|Not Ready",
  "breakdown": {
    "technical": number,
    "communication": number,
    "problemSolving": number,
    "experience": number
  },
  "criticalGaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"]
}`;

    try {
      const content = await callAI(prompt, 0.4);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Readiness calculation error:', error);
      return {
        score: 50,
        status: 'Improving',
        breakdown: { technical: 50, communication: 50, problemSolving: 50, experience: 50 },
        criticalGaps: ['Keep practicing'],
        recommendations: ['Complete more mock interviews']
      };
    }
  }

  // Default responses for error cases - returns mock data so user sees something useful
  static getDefaultResumeAnalysis() {
    console.log('[AI Service] Using fallback mock resume analysis');
    return {
      skills_detected: [
        { name: "JavaScript", proficiency: "Intermediate", category: "technical" },
        { name: "React", proficiency: "Intermediate", category: "technical" },
        { name: "Node.js", proficiency: "Beginner", category: "technical" },
        { name: "HTML/CSS", proficiency: "Advanced", category: "technical" },
        { name: "Communication", proficiency: "Advanced", category: "soft" },
        { name: "Problem Solving", proficiency: "Intermediate", category: "soft" }
      ],
      weak_areas: ["System Design", "Database Optimization", "Cloud Technologies", "Testing"],
      risk_flags: ["Add more quantifiable achievements", "Include project metrics"],
      strengths: ["Good technical foundation", "Clear communication style", "Diverse project experience"],
      experience_summary: "2+ years of software development with focus on web applications",
      projects_summary: [
        { name: "Web Application", technologies: ["React", "Node.js"], complexity: "medium" },
        { name: "Portfolio Site", technologies: ["HTML", "CSS", "JavaScript"], complexity: "low" }
      ],
      education: [
        { degree: "B.Tech/B.E. Computer Science", institution: "University", year: "2023" }
      ],
      skill_gaps: [
        { skill: "System Design", importance: "high", recommendation: "Practice design problems" },
        { skill: "Docker/Kubernetes", importance: "medium", recommendation: "Complete Docker basics" },
        { skill: "AWS/Cloud", importance: "medium", recommendation: "Get AWS certification" }
      ],
      overclaimed_skills: [],
      confidence_score: 65,
      _fallback: true // Mark as fallback data
    };
  }

  // Normalize AI response to match database enum values
  static normalizeResumeAnalysis(analysis) {
    const validProficiency = ["Beginner", "Intermediate", "Advanced", "Expert"];
    const validCategory = ["technical", "soft", "domain"];
    const validComplexity = ["low", "medium", "high"];
    const validImportance = ["high", "medium", "low"];

    // Map common invalid values to valid ones
    const proficiencyMap = {
      "basic": "Beginner",
      "learning": "Beginner",
      "familiar": "Beginner",
      "novice": "Beginner",
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced",
      "expert": "Expert",
      "master": "Expert"
    };

    const importanceMap = {
      "high": "high",
      "medium": "medium",
      "low": "low"
    };

    // Normalize skills_detected
    if (analysis.skills_detected && Array.isArray(analysis.skills_detected)) {
      analysis.skills_detected = analysis.skills_detected.map(skill => {
        let proficiency = (skill.proficiency || "Beginner").toLowerCase();
        let category = (skill.category || "technical").toLowerCase();

        // Map proficiency
        if (proficiencyMap[proficiency]) {
          proficiency = proficiencyMap[proficiency];
        } else if (!validProficiency.includes(proficiency)) {
          proficiency = "Beginner"; // Default fallback
        }

        // Map category
        if (!validCategory.includes(category)) {
          category = "technical"; // Default fallback
        }

        return {
          name: skill.name || "Unknown Skill",
          proficiency: proficiency.charAt(0).toUpperCase() + proficiency.slice(1),
          category: category
        };
      });
    }

    // Normalize projects_summary
    if (analysis.projects_summary && Array.isArray(analysis.projects_summary)) {
      analysis.projects_summary = analysis.projects_summary.map(project => {
        let complexity = (project.complexity || "medium").toLowerCase();
        if (!validComplexity.includes(complexity)) {
          complexity = "medium";
        }
        return {
          name: project.name || "Unnamed Project",
          technologies: project.technologies || [],
          complexity: complexity
        };
      });
    }

    // Normalize skill_gaps
    if (analysis.skill_gaps && Array.isArray(analysis.skill_gaps)) {
      analysis.skill_gaps = analysis.skill_gaps.map(gap => {
        let importance = (gap.importance || "medium").toLowerCase();
        if (!validImportance.includes(importance)) {
          importance = "medium";
        }
        return {
          skill: gap.skill || "Unknown Skill",
          importance: importance,
          recommendation: gap.recommendation || "Practice more"
        };
      });
    }

    // Ensure confidence_score is a number
    if (typeof analysis.confidence_score !== 'number') {
      analysis.confidence_score = 50;
    }

    return analysis;
  }

  static getDefaultQuestion(type) {
    const defaults = {
      technical: {
        id: 'default-tech',
        question: 'Explain the difference between REST and GraphQL. When would you choose one over the other?',
        category: 'Web APIs',
        difficulty: 'medium',
        expectedAnswerPoints: ['REST uses HTTP methods', 'GraphQL allows flexible queries', 'Trade-offs in performance'],
        hints: ['Consider over-fetching', 'Think about caching'],
        timeLimit: 120
      },
      hr: {
        id: 'default-hr',
        question: 'Tell me about yourself and why you want this position.',
        category: 'Introduction',
        difficulty: 'easy',
        expectedAnswerPoints: ['Brief background', 'Relevant skills', 'Motivation'],
        hints: ['Keep it professional', 'Connect to the role'],
        timeLimit: 90
      },
      behavioral: {
        id: 'default-beh',
        question: 'Describe a time when you faced a conflict in a team. How did you resolve it?',
        category: 'Teamwork',
        difficulty: 'medium',
        expectedAnswerPoints: ['Situation context', 'Actions taken', 'Outcome', 'Lessons learned'],
        hints: ['Use STAR method', 'Be specific'],
        timeLimit: 180
      }
    };
    return defaults[type] || defaults.technical;
  }

  static getDefaultFeedback() {
    return {
      score: 5,
      confidence: 5,
      clarity: 5,
      technical_accuracy: 5,
      communication: 5,
      issues: ['Unable to evaluate fully'],
      suggestions: ['Try again with more detail'],
      filler_words: { count: 0, words: [] },
      missing_points: [],
      strengths: ['Attempted the question'],
      aiResponse: 'Thank you for your answer. Could you elaborate more?',
      nextDifficulty: 'same'
    };
  }

  static getDefaultFullFeedback() {
    return {
      dimensions: {
        confidence: { score: 5, details: 'Evaluation pending', improvements: ['Practice more'] },
        clarity: { score: 5, details: 'Evaluation pending', improvements: ['Structure answers better'] },
        technical: { score: 5, details: 'Evaluation pending', knowledgeGaps: [], improvements: ['Study core concepts'] },
        communication: { score: 5, fillerWords: { count: 0, words: [] }, pace: 'N/A', structure: 'N/A', improvements: [] },
        problem_solving: { score: 5, approach: 'N/A', optimization: 'N/A', improvements: [] }
      },
      actionItems: [],
      aiSummary: {
        overallAssessment: 'Complete the interview for full feedback',
        keyStrengths: [],
        priorityAreas: ['Complete mock interviews'],
        preparationTips: ['Practice regularly']
      }
    };
  }

  // Generate placement-focused roadmap based on resume gaps
  static generatePlacementRoadmap(userProfile, targetRole) {
    const weakAreas = userProfile.weakAreas || [];
    const skills = userProfile.skills || [];
    
    // Create personalized 30-day plan based on weak areas
    const dailyPlan = [];
    const focuses = weakAreas.length > 0 
      ? [...weakAreas, "System Design", "Behavioral Interview", "Coding Practice", "Mock Interviews"]
      : ["Data Structures", "Algorithms", "System Design", "Behavioral", "Coding Practice"];
    
    // Week 1: Fundamentals & Weak Areas
    for (let i = 1; i <= 7; i++) {
      const focus = focuses[(i - 1) % focuses.length];
      dailyPlan.push({
        day: i,
        focus: `Foundation: ${focus}`,
        tasks: [
          { title: `Learn ${focus} fundamentals`, type: "learning", duration: 60, completed: false, resources: [{type: "article", title: `${focus} Basics`}] },
          { title: `Practice ${focus} exercises`, type: "practice", duration: 90, completed: false, resources: [{type: "problem", title: `Easy ${focus} Problems`}] },
          { title: "Review and notes", type: "revision", duration: 30, completed: false }
        ],
        skills: [focus],
        estimatedXP: 150
      });
    }
    
    // Week 2: Intermediate Practice
    for (let i = 8; i <= 14; i++) {
      const focus = focuses[(i - 1) % focuses.length];
      dailyPlan.push({
        day: i,
        focus: `Practice: ${focus}`,
        tasks: [
          { title: `Medium ${focus} problems`, type: "coding", duration: 90, completed: false, resources: [{type: "problem", title: `LeetCode Medium - ${focus}`}] },
          { title: "System Design case study", type: "learning", duration: 60, completed: false, resources: [{type: "video", title: "System Design Tutorial"}] },
          { title: "Quick revision", type: "revision", duration: 30, completed: false }
        ],
        skills: [focus, "Problem Solving"],
        estimatedXP: 180
      });
    }
    
    // Week 3: Advanced & Company Prep
    for (let i = 15; i <= 21; i++) {
      dailyPlan.push({
        day: i,
        focus: "Advanced Preparation",
        tasks: [
          { title: "Hard coding problems", type: "coding", duration: 120, completed: false, resources: [{type: "problem", title: "LeetCode Hard"}] },
          { title: "Mock Interview - Technical", type: "interview", duration: 45, completed: false, resources: [{type: "mock", title: "Technical Mock"}] },
          { title: "Behavioral prep (STAR method)", type: "learning", duration: 45, completed: false, resources: [{type: "article", title: "Behavioral Interview Guide"}] }
        ],
        skills: ["Advanced Algorithms", "Interview Skills"],
        estimatedXP: 200
      });
    }
    
    // Week 4: Final Prep & Mock Interviews
    for (let i = 22; i <= 28; i++) {
      dailyPlan.push({
        day: i,
        focus: "Interview Simulation",
        tasks: [
          { title: "Full Mock Interview", type: "interview", duration: 60, completed: false, resources: [{type: "mock", title: "Complete Interview"}] },
          { title: "Review weak areas", type: "revision", duration: 60, completed: false },
          { title: "Company research", type: "learning", duration: 30, completed: false, resources: [{type: "article", title: "Company-specific prep"}] }
        ],
        skills: ["Interview Skills", "Communication"],
        estimatedXP: 220
      });
    }
    
    // Days 29-30: Final Review
    for (let i = 29; i <= 30; i++) {
      dailyPlan.push({
        day: i,
        focus: "Final Review & Rest",
        tasks: [
          { title: "Light revision", type: "revision", duration: 60, completed: false },
          { title: "Rest and mental prep", type: "rest", duration: 60, completed: false },
          { title: "Mock interview warmup", type: "interview", duration: 30, completed: false }
        ],
        skills: ["Preparation"],
        estimatedXP: 100
      });
    }
    
    return {
      target: {
        role: targetRole || "Software Developer",
        companies: ["Google", "Microsoft", "Amazon", "Meta", "Product-Based Companies"],
        timeline: "30 days",
        focusAreas: [...new Set(focuses)].slice(0, 4)
      },
      schedule: {
        totalDays: 30,
        dailyPlan
      },
      skillPath: focuses.map(skill => ({
        skill,
        currentLevel: "beginner",
        targetLevel: "intermediate",
        resources: ["LeetCode", "GeeksforGeeks", "YouTube Tutorials"],
        practiceProblems: [`${skill} Problem 1`, `${skill} Problem 2`],
        estimatedDays: 7
      })).slice(0, 5),
      milestones: [
        { title: "Week 1 Complete", description: "Finish all fundamental topics", criteria: ["Complete 7 days"], xpReward: 500, completed: false, estimatedDays: 7 },
        { title: "Coding Streak", description: "Solve 20+ problems", criteria: ["20 problems solved"], xpReward: 300, completed: false, estimatedDays: 14 },
        { title: "First Mock Interview", description: "Complete technical mock", criteria: ["Score > 7/10"], xpReward: 200, completed: false, estimatedDays: 10 },
        { title: "System Design Ready", description: "Complete 3 system designs", criteria: ["3 designs done"], xpReward: 400, completed: false, estimatedDays: 21 },
        { title: "Interview Ready", description: "Score 8+ in 2 mocks", criteria: ["2 high scores"], xpReward: 1000, completed: false, estimatedDays: 28 },
        { title: "Placement Ready", description: "Complete 30-day plan", criteria: ["All 30 days done"], xpReward: 2000, completed: false, estimatedDays: 30 }
      ],
      aiInsights: {
        reasoning: `Based on your resume, we identified ${weakAreas.length} weak areas to focus on: ${weakAreas.join(', ')}. This plan targets these gaps for interview success.`,
        difficultyAssessment: weakAreas.length > 3 ? "Challenging - Multiple gaps to fill" : "Moderate - Focused improvement needed",
        successProbability: Math.max(50, 100 - weakAreas.length * 10),
        alternativePaths: weakAreas.includes("System Design") ? ["Focus on startups first", "Consider backend roles"] : ["Consider devops roles"]
      }
    };
  }

  static getDefaultRoadmap() {
    // Return full mock roadmap with 30-day plan
    return mockRoadmap;
  }

  static getDefaultCodingProblem(category) {
    return {
      title: `Basic ${category} Problem`,
      description: 'Practice problem for skill development',
      difficulty: 'easy',
      category,
      examples: [],
      constraints: [],
      hints: [],
      solution: { approach: '', timeComplexity: '', spaceComplexity: '' },
      testCases: []
    };
  }

  static getDefaultCodeFeedback() {
    return {
      correctness: 50,
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      codeQuality: 5,
      optimizationLevel: 5,
      suggestions: ['Review your solution', 'Check algorithm complexity'],
      feedback: 'Solution analyzed. Check test results for details.'
    };
  }

  // Generate personalized problem based on user's weak areas
  static async generatePersonalizedProblem(context) {
    const { userLevel, weakAreas, skills, focusArea, targetCompanies } = context;
    
    const prompt = `Generate a LeetCode-style coding problem personalized for a ${userLevel} level candidate preparing for placement at ${targetCompanies.join(', ')}.

CRITICAL FOCUS AREAS (from resume analysis):
- Weak Areas: ${weakAreas.join(', ')}
- Current Skills: ${skills.join(', ')}
- Primary Focus: ${focusArea}

REQUIREMENTS:
1. Problem must directly address the weak area: ${focusArea}
2. Difficulty appropriate for ${userLevel} level
3. Commonly asked in ${targetCompanies.join(', ')} interviews
4. Include proper examples, constraints, and edge cases
5. Must have clear problem statement like real LeetCode problems
6. Include step-by-step hints with XP costs
7. Provide optimal solution with time/space complexity
8. Include 3-5 test cases (visible and hidden)

Return valid JSON:
{
  "title": "Descriptive Problem Title",
  "description": "Detailed problem description with examples",
  "difficulty": "easy|medium|hard",
  "category": "arrays|strings|linked_list|trees|graphs|dynamic_programming|recursion|backtracking|greedy|sorting",
  "examples": [
    {"input": "...", "output": "...", "explanation": "..."}
  ],
  "constraints": ["1 <= n <= 10^5", "0 <= nums[i] <= 100"],
  "hints": [
    {"order": 1, "content": "First hint", "xpCost": 0},
    {"order": 2, "content": "Second hint", "xpCost": 50}
  ],
  "solution": {
    "approach": "Detailed explanation of approach",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "code": {
      "javascript": "function solution() { ... }",
      "python": "def solution(): ...",
      "java": "public int solution() { ... }",
      "cpp": "int solution() { ... }"
    }
  },
  "testCases": [
    {"input": "[1,2,3]", "expectedOutput": "6", "isHidden": false},
    {"input": "[5,5,5]", "expectedOutput": "15", "isHidden": true}
  ]
}`;

    try {
      console.log(`[AI] Generating personalized problem for ${userLevel} level, focusing on: ${focusArea}`);
      const content = await callAI(prompt, 0.6);
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!parsed.title || !parsed.description || !parsed.difficulty) {
          throw new Error('Missing required fields in generated problem');
        }
        
        // Add metadata
        parsed.source = 'ai-generated';
        parsed.companyTags = targetCompanies;
        parsed.tags = [parsed.difficulty, parsed.category, focusArea.toLowerCase().replace(/\s+/g, '_')];
        
        console.log(`✅ Generated problem: "${parsed.title}" (${parsed.difficulty})`);
        return parsed;
      }
      throw new Error('Invalid JSON response from AI');
    } catch (error) {
      console.error('Personalized problem generation error:', error);
      console.log('Falling back to standard problem generation');
      return this.getDefaultCodingProblem('arrays');
    }
  }

  // Generate problem for mock test with specific constraints
  static async generateMockTestProblem(context) {
    const { difficulty, companyMode, focusArea, userLevel, isFollowUp } = context;
    
    const companySpecificHints = {
      'Google': 'Focus on efficient algorithms with optimal time/space complexity',
      'Amazon': 'Emphasize scalable solutions and system design considerations',
      'Facebook': 'Focus on clean code and edge case handling',
      'Microsoft': 'Emphasize robust solutions with comprehensive testing',
      'Apple': 'Focus on memory-efficient solutions',
      'Netflix': 'Emphasize high-performance and concurrency handling',
      'general': 'Focus on fundamental DSA concepts'
    };

    const prompt = `Generate a ${difficulty} coding problem for a ${userLevel} candidate preparing for ${companyMode} interviews.

FOCUS AREA: ${focusArea}
${isFollowUp ? 'This should be a follow-up problem building on previous concepts.' : ''}

COMPANY FOCUS: ${companySpecificHints[companyMode] || companySpecificHints.general}

Requirements:
1. Problem should be ${difficulty} difficulty level
2. Must have clear problem statement with examples
3. Include input/output format
4. Must test ${focusArea} concepts
5. Should be solvable in 30-45 minutes
6. Include 2-3 examples
7. Include constraints section

Return valid JSON:
{
  "title": "Descriptive Problem Title",
  "description": "Detailed problem description with context",
  "difficulty": "${difficulty}",
  "category": "arrays|strings|linked_list|trees|graphs|dynamic_programming",
  "examples": [
    {
      "input": "example input",
      "output": "expected output",
      "explanation": "why this is the output"
    }
  ],
  "constraints": ["1 <= n <= 10^5", "0 <= nums[i] <= 100"],
  "hints": [
    {"order": 1, "content": "First hint", "xpCost": 0},
    {"order": 2, "content": "Second hint", "xpCost": 50}
  ]
}`;

    try {
      console.log(`[AI] Generating mock test problem: ${difficulty}, ${focusArea}, ${companyMode}`);
      const content = await callAI(prompt, 0.5);
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (!parsed.title || !parsed.description) {
          throw new Error('Missing required fields');
        }
        
        parsed.source = 'ai-mock-test';
        parsed.companyTags = [companyMode];
        parsed.isMockTest = true;
        parsed.generatedAt = new Date();
        
        console.log(`✅ Generated mock test problem: "${parsed.title}"`);
        return parsed;
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Mock test problem generation error:', error);
      return this.getDefaultCodingProblem('arrays');
    }
  }
}

module.exports = AIService;
