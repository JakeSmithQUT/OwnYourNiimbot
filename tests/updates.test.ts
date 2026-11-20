import { describe, expect, it } from 'vitest';
import { releaseUrl, updateMode } from '../src/main/updateRules';
import { isAllowedExternal } from '../src/main/links';

describe('update check', () => {
  it('installs updates only where the app can replace itself', () => {
    expect(updateMode({ packaged: true, platform: 'win32' })).toBe('install');
    expect(updateMode({ packaged: true, platform: 'win32', portable: 'C:\\Downloads\\OwnYourNiimbot.exe' })).toBe('notify');
    expect(updateMode({ packaged: true, platform: 'linux', appImage: '/home/me/OwnYourNiimbot.AppImage' })).toBe('install');
    expect(updateMode({ packaged: true, platform: 'linux' })).toBe('notify');
    expect(updateMode({ packaged: true, platform: 'darwin' })).toBe('notify');
  });

  it('does not check in a development build without a test feed', () => {
    expect(updateMode({ packaged: false, platform: 'win32' })).toBe('none');
    expect(updateMode({ packaged: false, platform: 'win32', testFeed: 'http://127.0.0.1:8080/' })).toBe('install');
  });

  it('links to the release page of a plain version only', () => {
    expect(releaseUrl('1.3.0')).toBe('https://github.com/JakeSmithQUT/OwnYourNiimbot/releases/tag/v1.3.0');
    expect(releaseUrl('1.3.0/../../evil')).toBe('https://github.com/JakeSmithQUT/OwnYourNiimbot/releases');
    expect(releaseUrl(undefined)).toBe('https://github.com/JakeSmithQUT/OwnYourNiimbot/releases');
    expect(isAllowedExternal(releaseUrl('1.3.0'))).toBe(true);
  });
});
