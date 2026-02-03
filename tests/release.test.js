import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateNextVersion } from '../src/commands/release.js';

describe('calculateNextVersion', () => {
  it('should bump patch version', () => {
    assert.strictEqual(calculateNextVersion('1.2.3', 'patch'), '1.2.4');
    assert.strictEqual(calculateNextVersion('0.1.0', 'patch'), '0.1.1');
    assert.strictEqual(calculateNextVersion('10.20.30', 'patch'), '10.20.31');
  });

  it('should bump minor version and reset patch', () => {
    assert.strictEqual(calculateNextVersion('1.2.3', 'minor'), '1.3.0');
    assert.strictEqual(calculateNextVersion('0.1.5', 'minor'), '0.2.0');
    assert.strictEqual(calculateNextVersion('10.20.30', 'minor'), '10.21.0');
  });

  it('should bump major version and reset minor and patch', () => {
    assert.strictEqual(calculateNextVersion('1.2.3', 'major'), '2.0.0');
    assert.strictEqual(calculateNextVersion('0.1.5', 'major'), '1.0.0');
    assert.strictEqual(calculateNextVersion('10.20.30', 'major'), '11.0.0');
  });

  it('should default to patch if type not provided', () => {
    assert.strictEqual(calculateNextVersion('1.2.3'), '1.2.4');
  });

  it('should throw on invalid version format', () => {
    assert.throws(() => calculateNextVersion('1.2'), /Invalid version format/);
    assert.throws(() => calculateNextVersion('invalid'), /Invalid version format/);
    assert.throws(() => calculateNextVersion('1.2.x'), /Invalid version format/);
  });

  it('should throw on invalid type', () => {
    assert.throws(() => calculateNextVersion('1.2.3', 'invalid'), /Invalid version type/);
  });
});
