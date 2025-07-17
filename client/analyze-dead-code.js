#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🔍 React Frontend Dead Code Analysis');
console.log('='.repeat(80));

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// Function to run command and capture output
function runCommand(command, description) {
  console.log(`\n📊 ${description}...`);
  console.log('-'.repeat(50));
  
  try {
    const output = execSync(command, { 
      cwd: __dirname, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return output;
  } catch (error) {
    // Many tools exit with non-zero code when finding issues
    return error.stdout || error.stderr || 'No output';
  }
}

// 1. Check for unused files and dependencies
const unimportedOutput = runCommand('npx unimported --json', 'Checking for unused files and dependencies');
console.log(unimportedOutput);

try {
  const unimportedData = JSON.parse(unimportedOutput);
  
  // Write detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      unusedDependencies: unimportedData.unusedDependencies?.length || 0,
      unimportedFiles: unimportedData.unimportedFiles?.length || 0,
      unresolvedImports: unimportedData.unresolvedImports?.length || 0
    },
    details: unimportedData
  };
  
  fs.writeFileSync(
    path.join(reportsDir, 'unimported-analysis.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`✅ Found ${report.summary.unusedDependencies} unused dependencies`);
  console.log(`✅ Found ${report.summary.unimportedFiles} unimported files`);
  
} catch (error) {
  console.log('⚠️  Could not parse unimported output as JSON, saving raw output...');
  fs.writeFileSync(
    path.join(reportsDir, 'unimported-analysis.txt'),
    unimportedOutput
  );
}

// 2. Check dependencies with depcheck
const depcheckOutput = runCommand('npx depcheck --json', 'Checking dependencies with depcheck');
console.log('\n📊 Depcheck Results:');
console.log('-'.repeat(50));

try {
  const depcheckData = JSON.parse(depcheckOutput);
  
  console.log(`Unused dependencies: ${depcheckData.dependencies?.length || 0}`);
  console.log(`Unused devDependencies: ${depcheckData.devDependencies?.length || 0}`);
  console.log(`Missing dependencies: ${depcheckData.missing ? Object.keys(depcheckData.missing).length : 0}`);
  
  if (depcheckData.dependencies?.length > 0) {
    console.log('\nUnused dependencies:');
    depcheckData.dependencies.forEach(dep => console.log(`  - ${dep}`));
  }
  
  if (depcheckData.devDependencies?.length > 0) {
    console.log('\nUnused devDependencies:');
    depcheckData.devDependencies.forEach(dep => console.log(`  - ${dep}`));
  }
  
  fs.writeFileSync(
    path.join(reportsDir, 'depcheck-analysis.json'),
    JSON.stringify(depcheckData, null, 2)
  );
  
} catch (error) {
  console.log('⚠️  Could not parse depcheck output as JSON, saving raw output...');
  fs.writeFileSync(
    path.join(reportsDir, 'depcheck-analysis.txt'),
    depcheckOutput
  );
}

// 3. Check for unused exports
console.log('\n📊 Checking for unused exports...');
console.log('-'.repeat(50));

try {
  const tsUnusedExportsOutput = runCommand('npx ts-unused-exports tsconfig.json', 'Checking for unused exports');
  console.log(tsUnusedExportsOutput);
  
  fs.writeFileSync(
    path.join(reportsDir, 'unused-exports.txt'),
    tsUnusedExportsOutput
  );
} catch (error) {
  console.log('⚠️  ts-unused-exports not available or no tsconfig.json found');
}

// 4. Generate summary report
const summaryReport = {
  timestamp: new Date().toISOString(),
  project: 'React Frontend',
  analyzedDirectory: __dirname,
  analysisTypes: [
    'Unused files and dependencies (unimported)',
    'Dependency analysis (depcheck)',
    'Unused exports (ts-unused-exports)'
  ],
  reportsGenerated: fs.readdirSync(reportsDir)
};

fs.writeFileSync(
  path.join(reportsDir, 'summary.json'),
  JSON.stringify(summaryReport, null, 2)
);

console.log('\n🎉 Analysis Complete!');
console.log('='.repeat(80));
console.log(`📁 Reports saved to: ${reportsDir}`);
console.log(`📄 Summary report: ${path.join(reportsDir, 'summary.json')}`);
console.log('\nFiles analyzed:');
summaryReport.reportsGenerated.forEach(file => console.log(`  - ${file}`));