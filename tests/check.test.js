import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { CHECKS, parseCheckArgs, runChecks } from '../src/commands/check.js';
import { countFailingVulnerabilities } from '../src/checks/security.js';

const FIXTURES = path.resolve(process.cwd(), 'tests/fixtures');

describe('check command internals', () => {
  it('exports a stable CHECKS registry for unit testing', () => {
    assert.ok(Array.isArray(CHECKS));
    assert.ok(CHECKS.some((check) => check.id === 'file.package_json'));
    assert.ok(CHECKS.some((check) => check.id === 'npm.audit'));
  });

  it('detects malformed package.json with a direct parse error', async () => {
    const payload = await runChecks({
      cwd: path.join(FIXTURES, 'broken-package-json'),
      options: parseCheckArgs(['--skip', 'network']),
      checks: CHECKS.filter((check) => check.id === 'package.json_parse'),
    });
    assert.equal(payload.failed, 1);
    assert.equal(payload.results[0].details.error.code, 'PACKAGE_JSON_PARSE_ERROR');
  });

  it('detects missing package metadata fields', async () => {
    const payload = await runChecks({
      cwd: path.join(FIXTURES, 'missing-test-script'),
      options: parseCheckArgs(['--skip', 'network']),
      checks: CHECKS.filter((check) => check.id === 'package.script_test'),
    });
    assert.equal(payload.failed, 1);
    assert.equal(payload.results[0].id, 'package.script_test');
  });

  it('detects conflicting lockfiles including yarn.lock', async () => {
    const payload = await runChecks({
      cwd: path.join(FIXTURES, 'conflicting-lockfiles'),
      options: parseCheckArgs(['--skip', 'network']),
      checks: CHECKS.filter((check) => check.id === 'package.lockfile_conflict'),
    });
    assert.equal(payload.failed, 1);
    assert.deepEqual(payload.results[0].details.lockfiles.sort(), ['package-lock.json', 'yarn.lock']);
  });

  it('detects missing CI workflow fixtures', async () => {
    const payload = await runChecks({
      cwd: path.join(FIXTURES, 'missing-ci-workflow'),
      options: parseCheckArgs(['--skip', 'network']),
      checks: CHECKS.filter((check) => check.id === 'file.ci_workflow'),
    });
    assert.equal(payload.failed, 1);
  });

  it('counts audit failures according to fail-level', () => {
    const vulnerabilities = { low: 1, moderate: 1, high: 1, critical: 1 };
    assert.equal(countFailingVulnerabilities(vulnerabilities, 'critical'), 1);
    assert.equal(countFailingVulnerabilities(vulnerabilities, 'high'), 2);
    assert.equal(countFailingVulnerabilities(vulnerabilities, 'all'), 4);
  });
});
