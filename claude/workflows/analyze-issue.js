export const meta = {
  name: 'analyze-issue',
  description: 'Multi-analyst problem analysis with adversarial review; emits an implementation brief',
  whenToUse: 'Before implementing a non-trivial issue or problem: parallel analyst lenses investigate the repo, skeptics attack the synthesis, and the output is a brief ready to hand to an implementation agent (used by the ship-issue skill for standard/large tiers).',
  phases: [
    { title: 'Analyze', detail: 'parallel analyst lenses (sonnet)', model: 'sonnet' },
    { title: 'Synthesize', detail: 'merge analyses into a draft implementation brief' },
    { title: 'Adversarial review', detail: 'skeptic panel attacks the brief (opus)', model: 'opus' },
    { title: 'Finalize', detail: 'revise brief from sustained objections' },
  ],
}

// args: a problem-statement string, or { problem, context?, issue? }
//   problem — what needs solving, in the dispatcher's words (required)
//   context — verified facts the dispatcher already gathered (optional, prepended to every analyst prompt)
//   issue   — GitHub issue number if one exists (optional)
const problem = typeof args === 'string' ? args : args && args.problem
if (!problem) throw new Error('analyze-issue requires a problem statement: pass a string or { problem: "..." }')
const context = (args && args.context) ? `\n\nVerified facts from the dispatcher (trust these, do not re-derive):\n${args.context}` : ''
const issueRef = (args && args.issue) ? `\nThere is an existing GitHub issue #${args.issue} for this — read it with gh issue view first.` : ''

const ANALYSIS = {
  type: 'object',
  required: ['lens', 'findings', 'recommendation'],
  properties: {
    lens: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'evidence', 'confidence'],
        properties: {
          claim: { type: 'string' },
          evidence: { type: 'string', description: 'file:line references, command output, or doc citations — concrete, checkable' },
          confidence: { enum: ['verified', 'probable', 'speculative'] },
        },
      },
    },
    recommendation: { type: 'string' },
  },
}

const BRIEF = {
  type: 'object',
  required: ['problem', 'approach', 'inScope', 'outOfScope', 'acceptance', 'guardrails', 'reviewTier', 'workerModel'],
  properties: {
    problem: { type: 'string' },
    verifiedFacts: { type: 'array', items: { type: 'string' }, description: 'facts with file:line evidence the worker can rely on without re-deriving' },
    approach: { type: 'string' },
    inScope: { type: 'array', items: { type: 'string' } },
    outOfScope: { type: 'array', items: { type: 'string' }, description: 'explicit non-goals, with one-line reasons' },
    acceptance: { type: 'array', items: { type: 'string' }, description: 'checkable criteria; include exact verification commands where known' },
    risks: { type: 'array', items: { type: 'string' } },
    guardrails: { type: 'array', items: { type: 'string' }, description: 'repo-specific constraints the worker must obey (commit hygiene, shared state, conventions)' },
    reviewTier: { enum: ['self-review', 'one-pass', 'two-pass', 'three-pass'] },
    workerModel: { enum: ['haiku', 'sonnet', 'opus'] },
    openQuestions: { type: 'array', items: { type: 'string' }, description: 'things only the human can answer; empty when none' },
  },
}

const VERDICT = {
  type: 'object',
  required: ['approve', 'objections'],
  properties: {
    approve: { type: 'boolean' },
    objections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['target', 'why', 'severity'],
        properties: {
          target: { type: 'string', description: 'which brief field/claim this attacks' },
          why: { type: 'string' },
          severity: { enum: ['blocking', 'major', 'minor'] },
        },
      },
    },
  },
}

const LENSES = [
  { key: 'root-cause', focus: 'Locate exactly where the relevant behavior lives in the code. Identify the actual mechanism — not a plausible one. Every claim needs file:line evidence; if you cannot verify a claim by reading code or running a read-only command, mark it speculative.' },
  { key: 'blast-radius', focus: 'Map everything that must change together: consumers of the code being touched, tests that cover it, docs/READMEs/ADRs that describe it, generated artifacts. The project convention is that code changes update contradicted docs in the same PR — list them.' },
  { key: 'constraints', focus: 'Find the repo conventions and recorded lessons that bind this change: read the project CLAUDE.md, .planning/lessons.md, and relevant .planning/decisions/ ADRs. Surface anything that constrains commit structure, release tooling (e.g. path-based attribution), shared local state (databases, env files), naming, or testing discipline.' },
  { key: 'verification', focus: 'Determine how to prove the change works: exact lint/typecheck/test/build commands this repo uses (check Makefile, package.json, CI workflows), what new tests are needed, and what the acceptance criteria should be. Prefer criteria checkable by command over criteria requiring judgment.' },
  { key: 'scope-cut', focus: 'Find the simplest viable fix. Identify what could be cut, what is speculative, and what adjacent work should be explicitly declared out of scope. Flag any part of the problem statement that smells like premature generalization.' },
]

