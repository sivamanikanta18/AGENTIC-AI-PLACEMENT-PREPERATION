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

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prepsense_ai';
    const conn = await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected:', conn.connection.host);
    
    // Seed coding problems if empty
    await seedCodingProblems();
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  IP Whitelist Issue: Add your IP to MongoDB Atlas Network Access');
    console.log('   → https://cloud.mongodb.com → Network Access → Add IP Address');
    console.log('⚠️  Running without database - features will be limited');
  }
};
connectDB();

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_interview', (interviewId) => {
    socket.join(interviewId);
  });
  
  socket.on('interview_response', (data) => {
    io.to(data.interviewId).emit('new_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };
