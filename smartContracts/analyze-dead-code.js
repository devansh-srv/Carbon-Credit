#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🔍 Solidity Smart Contracts Dead Code Analysis');
console.log('='.repeat(80));

// Create reports directory
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
    return error.stdout || error.stderr || 'No output';
  }
}

// 1. Analyze contract files
const contractsDir = path.join(__dirname, 'contracts');
const contractFiles = [];

if (fs.existsSync(contractsDir)) {
  const files = fs.readdirSync(contractsDir);
  files.forEach(file => {
    if (file.endsWith('.sol')) {
      contractFiles.push(file);
    }
  });
}

console.log(`📁 Found ${contractFiles.length} Solidity files:`);
contractFiles.forEach(file => console.log(`  - ${file}`));

// 2. Manual analysis of contract content
const analysis = {
  timestamp: new Date().toISOString(),
  project: 'Solidity Smart Contracts',
  analyzedDirectory: __dirname,
  contracts: []
};

contractFiles.forEach(file => {
  const filePath = path.join(contractsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Basic analysis
  const lines = content.split('\n');
  const functions = [];
  const variables = [];
  const events = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Find functions
    if (trimmed.includes('function ') && !trimmed.startsWith('//')) {
      const match = trimmed.match(/function\s+(\w+)/);
      if (match) {
        functions.push({
          name: match[1],
          line: index + 1,
          visibility: trimmed.includes('public') ? 'public' : 
                     trimmed.includes('private') ? 'private' :
                     trimmed.includes('internal') ? 'internal' : 'external'
        });
      }
    }
    
    // Find state variables
    if (trimmed.includes('mapping') || (trimmed.includes('uint') && trimmed.includes(';'))) {
      const match = trimmed.match(/(\w+)\s*;/);
      if (match && !trimmed.startsWith('//')) {
        variables.push({
          name: match[1],
          line: index + 1,
          type: trimmed.includes('mapping') ? 'mapping' : 'variable'
        });
      }
    }
    
    // Find events
    if (trimmed.includes('event ') && !trimmed.startsWith('//')) {
      const match = trimmed.match(/event\s+(\w+)/);
      if (match) {
        events.push({
          name: match[1],
          line: index + 1
        });
      }
    }
  });
  
  analysis.contracts.push({
    file,
    path: filePath,
    totalLines: lines.length,
    functions,
    variables,
    events
  });
});

// 3. Try to run solhint if available
console.log('\n📊 Checking for linting issues with solhint...');
console.log('-'.repeat(50));

try {
  // Check if solhint is available
  execSync('which solhint', { stdio: 'ignore' });
  
  const solhintOutput = runCommand('solhint contracts/*.sol', 'Running solhint analysis');
  console.log(solhintOutput);
  
  fs.writeFileSync(
    path.join(reportsDir, 'solhint-analysis.txt'),
    solhintOutput
  );
  
  analysis.solhint = {
    available: true,
    output: solhintOutput
  };
  
} catch (error) {
  console.log('⚠️  solhint not available - install with: npm install -g solhint');
  analysis.solhint = {
    available: false,
    note: 'Install solhint globally: npm install -g solhint'
  };
}

// 4. Check for unused dependencies in package.json
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
  const depcheckOutput = runCommand('npx depcheck --json', 'Checking dependencies');
  
  try {
    const depcheckData = JSON.parse(depcheckOutput);
    analysis.dependencies = depcheckData;
    
    console.log(`📦 Unused dependencies: ${depcheckData.dependencies?.length || 0}`);
    console.log(`📦 Unused devDependencies: ${depcheckData.devDependencies?.length || 0}`);
    
    fs.writeFileSync(
      path.join(reportsDir, 'dependencies-analysis.json'),
      JSON.stringify(depcheckData, null, 2)
    );
  } catch (error) {
    console.log('⚠️  Could not parse dependency check output');
  }
}

// 5. Generate report
fs.writeFileSync(
  path.join(reportsDir, 'contracts-analysis.json'),
  JSON.stringify(analysis, null, 2)
);

// 6. Generate summary
const totalFunctions = analysis.contracts.reduce((sum, contract) => sum + contract.functions.length, 0);
const totalVariables = analysis.contracts.reduce((sum, contract) => sum + contract.variables.length, 0);
const totalEvents = analysis.contracts.reduce((sum, contract) => sum + contract.events.length, 0);

console.log('\n🎉 Analysis Complete!');
console.log('=' * 80);
console.log(`📁 Reports saved to: ${reportsDir}`);
console.log(`📄 Contract analysis: ${path.join(reportsDir, 'contracts-analysis.json')}`);
console.log(`📊 Summary:`);
console.log(`  - ${contractFiles.length} Solidity files`);
console.log(`  - ${totalFunctions} functions found`);
console.log(`  - ${totalVariables} variables/mappings found`);
console.log(`  - ${totalEvents} events found`);

// List generated reports
console.log('\nReports generated:');
fs.readdirSync(reportsDir).forEach(file => console.log(`  - ${file}`));

console.log('\n💡 Manual Review Recommended:');
console.log('  - Check if all functions are called in tests');
console.log('  - Verify state variables are properly used');
console.log('  - Ensure events are emitted appropriately');
console.log('  - Install solhint for automated linting: npm install -g solhint');