import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileExists } from '../lib/fs.js';
import {
  findLockfiles,
  getBinPaths,
  isValidSpdxLicense,
  licenseTextMatchesPackage,
  packageFilesIncludePath,
  packageManagerFromField,
  packageManagersFromLockfiles,
  readLicenseFile,
  readPackageJson,
} from '../lib/package-json.js';
import { MroError, serializeError } from '../lib/errors.js';
import { fail, pass, skipped } from './types.js';

export const packageChecks = [
  {
    id: 'package.json_parse',
    name: 'package.json parses',
    severity: 'critical',
    fix: 'Fix package.json syntax so it is valid JSON',
    run: async (context) => {
      try {
        await readPackageJson(context.cwd);
        return pass(thisCheck('package.json_parse'));
      } catch (err) {
        return fail(thisCheck('package.json_parse'), null, { error: serializeError(err) });
      }
    },
  },
  requiredStringCheck('package.name', 'Package name is defined', 'name', 'Add a "name" field to package.json'),
  requiredStringCheck(
    'package.version',
    'Package version is defined',
    'version',
    'Add a "version" field to package.json',
  ),
  requiredStringCheck(
    'package.description',
    'Package description is defined',
    'description',
    'Add a "description" field to package.json',
  ),
  {
    id: 'package.repository',
    name: 'Repository metadata is defined',
    severity: 'medium',
    fix: 'Add repository metadata to package.json',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('package.repository'));
      if ('passed' in pkg) return pkg;
      const repository = pkg.repository;
      const ok =
        typeof repository === 'string' ||
        (isRecord(repository) && typeof repository.url === 'string' && repository.url.length > 0);
      return ok ? pass(thisCheck('package.repository')) : fail(thisCheck('package.repository'));
    },
  },
  {
    id: 'package.bugs_url',
    name: 'bugs.url is defined',
    severity: 'medium',
    fix: 'Add "bugs": { "url": "https://github.com/OWNER/REPO/issues" }',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('package.bugs_url'));
      if ('passed' in pkg) return pkg;
      return isRecord(pkg.bugs) && typeof pkg.bugs.url === 'string'
        ? pass(thisCheck('package.bugs_url'))
        : fail(thisCheck('package.bugs_url'));
    },
  },
  requiredStringCheck(
    'package.homepage',
    'Package homepage is defined',
    'homepage',
    'Add a "homepage" field to package.json',
  ),
  requiredStringCheck('package.author', 'Package author is defined', 'author', 'Add an "author" field to package.json'),
  {
    id: 'package.license_spdx',
    name: 'Package license is valid SPDX',
    severity: 'high',
    fix: 'Use a valid SPDX license identifier such as MIT or Apache-2.0',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('package.license_spdx'));
      if ('passed' in pkg) return pkg;
      return isValidSpdxLicense(typeof pkg.license === 'string' ? pkg.license : undefined)
        ? pass(thisCheck('package.license_spdx'), { license: pkg.license })
        : fail(thisCheck('package.license_spdx'), null, { license: pkg.license || null });
    },
  },
  {
    id: 'package.license_matches_file',
    name: 'package.json license matches LICENSE file',
    severity: 'high',
    fix: 'Make package.json license agree with the LICENSE file',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('package.license_matches_file'));
      if ('passed' in pkg) return pkg;
      const license = typeof pkg.license === 'string' ? pkg.license : '';
      const licenseText = await readLicenseFile(context.cwd);
      if (!licenseText) return fail(thisCheck('package.license_matches_file'), 'Add a LICENSE file');
      return licenseTextMatchesPackage(license, licenseText)
        ? pass(thisCheck('package.license_matches_file'), { license })
        : fail(thisCheck('package.license_matches_file'), null, { license });
    },
  },
  {
    id: 'package.script_test',
    name: 'Test script is defined',
    severity: 'high',
    fix: 'Add a real "test" script to package.json',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('package.script_test'));
      if ('passed' in pkg) return pkg;
      const testScript = isRecord(pkg.scripts) ? pkg.scripts.test : undefined;
      return typeof testScript === 'string' && !testScript.includes('no test specified')
        ? pass(thisCheck('package.script_test'))
        : fail(thisCheck('package.script_test'));
    },
  },
  {
    id: 'package.node_engines',
    name: 'Node engines are specified',
    severity: 'medium',
    fix: 'Add "engines": { "node": ">=18.0.0" } to package.json',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('package.node_engines'));
      if ('passed' in pkg) return pkg;
      return isRecord(pkg.engines) && typeof pkg.engines.node === 'string'
        ? pass(thisCheck('package.node_engines'))
        : fail(thisCheck('package.node_engines'));
    },
  },
  {
    id: 'package.manager',
    name: 'Package manager is declared',
    severity: 'medium',
    fix: 'Add a packageManager field such as "npm@10.9.2"',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('package.manager'));
      if ('passed' in pkg) return pkg;
      const manager = packageManagerFromField(pkg);
      return manager ? pass(thisCheck('package.manager'), { manager }) : fail(thisCheck('package.manager'));
    },
  },
  {
    id: 'package.lockfile_conflict',
    name: 'One canonical lockfile is used',
    severity: 'high',
    fix: 'Keep only the lockfile for the declared package manager',
    run: async (context) => {
      const lockfiles = await findLockfiles(context.cwd);
      const pkg = await readPackageJsonSafe(context.cwd);
      const declaredManager = pkg ? packageManagerFromField(pkg) : null;
      const managers = packageManagersFromLockfiles(lockfiles);
      const conflict = lockfiles.length > 1;
      const declaredLockfileMatches =
        !declaredManager || lockfiles.length === 0 || managers.length === 0 || managers.includes(declaredManager);

      return !conflict && declaredLockfileMatches
        ? pass(thisCheck('package.lockfile_conflict'), { lockfiles, declaredManager })
        : fail(thisCheck('package.lockfile_conflict'), null, { lockfiles, managers, declaredManager });
    },
  },
  {
    id: 'publish.files_or_npmignore',
    name: 'Publish allowlist or .npmignore exists',
    severity: 'medium',
    fix: 'Add package.json files or .npmignore to control published package contents',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('publish.files_or_npmignore'));
      if ('passed' in pkg) return pkg;
      return Array.isArray(pkg.files) || (await fileExists('.npmignore', context.cwd))
        ? pass(thisCheck('publish.files_or_npmignore'))
        : fail(thisCheck('publish.files_or_npmignore'));
    },
  },
  publishIncludesCheck('publish.readme', 'Package includes README.md', 'README.md', 'Add README.md to package files'),
  publishIncludesCheck('publish.license', 'Package includes LICENSE', 'LICENSE', 'Add LICENSE to package files'),
  {
    id: 'publish.bin_files',
    name: 'Package includes CLI entrypoint files',
    severity: 'critical',
    fix: 'Ensure package files includes all bin entrypoint paths',
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck('publish.bin_files'));
      if ('passed' in pkg) return pkg;
      const binPaths = getBinPaths(pkg);
      const missing = binPaths.filter((binPath) => !packageFilesIncludePath(pkg, normalizeBinPath(binPath)));
      return missing.length === 0
        ? pass(thisCheck('publish.bin_files'), { binPaths })
        : fail(thisCheck('publish.bin_files'), null, { missing });
    },
  },
  {
    id: 'publish.npm_pack_dry_run',
    name: 'npm pack dry-run succeeds',
    severity: 'high',
    fix: 'Run npm pack --dry-run and fix package publication errors',
    run: async (context) => {
      if (context.options.skip.has('network'))
        return skipped(thisCheck('publish.npm_pack_dry_run'), 'network checks skipped');
      try {
        const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
          cwd: context.cwd,
          encoding: 'utf8',
          timeout: 15000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        const parsed = JSON.parse(output || '[]');
        return pass(thisCheck('publish.npm_pack_dry_run'), { files: parsed[0]?.files?.length || 0 });
      } catch (err) {
        return fail(thisCheck('publish.npm_pack_dry_run'), null, { error: commandErrorDetails(err) });
      }
    },
  },
  {
    id: 'file.executable_src_index',
    name: 'src/index.js is executable',
    severity: 'medium',
    fix: 'Run: chmod +x src/index.js',
    run: async (context) => {
      try {
        const stat = await fs.stat(path.resolve(context.cwd, 'src/index.js'));
        return stat.mode & 0o111
          ? pass(thisCheck('file.executable_src_index'), { mode: stat.mode.toString(8) })
          : fail(thisCheck('file.executable_src_index'), null, { mode: stat.mode.toString(8) });
      } catch (err) {
        return fail(thisCheck('file.executable_src_index'), 'Create src/index.js and make it executable', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  },
  binPathCheck('bin.mro_path', 'bin.mro path exists', 'mro'),
  binPathCheck(
    'bin.maintenance_release_operator_path',
    'bin.maintenance-release-operator path exists',
    'maintenance-release-operator',
  ),
  cliSmokeCheck('cli.help', 'CLI help smoke test passes', ['--help']),
  cliSmokeCheck('cli.unknown_command', 'CLI unknown command fails cleanly', ['__mro_unknown__'], true),
  cliSmokeCheck('cli.check_json', 'CLI check --json smoke test passes', ['check', '--json', '--skip', 'network']),
];

/**
 * @param {string} id
 * @param {string} name
 * @param {string} field
 * @param {string} fix
 */
function requiredStringCheck(id, name, field, fix) {
  return {
    id,
    name,
    severity: 'medium',
    fix,
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck(id));
      if ('passed' in pkg) return pkg;
      return typeof pkg[field] === 'string' && pkg[field].length > 0
        ? pass(thisCheck(id), { value: pkg[field] })
        : fail(thisCheck(id));
    },
  };
}

