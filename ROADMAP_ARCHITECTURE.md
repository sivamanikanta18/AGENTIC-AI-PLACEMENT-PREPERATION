# PrepSense AI - Advanced Learning Roadmap Architecture

## Executive Summary
Production-grade, AI-adaptive learning roadmap system with gamification, multiple roadmap support, and real-time progress analytics.

## Core Architecture

### 1. Database Schema Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROADMAP SYSTEM SCHEMA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │    User      │    │   Roadmap    │    │  RoadmapTemplate │   │
│  │              │◄───┤              │◄───┤                  │   │
│  │ - id         │    │ - userId     │    │ - type           │   │
│  │ - profile    │    │ - templateId │    │ - targetRole     │   │
│  │ - gamification│   │ - schedule   │    │ - company        │   │
│  └──────┬───────┘    │ - progress   │    │ - structure      │   │
│         │            └──────┬───────┘    └──────────────────┘   │
│         │                   │                                     │
│         │            ┌──────┴──────┐                             │
│         │            │   DayPlan   │                             │
│         │            │             │                             │
│         │            │ - tasks[]   │                             │
│         │            │ - focus     │                             │
│         │            └──────┬──────┘                             │
│         │                   │                                     │
│         │            ┌──────┴──────┐                             │
│         │            │  SmartTask  │                             │
│         │            │             │                             │
│         │            │ - type      │                             │
│         │            │ - topic     │                             │
│         │            │ - resources │                             │
│         │            │ - quiz      │                             │
│         │            └─────────────┘                             │
│         │                                                        │
│  ┌──────┴──────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │TopicMastery  │    │LearningPath  │    │  AIRecommendation│   │
│  │             │    │              │    │                  │   │
│  │ - topic     │    │ - skillTree │    │ - weakAreas      │   │
│  │ - level     │    │ - unlocks   │    │ - suggestions    │   │
│  │ - xp        │    │ - progress  │    │ - priority       │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Smart Task Structure

Each task now contains:

```javascript
{
  // Core Info
  id: String,
  type: 'concept' | 'coding' | 'quiz' | 'project' | 'revision',
  topic: String,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  
  // Learning Content
  content: {
    explanation: String,           // AI-generated explanation
    keyPoints: [String],           // Bullet points
    codeExample: String,           // If applicable
    estimatedTime: Number          // Minutes
  },
  
  // Curated Resources
  resources: [{
    type: 'video' | 'article' | 'documentation' | 'course',
    title: String,
    url: String,
    source: String,               // YouTube, Medium, etc.
    duration: String,
    quality: 'beginner' | 'intermediate' | 'advanced'
  }],
  
  // Practice Problems
  problems: [{
    id: String,
    title: String,
    difficulty: String,
    platform: 'LeetCode' | 'HackerRank' | 'CodeChef',
    url: String,
    hints: [String]
  }],
  
  // Quiz Section
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String
    }],
    passingScore: Number
  },
  
  // User Progress
  progress: {
    status: 'locked' | 'available' | 'in_progress' | 'completed',
    startedAt: Date,
    completedAt: Date,
    timeSpent: Number,            // Minutes
    quizScore: Number,
    notes: String                 // User notes
  },
  
  // Gamification
  xpReward: Number,
  badges: [String],
  streakBonus: Boolean
}
```

### 3. Multiple Roadmap Types

