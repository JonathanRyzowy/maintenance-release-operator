import fs from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_SCHEMA, loadConfig } from '../lib/config.js';
import { serializeError } from '../lib/errors.js';

/**
 * @param {string[]} args
 */
export async function config(args = []) {
  const subcommand = args[0] || 'validate';

  if (subcommand === 'schema') {
    console.log(JSON.stringify(CONFIG_SCHEMA, null, 2));
    return 0;
  }

  if (subcommand !== 'validate') {
    console.error(`Unknown config command: ${subcommand}`);
    return 1;
  }

  try {
    await loadConfig();
    console.log('.mrorc.json is valid');
    return 0;
  } catch (err) {
    const error = serializeError(err);
    console.error(`${error.code}: ${error.message}`);
    return 1;
  }
}

export async function writeConfigSchema() {
  await fs.writeFile(path.resolve(process.cwd(), '.mrorc.schema.json'), `${JSON.stringify(CONFIG_SCHEMA, null, 2)}\n`);
}
