const fs = require('fs');
const path = require('path');

const dir = 'public/data_demo/work-instructions';

fs.readdirSync(dir).forEach(d => {
  const p = path.join(dir, d, 'contributions/contributions.json');
  if(fs.existsSync(p)) {
    const c = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(c);
    for (const contrib of data.contributions || []) {
      if (contrib.userName && !contrib.userName.startsWith('作業者')) {
        console.log(d, ':', JSON.stringify(contrib.userName));
      }
      if (contrib.userId && !contrib.userId.startsWith('作業者')) {
        console.log(d, '(userId):', JSON.stringify(contrib.userId));
      }
    }
  }
});
