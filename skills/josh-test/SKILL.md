---
name: josh-test
description: >
  Alias for /review. The Josh Test: a ruthless code review that holds
  nothing back. Same 10 criteria, same 5 parallel agents, same iterative
  design — just a better name.
argument-hint: [optional focus area]
disable-model-invocation: false
user-invocable: true
allowed-tools: Skill
---

# The Josh Test

Run `/review $ARGUMENTS`.

This is not a separate skill — it invokes `/review` directly. All review
criteria, parallel agents, iteration awareness, and fix behavior are
defined there. This exists purely as an alias.
