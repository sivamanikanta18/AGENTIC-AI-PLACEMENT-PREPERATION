const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { seedCodingProblems } = require('./utils/seedCodingProblems');
const { validateEnv } = require('./config/env');

dotenv.config();

// Validate environment variables
validateEnv();

const app = express();
const httpServer = createServer(app);

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'];

// CORS configuration
const corsOptions = {
  origin: IS_PRODUCTION ? ALLOWED_ORIGINS : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Socket.io with secure CORS
const io = new Server(httpServer, {
  cors: {
    origin: IS_PRODUCTION ? ALLOWED_ORIGINS : true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Rate limiting - stricter in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 50 : 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: IS_PRODUCTION ? undefined : false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/prepsense_ai';

const connectWithFallback = async (mongoURI) => {
  try {
    const conn = await mongoose.connect(mongoURI);
    return { conn, uri: mongoURI };
  } catch (err) {
    const isAtlasUri = mongoURI.includes('mongodb+srv://');

    if (!IS_PRODUCTION && isAtlasUri) {
      console.warn('⚠️  Atlas connection failed, falling back to local MongoDB...');
      console.warn(`   Reason: ${err.message}`);

      const localConn = await mongoose.connect(LOCAL_MONGO_URI);
      return { conn: localConn, uri: LOCAL_MONGO_URI, fallback: true };
    }

    throw err;
  }
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || LOCAL_MONGO_URI;
    const { conn, fallback } = await connectWithFallback(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    if (fallback) {
      console.log('ℹ️  Using local MongoDB for development because Atlas was unreachable');
    }

    // Seed coding problems if empty
    await seedCodingProblems();
  } catch (err) {
    if (!IS_PRODUCTION) {
      console.error('❌ MongoDB Connection Error:', err.message);
      console.log('⚠️  If you intend to use MongoDB Atlas, verify the cluster URL and Network Access settings');
      console.log('   → https://cloud.mongodb.com → Network Access → Add IP Address');
      console.log('   → Or start a local MongoDB instance on 127.0.0.1:27017');
    }
  }
};
connectDB();

// Socket.io for real-time features
io.on('connection', (socket) => {
  if (!IS_PRODUCTION) {
    // console.log('Client connected:', socket.id);
  }
  
  socket.on('join_interview', (interviewId) => {
    socket.join(interviewId);
  });
  
  socket.on('interview_response', (data) => {
    io.to(data.interviewId).emit('new_message', data);
  });
  
  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api/roadmaps', require('./routes/roadmapV2'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/coding', require('./routes/coding'));
app.use('/api/coding-mock', require('./routes/codingMockTest'));
app.use('/api/coding-exec', require('./routes/codingExecution'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/system', require('./routes/systemCheck'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling - secure in production
app.use((err, req, res, next) => {
  if (!IS_PRODUCTION) {
    console.error(err.stack);
  }
  
  // Log error for monitoring (without sensitive data)
  const errorLog = {
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  // Don't expose stack traces in production
  const response = IS_PRODUCTION 
    ? { error: 'Something went wrong!', code: 'INTERNAL_ERROR' }
    : { error: err.message, stack: err.stack };
    
  res.status(err.status || 500).json(response);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  if (!IS_PRODUCTION) {
    console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  }
});

module.exports = { io };
