import { loadConfig } from '../lib/config.js';
import { serializeError } from '../lib/errors.js';
import { fileChecks } from '../checks/files.js';
import { packageChecks } from '../checks/package.js';
import { dependencyChecks } from '../checks/dependencies.js';
import { securityChecks } from '../checks/security.js';
import { pass } from '../checks/types.js';

export const CHECKS = [...fileChecks, ...packageChecks, ...dependencyChecks, ...securityChecks];

/**
 * @param {string[]} args
 */
export function parseCheckArgs(args = []) {
  const options = {
    format: 'human',
    color: true,
    quiet: false,
    verbose: false,
    failLevel: 'high',
    failLevelExplicit: false,
    skip: new Set(),
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') {
      options.format = 'json';
    } else if (arg === '--format') {
      options.format = args[++i] || 'human';
    } else if (arg.startsWith('--format=')) {
      options.format = arg.slice('--format='.length);
    } else if (arg === '--no-color') {
      options.color = false;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--fail-level') {
      options.failLevel = args[++i] || 'high';
      options.failLevelExplicit = true;
    } else if (arg.startsWith('--fail-level=')) {
      options.failLevel = arg.slice('--fail-level='.length);
      options.failLevelExplicit = true;
    } else if (arg === '--skip') {
      addSkips(options.skip, args[++i] || '');
    } else if (arg.startsWith('--skip=')) {
      addSkips(options.skip, arg.slice('--skip='.length));
    }
  }

  if (!['human', 'json'].includes(options.format)) options.format = 'human';
  if (!['high', 'critical', 'all'].includes(options.failLevel)) options.failLevel = 'high';
  return options;
}

/**
 * @param {string[]} args
 * @param {{ cwd?: string, checks?: typeof CHECKS }} [runtime]
 */
export async function check(args = [], runtime = {}) {
  const options = parseCheckArgs(args);
  const cwd = runtime.cwd || process.cwd();
  const payload = await runChecks({ cwd, options, checks: runtime.checks || CHECKS });

  emitPayload(payload, options);
  return payload.failed > 0 ? 1 : 0;
}

/**
 * @param {{ cwd?: string, options?: ReturnType<typeof parseCheckArgs>, checks?: typeof CHECKS }} runtime
 */
export async function runChecks(runtime = {}) {
  const options = runtime.options || parseCheckArgs([]);
  const cwd = runtime.cwd || process.cwd();
  let config;

  try {
    config = await loadConfig(cwd);
  } catch (err) {
    const result = {
      id: 'config.parse',
      name: '.mrorc.json parses',
      passed: false,
      severity: 'critical',
      fix: 'Fix .mrorc.json or remove it',
      details: { error: serializeError(err) },
    };
    return { passed: 0, failed: 1, total: 1, results: [result] };
  }

  for (const skip of config.skip) options.skip.add(skip);
  if (config.failLevel && !options.failLevelExplicit) {
    options.failLevel = config.failLevel;
  }

  const exceptions = new Set(config.exceptions || []);
  const checks = runtime.checks || CHECKS;
  const context = { cwd, options };
  const results = [];

  for (const checkDefinition of checks) {
    let result;
    if (exceptions.has(checkDefinition.id)) {
      result = pass(checkDefinition, { policyException: true });
    } else {
      result = await checkDefinition.run(context);
    }
    results.push(result);
  }

  const failed = results.filter((result) => !result.passed).length;
  const passed = results.length - failed;
  return { passed, failed, total: results.length, results };
}

/**
 * @param {Set<string>} skip
 * @param {string} raw
 */
function addSkips(skip, raw) {
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => skip.add(item));
}

/**
 * @param {import('../checks/types.js').CheckResult} result
 * @param {ReturnType<typeof parseCheckArgs>} options
 */
function printHumanResult(result, options) {
  if (options.quiet && result.passed) return;

  const icon = result.passed ? paint(options, 'green', 'PASS') : paint(options, 'red', 'FAIL');
  console.log(`  ${icon} ${result.id} - ${result.name}`);

  if (!result.passed && result.fix) console.log(`       fix: ${result.fix}`);
  if (options.verbose && Object.keys(result.details || {}).length > 0) {
    console.log(`       details: ${JSON.stringify(result.details)}`);
  }
}

/**
 * @param {{ passed: number, failed: number, total: number }} payload
 * @param {ReturnType<typeof parseCheckArgs>} options
 */
function printHumanSummary(payload, options) {
  console.log('\n---------------------------------');
  console.log(`  Passed: ${payload.passed}/${payload.total}`);
  if (payload.failed > 0) {
    console.log(`  ${paint(options, 'yellow', `${payload.failed} issue(s) found`)}`);
  } else {
    console.log(`  ${paint(options, 'green', 'All checks passed')}`);
  }
  console.log('---------------------------------\n');
}

/**
 * @param {{ passed: number, failed: number, total: number, results: import('../checks/types.js').CheckResult[] }} payload
 * @param {ReturnType<typeof parseCheckArgs>} options
 */
function emitPayload(payload, options) {
  if (options.format === 'json') {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    if (!options.quiet) console.log(`${paint(options, 'cyan', 'Running maintenance checks...')}\n`);
    for (const result of payload.results) printHumanResult(result, options);
    printHumanSummary(payload, options);
  }
}

/**
 * @param {ReturnType<typeof parseCheckArgs>} options
 * @param {'red' | 'green' | 'yellow' | 'cyan'} color
 * @param {string} text
 */
function paint(options, color, text) {
  if (!options.color) return text;
  const codes = {
    red: 31,
    green: 32,
    yellow: 33,
    cyan: 36,
  };
  return `\u001b[${codes[color]}m${text}\u001b[0m`;
}
