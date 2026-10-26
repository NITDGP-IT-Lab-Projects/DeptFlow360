/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Syntax & Static Asset Integrity Checker
 * Run with: node tests/syntax-check.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running DAWMS Static Asset & Syntax Integrity Check...\n');

let hasErrors = false;

// 1. Check critical files existence
const requiredFiles = [
  'index.html',
  'css/styles.css',
  'js/data.js',
  'js/workflowEngine.js',
  'js/allocationEngine.js',
  'js/app.js',
  'docs/ARCHITECTURE_AND_DESIGN.md',
  'README.md'
];

console.log('Checking required workspace files:');
requiredFiles.forEach(fileRel => {
  const fullPath = path.join(rootDir, fileRel);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`  ✅ ${fileRel} exists (${stats.size} bytes)`);
  } else {
    console.error(`  ❌ Missing required file: ${fileRel}`);
    hasErrors = true;
  }
});

// 2. Validate JavaScript Syntax using Node.js VM compiler
console.log('\nValidating JavaScript syntax:');
const jsFiles = [
  'js/data.js',
  'js/workflowEngine.js',
  'js/allocationEngine.js',
  'js/app.js',
  'server/server.js',
  'server/config/db.js',
  'server/models/Workflow.js',
  'server/models/Faculty.js',
  'server/models/ProjectTeam.js',
  'server/models/Notification.js',
  'server/controllers/workflowController.js',
  'server/controllers/allocationController.js',
  'server/controllers/facultyController.js',
  'server/routes/workflowRoutes.js',
  'server/routes/allocationRoutes.js',
  'server/routes/facultyRoutes.js',
  'server/seed/seedData.js'
];

jsFiles.forEach(jsRel => {
  const fullPath = path.join(rootDir, jsRel);
  try {
    const code = fs.readFileSync(fullPath, 'utf8');
    new vm.Script(code, { filename: jsRel });
    console.log(`  ✅ ${jsRel} syntax is valid`);
  } catch (err) {
    console.error(`  ❌ Syntax Error in ${jsRel}:`, err.message);
    hasErrors = true;
  }
});

// 3. Verify index.html contains necessary tags
console.log('\nValidating index.html structure:');
const indexPath = path.join(rootDir, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const checks = [
  { tag: '<!DOCTYPE html>', desc: 'HTML5 Doctype' },
  { tag: '<html lang="en">', desc: 'HTML Lang' },
  { tag: '<meta charset="UTF-8">', desc: 'UTF-8 Charset' },
  { tag: 'css/styles.css', desc: 'Stylesheet link' },
  { tag: 'js/data.js', desc: 'Data module script tag' },
  { tag: 'js/workflowEngine.js', desc: 'Workflow engine script tag' },
  { tag: 'js/allocationEngine.js', desc: 'Allocation engine script tag' },
  { tag: 'js/app.js', desc: 'App controller script tag' }
];

checks.forEach(chk => {
  if (indexHtml.includes(chk.tag)) {
    console.log(`  ✅ Contains ${chk.desc}`);
  } else {
    console.error(`  ❌ Missing ${chk.desc} in index.html`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('\n❌ Static asset and syntax check FAILED.');
  process.exit(1);
} else {
  console.log('\n✨ All static assets, syntax checks, and structure tests PASSED!\n');
  process.exit(0);
}
