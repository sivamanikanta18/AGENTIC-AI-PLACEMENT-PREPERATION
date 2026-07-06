# PrepSense AI - Adaptive Interview Preparation Platform

**Live URL:** https://agentic-ai-placement-preperation.onrender.com

**GitHub:** https://github.com/sivamanikanta18/AGENTIC-AI-PLACEMENT-PREPERATION

An end-to-end AI-powered interview preparation platform that simulates real technical interviews, analyzes resumes for skill gaps, provides multi-dimensional feedback, and generates personalized learning roadmaps with gamification. Built as a full-stack MERN application with real-time WebSocket communication, multi-provider AI integration, and production-grade security.

## Problem Statement

College students and fresh graduates struggle with: unpredictable interview questions, no structured feedback after mock interviews, skill gap blindness, generic prep material wasting time, and no way to simulate real interview pressure. PrepSense AI solves all of these with an adaptive AI interviewer that personalizes every session based on the user's resume, performance history, and target company.

## Key Features & Technical Implementation

### 1. AI-Powered Resume Intelligence Engine
- PDF/DOCX parsing using `pdf-parse` and `mammoth` libraries
- AI extracts technical skills, projects, experience, and education from uploaded resumes
- Gap analysis cross-references resume against job role requirements
- Risk flags highlight potential skill mismatches and missing keywords

### 2. Adaptive Mock Interview Engine (Real-Time)
- Dynamic context-aware question generation based on resume content
- Adaptive difficulty: questions get harder/easier based on real-time user performance
- Company-specific modes: FAANG (hard algorithms), Service-based (aptitude + basics), Startup (full-stack practical)
- Real-time bidirectional communication via Socket.io WebSockets
- Pressure simulation with countdown timers, AI interruptions, follow-up questions

### 3. Multi-Dimensional Feedback System
- 4-dimension scoring: Technical Accuracy, Communication, Confidence, Problem-Solving
- Actionable insights with specific improvement suggestions (not generic advice)
- Answer quality analysis identifying missing key points, wrong assumptions, better approaches

### 4. Personalized Roadmap Generator
- AI generates 30-day structured daily learning paths
- Task management with completion tracking and XP rewards
- Adaptive replanning based on performance analytics
- MongoDB aggregation pipelines for complex data queries

### 5. Gamification & Analytics System
- XP, levels, and badges for completing interviews, coding problems, roadmap tasks
- Daily activity streaks tracked via MongoDB aggregation pipelines
- Dashboard with Recharts-powered visualizations: skill progression, weak-to-strong transitions, activity heatmaps
- Leaderboard ranking users by XP and interview performance

### 6. Coding Interview Simulator
- 50+ curated coding problems across DSA topics (arrays, trees, graphs, DP)
- Monaco Editor for full IDE experience with syntax highlighting
- AI-generated contextual hints without giving away solutions
- AI evaluates code correctness, time/space complexity, edge cases

### 7. AI Debate Mode
- Technical debates on topics like "Monolith vs Microservices", "SQL vs NoSQL"
- Argument quality scoring on logic, depth, counter-arguments, real-world examples

## Architecture & Technical Decisions

### System Design

**Monorepo Structure:**
- `backend/` - Node.js REST API + WebSocket server
- `frontend/` - React 18 SPA built with Vite
- `render.yaml` - Infrastructure-as-code for Render deployment

**Backend Architecture:**
- **Layered architecture**: Controllers → Services → Models → Database
- **Middleware pipeline**: CORS (strict origin whitelist), Helmet.js (security headers), Express Rate Limit (50 req/15min in production), JWT Authentication, centralized Error Handling
- **AI Service Abstraction**: Switchable providers (Groq Llama 3.3 70B as default, OpenAI GPT-4 fallback, Google Gemini fallback) with retry logic and structured JSON output parsing via regex patterns
- **File Processing Pipeline**: Multer upload → pdf-parse/mammoth extraction → AI analysis → MongoDB storage
- **Real-Time Engine**: Socket.io with namespace isolation for interview sessions, session state management

**Frontend Architecture:**
- **Component-based SPA**: Modular pages with reusable components and custom hooks
- **State Management**: Zustand for global state (auth, interview, gamification); React hooks for local component state
- **Data Fetching**: REST API via axios with interceptors; real-time data via Socket.io client
- **UI/UX**: Tailwind CSS with custom design system; Framer Motion for page transitions and animations; React Hot Toast for notifications

### Technologies Used

