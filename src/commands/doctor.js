import { execFileSync } from 'node:child_process';
import { findLockfiles, packageManagerFromField, readPackageJson } from '../lib/package-json.js';
import { parseCheckArgs } from './check.js';

/**
 * @param {string[]} args
 */
export async function doctor(args = []) {
  const options = parseCheckArgs(args);
  /** @type {Array<{ id: string, name: string, passed: boolean, details: Record<string, unknown> }>} */
  const checks = [
    probe('node', () => process.version),
    probe('npm', () => execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim()),
    probe('git', () => execFileSync('git', ['--version'], { encoding: 'utf8' }).trim()),
  ];

  let packageManager = null;
  try {
    const pkg = await readPackageJson();
    packageManager = packageManagerFromField(pkg);
  } catch {
    packageManager = null;
  }

  checks.push({
    id: 'doctor.package_manager',
    name: 'Package manager detectable',
    passed: Boolean(packageManager || (await findLockfiles()).length > 0),
    details: { packageManager, lockfiles: await findLockfiles() },
  });

  const failed = checks.filter((check) => !check.passed).length;
  const payload = { passed: checks.length - failed, failed, total: checks.length, results: checks };

  if (options.format === 'json') {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const check of checks) {
      console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.id} - ${check.name}`);
    }
  }

  return failed > 0 ? 1 : 0;
}

/**
 * @param {string} id
 * @param {() => string} fn
 */
function probe(id, fn) {
  try {
    return {
      id: `doctor.${id}`,
      name: `${id} available`,
      passed: true,
      details: { version: fn() },
    };
  } catch (err) {
    return {
      id: `doctor.${id}`,
      name: `${id} available`,
      passed: false,
      details: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}
