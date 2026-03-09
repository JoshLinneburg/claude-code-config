# Cross-Cutting Analysis Agents

Launch these 4 agents in parallel after module reviews complete. Each
agent receives the module findings and project context. Each performs
**read-only** analysis and returns findings — no fixes applied.

These agents look for problems that only become visible when you compare
across modules. A module can pass its own review but still be inconsistent
with the rest of the project.

## Agent A: Dependency Health

- Are dependencies up to date? Any known vulnerabilities?
- Any unused dependencies (declared but not imported)?
- Are there duplicate dependencies at different versions?
- Check for deprecated packages or packages with known CVEs
- Did a recent change add a new dependency? Is it justified, or was
  a stdlib/existing solution available?

## Agent B: Test Coverage & Quality

- Are there entire modules or features with no tests?
- Are integration tests properly separated from unit tests?
- Are test utilities and fixtures well-organized or duplicated?
- Do test files follow consistent naming and structure?
- **Test substance across modules** — is one module rigorously tested
  with real assertions while another relies entirely on mock-only tests?
  Inconsistent test quality is a cross-cutting concern.

## Agent C: Pattern & Convention Consistency

- Does module A handle errors differently from module B without a
  good reason?
- Are naming conventions consistent across modules? Do they follow the
  language's community standards where the project doesn't override
  (`snake_case` for Python/Rust, `camelCase` for JS/TS)? Are idiomatic
  constructs used consistently (`.map()`/`.filter()` vs manual loops in
  JS, list comprehensions vs explicit accumulation in Python)?
- Are configuration patterns (env vars, settings objects) consistent?
- Is there duplicated logic across modules that should be shared?
- **Type safety consistency** — is one module using strict types while
  another is littered with `any` or untyped functions? Are data models
  (interfaces, data classes) defined consistently?
- **Security consistency** — across modules, is user input consistently
  validated before use in queries, commands, file paths, or output? Are
  auth checks applied consistently? Are secrets handled the same way
  (env vars, not hardcoded)? One module doing it right and another
  doing it wrong is a pattern consistency failure.
- **Observability consistency** — are logging patterns consistent across
  modules? Same log format, same error context, same level conventions?
  Is one module using structured logging while another uses bare print
  statements?

## Agent D: Documentation Drift

- Do README, CLAUDE.md, and CONTRIBUTING.md still match the code?
- Are there dead file paths, outdated commands, or missing docs for
  new features?
- Use the same checks as `/doc-drift` (dead references, outdated
  instructions, missing documentation, cross-doc inconsistencies)
- Are there new env vars, CLI commands, or scripts not documented?
