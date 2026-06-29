import { fileExists } from '../lib/fs.js';
import { fail, pass } from './types.js';

export const fileChecks = [
  {
    id: 'file.package_json',
    name: 'package.json exists',
    severity: 'critical',
    fix: 'Run: npm init -y',
    run: async (context) =>
      (await fileExists('package.json', context.cwd))
        ? pass(thisCheck('file.package_json'))
        : fail(thisCheck('file.package_json')),
  },
  {
    id: 'file.readme',
    name: 'README.md exists',
    severity: 'high',
    fix: 'Create a README.md describing your project',
    run: async (context) =>
      (await fileExists('README.md', context.cwd)) ? pass(thisCheck('file.readme')) : fail(thisCheck('file.readme')),
  },
  {
    id: 'file.license',
    name: 'LICENSE exists',
    severity: 'high',
    fix: 'Add a LICENSE file. Try: npx license mit',
    run: async (context) =>
      (await fileExists('LICENSE', context.cwd)) ||
      (await fileExists('LICENSE.md', context.cwd)) ||
      (await fileExists('LICENSE.txt', context.cwd))
        ? pass(thisCheck('file.license'))
        : fail(thisCheck('file.license')),
  },
  {
    id: 'file.changelog',
    name: 'CHANGELOG.md exists',
    severity: 'medium',
    fix: 'Create CHANGELOG.md to track versions',
    run: async (context) =>
      (await fileExists('CHANGELOG.md', context.cwd)) || (await fileExists('CHANGELOG', context.cwd))
        ? pass(thisCheck('file.changelog'))
        : fail(thisCheck('file.changelog')),
  },
  {
    id: 'file.gitignore',
    name: '.gitignore exists',
    severity: 'medium',
    fix: 'Add .gitignore. Try: npx gitignore node',
    run: async (context) =>
      (await fileExists('.gitignore', context.cwd))
        ? pass(thisCheck('file.gitignore'))
        : fail(thisCheck('file.gitignore')),
  },
  {
    id: 'file.ci_workflow',
    name: 'CI workflow exists',
    severity: 'high',
    fix: 'Add .github/workflows/ci.yml for automated testing',
    run: async (context) =>
      (await fileExists('.github/workflows/ci.yml', context.cwd)) ||
      (await fileExists('.github/workflows/ci.yaml', context.cwd))
        ? pass(thisCheck('file.ci_workflow'))
        : fail(thisCheck('file.ci_workflow')),
  },
];

/**
 * @param {string} id
 */
function thisCheck(id) {
  const check = fileChecks.find((candidate) => candidate.id === id);
  if (!check) throw new Error(`Unknown file check: ${id}`);
  return check;
}
