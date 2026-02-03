import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const CHECKS = [
  // File existence checks
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
    name: 'No lockfile conflicts',
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
  // Package.json quality checks
  {
    name: 'Test script defined',
    check: async () => {
      const pkg = await readPackageJson();
      return pkg?.scripts?.test && !pkg.scripts.test.includes('no test specified');
    },
    fix: 'Add a "test" script to package.json',
  },
  {
    name: 'Node engines specified',
    check: async () => {
      const pkg = await readPackageJson();
      return !!pkg?.engines?.node;
    },
    fix: 'Add "engines": { "node": ">=18.0.0" } to package.json',
  },
  // Dependency checks
  {
    name: 'No outdated dependencies',
    check: async () => {
      if (!await fileExists('package.json')) return true;
      try {
        execSync('npm outdated --json', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true; // No output means no outdated deps
      } catch (err) {
        // npm outdated exits with code 1 if there are outdated deps
        const output = err.stdout?.toString() || '{}';
        const outdated = JSON.parse(output);
        return Object.keys(outdated).length === 0;
      }
    },
    fix: 'Run: npm update (or npm outdated to see details)',
  },
  {
    name: 'No security vulnerabilities',
    check: async () => {
      if (!await fileExists('package.json')) return true;
      if (!await fileExists('package-lock.json') && !await fileExists('node_modules')) return true;
      try {
        execSync('npm audit --json', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
      } catch (err) {
        const output = err.stdout?.toString() || '{}';
        try {
          const audit = JSON.parse(output);
          const vulns = audit.metadata?.vulnerabilities || {};
          const total = (vulns.high || 0) + (vulns.critical || 0);
          return total === 0; // Pass if no high/critical vulns
        } catch {
          return true; // Can't parse, assume ok
        }
      }
    },
    fix: 'Run: npm audit fix (or npm audit for details)',
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

async function readPackageJson() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), 'package.json'), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
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
