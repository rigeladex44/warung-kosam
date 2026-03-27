const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// WATCH DIRECTORY (src)
const watchPath = path.join(process.cwd(), 'src');

console.log('--- AUTO-GIT SYNC STARTED ---');
console.log('Watching for changes in: ' + watchPath);

let isSyncing = false;
let timeout = null;

const syncToGit = () => {
  if (isSyncing) return;
  isSyncing = true;

  console.log('\n🔄 Changes detected! Syncing to Git...');
  
  exec('git add . && git commit -m "auto: sync changes on save" && git push origin main', (error, stdout, stderr) => {
    isSyncing = false;
    if (error) {
      console.error('❌ Git Error: ', stderr || error.message);
      return;
    }
    console.log('✅ Sync Successful!');
    console.log(stdout.trim());
  });
};

// DEBOUNCED WATCHER (Prevent multiple triggers on single save)
fs.watch(watchPath, { recursive: true }, (event, filename) => {
  if (!filename || filename.startsWith('.')) return;
  
  // Debounce: Wait 2 seconds of inactivity before pushing
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(syncToGit, 2000);
});
