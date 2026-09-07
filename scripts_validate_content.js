const scenarios = require('./data/scenarios.json');
const chains = require('./data/chains.json');
const emergency = require('./data/emergency.json');
const casefiles = require('./data/casefiles.json');
const scenarioIds = new Set();
const errors = [];
for (const s of scenarios) {
  if (!s.id) errors.push('Scenario missing id');
  if (scenarioIds.has(s.id)) errors.push(`Duplicate scenario id: ${s.id}`);
  scenarioIds.add(s.id);
  if (!Array.isArray(s.options) || s.correct < 0 || s.correct >= s.options.length) errors.push(`Bad answer index/options: ${s.id}`);
}
for (const c of chains) {
  if (!c.id || !Array.isArray(c.stages) || !c.stages.length) errors.push(`Bad chain: ${c.id}`);
  for (const id of c.stages) if (!scenarioIds.has(id)) errors.push(`Chain ${c.id} references missing scenario ${id}`);
}
const caseIds = new Set();
for (const c of casefiles) {
  if (caseIds.has(c.id)) errors.push(`Duplicate case file id: ${c.id}`);
  caseIds.add(c.id);
  const nodes = new Map((c.nodes || []).map(n => [n.id, n]));
  if (!c.id || !c.title || !nodes.size) errors.push(`Bad case file: ${c.id}`);
  for (const n of nodes.values()) {
    if (n.scenario && !scenarioIds.has(n.scenario)) errors.push(`Case ${c.id}/${n.id} references missing scenario ${n.scenario}`);
    if (n.next) for (const [choice, target] of Object.entries(n.next)) {
      if (!/^\d+$/.test(choice)) errors.push(`Case ${c.id}/${n.id} has invalid choice key ${choice}`);
      if (!nodes.has(target)) errors.push(`Case ${c.id}/${n.id} points to missing node ${target}`);
    }
    if (!n.scenario && !n.terminal) errors.push(`Case ${c.id}/${n.id} is neither a scenario nor terminal`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`JEHU content valid: ${scenarios.length} scenarios, ${chains.length} chains, ${emergency.length} emergency playbooks, ${casefiles.length} case files.`);
