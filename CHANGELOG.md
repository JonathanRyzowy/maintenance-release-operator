# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial `check` command for repo health checks
- Dependency checks: outdated packages detection
- Security checks: npm audit integration (high/critical vulns)
- Package quality checks: test script, engines field
- CLI with `mro` alias
- JSON output support (`--json` flag)
- Basic maintenance checks:
  - package.json exists
  - README.md exists
  - LICENSE exists
  - CHANGELOG.md exists
  - .gitignore exists
  - Lockfile conflict detection
  - CI workflow exists

## [0.1.0] - 2026-02-03

### Added
- Project scaffolding
- Contract files (GOAL.md, FUNNEL.md, SCOREBOARD.json, POLICY.md)
- CI pipeline with GitHub Actions
- Basic test suite
