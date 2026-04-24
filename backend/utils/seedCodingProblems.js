const mongoose = require('mongoose');
const { CodingProblem } = require('../models/CodingProblem');
const { getAllProblems, getTopicsInfo } = require('./comprehensiveProblems');

// Transform comprehensive problems to database format
function transformProblemForDB(problem) {
  return {
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    category: problem.category,
    tags: problem.tags || [problem.category, problem.topicName?.toLowerCase()],
    companyTags: problem.companies || problem.companyTags || [],
    leetcodeId: problem.leetcodeId,
    leetcodeUrl: problem.leetcodeUrl,
    topicInfo: {
      name: problem.topicName,
      sno: problem.sno,
      recommendedDays: problem.recommendedDays
    },
    examples: problem.examples || [],
    constraints: problem.constraints || [],
    hints: (problem.hints || []).map((h, i) => ({
      order: h.order || i + 1,
      content: h.text || h.content,
      xpCost: h.xpCost || (i === 0 ? 0 : 50)
    })),
    interviewFrequency: problem.interviewFrequency || { faang: 5, service: 5, startup: 5 },
    solution: {
      approach: problem.solution?.approach || '',
      timeComplexity: problem.solution?.timeComplexity || 'O(n)',
      spaceComplexity: problem.solution?.spaceComplexity || 'O(1)',
      code: problem.solution?.code || {}
    },
    source: 'comprehensive-set',
    isPremium: false
  };
}

async function seedCodingProblems() {
  try {
    console.log('🌱 Checking coding problems database...');
    
    // Check if comprehensive problems already exist
    const existingCount = await CodingProblem.countDocuments({ source: 'comprehensive-set' });
    const comprehensiveProblems = getAllProblems();
    
    if (existingCount >= comprehensiveProblems.length) {
      console.log(`✅ All ${existingCount} comprehensive problems already exist`);
      return;
    }
    
    if (existingCount > 0 && existingCount < comprehensiveProblems.length) {
      console.log(`⚠️  Partial seed detected (${existingCount}/${comprehensiveProblems.length}), clearing...`);
      await CodingProblem.deleteMany({ source: 'comprehensive-set' });
    }
    
    // Transform and insert all comprehensive problems
    const dbProblems = comprehensiveProblems.map(transformProblemForDB);
    
    console.log(`📝 Seeding ${dbProblems.length} placement preparation problems...`);
    await CodingProblem.insertMany(dbProblems, { ordered: false });
    
    // Print summary
    const topics = getTopicsInfo();
    console.log('\n📚 Topics seeded:');
    topics.forEach(t => {
      console.log(`   ✓ ${t.name}: ${t.problemCount} problems (${t.recommendedDays} days)`);
    });
    
    console.log(`\n✅ Successfully seeded ${dbProblems.length} coding problems`);
    
  } catch (error) {
    console.error('❌ Error seeding problems:', error.message);
    // Don't throw - let app continue even if seeding fails
  }
}

// Get seeding statistics
async function getSeedingStats() {
  const total = await CodingProblem.countDocuments();
  const byDifficulty = await CodingProblem.aggregate([
    { $group: { _id: '$difficulty', count: { $sum: 1 } } }
  ]);
  const byCategory = await CodingProblem.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  return { total, byDifficulty, byCategory };
}

module.exports = { 
  seedCodingProblems, 
  getSeedingStats,
  transformProblemForDB 
};

// Run directly if called as script
if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prepsense_ai')
    .then(() => {
      console.log('📦 Connected to MongoDB');
      return seedCodingProblems();
    })
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}
