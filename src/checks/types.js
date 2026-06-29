/**
 * @typedef {'info' | 'low' | 'medium' | 'high' | 'critical'} CheckSeverity
 *
 * @typedef {object} CheckResult
 * @property {string} id Stable machine-readable check id.
 * @property {string} name Human-readable check name.
 * @property {boolean} passed Whether the check passed.
 * @property {CheckSeverity} severity Failure severity.
 * @property {string | null} fix Suggested remediation when failed.
 * @property {Record<string, unknown>} details Structured check details.
 */

/**
 * @param {{ id: string, name: string, severity?: CheckSeverity, fix?: string }} check
 * @param {Record<string, unknown>} [details]
 * @returns {CheckResult}
 */
export function pass(check, details = {}) {
  return {
    id: check.id,
    name: check.name,
    passed: true,
    severity: check.severity || 'medium',
    fix: null,
    details,
  };
}

/**
 * @param {{ id: string, name: string, severity?: CheckSeverity, fix?: string }} check
 * @param {string | null | undefined} [fix]
 * @param {Record<string, unknown>} [details]
 * @returns {CheckResult}
 */
export function fail(check, fix = check.fix, details = {}) {
  return {
    id: check.id,
    name: check.name,
    passed: false,
    severity: check.severity || 'medium',
    fix: fix || null,
    details,
  };
}

/**
 * @param {{ id: string, name: string, severity?: CheckSeverity }} check
 * @param {string} reason
 * @returns {CheckResult}
 */
export function skipped(check, reason) {
  return pass(check, { skipped: true, reason });
}
