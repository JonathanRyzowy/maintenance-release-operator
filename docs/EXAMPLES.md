# Real-World Examples

What MRO catches in actual repositories.

---

## Example 1: The "No License" Trap

### Scenario

Your team open-sources an internal tool. README looks great, tests pass, but you forgot one thing.

### Before MRO

```bash
$ ls
README.md  package.json  src/  tests/

$ git push origin main
# ✅ CI passes
# ✅ Code merged
# ❌ No LICENSE file — legal ambiguity for users
```

**Result:** Contributors are hesitant. Downstream users avoid your package. Legal teams block adoption.

### After MRO

```bash
$ npx maintenance-release-operator check

🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ❌ LICENSE exists
     → Add a LICENSE file. No license = legal ambiguity = unusable.
     → Try: npx license mit
  ✅ CHANGELOG.md exists
  ✅ .gitignore exists
  ✅ CI workflow exists

─────────────────────────────────
  Passed: 5/6
  ⚠️  1 issue(s) found
─────────────────────────────────

Exit code: 1
```

**Action:** Add LICENSE before merging.

**Impact:** Contributors confident, legal teams happy, adoption increases.

---

## Example 2: The Security Vulnerability You Didn't Notice

### Scenario

A dependency you installed 6 months ago has a high-severity CVE. Your tests pass. Your code works. But you're shipping a vulnerability.

### Before MRO

```bash
$ npm audit
# (You forgot to check)

$ git push origin main
# ✅ CI passes
# ✅ Code deployed
# ❌ CVE-2024-XXXXX in production
```

**Result:** Security scan flags your app. Customers lose trust. Emergency patch required.

### After MRO

```bash
$ npx maintenance-release-operator check

🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ✅ LICENSE exists
  ✅ CHANGELOG.md exists
  ✅ .gitignore exists
  ✅ CI workflow exists
  ✅ Test script exists
  ✅ Node engines specified
  ✅ No outdated dependencies
  ❌ Security vulnerabilities: 1 high severity
     → Run: npm audit fix
     → Or: npm audit for details

─────────────────────────────────
  Passed: 9/10
  ⚠️  1 issue(s) found
─────────────────────────────────

Exit code: 1
```

**Action:** Fix vulnerability before merging.

**Impact:** CVE never reaches production. Security posture maintained.

---

## Example 3: The Lockfile Chaos

### Scenario

Your repo has both `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm). Different developers get different dependency versions.

### Before MRO

```bash
$ npm install
# Uses package-lock.json

$ pnpm install  # (different dev)
# Uses pnpm-lock.yaml

# Result: Non-deterministic builds
# CI: "It works on my machine!"
```

**Result:** Builds fail randomly. Debugging nightmare. Wasted hours.

### After MRO

```bash
$ npx maintenance-release-operator check

🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ✅ LICENSE exists
  ✅ CHANGELOG.md exists
  ✅ .gitignore exists
  ❌ No package-lock.json AND pnpm-lock.yaml (pick one)
     → Multiple lockfiles cause non-deterministic installs
     → Keep one, delete the other
  ✅ CI workflow exists

─────────────────────────────────
  Passed: 6/7
  ⚠️  1 issue(s) found
─────────────────────────────────

Exit code: 1
```

**Action:** Remove one lockfile.

**Impact:** Deterministic builds. No more "works on my machine."

---

## Example 4: The Forgotten CHANGELOG

### Scenario

You've shipped 10 versions. Users ask "What changed in v2.3.0?" You have no answer.

### Before MRO

```bash
$ ls
README.md  package.json  src/  tests/
# No CHANGELOG.md

$ npm version minor
$ npm publish
# ✅ Published v2.3.0
# ❌ Users have no idea what changed
```

**Result:** Adoption stalls. Users scared to upgrade (breaking changes?). Support tickets spike.

### After MRO

```bash
$ npx maintenance-release-operator check

🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ✅ LICENSE exists
  ❌ CHANGELOG exists
     → Create CHANGELOG.md to track versions
     → Users need to know what changed
  ✅ .gitignore exists
  ✅ CI workflow exists

─────────────────────────────────
  Passed: 5/6
  ⚠️  1 issue(s) found
─────────────────────────────────

Exit code: 1
```

**Action:** Add CHANGELOG before release.

**Impact:** Users confident upgrading. Reduced support burden.

---

## Example 5: The CI That Doesn't Exist

### Scenario

README says "tests passing." But there's no CI. Tests only pass on your machine.

### Before MRO

```bash
$ cat README.md
# my-project
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]

$ ls .github/workflows/
# (empty)

# Users trust the badge
# Reality: No CI, tests might fail
```

**Result:** Contributors submit PRs that break tests. You manually test everything. Maintainer burnout.

### After MRO

```bash
$ npx maintenance-release-operator check

🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ✅ LICENSE exists
  ✅ CHANGELOG.md exists
  ✅ .gitignore exists
  ❌ CI workflow exists
     → Add .github/workflows/ci.yml
     → Claims of "tests passing" must be verifiable
  ✅ Test script exists

─────────────────────────────────
  Passed: 6/7
  ⚠️  1 issue(s) found
─────────────────────────────────

Exit code: 1
```

**Action:** Add CI workflow.

**Impact:** Automated testing. Contributors verify their PRs. Maintainer sanity preserved.

---

## Example 6: The Outdated Dependencies

### Scenario

You built a project 2 years ago. Dependencies haven't been updated. Now you need to add a feature.

### Before MRO

```bash
$ npm install some-new-package
npm ERR! peer dependency conflict

# Why? Because your deps are ancient
# Time to update everything (breaking changes?)
```

**Result:** Feature blocked. Day spent on dependency hell. Bugs introduced.

### After MRO

```bash
$ npx maintenance-release-operator check

🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ✅ LICENSE exists
  ✅ CHANGELOG.md exists
  ✅ .gitignore exists
  ✅ CI workflow exists
  ✅ Test script exists
  ✅ Node engines specified
  ❌ Outdated dependencies: 12 packages behind
     → Run: npm outdated
     → Consider: npm update

─────────────────────────────────
  Passed: 8/9
  ⚠️  1 issue(s) found
─────────────────────────────────

Exit code: 1
```

**Action:** Update deps regularly (before they're ancient).

**Impact:** No dependency hell. Features ship on time.

---

## Example 7: The Missing Node Version

### Scenario

Your app works on Node 20. New dev clones repo, runs on Node 16. Everything breaks.

### Before MRO

```bash
# New dev
$ node --version
v16.0.0

$ npm install
$ npm test
# ❌ Tests fail (async syntax not supported)

# "It works on my machine!" — you
```

**Result:** Onboarding friction. New contributors give up.

### After MRO

```bash
$ npx maintenance-release-operator check

🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ✅ LICENSE exists
  ✅ CHANGELOG.md exists
  ✅ .gitignore exists
  ✅ CI workflow exists
  ✅ Test script exists
  ❌ Node engines specified
     → Add "engines": { "node": ">=18.0.0" } to package.json
     → Specifies supported Node versions

─────────────────────────────────
  Passed: 7/8
  ⚠️  1 issue(s) found
─────────────────────────────────

Exit code: 1
```

**Action:** Declare Node version in `package.json`.

**Impact:** New devs see clear error: "Node 16 not supported." Onboarding smooth.

---

## Real-World Adoption

### Before MRO: The Maintenance Lottery

- Some repos have CI, some don't
- Some have CHANGELOG, some don't
- Some have LICENSE, some don't
- Standards = whatever maintainer remembers

**Result:** Inconsistent quality. Users can't trust your org's repos.

### After MRO: Enforced Standards

```yaml
# .github/workflows/ci.yml (added to all repos)
- name: MRO Check
  run: npx maintenance-release-operator check
```

**Result:** Every repo meets baseline standards. Trust increases. Adoption increases.

---

## Organization-Level Impact

### Scenario: 50-repo engineering org

**Before MRO:**
- 10 repos have no LICENSE
- 15 repos have security vulnerabilities
- 20 repos have no CI
- 30 repos have outdated dependencies

**Cost:**
- Legal review blocks 5 open-source releases
- Security audit flags 8 high-severity CVEs
- New hires waste 2 days setting up CI
- Dependency hell delays 3 features

**After MRO (CI enforcement):**
- PRs blocked until LICENSE added
- PRs blocked until CVEs fixed
- PRs blocked until CI exists
- PRs blocked until deps updated

**Impact:**
- 0 legal blockers
- 0 security incidents
- 0 onboarding friction
- 0 dependency hell

**ROI:** Eliminates entire class of preventable issues.

---

## What MRO Doesn't Catch (Yet)

MRO enforces **measurable truth**, not subjective quality.

**Out of scope:**
- Code quality (use ESLint)
- Test coverage (use nyc/c8)
- Performance (use benchmarks)
- Documentation completeness (use linters)

**Why?** These require opinions. MRO enforces facts:
- "LICENSE exists" = fact
- "LICENSE is good" = opinion

---

## Try It Yourself

```bash
# Run on your repo
npx maintenance-release-operator check

# Run on someone else's repo
git clone <repo-url>
cd <repo>
npx maintenance-release-operator check
```

**You'll be surprised what you find.**

---

## Next Steps

1. Run MRO on your repos
2. Fix issues it catches
3. Add MRO to CI ([guide](CI-INTEGRATION.md))
4. Enforce standards, not suggestions

**Questions?** Open an [issue](https://github.com/JonathanRyzowy/maintenance-release-operator/issues/new).
