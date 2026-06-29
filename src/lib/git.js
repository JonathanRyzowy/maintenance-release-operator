import { execFileSync } from 'node:child_process';
import { MroError } from './errors.js';

/**
 * @param {string[]} args
 * @param {{ cwd?: string, stdio?: 'pipe' | 'inherit' }} [options]
 * @returns {string}
 */
export function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: options.cwd || process.cwd(),
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
  }).trim();
}

/**
 * @param {string} [cwd]
 * @returns {boolean}
 */
export function isWorkingTreeClean(cwd = process.cwd()) {
  try {
    return git(['status', '--porcelain'], { cwd }).length === 0;
  } catch {
    return false;
  }
}

/**
 * @param {string} [cwd]
 * @returns {string}
 */
export function currentBranch(cwd = process.cwd()) {
  return git(['branch', '--show-current'], { cwd });
}

/**
 * @param {string} branch
 * @param {string} [cwd]
 * @returns {string}
 */
export function trackingBranch(branch, cwd = process.cwd()) {
  try {
    return git(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`], { cwd });
  } catch (err) {
    throw new MroError('GIT_NO_UPSTREAM', `Branch ${branch} has no upstream tracking branch`, {
      cause: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * @param {string} [cwd]
 * @returns {boolean}
 */
export function isBranchUpToDate(cwd = process.cwd()) {
  const branch = currentBranch(cwd);
  const upstream = trackingBranch(branch, cwd);
  const local = git(['rev-parse', branch], { cwd });
  const remote = git(['rev-parse', upstream], { cwd });
  return local === remote;
}

/**
 * @param {string} tag
 * @param {string} [cwd]
 * @returns {boolean}
 */
export function tagExists(tag, cwd = process.cwd()) {
  try {
    git(['rev-parse', '--verify', `refs/tags/${tag}`], { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} sinceRef
 * @param {string} [cwd]
 * @returns {string[]}
 */
export function getRecentCommits(sinceRef = 'HEAD~10..HEAD', cwd = process.cwd()) {
  try {
    const log = git(['log', sinceRef, '--pretty=format:%s', '--no-merges'], { cwd });
    return log.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}
