#!/usr/bin/env node

// StocksShorts Backup Verification Script
// This script verifies that all essential files are present in the backup

import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'drizzle.config.ts',
  'components.json',
  'replit.md',
  'client/index.html',
  'client/src/App.tsx',
  'client/src/main.tsx',
  'server/index.ts',
  'server/routes.ts',
  'server/storage.ts',
  'server/mobileAuth.ts',
  'shared/schema.ts',
  'start-backup.sh',
  '.env.example'
];

const requiredDirectories = [
  'client',
  'client/src',
  'client/public',
  'server',
  'server/services',
  'shared',
  'attached_assets'
];

console.log('🔍 Verifying StocksShorts backup...\n');

let allFilesPresent = true;
let allDirectoriesPresent = true;

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesPresent = false;
  }
});

console.log('\n📂 Checking required directories:');
requiredDirectories.forEach(dir => {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - MISSING`);
    allDirectoriesPresent = false;
  }
});

// Check package.json content
console.log('\n📋 Checking package.json configuration:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = ['dev', 'build', 'start', 'db:push'];
  const requiredDependencies = ['react', 'express', 'drizzle-orm', 'wouter'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Script: ${script} - MISSING`);
      allFilesPresent = false;
    }
  });
  
  requiredDependencies.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ Dependency: ${dep}`);
    } else {
      console.log(`❌ Dependency: ${dep} - MISSING`);
      allFilesPresent = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
  allFilesPresent = false;
}

// Check asset files
console.log('\n🖼️  Checking asset files:');
const assetsDir = 'attached_assets';
if (fs.existsSync(assetsDir)) {
  const assets = fs.readdirSync(assetsDir);
  const imageAssets = assets.filter(file => 
    file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp')
  );
  
  console.log(`✅ Found ${imageAssets.length} image assets`);
  
  // Check for logo files
  const logoFiles = assets.filter(file => file.includes('logo'));
  if (logoFiles.length > 0) {
    console.log(`✅ Found ${logoFiles.length} logo files`);
  } else {
    console.log(`⚠️  No logo files found`);
  }
} else {
  console.log('❌ attached_assets directory missing');
}

// Final verification result
console.log('\n' + '='.repeat(50));
if (allFilesPresent && allDirectoriesPresent) {
  console.log('✅ BACKUP VERIFICATION SUCCESSFUL');
  console.log('   All required files and directories are present');
  console.log('   Backup is ready for restoration');
} else {
  console.log('❌ BACKUP VERIFICATION FAILED');
  console.log('   Some required files or directories are missing');
  console.log('   Please check the backup process');
}

console.log('\n📝 Next steps:');
console.log('1. Copy .env.example to .env and fill in your values');
console.log('2. Run: npm install');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run dev');
console.log('\n🚀 Or use the start-backup.sh script for automated setup');