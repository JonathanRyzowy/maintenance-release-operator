import { execFileSync } from 'node:child_process';
import { fileExists } from '../lib/fs.js';
import { fail, pass, skipped } from './types.js';

export const dependencyChecks = [
  {
    id: 'npm.outdated',
    name: 'No outdated dependencies',
    severity: 'medium',
    fix: 'Run: npm outdated, then update intentionally',
    run: async (context) => {
      if (context.options.skip.has('network')) return skipped(thisCheck('npm.outdated'), 'network checks skipped');
      if (!(await fileExists('package.json', context.cwd)))
        return skipped(thisCheck('npm.outdated'), 'package.json missing');

      try {
        execFileSync('npm', ['outdated', '--json'], {
          cwd: context.cwd,
          encoding: 'utf8',
          timeout: 15000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        return pass(thisCheck('npm.outdated'));
      } catch (err) {
        const details = commandErrorDetails(err);
        if (details.timedOut)
          return fail(
            thisCheck('npm.outdated'),
            'npm outdated timed out; retry locally or use --skip network',
            details,
          );

        const outdated = parseJson(details.stdout, {});
        return Object.keys(outdated).length === 0
          ? pass(thisCheck('npm.outdated'))
          : fail(thisCheck('npm.outdated'), null, { outdated: Object.keys(outdated) });
      }
    },
  },
];

/**
 * @param {string} id
 */
function thisCheck(id) {
  const check = dependencyChecks.find((candidate) => candidate.id === id);
  if (!check) throw new Error(`Unknown dependency check: ${id}`);
  return check;
}

/**
 * @param {unknown} err
 */
function commandErrorDetails(err) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    message,
    timedOut:
      message.includes('ETIMEDOUT') ||
      message.includes('timed out') ||
      (err !== null && typeof err === 'object' && 'signal' in err && err.signal === 'SIGTERM'),
    status: err && typeof err === 'object' && 'status' in err ? err.status : null,
    signal: err && typeof err === 'object' && 'signal' in err ? err.signal : null,
    stdout: err && typeof err === 'object' && 'stdout' in err && err.stdout ? String(err.stdout) : '',
    stderr: err && typeof err === 'object' && 'stderr' in err && err.stderr ? String(err.stderr).slice(0, 1000) : '',
  };
}

/**
 * @param {string} value
 * @param {unknown} fallback
 */
function parseJson(value, fallback) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return fallback;
  }
}
