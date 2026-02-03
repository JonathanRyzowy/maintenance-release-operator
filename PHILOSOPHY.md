# PHILOSOPHY.md — Governance Principles

This document declares what MRO enforces, why it enforces it, and what it will never become.

---

## 1. Core Thesis

**Software repositories lie.**

Not maliciously — but through entropy, neglect, and accumulated technical debt. A repo can have:
- A README that claims tests pass (they don't)
- A CHANGELOG that stopped updating 6 months ago
- Dependencies with known CVEs that no one noticed
- No LICENSE file (legal ambiguity)
- CI that runs on a branch that hasn't merged in weeks

**MRO exists to enforce truth.**

Truth = the state of the repository matches what it claims about itself.

---

## 2. Strictness Over Flexibility

### MRO is not configurable by default

Most tools optimize for "developer experience" — which often means:
- Flexible rules you can override
- Warnings you can ignore
- Checks you can skip

MRO does the opposite:
- **Rules are non-negotiable** (unless you pay for policy exceptions)
- **Exit codes are binary** (pass = 0, fail = 1)
- **No warnings** — only failures or passes

### Why strictness matters

Flexibility allows drift. Drift allows lies. Lies accumulate into unmaintainable codebases.

If you want flexibility, fork the tool. If you want enforcement, use MRO.

---

## 3. Determinism Guarantee

**MRO behavior is deterministic.**

Given the same repository state:
- The same checks run
- The same results are returned
- The same exit code is produced

### What this means in practice

- **No network-dependent checks** (unless explicitly scoped, e.g., npm audit)
- **No time-based checks** (no "fail if older than N days")
- **No AI in the execution path** (no LLM deciding if your code is "good enough")
- **No silent updates** (version pinning enforced in lockfiles)

### Why determinism matters

If CI passes today and fails tomorrow with no code change, the tool is broken — or the tool is lying.

MRO will never lie about repository state.

---

## 4. What MRO Will Never Become

These are binding constraints. If MRO violates these, it has failed:

### ❌ Never a suggestion engine
MRO does not "recommend" fixes. It enforces requirements or fails.

### ❌ Never AI-augmented
No LLM will ever decide if your repo is "healthy." Health is measurable.

### ❌ Never a social network
No badges, no leaderboards, no gamification. Compliance is not a competition.

### ❌ Never telemetry-by-default
If data leaves your machine, you opted in explicitly.

### ❌ Never "smart" defaults
Defaults are strict. If you want leniency, configure it explicitly (and pay for policy exceptions).

---

## 5. Authority Model

### Free tier: Truth enforcement on your machine
You run `mro check`. It tells you the truth. No authority over others.

### Paid tier: Authority over teams
You enforce checks on 10, 50, 100 repos. You block merges if MRO fails. This is organizational authority — and it costs money.

**Why this matters:**
- Small teams using MRO locally = free
- Large teams enforcing MRO across repos = paying for leverage
- The tool subsidizes individual legitimacy by charging for organizational power

---

## 6. Governance Integrity

MRO is a **governance tool**, not a convenience tool.

### What governance means
- Repositories must meet baseline standards
- Standards are documented, measurable, and enforceable
- Enforcement is automated, not optional

### What governance does not mean
- MRO does not decide what's "best practice" — it enforces what you declare as required
- MRO does not provide opinion (e.g., "tabs vs spaces") — it provides measurement
- MRO does not replace human judgment — it removes human inconsistency

---

## 7. Trust Anchor

**If MRO says your repo is compliant, it is.**

This requires:
- Open source code (auditable)
- Deterministic behavior (reproducible)
- No hidden network calls (transparent)
- No telemetry by default (privacy-preserving)

If you cannot trust the tool, you cannot trust the enforcement.

---

## 8. Revenue Without Corruption

MRO will make money. But not by:
- Selling user data
- Adding ads
- Requiring subscriptions for core CLI features
- Paywalling security checks

MRO makes money by:
- Charging for organizational authority (GitHub App, org enforcement)
- Charging for compliance features (audit logs, policy exceptions)
- Charging for support SLAs (priority fixes, dedicated channels)

Revenue comes from **leverage**, not **hostages**.

---

## 9. Evolution Constraints

MRO can evolve, but only within bounds:

### ✅ Allowed evolution
- New checks that enforce measurable truth
- New release automation features (e.g., multi-repo releases)
- New enforcement surfaces (e.g., GitHub App, GitLab integration)
- Performance improvements
- Better error messages

### ❌ Forbidden evolution
- "Smart" checks that use non-deterministic logic
- Checks that require network calls without explicit user consent
- Features that introduce flexibility without payment
- Telemetry or analytics without opt-in
- Changing pricing philosophy without community input

---

## 10. Accountability

**This document is binding.**

If MRO violates these principles:
1. File a GitHub issue with evidence
2. Tag it `philosophy-violation`
3. Maintainers must respond within 7 days with either:
   - Acknowledgment of violation + timeline to fix
   - Evidence that no violation occurred

If maintainers ignore violations, the community should fork.

---

_Last updated: 2026-02-03_  
_This document is versioned. Changes require explicit commits and community visibility._