/**
 * @param {string} id
 * @param {string} name
 * @param {string} filepath
 * @param {string} fix
 */
function publishIncludesCheck(id, name, filepath, fix) {
  return {
    id,
    name,
    severity: 'high',
    fix,
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck(id));
      if ('passed' in pkg) return pkg;
      return packageFilesIncludePath(pkg, filepath) ? pass(thisCheck(id)) : fail(thisCheck(id));
    },
  };
}

/**
 * @param {string} id
 * @param {string} name
 * @param {string} binName
 */
function binPathCheck(id, name, binName) {
  return {
    id,
    name,
    severity: 'critical',
    fix: `Add bin.${binName} with a path that exists`,
    run: async (context) => {
      const pkg = await packageOrFail(context, thisCheck(id));
      if ('passed' in pkg) return pkg;
      const bin = pkg.bin && typeof pkg.bin === 'object' ? pkg.bin[binName] : undefined;
      return typeof bin === 'string' && (await fileExists(normalizeBinPath(bin), context.cwd))
        ? pass(thisCheck(id), { path: bin })
        : fail(thisCheck(id), null, { path: bin || null });
    },
  };
}

/**
 * @param {string} id
 * @param {string} name
 * @param {string[]} args
 * @param {boolean} expectFailure
 */
function cliSmokeCheck(id, name, args, expectFailure = false) {
  return {
    id,
    name,
    severity: 'high',
    fix: 'Fix the CLI entrypoint so smoke commands behave correctly',
    run: async (context) => {
      if (process.env.MRO_SKIP_CLI_SMOKE === '1')
        return skipped(thisCheck(id), 'CLI smoke checks disabled for nested check run');
      const pkg = await packageOrFail(context, thisCheck(id));
      if ('passed' in pkg) return pkg;
      const binPath = getBinPaths(pkg)[0];
      if (!binPath) return fail(thisCheck(id), 'Add a bin entrypoint to package.json');

      try {
        execFileSync(process.execPath, [path.resolve(context.cwd, normalizeBinPath(binPath)), ...args], {
          cwd: context.cwd,
          encoding: 'utf8',
          timeout: 15000,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: id === 'cli.check_json' ? { ...process.env, MRO_SKIP_CLI_SMOKE: '1' } : process.env,
        });
        return expectFailure ? fail(thisCheck(id), null, { expectedFailure: true }) : pass(thisCheck(id));
      } catch (err) {
        if (expectFailure && err && typeof err === 'object' && 'status' in err && err.status === 1) {
          return pass(thisCheck(id), { expectedFailure: true });
        }
        return fail(thisCheck(id), null, { error: commandErrorDetails(err) });
      }
    },
  };
}

