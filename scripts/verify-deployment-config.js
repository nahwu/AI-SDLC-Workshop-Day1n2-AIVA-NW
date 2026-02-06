#!/usr/bin/env node

/**
 * Railway Deployment Pre-flight Check
 * 
 * Verifies that all required configuration files and settings
 * are in place before deploying to Railway.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const NEXTJS_DIR = path.join(ROOT_DIR, 'nextjs_server');

let hasErrors = false;
let hasWarnings = false;

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.error(`❌ ${description} - MISSING`);
    hasErrors = true;
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${description} - FILE NOT FOUND`);
    hasErrors = true;
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes(searchString)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.warn(`⚠️  ${description} - NOT CONFIGURED`);
    hasWarnings = true;
    return false;
  }
}

function checkPackageJson() {
  const pkgPath = path.join(NEXTJS_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ package.json not found`);
    hasErrors = true;
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  
  // Check required scripts
  const requiredScripts = ['dev', 'build', 'start'];
  let allScriptsPresent = true;
  
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`✅ package.json has "${script}" script`);
    } else {
      console.error(`❌ package.json missing "${script}" script`);
      hasErrors = true;
      allScriptsPresent = false;
    }
  });
  
  // Check required dependencies
  const requiredDeps = ['next', 'react', 'better-sqlite3'];
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`✅ package.json includes "${dep}" dependency`);
    } else {
      console.error(`❌ package.json missing "${dep}" dependency`);
      hasErrors = true;
    }
  });
  
  return allScriptsPresent;
}

function checkEnvExample() {
  const envPath = path.join(NEXTJS_DIR, '.env.example');
  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  .env.example not found - consider creating one`);
    hasWarnings = true;
    return false;
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  
  // Check for important variables
  const importantVars = [
    'TZ',
    'DATABASE_PATH',
    'NODE_ENV'
  ];
  
  importantVars.forEach(varName => {
    if (content.includes(varName)) {
      console.log(`✅ .env.example includes ${varName}`);
    } else {
      console.warn(`⚠️  .env.example missing ${varName}`);
      hasWarnings = true;
    }
  });
  
  return true;
}

console.log('\n🚀 Railway Deployment Pre-flight Check\n');
console.log('═'.repeat(50));
console.log('\n📋 Checking Railway Configuration Files...\n');

// Check root configuration files
checkFile(
  path.join(ROOT_DIR, 'railway.json'),
  'railway.json exists'
);

checkFile(
  path.join(ROOT_DIR, 'nixpacks.toml'),
  'nixpacks.toml exists'
);

checkFile(
  path.join(ROOT_DIR, '.railwayignore'),
  '.railwayignore exists'
);

console.log('\n📋 Checking Next.js Configuration...\n');

// Check Next.js files
checkFile(
  path.join(NEXTJS_DIR, 'package.json'),
  'nextjs_server/package.json exists'
);

checkFile(
  path.join(NEXTJS_DIR, 'next.config.ts'),
  'nextjs_server/next.config.ts exists'
);

checkFile(
  path.join(NEXTJS_DIR, 'Dockerfile'),
  'nextjs_server/Dockerfile exists'
);

console.log('\n📋 Checking Database Configuration...\n');

// Check database files
checkFile(
  path.join(NEXTJS_DIR, 'lib', 'db.ts'),
  'lib/db.ts exists'
);

checkFile(
  path.join(NEXTJS_DIR, 'lib', 'sqlite-db.ts'),
  'lib/sqlite-db.ts exists'
);

checkFileContent(
  path.join(NEXTJS_DIR, 'lib', 'sqlite-db.ts'),
  'DATABASE_PATH',
  'Database supports custom path (DATABASE_PATH)'
);

console.log('\n📋 Checking Documentation...\n');

// Check documentation
checkFile(
  path.join(ROOT_DIR, 'RAILWAY_QUICK_START.md'),
  'RAILWAY_QUICK_START.md exists'
);

checkFile(
  path.join(ROOT_DIR, 'RAILWAY_DEPLOYMENT_CHECKLIST.md'),
  'RAILWAY_DEPLOYMENT_CHECKLIST.md exists'
);

checkFile(
  path.join(ROOT_DIR, 'DEPLOYMENT_SUMMARY.md'),
  'DEPLOYMENT_SUMMARY.md exists'
);

console.log('\n📋 Checking package.json and dependencies...\n');

checkPackageJson();

console.log('\n📋 Checking environment configuration...\n');

checkEnvExample();

// Check Dockerfile configuration
console.log('\n📋 Checking Dockerfile...\n');

checkFileContent(
  path.join(NEXTJS_DIR, 'Dockerfile'),
  '/data',
  'Dockerfile configured for persistent volume'
);

checkFileContent(
  path.join(NEXTJS_DIR, 'Dockerfile'),
  'Asia/Singapore',
  'Dockerfile sets Singapore timezone'
);

// Final summary
console.log('\n' + '═'.repeat(50));
console.log('\n📊 Pre-flight Check Summary\n');

if (hasErrors) {
  console.error('❌ ERRORS FOUND - Please fix the issues above before deploying\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  WARNINGS FOUND - Review warnings above, but deployment should work\n');
  console.log('✅ All critical checks passed!\n');
  console.log('📖 Next steps:');
  console.log('   1. Review warnings above');
  console.log('   2. Follow RAILWAY_QUICK_START.md to deploy');
  console.log('   3. Set environment variables in Railway dashboard\n');
  process.exit(0);
} else {
  console.log('✅ All checks passed! Ready to deploy to Railway!\n');
  console.log('📖 Next steps:');
  console.log('   1. Push to GitHub: git push origin main');
  console.log('   2. Follow RAILWAY_QUICK_START.md to deploy');
  console.log('   3. Add persistent volume at /data');
  console.log('   4. Set environment variables in Railway\n');
  console.log('🚀 Happy deploying!\n');
  process.exit(0);
}
