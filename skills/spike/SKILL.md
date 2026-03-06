---
name: spike
description: >
  Structured technical investigation. Researches a topic, evaluates options,
  and produces a decision-ready document in .planning/research/. Use for
  exploring new tools, patterns, architectural questions, or anything that
  needs more than a quick answer. Captures Friday explorations durably.
argument-hint: <topic or question to investigate>
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Agent, Skill
---

# Spike

Conduct a structured technical investigation and produce a durable
research document.

## Arguments

`$ARGUMENTS` should describe the topic or question to investigate.
If no arguments, ask the user what they want to explore.

## Phase 1: Setup

### 1a. Create the research document
Generate a filename: `.planning/research/YYYY-MM-DD-<slug>.md`
where slug is a kebab-case summary of the topic (max 5 words).

If `.planning/` doesn't exist, tell the user to run `/init-planning`
first and stop.

If `.planning/research/` doesn't exist, create it.

### 1b. Check for prior research
Search `.planning/research/` and `.planning/decisions/` for existing
documents on the same or related topics. If found, read them and build
on prior work rather than starting from scratch. Mention what prior
research exists.

### 1c. Write the document header

```markdown
# Spike: <Topic>

**Date:** YYYY-MM-DD
**Status:** In Progress
**Question:** <the core question being investigated>

## Context

<1-3 sentences on why this matters and what prompted the investigation>
```

## Phase 2: Investigation

### 2a. Gather information
Use ALL relevant sources. Do not stop after one:

- **Codebase:** Search the current project for related patterns, prior
  art, existing implementations that relate to the question
- **Documentation:** Read project docs, library docs (via WebFetch if
  needed), API references
- **Web research:** Use WebSearch for current best practices, blog posts,
  official recommendations. Focus on authoritative sources (official docs,
  core maintainer posts, well-known engineering blogs). Prefer 2025-2026
  content when available.
- **Comparisons:** If evaluating alternatives, research each one
  individually. Don't rely on a single comparison article.

### 2b. Use subagents for parallel research
If the investigation has multiple independent threads (e.g., evaluating
3 different libraries), launch subagents to research each one in parallel.
Each subagent should return: what it is, key features, trade-offs,
community health, and how it fits the project's stack.

### 2c. Test feasibility when possible
If the spike involves a library or pattern, consider writing a minimal
proof-of-concept in a scratch file. Don't commit it — this is
exploratory. Delete it when done or note its location in the document.

## Phase 3: Synthesis

Update the research document with findings:

```markdown
## Options

### Option A: <name>
**What:** <one sentence>
**Pros:**
- ...
**Cons:**
- ...
**Fit:** <how well it fits this project's stack, patterns, constraints>

### Option B: <name>
...

## Comparison

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| <relevant criteria> | ... | ... | ... |

## Recommendation

<clear recommendation with reasoning>
<what trade-offs are being accepted>
<what risks remain>

## Open Questions

- <anything that couldn't be resolved and needs further investigation>

## Next Steps

- [ ] <concrete actions if the recommendation is accepted>
```

### 3a. Update status
Change the document status from "In Progress" to "Complete" (or
"Needs Discussion" if there's no clear winner).

## Phase 4: Wrap Up

### 4a. Commit the research document
Stage and commit: `docs: spike on <topic>`

### 4b. Decision handoff
If the research leads to a clear decision, ask the user if they want to
record it as a formal decision via `/save-decision`. Don't auto-invoke —
the user may want to discuss first.

### 4c. Summary
Output a brief summary to the conversation:
- The core question
- The recommendation (or "needs discussion")
- Top 2-3 findings that might surprise the user
- Path to the full document

## Important

- Research documents are tracked in git (`.planning/research/` is not
  gitignored). They merge with the branch and propagate to main.
- Keep the document under 150 lines. It's a decision aid, not a thesis.
- Cite sources. Include URLs for key references so the user can verify.
- If the topic is too broad, narrow it. Ask the user to scope the
  question rather than writing a 500-line doc that covers everything
  superficially.
- Do not recommend options you haven't actually researched. If you can't
  find solid information on an option, say so.