/**
 * @param {{ cwd: string }} context
 * @param {{ id: string, name: string, severity?: import('./types.js').CheckSeverity, fix?: string }} check
 * @returns {Promise<Record<string, unknown> | import('./types.js').CheckResult>}
 */
async function packageOrFail(context, check) {
  try {
    return await readPackageJson(context.cwd);
  } catch (err) {
    const error = serializeError(err);
    if (err instanceof MroError && err.code === 'PACKAGE_JSON_MISSING') {
      return fail(check, 'Add package.json before running package checks', { error });
    }
    return fail(check, 'Fix package.json syntax before running package checks', { error });
  }
}

/**
 * @param {string} cwd
 */
async function readPackageJsonSafe(cwd) {
  try {
    return await readPackageJson(cwd);
  } catch {
    return null;
  }
}

/**
 * @param {string} filepath
 */
function normalizeBinPath(filepath) {
  return filepath.replace(/^\.\//, '');
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {unknown} err
 */
function commandErrorDetails(err) {
  if (!err || typeof err !== 'object') return { message: String(err) };
  return {
    message: err instanceof Error ? err.message : String(err),
    status: 'status' in err ? err.status : null,
    signal: 'signal' in err ? err.signal : null,
    stdout: 'stdout' in err && err.stdout ? String(err.stdout).slice(0, 1000) : '',
    stderr: 'stderr' in err && err.stderr ? String(err.stderr).slice(0, 1000) : '',
  };
}

/**
 * @param {string} id
 */
function thisCheck(id) {
  const check = packageChecks.find((candidate) => candidate.id === id);
  if (!check) throw new Error(`Unknown package check: ${id}`);
  return check;
}
