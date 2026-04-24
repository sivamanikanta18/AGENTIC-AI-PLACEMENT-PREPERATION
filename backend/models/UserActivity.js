const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Activity type
  type: {
    type: String,
    enum: ['interview', 'coding', 'resume_upload', 'mock_test', 'roadmap_view', 'login', 'practice'],
    required: true
  },
  
  // Activity details
  action: {
    type: String,
    required: true
    // Examples: 'started_interview', 'submitted_answer', 'completed_problem', 'uploaded_resume'
  },
  
  // Metadata about the activity
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Stores contextual data like:
    // - interviewId, questionId, score (for interviews)
    // - problemId, difficulty, passed (for coding)
    // - resumeId, confidenceScore (for resume)
  },
  
  // Time tracking
  duration: {
    type: Number,  // Duration in seconds
    default: 0
  },
  
  // Timestamps
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date
  },
  
  // Performance metrics
  score: {
    type: Number,
    default: null
  },
  
  result: {
    type: String,
    enum: ['success', 'failure', 'partial', 'incomplete', null],
    default: null
  },
  
  // Device/location info
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

// Index for efficient querying
UserActivitySchema.index({ userId: 1, type: 1, createdAt: -1 });
UserActivitySchema.index({ userId: 1, createdAt: -1 });
UserActivitySchema.index({ type: 1, createdAt: -1 });

// Static methods for analytics
UserActivitySchema.statics.getUserStats = async function(userId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgScore: { $avg: '$score' },
        lastActivity: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats;
};

UserActivitySchema.statics.getDailyActivity = async function(userId, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const activity = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type'
        },
        count: { $sum: 1 },
        duration: { $sum: '$duration' }
      }
    },
    {
      $sort: { '_id.date': -1 }
    }
  ]);
  
  return activity;
};

UserActivitySchema.statics.getTotalTimeSpent = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalSeconds: { $sum: '$duration' },
        totalActivities: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalSeconds: 0, totalActivities: 0 };
};

module.exports = mongoose.model('UserActivity', UserActivitySchema);
