import fs from 'node:fs/promises';
import path from 'node:path';

const CHECKS = [
  {
    name: 'package.json exists',
    check: async () => fileExists('package.json'),
    fix: 'Run: npm init -y',
  },
  {
    name: 'README.md exists',
    check: async () => fileExists('README.md'),
    fix: 'Create a README.md describing your project',
  },
  {
    name: 'LICENSE exists',
    check: async () => fileExists('LICENSE') || fileExists('LICENSE.md') || fileExists('LICENSE.txt'),
    fix: 'Add a LICENSE file. Try: npx license mit',
  },
  {
    name: 'CHANGELOG exists',
    check: async () => fileExists('CHANGELOG.md') || fileExists('CHANGELOG'),
    fix: 'Create CHANGELOG.md to track versions',
  },
  {
    name: '.gitignore exists',
    check: async () => fileExists('.gitignore'),
    fix: 'Add .gitignore. Try: npx gitignore node',
  },
  {
    name: 'No package-lock.json AND pnpm-lock.yaml (pick one)',
    check: async () => {
      const hasNpm = await fileExists('package-lock.json');
      const hasPnpm = await fileExists('pnpm-lock.yaml');
      return !(hasNpm && hasPnpm);
    },
    fix: 'Remove one lockfile to avoid conflicts',
  },
  {
    name: 'CI workflow exists',
    check: async () => fileExists('.github/workflows/ci.yml') || fileExists('.github/workflows/ci.yaml'),
    fix: 'Add .github/workflows/ci.yml for automated testing',
  },
];

async function fileExists(filepath) {
  try {
    await fs.access(path.resolve(process.cwd(), filepath));
    return true;
  } catch {
    return false;
  }
}

export async function check(args) {
  const jsonOutput = args.includes('--json');
  
  if (!jsonOutput) {
    console.log('🔍 Running maintenance checks...\n');
  }

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const { name, check: checkFn, fix } of CHECKS) {
    const ok = await checkFn();
    results.push({ name, passed: ok, fix: ok ? null : fix });
    
    if (ok) {
      passed++;
      if (!jsonOutput) console.log(`  ✅ ${name}`);
    } else {
      failed++;
      if (!jsonOutput) {
        console.log(`  ❌ ${name}`);
        console.log(`     → ${fix}`);
      }
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ passed, failed, total: CHECKS.length, results }, null, 2));
  } else {
    console.log(`\n─────────────────────────────────`);
    console.log(`  Passed: ${passed}/${CHECKS.length}`);
    if (failed > 0) {
      console.log(`  ⚠️  ${failed} issue(s) found`);
    } else {
      console.log(`  🎉 All checks passed!`);
    }
    console.log(`─────────────────────────────────\n`);
  }

  return failed > 0 ? 1 : 0;
}
