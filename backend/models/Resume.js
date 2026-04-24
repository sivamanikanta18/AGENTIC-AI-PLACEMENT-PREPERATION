const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFile: {
    filename: String,
    path: String,
    fileType: String
  },
  extractedText: String,
  analysis: {
    skills_detected: [{
      name: String,
      proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
      category: { type: String, enum: ['technical', 'soft', 'domain'] }
    }],
    weak_areas: [String],
    risk_flags: [String],
    strengths: [String],
    experience_summary: String,
    projects_summary: [{
      name: String,
      technologies: [String],
      complexity: String
    }],
    education: [{
      degree: String,
      institution: String,
      year: String
    }],
    skill_gaps: [{
      skill: String,
      importance: { type: String, enum: ['high', 'medium', 'low'] },
      recommendation: String
    }],
    overclaimed_skills: [String],
    confidence_score: { type: Number, min: 0, max: 100 }
  },
  parsedData: {
    skills: [String],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String]
    }],
    education: [{
      degree: String,
      institution: String,
      year: String
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