phase('Analyze')
const analystResults = await parallel(LENSES.map(l => () =>
  agent(
    `You are one analyst lens in a problem-analysis panel for this repository. Investigate the problem below through YOUR lens only; other lenses are covered by other analysts.\n\nPROBLEM:\n${problem}${issueRef}${context}\n\nYOUR LENS (${l.key}): ${l.focus}\n\nInvestigate the actual repo (read files, run read-only commands like git log / grep / gh issue view). Do not propose implementation details outside your lens. Set lens to "${l.key}".`,
    { label: `analyze:${l.key}`, phase: 'Analyze', model: 'sonnet', schema: ANALYSIS },
  )))
const analyses = analystResults.filter(Boolean)
if (analyses.length < LENSES.length) log(`⚠ ${LENSES.length - analyses.length} analyst(s) dropped — synthesis proceeds on ${analyses.length} lenses`)
if (analyses.length === 0) throw new Error('all analysts failed; nothing to synthesize')

phase('Synthesize')
const draft = await agent(
  `Merge these analyst reports into one implementation brief for the problem below. Resolve contradictions explicitly (prefer verified over probable over speculative claims; discard speculative claims that no other lens corroborates). Choose reviewTier and workerModel honestly from scope: trivial/mechanical → haiku/sonnet + self-review or one-pass; multi-file behavior change → sonnet/opus + one/two-pass; schema/CI/release-touching or cross-component → opus + two/three-pass.\n\nPROBLEM:\n${problem}\n\nANALYST REPORTS (JSON):\n${JSON.stringify(analyses)}`,
  { label: 'synthesize-brief', phase: 'Synthesize', schema: BRIEF },
)

phase('Adversarial review')
const SKEPTICS = [
  { key: 'wrong-root-cause', charge: 'Attack the brief\'s causal story and verifiedFacts: is the mechanism actually proven, or merely plausible? Re-check the cited evidence in the repo yourself. If the approach would "fix" a symptom while the defect lives elsewhere, that is a blocking objection.' },
  { key: 'missing-blast-radius', charge: 'Attack completeness: find consumers, tests, docs, generated artifacts, or repo constraints (commit/release hygiene, shared local state) the brief missed. Check the repo yourself; an unlisted doc that contradicts the change post-merge is a major objection.' },
  { key: 'mis-scoped', charge: 'Attack the scope and the tier calls: is anything in inScope unnecessary, anything in outOfScope actually required, the acceptance criteria too weak to prove the fix, or the reviewTier/workerModel mismatched to the real risk? Over-scoping is as objectionable as under-scoping.' },
]
const verdicts = (await parallel(SKEPTICS.map(s => () =>
  agent(
    `You are an adversarial reviewer. Your job is to REFUTE this implementation brief, not to polish it. Verify claims against the actual repo before objecting — unfounded objections are worse than none. If after genuine effort you cannot sustain a substantive objection, approve.\n\nYOUR ANGLE (${s.key}): ${s.charge}\n\nPROBLEM:\n${problem}\n\nBRIEF (JSON):\n${JSON.stringify(draft)}`,
    { label: `skeptic:${s.key}`, phase: 'Adversarial review', model: 'opus', schema: VERDICT },
  )))).filter(Boolean)
const sustained = verdicts.flatMap(v => v.objections).filter(o => o.severity !== 'minor')
const minors = verdicts.flatMap(v => v.objections).filter(o => o.severity === 'minor')
log(`skeptic panel: ${verdicts.filter(v => v.approve).length}/${verdicts.length} approve, ${sustained.length} sustained objection(s), ${minors.length} minor`)

phase('Finalize')
let finalBrief = draft
if (sustained.length > 0) {
  finalBrief = await agent(
    `Revise this implementation brief to resolve the sustained objections below. Address each objection by changing the brief — not by arguing with it; if an objection reveals a question only the human can answer, put it in openQuestions. Return the COMPLETE revised brief.\n\nPROBLEM:\n${problem}\n\nDRAFT BRIEF (JSON):\n${JSON.stringify(draft)}\n\nSUSTAINED OBJECTIONS (JSON):\n${JSON.stringify(sustained)}`,
    { label: 'finalize-brief', phase: 'Finalize', schema: BRIEF },
  )
}

return {
  brief: finalBrief,
  dissent: { sustained, minor: minors, approvals: verdicts.filter(v => v.approve).length, panelSize: verdicts.length },
  analystLensesCompleted: analyses.map(a => a.lens),
}
