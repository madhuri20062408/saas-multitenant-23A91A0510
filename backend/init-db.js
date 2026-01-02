// backend/init-db.js
const { execSync } = require('child_process');

async function initDatabase() {
  console.log('🔄 Pushing schema to database...');
  
  try {
    // Use db push instead of migrations (creates tables from schema)
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('✅ Database schema pushed');

    // Run seed data
    try {
      execSync('npx prisma db seed', { stdio: 'inherit' });
      console.log('✅ Seed data loaded');
    } catch (seedError) {
      console.log('⚠️ Seed skipped:', seedError.message);
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initDatabase();
