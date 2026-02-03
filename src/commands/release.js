import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

async function readPackageJson() {
  const content = await fs.readFile(path.resolve(process.cwd(), 'package.json'), 'utf-8');
  return JSON.parse(content);
}

function checkWorkingTree() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    return status.length === 0;
  } catch {
    return false;
  }
}

function checkCI() {
  try {
    // Run the CI command defined in package.json
    execSync('npm run ci', { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function getRecentCommits(since = null) {
  try {
    const sinceFlag = since ? `v${since}..HEAD` : 'HEAD~10..HEAD';
    const log = execSync(`git log ${sinceFlag} --pretty=format:"%s" --no-merges`, {
      encoding: 'utf-8'
    }).trim();
    return log.split('\n').filter(line => line.length > 0);
  } catch {
    return [];
  }
}

export function calculateNextVersion(currentVersion, type = 'patch') {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  const [major, minor, patch] = parts;

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

async function updatePackageJson(newVersion) {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const content = await fs.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(content);
  pkg.version = newVersion;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

async function updateChangelog(version, commits) {
  const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
  
  let changelogExists = false;
  try {
    await fs.access(changelogPath);
    changelogExists = true;
  } catch {
    // Create new CHANGELOG.md
    await fs.writeFile(changelogPath, '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n');
    changelogExists = true;
  }

  const content = await fs.readFile(changelogPath, 'utf-8');
  const date = new Date().toISOString().split('T')[0];
  
  let changeSection = '';
  if (commits.length > 0) {
    changeSection = commits.map(msg => `- ${msg}`).join('\n');
  } else {
    changeSection = '- Maintenance release';
  }

  const newEntry = `## [${version}] - ${date}\n\n${changeSection}\n`;
  
  // Find where to insert (after the header, before first version entry)
  const lines = content.split('\n');
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## [')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === 0) {
    // No previous entries, add after header
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#') && !lines[i].startsWith('##')) {
        insertIndex = i + 1;
        while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
          insertIndex++;
        }
        break;
      }
    }
  }
  
  lines.splice(insertIndex, 0, newEntry);
  await fs.writeFile(changelogPath, lines.join('\n'));
}

export async function release(args) {
  const type = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(type)) {
    console.error(`❌ Invalid version type: ${type}. Use major, minor, or patch.`);
    return 1;
  }

  console.log('🔍 Running pre-release checks...\n');

  // Check 1: Working tree must be clean
  if (!checkWorkingTree()) {
    console.error('❌ Working tree is dirty. Commit or stash changes before releasing.');
    return 1;
  }
  console.log('✅ Working tree is clean');

  // Check 2: CI must pass
  console.log('🧪 Running CI checks...');
  if (!checkCI()) {
    console.error('❌ CI checks failed. Fix issues before releasing.');
    return 1;
  }
  console.log('✅ CI checks passed\n');

  try {
    const pkg = await readPackageJson();
    const oldVersion = pkg.version;
    const newVersion = calculateNextVersion(oldVersion, type);

    console.log(`🚀 Releasing ${type} version: ${oldVersion} → ${newVersion}\n`);

    // Get commits since last version
    const commits = getRecentCommits(oldVersion);

    // Update package.json
    console.log('📝 Updating package.json...');
    await updatePackageJson(newVersion);
    console.log('✅ package.json updated');

    // Update CHANGELOG.md
    console.log('📝 Updating CHANGELOG.md...');
    await updateChangelog(newVersion, commits);
    console.log('✅ CHANGELOG.md updated');

    // Git commit and tag
    console.log('📦 Creating git commit and tag...');
    try {
      execSync('git add package.json CHANGELOG.md', { stdio: 'pipe' });
      execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'pipe' });
      execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'pipe' });
      console.log(`✅ Created tag v${newVersion}`);
    } catch (gitErr) {
      console.error('❌ Git operations failed:', gitErr.message);
      return 1;
    }

    console.log(`\n🎉 Release v${newVersion} complete!\n`);
    console.log('Next steps:');
    console.log(`  git push origin main`);
    console.log(`  git push origin v${newVersion}`);
    console.log(`  npm publish  # if publishing to npm\n`);

    return 0;
  } catch (err) {
    console.error('❌ Release failed:', err.message);
    return 1;
  }
}
