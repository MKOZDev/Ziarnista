const LOGIN_PATH = '/login';
const DEFAULT_TARGET = '/';
// Only used to detect a change of origin; never visible in the result
const PLACEHOLDER_ORIGIN = 'http://panel.invalid';

/**
 * Turns the untrusted returnTo parameter into a path inside the panel (open redirect protection).
 * The URL parser decides, as browsers do: a prefix check would miss "/\evil.com" or "/\t/evil.com",
 * which browsers normalize to "//evil.com", another origin.
 */
export function safeReturnTo(value: string | undefined): string {
  if (!value?.startsWith('/')) {
    return DEFAULT_TARGET;
  }
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    // Returning to /login would leave a logged-in admin on the form
    if (url.origin !== PLACEHOLDER_ORIGIN || url.pathname === LOGIN_PATH) {
      return DEFAULT_TARGET;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_TARGET;
  }
}

/** The dashboard is the default target, so it needs no parameter. */
export function loginPath(returnTo: string = DEFAULT_TARGET): string {
  return returnTo === DEFAULT_TARGET
    ? LOGIN_PATH
    : `${LOGIN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}
