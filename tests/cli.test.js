import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';

const CLI_PATH = path.resolve(process.cwd(), 'src/index.js');

describe('CLI', () => {
  it('should show help with --help flag', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf-8' });
    assert.ok(output.includes('maintenance-release-operator'), 'Should show tool name');
    assert.ok(output.includes('check'), 'Should list check command');
  });

  it('should run check command and produce output', () => {
    // check may exit 1 if some checks fail, that's ok
    try {
      const output = execSync(`node ${CLI_PATH} check`, { encoding: 'utf-8' });
      assert.ok(output.includes('Running maintenance checks'), 'Should show check header');
    } catch (err) {
      // Command exited with error but we can still check stderr/stdout
      const output = err.stdout?.toString() || '';
      assert.ok(output.includes('Running maintenance checks'), 'Should show check header even on failure');
    }
  });

  it('should support --json output', () => {
    try {
      const output = execSync(`node ${CLI_PATH} check --json`, { encoding: 'utf-8' });
      const json = JSON.parse(output);
      assert.ok(typeof json.passed === 'number', 'Should have passed count');
      assert.ok(typeof json.failed === 'number', 'Should have failed count');
      assert.ok(Array.isArray(json.results), 'Should have results array');
    } catch (err) {
      // Even if exit code is 1, stdout should have valid JSON
      const output = err.stdout?.toString() || '';
      const json = JSON.parse(output);
      assert.ok(typeof json.passed === 'number', 'Should have passed count');
      assert.ok(typeof json.failed === 'number', 'Should have failed count');
    }
  });

  it('should exit with code 1 when checks fail in empty dir', () => {
    try {
      execSync(`node ${CLI_PATH} check`, { encoding: 'utf-8', cwd: '/tmp' });
      assert.fail('Should have exited with error in /tmp');
    } catch (err) {
      assert.strictEqual(err.status, 1, 'Should exit with code 1 on failures');
    }
  });
});
