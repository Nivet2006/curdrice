const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tasksPath = path.join(__dirname, '../CURRENT_TASKS.md');
const trackerPath = path.join(__dirname, '../CLUB_EVE_SERVICE_IMPLEMENTATION_TRACKER.md');

function runVerification() {
  console.log(`[${new Date().toISOString()}] Running production build verification...`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Build succeeded! Updating trackers...');
    updateTrackerFiles(true);
  } catch (error) {
    console.error('Build failed! Updating trackers...');
    updateTrackerFiles(false);
  }
}

function updateTrackerFiles(isPass) {
  const resultStr = isPass ? 'PASS' : 'FAIL';
  
  if (fs.existsSync(tasksPath)) {
    let tasksContent = fs.readFileSync(tasksPath, 'utf8');
    tasksContent = tasksContent.replace(/\| Production Build \| (PASS|FAIL|NOT RUN) \|/, `| Production Build | ${resultStr} |`);
    fs.writeFileSync(tasksPath, tasksContent, 'utf8');
  }

  if (fs.existsSync(trackerPath)) {
    let trackerContent = fs.readFileSync(trackerPath, 'utf8');
    // Find the last modified service (the one that is not COMPLETE or currently being worked on)
    // and set its verification status. For simplicity, we can update the active service's status block.
    // We will look for verification result table rows and update them.
    trackerContent = trackerContent.replace(/\| Production Build \| (PASS|FAIL|NOT RUN) \|/, `| Production Build | ${resultStr} |`);
    trackerContent = trackerContent.replace(/Build: (PASS|FAIL|NOT RUN)/, `Build: ${resultStr}`);
    fs.writeFileSync(trackerPath, trackerContent, 'utf8');
  }
}

// Run once immediately, then loop every 60 seconds
runVerification();
setInterval(runVerification, 60000);
