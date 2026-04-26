/**
 * Environment Configuration Validation
 * Ensures all required env vars are set before starting server
 */

const requiredEnvVars = [
  { name: 'JWT_SECRET', description: 'Secret for JWT token signing', minLength: 32 },
  { name: 'MONGODB_URI', description: 'MongoDB connection string' },
];

const optionalEnvVars = [
  { name: 'AI_PROVIDER', default: 'groq', description: 'AI provider (groq, google, openai)' },
  { name: 'NODE_ENV', default: 'development', description: 'Environment (development, production)' },
  { name: 'PORT', default: '5000', description: 'Server port' },
  { name: 'CLIENT_URL', default: 'http://localhost:5173', description: 'Frontend URL' },
];

function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required vars
  requiredEnvVars.forEach((envVar) => {
    const value = process.env[envVar.name];
    
    if (!value) {
      missing.push(envVar);
    } else if (envVar.minLength && value.length < envVar.minLength) {
      warnings.push(`${envVar.name} should be at least ${envVar.minLength} characters for security`);
    }
  });

  // Set defaults for optional vars
  optionalEnvVars.forEach((envVar) => {
    if (!process.env[envVar.name] && envVar.default) {
      process.env[envVar.name] = envVar.default;
    }
  });

  // Check AI keys based on provider
  const provider = process.env.AI_PROVIDER || 'groq';
  if (provider === 'groq' && !process.env.GROQ_API_KEY) {
    warnings.push('GROQ_API_KEY not set - AI features will fail');
  }
  if (provider === 'google' && !process.env.GOOGLE_API_KEY) {
    warnings.push('GOOGLE_API_KEY not set - AI features will fail');
  }
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set - AI features will fail');
  }

  // In production, fail on missing required vars
  if (process.env.NODE_ENV === 'production' && missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((envVar) => {
      console.error(`   - ${envVar.name}: ${envVar.description}`);
    });
    process.exit(1);
  }

  // Log status in development
  if (process.env.NODE_ENV !== 'production') {
    if (missing.length > 0) {
      console.warn('⚠️  Missing environment variables (using defaults):');
      missing.forEach((envVar) => {
        console.warn(`   - ${envVar.name}: ${envVar.description}`);
      });
    }
    if (warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      warnings.forEach((warning) => {
        console.warn(`   - ${warning}`);
      });
    }
  }

  return {
    isValid: missing.length === 0 || process.env.NODE_ENV !== 'production',
    missing,
    warnings
  };
}

module.exports = { validateEnv, requiredEnvVars, optionalEnvVars };
