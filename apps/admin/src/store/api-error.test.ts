import { describe, expect, it } from 'vitest';
import { parseApiError } from './api-error';

describe('parseApiError', () => {
  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [400, 'validation'],
    [404, 'rejected'],
    [409, 'rejected'],
    [429, 'rejected'],
  ])('maps HTTP %i to %s with the message from the API', (status, kind) => {
    expect(parseApiError({ status, data: { message: 'Komunikat' } })).toMatchObject({
      kind,
      message: 'Komunikat',
      code: `HTTP ${status}`,
    });
  });

  it('exposes the field errors of a validation failure', () => {
    const errors = [{ path: 'email', message: 'Zajęty' }];

    expect(parseApiError({ status: 400, data: { message: 'x', errors } }).fieldIssues).toEqual(
      errors,
    );
  });

  it.each([
    ['network failure', { status: 'FETCH_ERROR', error: 'TypeError' }, 'Brak połączenia'],
    ['timeout', { status: 'TIMEOUT_ERROR', error: 'x' }, 'Brak połączenia'],
    [
      'non-JSON error page of the proxy',
      { status: 'PARSING_ERROR', originalStatus: 500, data: '<html>', error: 'x' },
      'HTTP 500',
    ],
    ['server error', { status: 503, data: { message: 'x' } }, 'HTTP 503'],
    ['response breaking the contract', { name: 'SchemaError' }, 'Nieprawidłowa odpowiedź serwera'],
  ])('treats %s as unavailable', (_case, error, code) => {
    expect(parseApiError(error)).toMatchObject({ kind: 'unavailable', code });
  });
});