**Backend (Node.js 18.19.0):**
| Technology | Purpose |
|------------|---------|
| Express.js 4.18.2 | REST API framework |
| MongoDB + Mongoose 8.x | Document database and ODM |
| Socket.io 4.7.4 | Real-time bidirectional WebSocket communication |
| JWT (jsonwebtoken 9.x) | Stateless authentication |
| bcryptjs 2.4.3 | Password hashing |
| Helmet.js 7.x | Security headers (XSS, CSP, HSTS) |
| express-rate-limit 7.x | DDoS/brute force protection |
| Multer 1.4.5 | Multipart file upload handling |
| pdf-parse + mammoth | PDF and DOCX text extraction |
| axios 1.15.2 | HTTP client for AI API calls |
| Groq API / OpenAI API / Google Gemini API | Multi-provider AI integration |

**Frontend (Node.js 18.19.0):**
| Technology | Purpose |
|------------|---------|
| React 18 | UI library with functional components and hooks |
| Vite | Fast build tool and dev server |
| Tailwind CSS | Utility-first CSS framework |
| Zustand | Lightweight state management |
| React Router DOM | Client-side routing |
| Framer Motion | Page transitions and micro-interactions |
| Recharts | Data visualization (line charts, bar charts, heatmaps) |
| Monaco Editor | Code editor with syntax highlighting for coding problems |
| React Dropzone | Drag-and-drop file upload |
| Socket.io Client | Real-time interview communication |
| React Hot Toast | Toast notifications |

### Database Schema (MongoDB)

- **Users**: Authentication, profile, preferences, gamification stats
- **Resumes**: Parsed content, AI analysis results, skill extraction
- **Interviews**: Session state, questions, answers, feedback reports
- **CodingSubmissions**: Code, test results, AI evaluation
- **Roadmaps**: Daily tasks, completion status, AI-generated plans
- **UserActivities**: Analytics events for streaks, XP, heatmaps

### Security Measures

- **CORS**: Strict origin whitelist with credentials support; production mode only allows specific origins
- **Helmet.js**: Content Security Policy, XSS protection, HSTS headers
- **Rate Limiting**: 50 requests per 15 minutes per IP in production
- **JWT**: Stateless auth with 7-day expiry, secure token validation with detailed error codes
- **Environment Validation**: Startup validation ensuring all required env vars are present with format checks
- **Production Error Handling**: Stack traces hidden from API responses; generic error messages to prevent information leakage

## Deployment & DevOps

**Production Stack:**
- **Backend**: Render (Node.js web service) with auto-deploy from GitHub
- **Frontend**: Render (static site) with auto-deploy from GitHub
- **Database**: MongoDB Atlas (free tier, M0 cluster)
- **Version Control**: GitHub with branch-based CI/CD
- **Infrastructure as Code**: `render.yaml` defines the backend service and its deployment settings

**Deployment Architecture:**
- Render backend exposes public HTTPS endpoint
- Frontend points to the Render backend through `VITE_API_URL`
- Auto-deploy on every Git push to main branch

## Project Impact & Metrics

- **Full-stack solo project** built from scratch (backend + frontend + database + deployment)
- **7 major feature modules** with AI integration, real-time communication, file processing, and gamification
- **Production-ready security** with CORS, Helmet, rate limiting, JWT auth, and input validation
- **Multi-provider AI resilience** with Groq, OpenAI, and Gemini fallbacks
- **MongoDB aggregation pipelines** for complex analytics (streaks, XP calculations, heatmaps)
- **Live deployment** with zero-downtime updates via GitHub webhooks

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas cloud)
- Groq API key (or OpenAI/Google Gemini key)

### Installation

1. **Clone and setup backend:**
```bash
cd prepsense-ai/backend
npm install
```

2. **Configure environment variables:**
Create `.env` file in backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/prepsense_ai
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
AI_PROVIDER=groq
NODE_ENV=development
```

3. **Start backend:**
```bash
npm run dev
```

4. **Setup frontend:**
```bash
cd ../frontend
npm install
```

5. **Start frontend:**
```bash
npm run dev
```

6. **Open browser:** Navigate to `http://localhost:5173`

## Deploy Backend On Render

1. Push this repository to GitHub.
2. In Render, create a new **Web Service** and connect the GitHub repo.
3. Set the root directory to `backend`.
4. Use these commands:
	- Build command: `npm install`
	- Start command: `npm start`
5. Add the environment variables:
	- `NODE_ENV=production`
	- `MONGODB_URI=<your MongoDB Atlas connection string>`
	- `JWT_SECRET=<strong random secret, 32+ chars>`
	- `AI_PROVIDER=groq` or `openai` or `google`
	- `GROQ_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_API_KEY` for the provider you choose
	- `CLIENT_URL=<your frontend URL>`
	- `ALLOWED_ORIGINS=<your frontend URL>`
