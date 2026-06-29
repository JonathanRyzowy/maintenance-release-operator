import { execFileSync } from 'node:child_process';
import { fileExists } from '../lib/fs.js';
import { fail, pass, skipped } from './types.js';

const FAIL_LEVELS = new Set(['high', 'critical', 'all']);

export const securityChecks = [
  {
    id: 'npm.audit',
    name: 'No npm audit vulnerabilities at fail level',
    severity: 'high',
    fix: 'Run: npm audit and remediate vulnerabilities above your fail level',
    run: async (context) => {
      if (context.options.skip.has('network')) return skipped(thisCheck('npm.audit'), 'network checks skipped');
      if (!(await fileExists('package.json', context.cwd)))
        return skipped(thisCheck('npm.audit'), 'package.json missing');
      if (!(await fileExists('package-lock.json', context.cwd)) && !(await fileExists('node_modules', context.cwd))) {
        return skipped(thisCheck('npm.audit'), 'package-lock.json or node_modules missing');
      }

      const failLevel = FAIL_LEVELS.has(context.options.failLevel) ? context.options.failLevel : 'high';

      try {
        execFileSync('npm', ['audit', '--json'], {
          cwd: context.cwd,
          encoding: 'utf8',
          timeout: 15000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        return pass(thisCheck('npm.audit'), { failLevel });
      } catch (err) {
        const details = commandErrorDetails(err);
        if (details.timedOut)
          return fail(thisCheck('npm.audit'), 'npm audit timed out; retry locally or use --skip network', details);

        const audit = parseJson(details.stdout, {});
        const vulnerabilities = audit.metadata?.vulnerabilities || {};
        const failing = countFailingVulnerabilities(vulnerabilities, failLevel);
        return failing === 0
          ? pass(thisCheck('npm.audit'), { failLevel, vulnerabilities })
          : fail(thisCheck('npm.audit'), null, { failLevel, vulnerabilities, failing });
      }
    },
  },
];

/**
 * @param {Record<string, number>} vulnerabilities
 * @param {'high' | 'critical' | 'all'} failLevel
 */
export function countFailingVulnerabilities(vulnerabilities, failLevel) {
  if (failLevel === 'critical') return vulnerabilities.critical || 0;
  if (failLevel === 'all') {
    return ['info', 'low', 'moderate', 'medium', 'high', 'critical'].reduce(
      (sum, key) => sum + (vulnerabilities[key] || 0),
      0,
    );
  }
  return (vulnerabilities.high || 0) + (vulnerabilities.critical || 0);
}

/**
 * @param {string} id
 */
function thisCheck(id) {
  const check = securityChecks.find((candidate) => candidate.id === id);
  if (!check) throw new Error(`Unknown security check: ${id}`);
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
