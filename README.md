# maintenance-release-operator

**Keep your repos healthy. Ship releases faster.**

One command to check your repo for common maintenance issues — missing files, outdated config, forgotten hygiene. Fix problems before they become blockers.

[![CI](https://github.com/JonathanRyzowy/maintenance-release-operator/actions/workflows/ci.yml/badge.svg)](https://github.com/JonathanRyzowy/maintenance-release-operator/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/maintenance-release-operator.svg)](https://www.npmjs.com/package/maintenance-release-operator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

---

## What It Checks

| Check | Why It Matters |
|-------|---------------|
| `package.json` | Required for Node projects |
| `README.md` | First thing users see |
| `LICENSE` | Legal clarity for contributors |
| `CHANGELOG.md` | Track what changed between versions |
| `.gitignore` | Avoid committing junk |
| Lockfile conflicts | Multiple lockfiles cause CI failures |
| CI workflow | Automated testing prevents regressions |

---

## Roadmap

- [ ] `mro release` — Automate changelog + version bump + tag
- [ ] `mro deps` — Check for outdated/vulnerable dependencies
- [ ] `mro audit` — Security-focused checks
- [ ] Config file support (`.mrorc`)

---

## Contributing

Issues and PRs welcome. Please read the existing issues before opening a new one.

---

## License

MIT
