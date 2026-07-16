const { execSync } = require('child_process');
const fs = require('fs');

const targetDir = 'raw-data';

if (fs.existsSync(targetDir)) {
  console.log(`Directory ${targetDir} already exists. Removing...`);
  fs.rmSync(targetDir, { recursive: true, force: true });
}

console.log('Fetching 10th-edition BSData...');
try {
  execSync('git clone --depth 1 https://github.com/BSData/wh40k-10e.git raw-data/', { stdio: 'inherit' });
  console.log('Data successfully cloned into /raw-data/');
} catch (error) {
  console.error('Failed to fetch data:', error);
  process.exit(1);
}
