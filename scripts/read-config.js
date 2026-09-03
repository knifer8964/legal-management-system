const fs = require('fs');
const c = JSON.parse(fs.readFileSync('C:\\Users\\tatoo\\.qclaw\\openclaw.json', 'utf8'));
console.log(JSON.stringify(c.agents, null, 2));
