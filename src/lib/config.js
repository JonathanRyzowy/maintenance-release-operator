import fs from 'node:fs/promises';
import path from 'node:path';
import { MroError } from './errors.js';
import { fileExists } from './fs.js';

export const CONFIG_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'maintenance-release-operator configuration',
  type: 'object',
  additionalProperties: false,
  properties: {
    exceptions: {
      type: 'array',
      items: { type: 'string' },
      default: [],
      description: 'Stable check IDs to treat as explicit policy exceptions.',
    },
    skip: {
      type: 'array',
      items: { type: 'string' },
      default: [],
      description: 'Check groups to skip, such as network.',
    },
    failLevel: {
      enum: ['high', 'critical', 'all'],
      default: 'high',
      description: 'npm audit severity threshold.',
    },
  },
};

/**
 * @param {string} [cwd]
 * @returns {Promise<{ exceptions: string[], skip: string[], failLevel?: string }>}
 */
export async function loadConfig(cwd = process.cwd()) {
  if (!(await fileExists('.mrorc.json', cwd))) return { exceptions: [], skip: [] };

  const configPath = path.resolve(cwd, '.mrorc.json');
  let config;
  try {
    config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  } catch (err) {
    throw new MroError('CONFIG_PARSE_ERROR', '.mrorc.json is malformed JSON', {
      path: configPath,
      cause: err instanceof Error ? err.message : String(err),
    });
  }

  validateConfigObject(config);
  return {
    exceptions: Array.isArray(config.exceptions) ? config.exceptions : [],
    skip: Array.isArray(config.skip) ? config.skip : [],
    failLevel: config.failLevel,
  };
}

/**
 * @param {unknown} config
 * @returns {void}
 */
export function validateConfigObject(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new MroError('CONFIG_INVALID', '.mrorc.json must be a JSON object');
  }

  const allowed = new Set(Object.keys(CONFIG_SCHEMA.properties));
  for (const key of Object.keys(config)) {
    if (!allowed.has(key)) throw new MroError('CONFIG_INVALID_KEY', `Unknown .mrorc.json key: ${key}`, { key });
  }

  if ('exceptions' in config && !isStringArray(config.exceptions)) {
    throw new MroError('CONFIG_INVALID_EXCEPTIONS', 'exceptions must be an array of check IDs');
  }

  if ('skip' in config && !isStringArray(config.skip)) {
    throw new MroError('CONFIG_INVALID_SKIP', 'skip must be an array of group names');
  }

  if (
    'failLevel' in config &&
    (typeof config.failLevel !== 'string' || !['high', 'critical', 'all'].includes(config.failLevel))
  ) {
    throw new MroError('CONFIG_INVALID_FAIL_LEVEL', 'failLevel must be high, critical, or all');
  }
}

/**
 * @param {unknown} value
 */
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
