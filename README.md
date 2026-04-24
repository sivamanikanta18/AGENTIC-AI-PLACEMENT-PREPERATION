# PrepSense AI - Adaptive Interview Coach

An AI-powered adaptive interview preparation platform that simulates real interviews, identifies skill gaps, provides deep feedback, and generates personalized roadmaps.

## Features

### Core Features
- **Resume Intelligence Engine**: Upload your resume and get AI-powered analysis of skills, weak areas, and risk flags
- **Adaptive Mock Interview Engine**: AI dynamically conducts interviews with resume-based questions and adaptive difficulty
- **Real-Time Pressure Simulation**: Countdown timers, AI interruptions, and time-limited answers
- **Multi-Dimensional Feedback Engine**: Confidence, clarity, technical accuracy, and communication scores
- **Coding Interview Simulator**: Practice coding problems with AI-generated hints and solution feedback
- **Company-Specific Mode**: FAANG, Service-based (TCS/Infosys), Startup modes
- **Personalized Roadmap Generator**: AI generates daily study plans based on your performance
- **Placement Readiness Score**: Single metric showing your interview readiness
- **Gamification System**: XP points, levels, streaks, and badges
- **AI Debate Mode**: Debate with AI on technical topics to sharpen your argumentation skills

### Dashboard & Analytics
- Real-time skill progression tracking
- Weak to strong transition monitoring
- Interview history and feedback reports
- Weekly activity heatmaps
- Performance trend analysis

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- OpenAI GPT-4 API integration
- Socket.io for real-time features
- JWT authentication
- Multer for file uploads

### Frontend
- React 18 + Vite
- Tailwind CSS
- Zustand for state management
- Framer Motion for animations
- Recharts for data visualization
- Monaco Editor for coding
- React Dropzone for file uploads

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB (local or cloud)
- OpenAI API key

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
OPENAI_API_KEY=your_openai_api_key_here
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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Resume
- `POST /api/resume/upload` - Upload and analyze resume
- `GET /api/resume/analysis` - Get resume analysis

### Interview
- `POST /api/interview/start` - Start mock interview
- `POST /api/interview/answer` - Submit answer
- `GET /api/interview/history` - Get interview history
- `POST /api/interview/debate` - AI debate mode

### Coding
- `GET /api/coding/problems` - Get coding problems
- `GET /api/coding/problems/:id` - Get problem details
- `POST /api/coding/submit` - Submit solution

### Feedback
- `GET /api/feedback/:interviewId` - Get feedback report
- `GET /api/feedback/history` - Get feedback history

### Roadmap
- `POST /api/roadmap/generate` - Generate roadmap
- `GET /api/roadmap/current` - Get current roadmap

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/analytics` - Get analytics

### Gamification
- `GET /api/gamification/status` - Get gamification status
- `GET /api/gamification/leaderboard` - Get leaderboard

## Project Structure

```
prepsense-ai/
├── backend/
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── utils/           # AI service utilities
│   ├── uploads/         # File uploads
│   ├── server.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # Shared components
│   │   ├── store/       # Zustand stores
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret for JWT tokens |
| OPENAI_API_KEY | OpenAI API key |
| NODE_ENV | Environment mode |

## Demo Flow

1. **Upload Resume** → AI extracts skills and identifies gaps
2. **Start Interview** → Configure type, company mode, difficulty
3. **Answer Questions** → AI adapts questions based on responses
4. **Get Feedback** → Multi-dimensional analysis with action items
5. **View Roadmap** → AI generates personalized study plan
6. **Track Progress** → Dashboard shows skill improvement

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use for your hackathon or personal projects!

## Acknowledgments

- OpenAI for GPT-4 API
- React and Vite teams
- Tailwind CSS community
