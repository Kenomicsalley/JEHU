# JEHU Scenario Authoring Guide

## Options-authoring pass (v2.2)

100 base scenarios (A089–A288, spanning 10 categories) previously shared
one of two generic, cross-category templated option sets — a leftover
from the script that expanded the dataset. Every one of the 100 has now
been given genuinely scenario-specific options, written from its actual
`title`/`message`, following a consistent structure: [0] comply
immediately in the specific way asked, [1] the correct answer — verify
independently through the appropriate channel for *that* scenario, [2] a
partial-compliance middle ground, [3] deflect the decision to someone
else. Each "— The Follow-Up" scenario (the escalation variant of the same
scam) intentionally shares its base scenario's options — that's a
deliberate pairing (same decision, tested again under more pressure), not
a leftover duplicate. The one remaining group of 12 shared option sets
(`A289`–`A300`, the LEGITIMATE VERIFICATION category) is similarly
intentional — one coherent, correctly-matched set for that category.
Result: 189 distinct option sets across 300 scenarios, largest remaining
group is 12 (down from a single 200-scenario cross-category block).

JEHU is designed so content grows without rewriting the game engine. Add or edit content in `data/scenarios.json`, `data/chains.json`, and `data/emergency.json`; the server/game rules stay unchanged.

## Scenario record

Required fields:
- `id`: unique ID such as `A81` or `L09`.
- `title`: short player-facing title.
- `category`: threat family.
- `difficulty`: 1 Rookie, 2 Analyst, 3 Elite, 4 JEHU Guardian.
- `type`: normally `scenario`.
- `message`: the situation the player sees.
- `evidence`: short evidence chips/items.
- `options`: array of response choices.
- `correct`: zero-based index of the safest response.
- `lesson`: concise educational explanation.
- `consequence`: what could happen if the unsafe path is taken.
- `buttons`: one or more psychological pressure tags from the JEHU framework.
- `legitimate`: `true` only for genuine/legitimate verification cases.

Optional chain metadata (`chainId`, `stage`, `chainTotal`) may be included for documentation, but chain membership is controlled by `data/chains.json`.

## Difficulty rules

A scenario's difficulty controls which rooms can see it. A higher level includes lower levels:
- Rookie sees difficulty 1.
- Analyst sees 1-2.
- Elite sees 1-3.
- Guardian sees 1-4.

Keep the correct response defensive. JEHU should teach safe verification, containment, reporting and recovery—not operational details that help criminals execute attacks.

## Chain record

A chain is a reusable multi-stage story:
```json
{
  "id": "CHAIN-21",
  "title": "A Clear Story Name",
  "difficulty": 3,
  "stages": ["A81", "A82", "A83"]
}
```

Stages should escalate logically. Avoid repeating the same scenario inside a chain. The chain difficulty must be at least the highest stage difficulty.

## Good chain patterns

Use a progression such as:
1. Establish trust or create a believable setup.
2. Apply pressure or request an action.
3. Introduce a consequence, pivot or second-stage manipulation.
4. Give the player a recovery/containment decision where appropriate.

## Quality checklist

Before publishing a new case:
- Is it based on a plausible real-world pattern?
- Is the safest response unambiguous?
- Does it teach a transferable principle rather than a one-off trick?
- Does it avoid unnecessary personal data?
- Does it avoid naming a real organisation as a scammer unless the source/context is explicitly documented?
- Is it different enough from existing cases?
- Does its difficulty match the sophistication of the scenario?
- If it is legitimate, is the verification path clear?
- If it is a chain stage, does it logically follow the previous stage?

Run:
`npm run validate:content`

The validator checks IDs, required fields, answer indexes, difficulty values, chain references and chain integrity.


## Content growth rule

JEHU content is data, not game code. Add scenarios to `data/scenarios.json`, chains to `data/chains.json`, case files to `data/casefiles.json`, and emergency guides to `data/emergency.json`. Then run `npm run validate:content`. Do not hard-code scenario IDs into the UI for ordinary content additions.

For new real-world procedures, add a source/verification note to the content record or authoring notes and verify time-sensitive contact details against the relevant official provider before publishing.
