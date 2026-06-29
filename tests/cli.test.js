import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const CLI_PATH = path.resolve(process.cwd(), 'src/index.js');
const FIXTURES = path.resolve(process.cwd(), 'tests/fixtures');

describe('CLI', () => {
  it('shows help with --help flag', () => {
    const output = execFileSync(process.execPath, [CLI_PATH, '--help'], { encoding: 'utf8' });
    assert.match(output, /maintenance-release-operator/);
    assert.match(output, /check/);
    assert.match(output, /doctor/);
  });

  it('fails cleanly on unknown commands', () => {
    assert.throws(
      () => execFileSync(process.execPath, [CLI_PATH, 'unknown-command'], { encoding: 'utf8', stdio: 'pipe' }),
      /Unknown command/,
    );
  });

  it('supports check --json output schema', () => {
    const output = execFileSync(process.execPath, [CLI_PATH, 'check', '--json', '--skip', 'network'], {
      encoding: 'utf8',
      cwd: path.join(FIXTURES, 'compliant'),
    });
    const json = JSON.parse(output);
    assert.equal(typeof json.passed, 'number');
    assert.equal(typeof json.failed, 'number');
    assert.equal(typeof json.total, 'number');
    assert.ok(Array.isArray(json.results));
    assert.ok(json.results.every((result) => 'id' in result && 'severity' in result && 'details' in result));
  });

  it('supports --format json as an alias for --json', () => {
    const output = execFileSync(process.execPath, [CLI_PATH, 'check', '--format', 'json', '--skip', 'network'], {
      encoding: 'utf8',
      cwd: path.join(FIXTURES, 'compliant'),
    });
    assert.ok(Array.isArray(JSON.parse(output).results));
  });

  it('prints human-readable check failures', () => {
    assert.throws(
      () =>
        execFileSync(process.execPath, [CLI_PATH, 'check', '--no-color', '--skip', 'network'], {
          encoding: 'utf8',
          cwd: path.join(FIXTURES, 'missing-license'),
          stdio: 'pipe',
        }),
      (err) => {
        assert.ok(err && typeof err === 'object' && 'stdout' in err);
        assert.match(String(err.stdout), /FAIL file\.license/);
        return true;
      },
    );
  });

  it('supports --quiet by printing failures only', () => {
    assert.throws(
      () =>
        execFileSync(process.execPath, [CLI_PATH, 'check', '--no-color', '--quiet', '--skip', 'network'], {
          encoding: 'utf8',
          cwd: path.join(FIXTURES, 'missing-license'),
          stdio: 'pipe',
        }),
      (err) => {
        assert.ok(err && typeof err === 'object' && 'stdout' in err);
        const stdout = String(err.stdout);
        assert.match(stdout, /FAIL file\.license/);
        assert.doesNotMatch(stdout, /PASS file\.package_json/);
        return true;
      },
    );
  });
});
