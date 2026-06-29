import fs from 'node:fs/promises';
import path from 'node:path';
import { MroError } from './errors.js';
import { fileExists } from './fs.js';

/**
 * @param {string} message
 * @returns {string}
 */
export function sanitizeCommitMessage(message) {
  return Array.from(message)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : char;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 240);
}

/**
 * @param {string[]} commits
 * @returns {Record<string, string[]>}
 */
export function groupConventionalCommits(commits) {
  const groups = {
    breaking: [],
    feat: [],
    fix: [],
    perf: [],
    docs: [],
    chore: [],
    other: [],
  };

  for (const raw of commits) {
    const message = sanitizeCommitMessage(raw);
    const typeMatch = message.match(/^([a-z]+)(?:\([^)]+\))?(!)?:\s*(.+)$/);
    if (message.includes('BREAKING CHANGE') || typeMatch?.[2]) {
      groups.breaking.push(message);
    } else if (typeMatch && Object.hasOwn(groups, typeMatch[1])) {
      groups[typeMatch[1]].push(typeMatch[3] || message);
    } else {
      groups.other.push(message);
    }
  }

  return Object.fromEntries(Object.entries(groups).filter(([, entries]) => entries.length > 0));
}

/**
 * @param {string[]} commits
 * @returns {'major' | 'minor' | 'patch'}
 */
export function inferReleaseType(commits) {
  if (commits.some((message) => message.includes('BREAKING CHANGE') || /^[a-z]+(?:\([^)]+\))?!:/.test(message))) {
    return 'major';
  }
  if (commits.some((message) => /^feat(?:\([^)]+\))?:/.test(message))) return 'minor';
  return 'patch';
}

/**
 * @param {string} version
 * @param {string[]} commits
 * @param {Date} [date]
 * @returns {string}
 */
export function buildChangelogEntry(version, commits, date = new Date()) {
  const groups = groupConventionalCommits(commits.length > 0 ? commits : ['chore: maintenance release']);
  const dateString = date.toISOString().slice(0, 10);
  const labels = {
    breaking: 'Breaking Changes',
    feat: 'Features',
    fix: 'Fixes',
    perf: 'Performance',
    docs: 'Documentation',
    chore: 'Maintenance',
    other: 'Other',
  };

  const sections = Object.entries(groups)
    .map(([type, entries]) => `### ${labels[type] || type}\n\n${entries.map((entry) => `- ${entry}`).join('\n')}`)
    .join('\n\n');

  return `## [${version}] - ${dateString}\n\n${sections}\n`;
}

/**
 * @param {string} version
 * @param {string[]} commits
 * @param {string} [cwd]
 * @returns {Promise<void>}
 */
export async function insertChangelogEntry(version, commits, cwd = process.cwd()) {
  const changelogPath = path.resolve(cwd, 'CHANGELOG.md');
  if (!(await fileExists('CHANGELOG.md', cwd))) {
    throw new MroError('CHANGELOG_MISSING', 'CHANGELOG.md is required before release');
  }

  const content = await fs.readFile(changelogPath, 'utf8');
  const entry = buildChangelogEntry(version, commits);
  const lines = content.split('\n');
  let insertIndex = lines.findIndex((line) => line.startsWith('## ['));

  if (insertIndex === -1) {
    insertIndex = lines.findIndex((line, index) => index > 0 && line.trim() !== '');
    if (insertIndex === -1) insertIndex = lines.length;
  }

  lines.splice(insertIndex, 0, entry);
  await fs.writeFile(changelogPath, lines.join('\n').replace(/\n{4,}/g, '\n\n\n'));
}
