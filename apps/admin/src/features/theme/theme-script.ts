export const THEME_STORAGE_KEY = 'zia-admin-theme';
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/**
 * Runs in <head> before the first paint, so the page never flashes the wrong theme.
 * A plain string, because it has to work before any bundle has loaded.
 * Precedence is the same as resolveTheme() in theme-store.ts: saved choice, then the system.
 */
export const THEME_INIT_SCRIPT = `(function(){var s=null;try{s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}var d=s==="dark"||(s!=="light"&&matchMedia(${JSON.stringify(DARK_MEDIA_QUERY)}).matches);document.documentElement.classList.toggle("dark",d)})();`;
