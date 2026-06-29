import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { calculateNextVersion } from '../src/commands/release.js';
import {
  buildChangelogEntry,
  inferReleaseType,
  insertChangelogEntry,
  sanitizeCommitMessage,
} from '../src/lib/changelog.js';
import { isWorkingTreeClean, tagExists } from '../src/lib/git.js';

describe('calculateNextVersion', () => {
  it('bumps patch version', () => {
    assert.equal(calculateNextVersion('1.2.3', 'patch'), '1.2.4');
    assert.equal(calculateNextVersion('0.1.0', 'patch'), '0.1.1');
  });

  it('bumps minor version and resets patch', () => {
    assert.equal(calculateNextVersion('1.2.3', 'minor'), '1.3.0');
  });

  it('bumps major version and resets minor and patch', () => {
    assert.equal(calculateNextVersion('1.2.3', 'major'), '2.0.0');
  });

  it('supports prerelease versions', () => {
    assert.equal(calculateNextVersion('1.2.3', 'prerelease'), '1.2.4-beta.1');
    assert.equal(calculateNextVersion('1.2.3-beta.1', 'prerelease'), '1.2.3-beta.2');
  });

  it('throws on invalid version format', () => {
    assert.throws(() => calculateNextVersion('1.2'), /Invalid version format/);
    assert.throws(() => calculateNextVersion('invalid'), /Invalid version format/);
  });

  it('throws on invalid type', () => {
    assert.throws(() => calculateNextVersion('1.2.3', /** @type {any} */ ('invalid')), /Invalid version type/);
  });
});

describe('release helpers', () => {
  it('sanitizes commit messages before changelog insertion', () => {
    assert.equal(sanitizeCommitMessage('fix: bad\n<script>'), 'fix: bad script');
  });

  it('groups changelog entries by Conventional Commit type', () => {
    const entry = buildChangelogEntry('1.2.3', ['feat: add command', 'fix: patch bug']);
    assert.match(entry, /### Features/);
    assert.match(entry, /### Fixes/);
  });

  it('infers release type from commits', () => {
    assert.equal(inferReleaseType(['fix: patch bug']), 'patch');
    assert.equal(inferReleaseType(['feat: new command']), 'minor');
    assert.equal(inferReleaseType(['feat!: breaking command']), 'major');
  });

  it('fails when CHANGELOG.md is missing', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mro-no-changelog-'));
    await assert.rejects(() => insertChangelogEntry('1.0.1', ['fix: test'], dir), /CHANGELOG\.md is required/);
  });

  it('detects release dirty-tree state', async () => {
    const dir = await makeGitRepo();
    assert.equal(isWorkingTreeClean(dir), true);
    await fs.writeFile(path.join(dir, 'dirty.txt'), 'dirty');
    assert.equal(isWorkingTreeClean(dir), false);
  });

  it('detects existing tag conflicts', async () => {
    const dir = await makeGitRepo();
    execFileSync('git', ['tag', 'v1.0.0'], { cwd: dir });
    assert.equal(tagExists('v1.0.0', dir), true);
  });
});

async function makeGitRepo() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mro-git-'));
  execFileSync('git', ['init'], { cwd: dir, stdio: 'pipe' });
  await fs.writeFile(path.join(dir, 'README.md'), '# Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: dir });
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'chore: initial'], {
    cwd: dir,
    stdio: 'pipe',
  });
  return dir;
}
