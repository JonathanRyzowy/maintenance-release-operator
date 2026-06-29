import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildChangelogEntry, inferReleaseType, insertChangelogEntry } from '../lib/changelog.js';
import { MroError, serializeError } from '../lib/errors.js';
import {
  currentBranch,
  getRecentCommits,
  isBranchUpToDate,
  isWorkingTreeClean,
  tagExists,
  trackingBranch,
  git,
} from '../lib/git.js';
import { readPackageJson, syncPackageLockVersion, writePackageJson } from '../lib/package-json.js';
import { fileExists } from '../lib/fs.js';

const RELEASE_TYPES = new Set(['major', 'minor', 'patch', 'prerelease']);

/**
 * @param {string} currentVersion
 * @param {'major' | 'minor' | 'patch' | 'prerelease'} [type]
 * @param {{ preid?: string }} [options]
 * @returns {string}
 */
export function calculateNextVersion(currentVersion, type = 'patch', options = {}) {
  const parsed = parseSemver(currentVersion);
  if (!parsed) throw new Error(`Invalid version format: ${currentVersion}`);

  const preid = options.preid || 'beta';
  const { major, minor, patch, prerelease } = parsed;

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return prerelease ? `${major}.${minor}.${patch}` : `${major}.${minor}.${patch + 1}`;
    case 'prerelease': {
      const prereleaseMatch = prerelease?.match(new RegExp(`^${escapeRegex(preid)}\\.(\\d+)$`));
      if (prereleaseMatch) return `${major}.${minor}.${patch}-${preid}.${Number(prereleaseMatch[1]) + 1}`;
      return `${major}.${minor}.${patch + 1}-${preid}.1`;
    }
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

/**
 * @param {string[]} args
 */
export async function release(args = []) {
  const options = parseReleaseArgs(args);

  if (!RELEASE_TYPES.has(options.type) && options.type !== 'from-commits') {
    console.error(`Invalid version type: ${options.type}. Use major, minor, patch, prerelease, or from-commits.`);
    return 1;
  }

  try {
    const pkg = await readPackageJson();
    const oldVersion = String(pkg.version || '');
    const commits = getRecentCommits(`v${oldVersion}..HEAD`);
    const releaseType =
      options.type === 'from-commits'
        ? inferReleaseType(commits)
        : /** @type {'major' | 'minor' | 'patch' | 'prerelease'} */ (options.type);
    const newVersion = calculateNextVersion(oldVersion, releaseType, { preid: options.preid });
    const tagName = `${options.tagPrefix}${newVersion}`;

    if (options.dryRun) {
      printDryRun({ oldVersion, newVersion, releaseType, tagName, commits });
      return 0;
    }

    validateReleasePreconditions({ tagName, skipGitValidation: options.changelogOnly });

    if (!options.yes) {
      console.error('Refusing non-interactive release without --yes.');
      return 1;
    }

    const snapshot = await snapshotReleaseFiles();

    try {
      if (!options.changelogOnly) {
        pkg.version = newVersion;
        await writePackageJson(pkg);
        await syncPackageLockVersion(newVersion);
      }

      await insertChangelogEntry(newVersion, commits);

      if (!options.noCommit) {
        const files = ['CHANGELOG.md'];
        if (!options.changelogOnly) {
          files.push('package.json');
          if (await fileExists('package-lock.json')) files.push('package-lock.json');
        }
        git(['add', ...files]);
        git(['commit', '-m', `chore: release ${tagName}`]);
      }

      if (!options.noTag) {
        git(['tag', '-a', tagName, '-m', `Release ${tagName}`]);
      }
    } catch (err) {
      await restoreReleaseFiles(snapshot);
      throw new MroError(
        'RELEASE_GIT_OR_WRITE_FAILED',
        'Release failed after file updates; local files were rolled back',
        {
          cause: err instanceof Error ? err.message : String(err),
        },
      );
    }

    console.log(`Release ${tagName} complete.`);
    if (options.noCommit) console.log('Commit skipped because --no-commit was supplied.');
    if (options.noTag) console.log('Tag skipped because --no-tag was supplied.');
    return 0;
  } catch (err) {
    const error = serializeError(err);
    console.error(`${error.code}: ${error.message}`);
    return 1;
  }
}

/**
 * @param {string[]} args
 */
export function parseReleaseArgs(args) {
  const options = {
    type: 'patch',
    dryRun: false,
    noTag: false,
    noCommit: false,
    yes: false,
    changelogOnly: false,
    tagPrefix: 'v',
    preid: 'beta',
  };

  const first = args[0];
  let startIndex = 0;
  if (first && !first.startsWith('--')) {
    options.type = first;
    startIndex = 1;
  }

  for (let i = startIndex; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--no-tag') options.noTag = true;
    else if (arg === '--no-commit') options.noCommit = true;
    else if (arg === '--yes') options.yes = true;
    else if (arg === '--changelog-only') options.changelogOnly = true;
    else if (arg === '--tag-prefix') options.tagPrefix = args[++i] || '';
    else if (arg.startsWith('--tag-prefix=')) options.tagPrefix = arg.slice('--tag-prefix='.length);
    else if (arg === '--preid') options.preid = args[++i] || 'beta';
    else if (arg.startsWith('--preid=')) options.preid = arg.slice('--preid='.length);
  }

  return options;
}

/**
 * @param {{ tagName: string, skipGitValidation: boolean }} options
 */
function validateReleasePreconditions(options) {
  if (!isWorkingTreeClean()) {
    throw new MroError('RELEASE_DIRTY_TREE', 'Working tree is dirty. Commit or stash changes before releasing.');
  }

  if (tagExists(options.tagName)) {
    throw new MroError('RELEASE_TAG_EXISTS', `Tag already exists: ${options.tagName}`);
  }

  if (!options.skipGitValidation) {
    const branch = currentBranch();
    trackingBranch(branch);
    if (!isBranchUpToDate()) {
      throw new MroError('RELEASE_BRANCH_BEHIND', `Branch ${branch} is not up to date with its upstream.`);
    }
  }

  try {
    execFileSync('npm', ['run', 'ci'], { stdio: 'inherit' });
  } catch (err) {
    throw new MroError('RELEASE_CI_FAILED', 'npm run ci failed', {
      cause: err instanceof Error ? err.message : String(err),
    });
  }
}

async function snapshotReleaseFiles() {
  const files = ['package.json', 'package-lock.json', 'CHANGELOG.md'];
  const snapshot = new Map();
  for (const file of files) {
    try {
      snapshot.set(file, await fs.readFile(path.resolve(process.cwd(), file), 'utf8'));
    } catch {
      snapshot.set(file, null);
    }
  }
  return snapshot;
}

/**
 * @param {Map<string, string | null>} snapshot
 */
async function restoreReleaseFiles(snapshot) {
  for (const [file, content] of snapshot.entries()) {
    const target = path.resolve(process.cwd(), file);
    if (content === null) {
      try {
        await fs.rm(target);
      } catch {
        // File did not exist before release attempt and is already absent.
      }
    } else {
      await fs.writeFile(target, content);
    }
  }
}

/**
 * @param {{ oldVersion: string, newVersion: string, releaseType: string, tagName: string, commits: string[] }} data
 */
function printDryRun(data) {
  console.log(`Release dry-run: ${data.oldVersion} -> ${data.newVersion}`);
  console.log(`Type: ${data.releaseType}`);
  console.log(`Tag: ${data.tagName}`);
  console.log('');
  console.log(buildChangelogEntry(data.newVersion, data.commits));
}

/**
 * @param {string} version
 */
function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
  };
}

/**
 * @param {string} value
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
