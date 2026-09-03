const fs = require('fs');
const path = 'C:\\Users\\tatoo\\.qclaw\\openclaw.json';
const c = JSON.parse(fs.readFileSync(path, 'utf8'));

// Find agent-d64c8186 and add subagents.allowAgents
const me = c.agents.list.find(a => a.id === 'agent-d64c8186');
if (!me.subagents) {
  me.subagents = {};
}
me.subagents.allowAgents = [
  'dev-cypher',
  'rvw-rigel',
  'tst-verity',
  'sec-cipher',
  'doc-scribe',
  'sys-wispr',
  'pm-nexus'
];

// Also set requireAgentId to false so spawn without agentId still works but can target specific agents
// allowAny stays false for safety, but allowAgents expands the list

fs.writeFileSync(path, JSON.stringify(c, null, 2), 'utf8');
console.log('Done! agent-d64c8186 now has subagents.allowAgents configured.');
console.log(JSON.stringify(me.subagents, null, 2));
