import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {string} filepath
 * @param {string} [cwd]
 * @returns {Promise<boolean>}
 */
export async function fileExists(filepath, cwd = process.cwd()) {
  try {
    await fs.access(path.resolve(cwd, filepath));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} filepath
 * @param {string} [cwd]
 * @returns {Promise<string | null>}
 */
export async function readTextIfExists(filepath, cwd = process.cwd()) {
  try {
    return await fs.readFile(path.resolve(cwd, filepath), 'utf8');
  } catch {
    return null;
  }
}

/**
 * @param {string} filepath
 * @param {string} content
 * @param {string} [cwd]
 * @returns {Promise<boolean>} true when created, false when file already existed
 */
export async function writeIfMissing(filepath, content, cwd = process.cwd()) {
  const target = path.resolve(cwd, filepath);
  if (await fileExists(filepath, cwd)) return false;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
  return true;
}
