const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const User = require('../models/User');
const AIService = require('../utils/aiService');
const AnalyticsService = require('../utils/analyticsService');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

// Upload and analyze resume
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // Extract text based on file type
    try {
      if (fileType === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
      } else if (fileType === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } else if (fileType === '.doc') {
        // For .doc files, we'll try to read as text
        extractedText = fs.readFileSync(filePath, 'utf8');
      } else if (fileType === '.txt') {
        extractedText = fs.readFileSync(filePath, 'utf8');
      }
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      return res.status(400).json({ error: 'Failed to extract text from file' });
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text from resume' });
    }

    // AI Analysis
    const analysis = await AIService.analyzeResume(extractedText);

    // Save to database
    const resume = new Resume({
      userId: req.user._id,
      originalFile: {
        filename: req.file.originalname,
        path: filePath,
        fileType
      },
      extractedText,
      analysis
    });

    await resume.save();

    // Update user's readiness score based on resume analysis
    const readinessData = await AIService.calculateReadiness({
      resumeAnalysis: analysis,
      userStats: req.user.stats
    });

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'readiness.score': readinessData.score,
        'readiness.status': readinessData.status,
        $push: {
          'readiness.history': {
            score: readinessData.score,
            date: new Date()
          }
        }
      }
    });

    // Track resume upload
    await AnalyticsService.trackActivity(
      req.user._id,
      'resume_upload',
      'uploaded_resume',
      { 
        resumeId: resume._id,
        confidenceScore: analysis.confidence_score
      }
    );

    res.json({
      success: true,
      resumeId: resume._id,
      analysis,
      readiness: readinessData
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get resume analysis
router.get('/analysis', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    res.json({
      resumeId: resume._id,
      analysis: resume.analysis,
      createdAt: resume.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get resume history
router.get('/history', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('analysis.confidence_score createdAt')
      .sort({ createdAt: -1 });
    
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze resume
router.post('/reanalyze/:resumeId', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Re-run AI analysis
    const analysis = await AIService.analyzeResume(resume.extractedText);
    
    resume.analysis = analysis;
    await resume.save();

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get skills and gaps
router.get('/skill-gaps', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    res.json({
      skills: resume.analysis.skills_detected,
      weakAreas: resume.analysis.weak_areas,
      skillGaps: resume.analysis.skill_gaps,
      riskFlags: resume.analysis.risk_flags
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