```javascript
// 1. Role-Based Roadmaps
const roleRoadmaps = {
  'software_developer': {
    focus: ['DSA', 'System Design', 'OOP', 'DBMS'],
    duration: 60,
    difficultyCurve: 'progressive'
  },
  'data_analyst': {
    focus: ['SQL', 'Python', 'Statistics', 'Visualization'],
    duration: 45,
    difficultyCurve: 'progressive'
  },
  'ml_engineer': {
    focus: ['Math', 'ML Algorithms', 'Python', 'Deep Learning'],
    duration: 90,
    difficultyCurve: 'steep'
  }
}

// 2. Company-Specific Roadmaps
const companyRoadmaps = {
  'amazon': {
    focus: ['DSA Heavy', 'System Design', 'Leadership Principles'],
    patterns: ['2 Rounds DSA', '1 Round System Design'],
    difficulty: 'high'
  },
  'tcs': {
    focus: ['Aptitude', 'Basic Coding', 'Communication'],
    patterns: ['NQT Pattern'],
    difficulty: 'medium'
  },
  'google': {
    focus: ['Advanced DSA', 'System Design', 'Googliness'],
    patterns: ['4-5 Rounds', 'Bar Raiser'],
    difficulty: 'very_high'
  }
}

// 3. Mode-Based Roadmaps
const roadmapModes = {
  'placement_sprint_30': {
    duration: 30,
    intensity: 'high',
    focus: ['Quick coverage', 'High yield topics', 'Mock interviews']
  },
  'revision_mode': {
    duration: 14,
    intensity: 'medium',
    focus: ['Weak areas', 'Quick revision', 'Practice problems']
  },
  'emergency_15': {
    duration: 15,
    intensity: 'extreme',
    focus: ['Most asked topics', 'Must-know concepts', 'Interview tips']
  }
}
```

### 4. AI Adaptive Engine

```javascript
// Adaptive Roadmap Algorithm
class AdaptiveRoadmapEngine {
  
  analyzePerformance(userId) {
    // Collect all performance data
    const data = {
      interviewScores: getInterviewHistory(userId),
      codingSubmissions: getCodingStats(userId),
      quizResults: getQuizScores(userId),
      resumeGaps: getResumeAnalysis(userId),
      completedTopics: getTopicMastery(userId),
      missedTasks: getMissedTasks(userId)
    };
    
    return this.generateAdaptations(data);
  }
  
  generateAdaptations(data) {
    const adaptations = [];
    
    // Rule 1: Weak topic reinforcement
    const weakTopics = this.identifyWeakTopics(data);
    weakTopics.forEach(topic => {
      adaptations.push({
        type: 'insert_extra_days',
        topic: topic,
        days: 2,
        reason: 'Performance below threshold'
      });
    });
    
    // Rule 2: Skip mastered topics
    const masteredTopics = this.identifyMasteredTopics(data);
    adaptations.push({
      type: 'compress_schedule',
      skipTopics: masteredTopics,
      reason: 'Topic already mastered'
    });
    
    // Rule 3: Adjust difficulty
    const avgScore = this.calculateAverageScore(data);
    if (avgScore > 85) {
      adaptations.push({
        type: 'increase_difficulty',
        reason: 'High performance detected'
      });
    }
    
    return adaptations;
  }
}
```

### 5. Skill Tree System

```javascript
const dsaSkillTree = {
  id: 'root',
  name: 'Data Structures & Algorithms',
  children: [
    {
      id: 'arrays',
      name: 'Arrays & Strings',
      difficulty: 'beginner',
      dependencies: [],
      children: [
        {
          id: 'two_pointers',
          name: 'Two Pointers',
          difficulty: 'beginner',
          dependencies: ['arrays']
        },
        {
          id: 'sliding_window',
          name: 'Sliding Window',
          difficulty: 'intermediate',
          dependencies: ['arrays', 'two_pointers']
        }
      ]
    },
    {
      id: 'linked_list',
      name: 'Linked List',
      difficulty: 'beginner',
      dependencies: [],
      children: [
        {
          id: 'fast_slow',
          name: 'Fast & Slow Pointers',
          difficulty: 'intermediate',
          dependencies: ['linked_list']
        }
      ]
    },
    {
      id: 'trees',
      name: 'Trees',
      difficulty: 'intermediate',
      dependencies: ['arrays', 'linked_list'],
      children: [
        {
          id: 'bst',
          name: 'Binary Search Tree',
          difficulty: 'intermediate',
          dependencies: ['trees']
        },
        {
          id: 'advanced_trees',
          name: 'AVL, Red-Black Trees',
          difficulty: 'advanced',
          dependencies: ['bst']
        }
      ]
    }
  ]
}
```

