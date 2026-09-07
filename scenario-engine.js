const crypto = require('crypto');
const scenarios = require('./data/scenarios.json');
const chains = require('./data/chains.json');
const emergency = require('./data/emergency.json');

const LEVELS = { rookie: 1, analyst: 2, elite: 3, guardian: 4 };
const LEVEL_NAMES = { rookie: 'Rookie', analyst: 'Analyst', elite: 'Elite', guardian: 'JEHU Guardian' };

// DATA-DRIVEN ENGINE: adding a scenario, chain or emergency guide only changes a data file.
// The game rules, UI and multiplayer protocol do not need to be rewritten.
function levelOf(difficulty) { return LEVELS[difficulty] || 1; }
function eligibleScenarios(difficulty = 'rookie', opts = {}) {
  const level = levelOf(difficulty);
  let pool = scenarios.filter(s => (s.difficulty || 1) <= level);
  if (opts.type) pool = pool.filter(s => !s.type || s.type === opts.type);
  if (opts.category) pool = pool.filter(s => s.category === opts.category);
  if (opts.legitimate !== undefined) pool = pool.filter(s => Boolean(s.legitimate) === Boolean(opts.legitimate));
  return pool;
}
function pickUnique(pool, usedIds = new Set()) {
  let available = pool.filter(s => !usedIds.has(s.id));
  if (!available.length) { usedIds.clear(); available = pool.slice(); }
  return available[crypto.randomInt(available.length)];
}
function pickForMatch(difficulty, usedIds, opts = {}) {
  const pool = eligibleScenarios(difficulty, opts);
  const picked = pickUnique(pool.length ? pool : scenarios, usedIds);
  usedIds.add(picked.id);
  return picked;
}
function chainForDifficulty(difficulty, usedIds) {
  const level = levelOf(difficulty);
  const candidates = chains.filter(c => c.difficulty <= level && c.stages.every(id => {
    const s = scenarios.find(x => x.id === id); return s && (s.difficulty || 1) <= level;
  }));
  if (!candidates.length) return null;
  const available = candidates.filter(c => c.stages.every(id => !usedIds.has(id)));
  const pool = available.length ? available : candidates;
  return pool[crypto.randomInt(pool.length)] || null;
}
function publicScenario(s, reveal = false) {
  const base = {
    id:s.id, title:s.title, category:s.category, difficulty:s.difficulty || 1,
    type:s.type || 'scenario', message:s.message, evidence:s.evidence || [], options:s.options || [],
    buttons:s.buttons || [], lesson:s.lesson, consequence:s.consequence || null,
    stage:s.stage || 1, chainId:s.chainId || null, chainTotal:s.chainTotal || 1,
    legitimate:s.legitimate === true
  };
  if (reveal) base.correct = s.correct;
  // Never expose the answer before reveal; this also protects public API consumers from trivial cheating.
  if (!reveal) delete base.correct;
  return base;
}
function publicEmergency(e) { return e; }
function stats() {
  const byDifficulty = {}, byType = {}, byCategory = {}, legitimate = {true:0,false:0};
  for (const s of scenarios) {
    byDifficulty[s.difficulty] = (byDifficulty[s.difficulty] || 0) + 1;
    byType[s.type || 'scenario'] = (byType[s.type || 'scenario'] || 0) + 1;
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    legitimate[String(s.legitimate === true)]++;
  }
  return { total: scenarios.length, chains: chains.length, emergencyGuides: emergency.length, byDifficulty, byType, byCategory, legitimate };
}
module.exports = { scenarios, chains, emergency, LEVELS, LEVEL_NAMES, levelOf, eligibleScenarios, pickForMatch, chainForDifficulty, publicScenario, publicEmergency, stats };

// CASE FILE ENGINE: branching, multi-stage incident simulations.
const casefiles = require('./data/casefiles.json');
function caseFilesForDifficulty(difficulty = 'rookie') {
  const level = levelOf(difficulty);
  return casefiles.filter(c => (c.difficulty || 1) <= level).map(c => ({
    id:c.id, title:c.title, category:c.category, difficulty:c.difficulty || 1,
    brief:c.brief, stages:c.nodes.filter(n => n.scenario).length
  }));
}
function publicCaseFile(c) {
  return {
    id:c.id, title:c.title, category:c.category, difficulty:c.difficulty || 1, brief:c.brief,
    nodes:c.nodes.map(n => n.scenario ? { id:n.id, scenario:n.scenario } : { id:n.id, terminal:n.terminal, summary:n.summary })
  };
}
function getCaseFile(id) { return casefiles.find(c => c.id === id) || null; }
function getCaseNode(c, id) { return c ? c.nodes.find(n => n.id === id) || null : null; }
module.exports.casefiles = casefiles;
module.exports.caseFilesForDifficulty = caseFilesForDifficulty;
module.exports.publicCaseFile = publicCaseFile;
module.exports.getCaseFile = getCaseFile;
module.exports.getCaseNode = getCaseNode;
