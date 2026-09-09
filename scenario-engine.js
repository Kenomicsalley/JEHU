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
function normalizeScenario(s) {
  if (!s || typeof s !== 'object') return null;
  // Accept the current JEHU schema and older V1/V2 aliases so a stale data file
  // cannot produce a blank question/options panel after deployment.
  const message = s.message ?? s.question ?? s.prompt ?? s.description ?? '';
  const evidence = Array.isArray(s.evidence) ? s.evidence
    : (Array.isArray(s.clues) ? s.clues : (Array.isArray(s.signals) ? s.signals : []));
  const options = Array.isArray(s.options) ? s.options
    : (Array.isArray(s.choices) ? s.choices : (Array.isArray(s.responses) ? s.responses : []));
  const correct = Number.isInteger(s.correct) ? s.correct
    : (Number.isInteger(s.correctIndex) ? s.correctIndex : s.answerIndex);
  return { ...s, message, evidence, options, correct };
}

function publicScenario(s, reveal = false) {
  const n = normalizeScenario(s);
  if (!n) return null;
  const base = {
    id:n.id, title:n.title, category:n.category, difficulty:n.difficulty || 1,
    type:n.type || 'scenario', message:n.message, evidence:n.evidence, options:n.options,
    buttons:n.buttons || [], lesson:n.lesson || '', consequence:n.consequence || null,
    stage:n.stage || 1, chainId:n.chainId || null, chainTotal:n.chainTotal || 1,
    legitimate:n.legitimate === true
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
  // Case Files are a small, curated set (10 total) rather than a large pool
  // like the 300 scenarios — hard-filtering by difficulty level left
  // "Rookie" (the default for every first-time player) seeing zero results,
  // since every case file requires difficulty >= 2. Show all of them,
  // sorted easiest-first, and let the visible star rating communicate
  // challenge level instead of hiding content behind an unmet threshold.
  void levelOf(difficulty);
  return casefiles.slice().sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1)).map(c => ({
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
