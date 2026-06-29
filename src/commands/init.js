import { writeIfMissing } from '../lib/fs.js';

const BASELINE_FILES = {
  '.mrorc.json': '{\n  "exceptions": [],\n  "skip": [],\n  "failLevel": "high"\n}\n',
  'CHANGELOG.md': '# Changelog\n\nAll notable changes to this project will be documented in this file.\n',
  '.gitignore': 'node_modules/\n.env\n.DS_Store\ncoverage/\ndist/\n',
};

export async function init() {
  const created = [];
  const skipped = [];

  for (const [file, content] of Object.entries(BASELINE_FILES)) {
    if (await writeIfMissing(file, content)) created.push(file);
    else skipped.push(file);
  }

  console.log(`Created: ${created.length ? created.join(', ') : 'none'}`);
  console.log(`Already existed: ${skipped.length ? skipped.join(', ') : 'none'}`);
  return 0;
}
