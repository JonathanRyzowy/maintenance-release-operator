#!/usr/bin/env node

import { check } from './commands/check.js';
import { release } from './commands/release.js';

const args = process.argv.slice(2);
const command = args[0];

const commands = {
  check,
  release,
  help: showHelp,
};

function showHelp() {
  console.log(`
maintenance-release-operator - Keep your repo healthy

USAGE
  npx maintenance-release-operator <command>

COMMANDS
  check    Run maintenance checks on current repo
  release  Bump version, update changelog, and tag
  help     Show this help message

EXAMPLES
  npx maintenance-release-operator check
  npx maintenance-release-operator release patch
  npx maintenance-release-operator check --json

Learn more: https://github.com/JonathanRyzowy/maintenance-release-operator
`);
  return 0;
}

async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.exit(showHelp());
  }

  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error('Run with --help for usage');
    process.exit(1);
  }

  try {
    const exitCode = await handler(args.slice(1));
    process.exit(exitCode ?? 0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
