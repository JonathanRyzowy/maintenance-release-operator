import { CHECKS, parseCheckArgs, runChecks } from './check.js';

/**
 * @param {string[]} args
 */
export async function report(args = []) {
  const options = parseCheckArgs(args);
  const payload = await runChecks({ options, checks: CHECKS });

  if (args.includes('--sarif')) {
    console.log(JSON.stringify(toSarif(payload), null, 2));
  } else {
    console.log(toMarkdown(payload));
  }

  return payload.failed > 0 ? 1 : 0;
}

/**
 * @param {{ passed: number, failed: number, total: number, results: import('../checks/types.js').CheckResult[] }} payload
 */
export function toMarkdown(payload) {
  const lines = [
    '## MRO Report',
    '',
    `Passed: ${payload.passed}`,
    `Failed: ${payload.failed}`,
    `Total: ${payload.total}`,
    '',
    '| ID | Status | Severity | Fix |',
    '| --- | --- | --- | --- |',
  ];

  for (const result of payload.results) {
    lines.push(`| ${result.id} | ${result.passed ? 'pass' : 'fail'} | ${result.severity} | ${result.fix || ''} |`);
  }

  return lines.join('\n');
}

/**
 * @param {{ results: import('../checks/types.js').CheckResult[] }} payload
 */
export function toSarif(payload) {
  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'maintenance-release-operator',
            rules: payload.results.map((result) => ({
              id: result.id,
              name: result.name,
              shortDescription: { text: result.name },
              help: { text: result.fix || result.name },
            })),
          },
        },
        results: payload.results
          .filter((result) => !result.passed)
          .map((result) => ({
            ruleId: result.id,
            level: result.severity === 'critical' || result.severity === 'high' ? 'error' : 'warning',
            message: { text: result.fix || result.name },
            locations: [{ physicalLocation: { artifactLocation: { uri: 'package.json' } } }],
          })),
      },
    ],
  };
}
