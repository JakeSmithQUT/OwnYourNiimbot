/** Websites that the app opens in the browser: this project on GitHub. Other links do nothing. */
export function isAllowedExternal(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'github.com' && /^\/JakeSmithQUT\/OwnYourNiimbot(\/|$)/i.test(u.pathname);
  } catch {
    return false;
  }
}