6. Deploy and verify `https://your-service.onrender.com/api/health` returns `{ "status": "OK" }`.
7. Update the frontend `VITE_API_URL` to `https://your-service.onrender.com/api` and redeploy the frontend.

### Render Notes

- Do not hardcode `PORT`; Render injects it automatically.
- The backend already listens on `process.env.PORT` and exposes `/api/health` for health checks.
- Resume uploads are stored locally in `backend/uploads/resumes`; if you need persistent storage on Render, move uploads to cloud storage such as S3 or Cloudinary.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with validation
- `POST /api/auth/login` - Login with JWT token generation
- `GET /api/auth/me` - Get current authenticated user

### Resume
- `POST /api/resume/upload` - Upload PDF/DOCX and trigger AI analysis
- `GET /api/resume/analysis` - Get parsed resume and AI analysis

### Interview
- `POST /api/interview/start` - Initialize mock interview session
- `POST /api/interview/answer` - Submit answer and get next question
- `GET /api/interview/history` - Get past interview sessions
- `POST /api/interview/debate` - Start AI debate mode

### Coding
- `GET /api/coding/problems` - List all coding problems
- `GET /api/coding/problems/:id` - Get problem details with test cases
- `POST /api/coding/submit` - Submit solution for AI evaluation

### Feedback
- `GET /api/feedback/:interviewId` - Get detailed feedback report
- `GET /api/feedback/history` - Get feedback history

### Roadmap
- `POST /api/roadmap/generate` - Generate personalized 30-day roadmap
- `GET /api/roadmap/current` - Get current active roadmap
- `POST /api/roadmap/complete-task` - Mark task complete and earn XP

### Dashboard & Analytics
- `GET /api/dashboard` - Get dashboard overview data
- `GET /api/dashboard/analytics` - Get detailed analytics and trends

### Gamification
- `GET /api/gamification/status` - Get XP, level, streaks, badges
- `GET /api/gamification/leaderboard` - Get global leaderboard

### System
- `GET /api/health` - Health check endpoint
- `GET /api/system/health` - Comprehensive system diagnostics

## Project Structure

```
prepsense-ai/
├── backend/
│   ├── config/          # Environment validation
│   ├── models/          # Mongoose schemas (User, Resume, Interview, Roadmap, etc.)
│   ├── routes/          # API route handlers
│   ├── middleware/      # Auth, error handling, validation
│   ├── utils/           # AI service, analytics, seed data
│   ├── uploads/         # Temporary file storage
│   ├── server.js        # Express + Socket.io entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/       # Route-level page components
│   │   ├── components/  # Reusable UI components
│   │   ├── store/       # Zustand state stores
│   │   ├── hooks/       # Custom React hooks
│   │   ├── App.jsx      # Router and layout
│   │   └── main.jsx     # Entry point
│   ├── public/
│   ├── index.html
│   └── package.json
├── render.yaml          # Render deployment config
├── .env.example         # Environment variable template
└── README.md
```

## Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 5000) | No |
| MONGODB_URI | MongoDB Atlas connection string | Yes |
| JWT_SECRET | Secret for JWT token signing | Yes |
| AI_PROVIDER | Default AI provider (groq/openai/gemini) | Yes |
| GROQ_API_KEY | Groq API key | Yes* |
| OPENAI_API_KEY | OpenAI API key | Optional |
| GOOGLE_API_KEY | Google Gemini API key | Optional |
| CLIENT_URL | Frontend URL for CORS | Production |
| ALLOWED_ORIGINS | Comma-separated allowed origins | Production |
| NODE_ENV | Environment (development/production) | Yes |

\* At least one AI provider key required

### Frontend (.env)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |

## Demo Flow

1. **Upload Resume** → AI extracts skills and identifies gaps with risk flags
2. **Start Interview** → Configure type, company mode, difficulty; AI generates resume-aware questions
3. **Answer Questions** → Real-time WebSocket communication; AI adapts difficulty dynamically
4. **Get Feedback** → Multi-dimensional scoring with specific action items
5. **View Roadmap** → AI generates 30-day personalized study plan with daily tasks
6. **Track Progress** → Dashboard shows skill improvement, streaks, XP, and leaderboard position
7. **Practice Coding** → Solve DSA problems with AI hints and complexity analysis

## License

MIT License

## Acknowledgments

- Groq API (Llama 3.3 70B) for fast, affordable AI inference
- OpenAI and Google Gemini as fallback providers
- React, Vite, and Tailwind CSS communities
- MongoDB Atlas for managed cloud database