### 6. Gamification System

```javascript
// XP System
const xpRewards = {
  complete_task: 50,
  complete_quiz: 30,
  solve_problem: 40,
  watch_video: 10,
  read_article: 15,
  maintain_streak: 20,
  master_topic: 100,
  unlock_skill: 75
};

// Level System
const levels = [
  { name: 'Novice', minXP: 0, color: '#94a3b8' },
  { name: 'Learner', minXP: 500, color: '#60a5fa' },
  { name: 'Practitioner', minXP: 1500, color: '#34d399' },
  { name: 'Expert', minXP: 3500, color: '#fbbf24' },
  { name: 'Master', minXP: 7000, color: '#f472b6' },
  { name: 'Legend', minXP: 12000, color: '#a78bfa' }
];

// Badge System
const badges = {
  'first_step': { name: 'First Step', desc: 'Complete your first task' },
  'week_warrior': { name: 'Week Warrior', desc: '7 day streak' },
  'month_master': { name: 'Month Master', desc: '30 day streak' },
  'topic_conqueror': { name: 'Topic Conqueror', desc: 'Master 5 topics' },
  'problem_solver': { name: 'Problem Solver', desc: 'Solve 50 problems' },
  'interview_ready': { name: 'Interview Ready', desc: 'Score >80 in mock interview' },
  'roadmap_complete': { name: 'Roadmap Complete', desc: 'Complete entire roadmap' },
  'early_bird': { name: 'Early Bird', desc: 'Study before 7 AM' },
  'night_owl': { name: 'Night Owl', desc: 'Study after 10 PM' }
};
```

### 7. API Architecture

```
POST /api/roadmaps
  - Generate new roadmap
  - Body: { type, targetRole, company, duration, preferences }

GET /api/roadmaps
  - List all user roadmaps
  
GET /api/roadmaps/:id
  - Get specific roadmap with progress

PUT /api/roadmaps/:id/adapt
  - Trigger AI adaptation

POST /api/roadmaps/:id/tasks/:taskId/complete
  - Mark task complete

POST /api/roadmaps/:id/tasks/:taskId/quiz/submit
  - Submit quiz answers

GET /api/skill-tree
  - Get skill tree structure

GET /api/topic-mastery
  - Get topic mastery levels

POST /api/ai-mentor/chat
  - Chat with AI mentor

GET /api/recommendations
  - Get personalized recommendations

GET /api/analytics/progress
  - Get detailed progress analytics
```

### 8. Frontend Component Architecture

```
src/
├── components/roadmap/
│   ├── RoadmapDashboard.jsx      # Main dashboard with stats
│   ├── RoadmapList.jsx           # List of all roadmaps
│   ├── RoadmapDetail.jsx         # Detail view with tabs
│   ├── KanbanBoard.jsx           # Kanban view of tasks
│   ├── CalendarView.jsx          # Calendar study planner
│   ├── SkillTree.jsx             # Skill tree visualization
│   ├── TaskCard.jsx              # Individual task card
│   ├── TaskDetail.jsx            # Task detail modal
│   ├── ProgressHeatmap.jsx       # GitHub-style heatmap
│   ├── AIMentor.jsx              # AI mentor chat
│   ├── GamificationPanel.jsx     # XP, badges, streaks
│   ├── QuizComponent.jsx         # Quiz interface
│   └── ResourcePlayer.jsx        # Video/resource player
│
├── hooks/
│   ├── useRoadmap.js             # Roadmap data management
│   ├── useTaskProgress.js        # Task progress tracking
│   ├── useSkillTree.js           # Skill tree interactions
│   ├── useGamification.js        # Gamification state
│   └── useAIMentor.js            # AI mentor chat
│
└── store/
    └── roadmapStore.js           # Zustand store for roadmaps
```

### 9. AI Prompts for Roadmap Generation

