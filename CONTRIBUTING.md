# Contributing

## Development

Use Node 22 for CI parity.

```bash
npm ci
npm run ci
```

## Tests

Run focused tests with Node's built-in runner:

```bash
node --test tests/check.test.js
```

Run the full suite before opening a PR:

```bash
npm run ci
```

## Pull Requests

PRs should include tests for behavior changes, keep CLI output deterministic, and avoid network-dependent tests unless the command supports `--skip network`.

## Releases

Dry-run first:

```bash
mro release patch --dry-run --yes --no-commit --no-tag
```

Real releases require a clean working tree, passing CI, an upstream tracking branch, no existing tag conflict, and explicit `--yes`.

## Issues

Bug reports should include the command, exit code, operating system, Node version, and whether the repo has package manager lockfiles.
