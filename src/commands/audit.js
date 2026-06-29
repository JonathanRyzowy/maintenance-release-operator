import { parseCheckArgs, runChecks } from './check.js';
import { securityChecks } from '../checks/security.js';

/**
 * @param {string[]} args
 */
export async function audit(args = []) {
  const options = parseCheckArgs(args);
  const payload = await runChecks({ options, checks: securityChecks });
  console.log(JSON.stringify(payload, null, 2));
  return payload.failed > 0 ? 1 : 0;
}
