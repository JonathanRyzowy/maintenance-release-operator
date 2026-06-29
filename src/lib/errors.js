export class MroError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {Record<string, unknown>} [details]
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'MroError';
    this.code = code;
    this.details = details;
  }
}

/**
 * @param {unknown} err
 * @returns {{ code: string, message: string, details: Record<string, unknown> }}
 */
export function serializeError(err) {
  if (err instanceof MroError) {
    return { code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof Error) {
    return { code: 'UNKNOWN_ERROR', message: err.message, details: {} };
  }

  return { code: 'UNKNOWN_ERROR', message: String(err), details: {} };
}
