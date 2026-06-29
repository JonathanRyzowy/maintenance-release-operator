import fs from 'node:fs/promises';
import path from 'node:path';
import { MroError } from './errors.js';
import { fileExists, readTextIfExists } from './fs.js';

const SPDX_LICENSES = new Set([
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'MPL-2.0',
  'GPL-2.0-only',
  'GPL-3.0-only',
  'LGPL-2.1-only',
  'LGPL-3.0-only',
  'AGPL-3.0-only',
  'Unlicense',
  'CC0-1.0',
]);

export const LOCKFILES = {
  npm: 'package-lock.json',
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
  bun: 'bun.lockb',
};

/**
 * @param {string} [cwd]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function readPackageJson(cwd = process.cwd()) {
  const pkgPath = path.resolve(cwd, 'package.json');
  let content;

  try {
    content = await fs.readFile(pkgPath, 'utf8');
  } catch (err) {
    throw new MroError('PACKAGE_JSON_MISSING', 'package.json is missing', {
      path: pkgPath,
      cause: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new MroError('PACKAGE_JSON_PARSE_ERROR', 'package.json is malformed JSON', {
      path: pkgPath,
      cause: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * @param {Record<string, unknown>} pkg
 * @param {string} [cwd]
 * @returns {Promise<void>}
 */
export async function writePackageJson(pkg, cwd = process.cwd()) {
  const pkgPath = path.resolve(cwd, 'package.json');
  await fs.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

/**
 * @param {string} version
 * @param {string} [cwd]
 * @returns {Promise<boolean>}
 */
export async function syncPackageLockVersion(version, cwd = process.cwd()) {
  const lockPath = path.resolve(cwd, 'package-lock.json');
  if (!(await fileExists('package-lock.json', cwd))) return false;

  const lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
  lock.version = version;
  if (lock.packages?.['']) {
    lock.packages[''].version = version;
  }

  await fs.writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  return true;
}

/**
 * @param {string | undefined} license
 * @returns {boolean}
 */
export function isValidSpdxLicense(license) {
  if (!license) return false;
  if (SPDX_LICENSES.has(license)) return true;
  if (/^\([A-Za-z0-9-.+]+ (AND|OR) [A-Za-z0-9-.+]+\)$/.test(license)) return true;
  return false;
}

/**
 * @param {string} license
 * @param {string} licenseText
 * @returns {boolean}
 */
export function licenseTextMatchesPackage(license, licenseText) {
  const text = licenseText.toLowerCase();
  const expected = license.toLowerCase();

  if (expected === 'mit') return text.includes('mit license') || text.includes('permission is hereby granted');
  if (expected === 'isc') return text.includes('isc license') || text.includes('permission to use, copy, modify');
  if (expected.startsWith('apache-2.0')) return text.includes('apache license') && text.includes('version 2.0');
  if (expected.startsWith('bsd-2') || expected.startsWith('bsd-3'))
    return text.includes('redistribution and use in source and binary forms');
  if (expected.includes('gpl')) return text.includes('gnu general public license');
  if (expected === 'unlicense') return text.includes('the unlicense');
  if (expected === 'cc0-1.0') return text.includes('creative commons');

  return text.includes(expected);
}

/**
 * @param {string} [cwd]
 * @returns {Promise<string | null>}
 */
export async function readLicenseFile(cwd = process.cwd()) {
  return (
    (await readTextIfExists('LICENSE', cwd)) ||
    (await readTextIfExists('LICENSE.md', cwd)) ||
    (await readTextIfExists('LICENSE.txt', cwd))
  );
}

/**
 * @param {Record<string, unknown>} pkg
 * @returns {string | null}
 */
export function packageManagerFromField(pkg) {
  if (typeof pkg.packageManager !== 'string') return null;
  return pkg.packageManager.split('@')[0] || null;
}

/**
 * @param {string} [cwd]
 * @returns {Promise<string[]>}
 */
export async function findLockfiles(cwd = process.cwd()) {
  const found = [];
  for (const lockfile of Object.values(LOCKFILES)) {
    if (await fileExists(lockfile, cwd)) found.push(lockfile);
  }
  return found;
}

/**
 * @param {string[]} lockfiles
 * @returns {string[]}
 */
export function packageManagersFromLockfiles(lockfiles) {
  return lockfiles
    .map((lockfile) => Object.entries(LOCKFILES).find(([, file]) => file === lockfile)?.[0])
    .filter(Boolean);
}

/**
 * @param {Record<string, unknown>} pkg
 * @param {string} filepath
 * @returns {boolean}
 */
export function packageFilesIncludePath(pkg, filepath) {
  const files = Array.isArray(pkg.files) ? pkg.files : [];
  if (files.length === 0) return true;

  return files.some((entry) => {
    if (typeof entry !== 'string') return false;
    const normalized = entry.replace(/\/+$/, '');
    return (
      normalized === filepath ||
      filepath.startsWith(`${normalized}/`) ||
      (normalized.endsWith('/**/*') && filepath.startsWith(normalized.slice(0, -5)))
    );
  });
}

/**
 * @param {Record<string, unknown>} pkg
 * @returns {string[]}
 */
export function getBinPaths(pkg) {
  const bin = pkg.bin;
  if (typeof bin === 'string') return [bin];
  if (!bin || typeof bin !== 'object') return [];
  return Object.values(bin).filter((value) => typeof value === 'string');
}
