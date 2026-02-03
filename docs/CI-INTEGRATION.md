# CI Integration Guide

Enforce repository standards in your CI pipeline using MRO.

---

## Why Enforce in CI?

Running `mro check` locally is useful. Running it in CI is **governance**.

When MRO runs in CI:
- Pull requests cannot merge if checks fail
- Standards are enforced automatically, not optionally
- New contributors follow the same rules as maintainers
- Entropy cannot accumulate unnoticed

This transforms MRO from a suggestion tool → an **enforcement mechanism**.

---

## GitHub Actions

### Option 1: Use MRO GitHub Action (Easiest)

Add to `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  mro-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run MRO checks
        uses: JonathanRyzowy/maintenance-release-operator@main
```

**This is the simplest approach.** The action handles everything: runs checks, posts results to GitHub step summary, and fails the workflow if checks fail.

### Option 2: Run CLI Directly

Add to `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  mro-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      
      - name: Run MRO checks
        run: npx maintenance-release-operator check
```

**Behavior:**
- Runs on every push to `main` and every PR
- Fails the build if MRO checks fail
- Exit code 1 → ❌ Check failed
- Exit code 0 → ✅ Check passed

### JSON Output (for reporting)

```yaml
- name: Run MRO checks with JSON output
  run: npx maintenance-release-operator check --json > mro-report.json
  continue-on-error: true

- name: Upload report
  uses: actions/upload-artifact@v3
  with:
    name: mro-report
    path: mro-report.json
```

---

## GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
mro-check:
  stage: test
  image: node:20
  script:
    - npx maintenance-release-operator check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

**Behavior:**
- Runs on merge requests and main branch pushes
- Fails the pipeline if checks fail

---

## CircleCI

Add to `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  mro-check:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Run MRO checks
          command: npx maintenance-release-operator check

workflows:
  version: 2
  check:
    jobs:
      - mro-check
```

---

## Jenkins

Add to `Jenkinsfile`:

```groovy
pipeline {
    agent any
    stages {
        stage('MRO Check') {
            steps {
                sh 'npx maintenance-release-operator check'
            }
        }
    }
}
```

---

## Travis CI

Add to `.travis.yml`:

```yaml
language: node_js
node_js:
  - 20
script:
  - npx maintenance-release-operator check
```

---

## Blocking Pull Requests

### GitHub Branch Protection

1. Go to: **Settings** → **Branches** → **Branch protection rules**
2. Add rule for `main`
3. Enable: **Require status checks to pass before merging**
4. Select: `mro-check` (or your job name)

**Result:** PRs cannot merge if MRO checks fail.

### GitLab Merge Request Approvals

1. Go to: **Settings** → **Merge requests**
2. Enable: **Pipelines must succeed**

**Result:** MRs cannot merge if pipeline (including MRO) fails.

---

## Example: What Gets Blocked

### Scenario 1: Missing LICENSE

**PR attempts to merge without a LICENSE file.**

```
❌ MRO Check Failed

  ✅ package.json exists
  ✅ README.md exists
  ❌ LICENSE exists
     → Add a LICENSE file. No license = legal ambiguity = unusable.
  ✅ CHANGELOG.md exists
  ...

─────────────────────────────────
  Passed: 6/7
  ⚠️  1 issue(s) found
─────────────────────────────────
```

**Status:** ❌ Cannot merge until LICENSE is added.

### Scenario 2: Security Vulnerability

**PR introduces a dependency with known CVE.**

```
❌ MRO Check Failed

  ...
  ✅ Outdated dependencies: 0 found
  ❌ Security vulnerabilities: 1 high severity
     → Run: npm audit fix --force
  
─────────────────────────────────
  Passed: 9/10
  ⚠️  1 issue(s) found
─────────────────────────────────
```

**Status:** ❌ Cannot merge until vulnerability is fixed.

---

## Organization-Wide Enforcement

### Current: Manual Setup

To enforce MRO across multiple repos, you must:
1. Add CI workflow to each repo
2. Configure branch protection per repo
3. Maintain consistency manually

**Friction:** High. Scales poorly.

### Future: GitHub App (Paid)

MRO will offer a GitHub App that:
- Automatically runs checks on all repos in an org
- Enforces policy without per-repo CI config
- Provides centralized dashboard
- Supports custom policy exceptions

**Pricing:** $29–$99/org/month (see [PRICING.md](../PRICING.md))

**Status:** Under development. [Request early access →](https://github.com/JonathanRyzowy/maintenance-release-operator/issues/new?title=GitHub+App+Early+Access)

---

## Advanced: Custom Policies

### Free Tier

MRO enforces a fixed set of checks. No customization.

**Philosophy:** Strictness by default. If the check exists, it matters.

### Paid Tier (Enterprise)

Custom policy exceptions for:
- Repos without CHANGELOG (legacy monorepos)
- Different lockfile requirements per team
- Custom security thresholds

**Pricing:** Enterprise tier (contact us)

**Why paid?** Flexibility introduces risk. Paid customers get authority to override strictness — but only when they pay for that privilege.

---

## Monitoring and Reporting

### Track Compliance Over Time

Run MRO checks nightly and store results:

```yaml
# .github/workflows/nightly-compliance.yml
name: Nightly Compliance Check

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      
      - name: Run MRO and save report
        run: |
          npx maintenance-release-operator check --json > compliance-$(date +%Y-%m-%d).json || true
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: compliance-reports
          path: compliance-*.json
```

**Result:** Historical compliance data for audits.

---

## Troubleshooting

### "MRO check passes locally but fails in CI"

**Cause:** Local environment differs from CI (e.g., different Node version, missing `.gitignore` entries).

**Fix:**
1. Run MRO in a clean clone: `git clone <repo> /tmp/test && cd /tmp/test && npx mro check`
2. Ensure CI uses same Node version as local (check `package.json` engines)

### "CI is too slow"

**Optimization:**
```yaml
- name: Cache npx packages
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

Reduces `npx` fetch time from 10s → 2s.

### "I want to skip MRO for hotfix PRs"

**Don't.** That's the point of enforcement. Hotfixes bypass review → accumulate debt.

If you **must** skip (emergency production outage):
```yaml
- name: Run MRO checks
  if: "!contains(github.event.head_commit.message, '[skip-mro]')"
  run: npx maintenance-release-operator check
```

**Warning:** This violates MRO's philosophy. Use sparingly.

---

## Next Steps

1. Add MRO to your CI pipeline (copy example above)
2. Enable branch protection to enforce checks
3. Monitor for failures, fix issues
4. Consider [GitHub App](https://github.com/JonathanRyzowy/maintenance-release-operator/issues/new?title=GitHub+App+Early+Access) for org-wide enforcement

---

**Questions?** Open an [issue](https://github.com/JonathanRyzowy/maintenance-release-operator/issues/new).
