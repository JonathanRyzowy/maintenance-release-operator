# maintenance-release-operator

**Enforce truth in your repositories.**

MRO is a strict, deterministic governance tool that checks repo legitimacy and automates compliant releases. No flexibility by default. No AI. No dark patterns.

> **Philosophy:** MRO enforces what repositories claim about themselves. If your README says tests pass, they better pass. If you have dependencies, they better be secure. See **[PHILOSOPHY.md](PHILOSOPHY.md)** for governance principles.

[![CI](https://github.com/JonathanRyzowy/maintenance-release-operator/actions/workflows/ci.yml/badge.svg)](https://github.com/JonathanRyzowy/maintenance-release-operator/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/maintenance-release-operator.svg)](https://www.npmjs.com/package/maintenance-release-operator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Core Documents:**  
📜 [PHILOSOPHY.md](PHILOSOPHY.md) — Governance principles, strictness guarantees, what MRO will never become  
💰 [PRICING.md](PRICING.md) — Economic boundaries, free vs. paid, monetization model  
🛡️ [POLICY.md](POLICY.md) — Safety constraints, engineering guardrails, data handling

---

## Quick Start

```bash
# No install required — just run:
npx maintenance-release-operator check
```

**Output:**
```
🔍 Running maintenance checks...

  ✅ package.json exists
  ✅ README.md exists
  ❌ LICENSE exists
     → Add a LICENSE file. Try: npx license mit
  ❌ CHANGELOG exists
     → Create CHANGELOG.md to track versions
  ✅ .gitignore exists
  ✅ No package-lock.json AND pnpm-lock.yaml (pick one)
  ✅ CI workflow exists

─────────────────────────────────
  Passed: 5/7
  ⚠️  2 issue(s) found
─────────────────────────────────
```

📖 **[See Real-World Examples](docs/EXAMPLES.md)** — What MRO catches: missing LICENSE, security CVEs, lockfile conflicts, forgotten CHANGELOG, and more.

---

## Install (Optional)

```bash
# Global install for frequent use
npm install -g maintenance-release-operator

# Then just run:
mro check
```

---

## Commands

### `check`

Run all maintenance checks on the current repo.

```bash
mro check           # Human-readable output
mro check --json    # JSON output for scripting
```

**Exit codes:**
- `0` — All checks passed
- `1` — One or more checks failed

### `release`

Automate version bumping, changelog updates, and git tagging.

```bash
mro release          # Bump patch version (default)
mro release patch    # Bump patch: 1.2.3 → 1.2.4
mro release minor    # Bump minor: 1.2.3 → 1.3.0
mro release major    # Bump major: 1.2.3 → 2.0.0
```

**What it does:**
1. ✅ Checks working tree is clean
2. ✅ Runs CI checks (`npm run ci`)
3. ✅ Calculates next version
4. ✅ Updates `package.json`
5. ✅ Updates `CHANGELOG.md` with recent commits
6. ✅ Creates git commit and tag (`vX.Y.Z`)

**Safety checks:**
- ❌ Fails if working tree is dirty
- ❌ Fails if CI checks fail

**After release:**
```bash
git push origin main
git push origin v1.2.4
npm publish  # if publishing to npm
```

---

## Enforce in CI

**Turn MRO from a suggestion tool → an enforcement mechanism.**

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run MRO checks
  uses: JonathanRyzowy/maintenance-release-operator@main
```

**Result:** Pull requests cannot merge if repo standards aren't met.

📖 **[Complete CI Integration Guide](docs/CI-INTEGRATION.md)** — GitHub Actions (reusable action), GitLab, CircleCI, Jenkins examples + branch protection setup.

---

## What It Checks

| Check | Enforcement Reason |
|-------|-------------------|
| `package.json` | Node projects must declare dependencies and metadata |
| `README.md` | Repos without documentation are unmaintainable |
| `LICENSE` | No license = legal ambiguity = unusable |
| `CHANGELOG.md` | Version history must be documented |
| `.gitignore` | Secrets and build artifacts must not be committed |
| Lockfile conflicts | Multiple lockfiles = non-deterministic installs |
| CI workflow | Claims of "tests passing" must be verifiable |
| Test script | `npm test` must be runnable |
| Node engines | Supported versions must be declared |
| Outdated deps | Stale dependencies accumulate security debt |
| Security vulns | Known CVEs must be surfaced |

---

## Plans

| Feature | Free (CLI) | Starter ($29/mo) | Organization ($99/mo) | Enterprise ($500+/mo) |
|---------|------------|------------------|----------------------|----------------------|
| **Local CLI** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Public repos** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Private repos (GitHub App)** | ❌ | ✅ Up to 5 | ✅ Up to 50 | ✅ Unlimited |
| **Automated PR checks** | ❌ | ✅ | ✅ | ✅ |
| **Compliance dashboard** | ❌ | ❌ | ✅ | ✅ |
| **Slack/Discord integration** | ❌ | ❌ | ✅ | ✅ |
| **Audit logs & reporting** | ❌ | ❌ | ❌ | ✅ |
| **Self-hosted deployment** | ✅ (DIY) | ❌ | ❌ | ✅ |
| **Support** | Community | Email (48h) | Email (24h) | Dedicated + SLA (4h) |

See **[PRICING.md](PRICING.md)** for full details, philosophy, and economic boundaries.

---

## Roadmap

- [x] `mro release` — Automate changelog + version bump + tag ✅
- [ ] `mro deps` — Check for outdated/vulnerable dependencies
- [ ] `mro audit` — Security-focused checks
- [ ] Config file support (`.mrorc`)

---

## Pricing

The CLI is free forever. GitHub App (org-level enforcement) has paid tiers starting at $29/mo.

See the **Plans** section above for a feature comparison, or **[PRICING.md](PRICING.md)** for philosophy and economic boundaries.

---

## Contributing

Issues and PRs welcome. Please read the existing issues before opening a new one.

---

## Support

If MRO saves you time, consider supporting continued maintenance. See **[SUPPORT.md](SUPPORT.md)** for details.

---

## License

MIT