```javascript
// Prompt 1: Smart Task Generation
const generateSmartTaskPrompt = (topic, difficulty, userLevel) => `
Generate a comprehensive learning task for: ${topic}

User Level: ${userLevel}
Target Difficulty: ${difficulty}

Create a task with:
1. Clear explanation (2-3 paragraphs)
2. 5 key points to remember
3. Code example if applicable
4. 3 curated resources (YouTube video, article, documentation)
5. 3 practice problems with difficulty levels
6. 5 quiz questions with explanations

Format as JSON with these exact keys:
{
  "explanation": "string",
  "keyPoints": ["string"],
  "codeExample": "string",
  "resources": [{"type", "title", "url", "duration"}],
  "problems": [{"title", "difficulty", "platform", "url"}],
  "quiz": {"questions": [{"question", "options", "correctAnswer", "explanation"}]}
}
`;

// Prompt 2: Adaptive Roadmap Adjustment
const adaptRoadmapPrompt = (currentPlan, performanceData) => `
Analyze this performance data and adjust the roadmap:

Current Plan:
${JSON.stringify(currentPlan)}

Performance Data:
${JSON.stringify(performanceData)}

Provide adaptations as JSON:
{
  "adaptations": [
    {"type": "insert|skip|modify", "details": {}, "reason": "string"}
  ],
  "recommendations": ["string"]
}
`;

// Prompt 3: Company-Specific Roadmap
const companyRoadmapPrompt = (company, userProfile) => `
Generate a preparation roadmap for ${company} placement.

Company Pattern:
- Interview rounds
- Focus areas
- Difficulty level
- Previous year patterns

User Profile:
${JSON.stringify(userProfile)}

Create a ${company === 'tcs' || company === 'infosys' ? 30 : 60}-day plan
with day-wise tasks including:
- Aptitude preparation
- Technical topics
- Coding practice
- Mock interviews
- HR preparation

Format as structured roadmap JSON.
`;
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] New database schemas
- [ ] Enhanced AI service
- [ ] Basic API endpoints

### Phase 2: Smart Tasks (Week 1-2)
- [ ] Rich task structure
- [ ] Resource integration
- [ ] Quiz system

### Phase 3: Multiple Roadmaps (Week 2)
- [ ] Template system
- [ ] Company roadmaps
- [ ] Mode selection

### Phase 4: AI Adaptation (Week 2-3)
- [ ] Performance tracking
- [ ] Adaptive engine
- [ ] Dynamic adjustments

### Phase 5: Gamification (Week 3)
- [ ] XP system
- [ ] Badges
- [ ] Skill tree

### Phase 6: UI/UX (Week 3-4)
- [ ] Kanban view
- [ ] Calendar
- [ ] Heatmap
- [ ] AI mentor

### Phase 7: Polish (Week 4)
- [ ] Testing
- [ ] Performance
- [ ] Documentation

## Bonus Features (Innovation)

1. **Peer Comparison**: Compare progress with anonymized peers
2. **Mock Interview Integration**: Schedule mocks based on roadmap
3. **Resume Auto-Update**: Suggest resume improvements based on completed topics
4. **Job Application Tracker**: Track applications with company-specific prep
5. **Community Challenges**: Weekly coding challenges with leaderboards
6. **Interview Story Bank**: Real interview experiences shared by users
7. **Salary Predictor**: Predict expected salary based on skills and roadmap progress

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Node.js, Express, MongoDB, Redis (caching)
- **AI**: OpenAI/Gemini for content generation
- **Real-time**: Socket.io for AI mentor chat
- **Storage**: Cloudinary for video/resources
- **Analytics**: Mixpanel/Amplitude for user tracking

## Success Metrics

- User engagement: Daily active users, time spent
- Completion rate: % of tasks completed
- Learning effectiveness: Quiz scores, interview performance
- Retention: 7-day, 30-day retention rates
- Satisfaction: NPS score from users

---

This architecture provides a scalable, innovative, and interview-worthy roadmap system that stands out from other placement prep platforms.
