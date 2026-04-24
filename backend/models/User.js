const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'jobseeker', 'career_switcher', 'bootcamp_learner'],
    default: 'student'
  },
  profile: {
    college: String,
    yearOfStudy: Number,
    experience: Number,
    targetCompanies: [String],
    preferredRoles: [String]
  },
  // Gamification data
  gamification: {
    xp: { type: Number, default: 0 },
    level: { type: String, default: 'Beginner', enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    badges: [{
      name: String,
      icon: String,
      earnedAt: { type: Date, default: Date.now }
    }],
    achievements: [{
      name: String,
      description: String,
      earnedAt: { type: Date, default: Date.now }
    }]
  },
  // Placement readiness score
  readiness: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, default: 'Not Ready', enum: ['Ready', 'Improving', 'Not Ready'] },
    history: [{
      score: Number,
      date: { type: Date, default: Date.now }
    }]
  },
  // Analytics
  stats: {
    totalInterviews: { type: Number, default: 0 },
    completedInterviews: { type: Number, default: 0 },
    totalCodingProblems: { type: Number, default: 0 },
    solvedProblems: { type: Number, default: 0 },
    averageFeedbackScore: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 } // in minutes
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
