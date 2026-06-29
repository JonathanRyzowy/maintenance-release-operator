import { parseCheckArgs, runChecks } from './check.js';
import { dependencyChecks } from '../checks/dependencies.js';
import { securityChecks } from '../checks/security.js';

/**
 * @param {string[]} args
 */
export async function deps(args = []) {
  const options = parseCheckArgs(args);
  const payload = await runChecks({ options, checks: [...dependencyChecks, ...securityChecks] });
  console.log(JSON.stringify(payload, null, 2));
  return payload.failed > 0 ? 1 : 0;
}
