import { describe, expect, it } from 'vitest';
import { formatMegabytes, formatSpeed, inProgramFiles, installAtLaunch, isNewerVersion, releaseUrl, updateMode } from '../src/main/updateRules';
import { isAllowedExternal } from '../src/main/links';

describe('update check', () => {
  it('installs updates only where the app can replace itself', () => {
    expect(updateMode({ packaged: true, platform: 'win32' })).toBe('install');
    expect(updateMode({ packaged: true, platform: 'win32', portable: 'C:\\Downloads\\OwnYourNiimbot.exe' })).toBe('notify');
    expect(updateMode({ packaged: true, platform: 'linux', appImage: '/home/me/OwnYourNiimbot.AppImage' })).toBe('install');
    expect(updateMode({ packaged: true, platform: 'linux' })).toBe('notify');
    expect(updateMode({ packaged: true, platform: 'darwin' })).toBe('notify');
  });

  it('shows a link instead of installing for an installation for all users', () => {
    expect(updateMode({ packaged: true, platform: 'win32', allUsers: true })).toBe('notify');
    const folders = ['C:\\Program Files', 'C:\\Program Files (x86)', undefined];
    expect(inProgramFiles('C:\\Program Files\\OwnYourNiimbot\\OwnYourNiimbot.exe', folders)).toBe(true);
    expect(inProgramFiles('c:\\program files (x86)\\OwnYourNiimbot\\OwnYourNiimbot.exe', folders)).toBe(true);
    expect(inProgramFiles('C:\\Users\\me\\AppData\\Local\\Programs\\OwnYourNiimbot\\OwnYourNiimbot.exe', folders)).toBe(false);
    expect(inProgramFiles('C:\\Program Files Old\\OwnYourNiimbot.exe', ['C:\\Program Files'])).toBe(false);
    expect(inProgramFiles('C:\\Apps\\OwnYourNiimbot.exe', [undefined])).toBe(false);
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

  it('compares versions', () => {
    expect(isNewerVersion('1.4.1', '1.4.0')).toBe(true);
    expect(isNewerVersion('1.10.0', '1.9.9')).toBe(true);
    expect(isNewerVersion('2.0.0', '1.99.99')).toBe(true);
    expect(isNewerVersion('1.4.0', '1.4.0')).toBe(false);
    expect(isNewerVersion('1.3.1', '1.4.0')).toBe(false);
  });

  it('does not install a version again at start-up after its install failed', () => {
    expect(installAtLaunch('1.5.0', undefined)).toBe(true);
    expect(installAtLaunch('1.5.1', '1.5.0')).toBe(true);
    expect(installAtLaunch('1.5.0', '1.5.0')).toBe(false);
    expect(installAtLaunch(undefined, undefined)).toBe(false);
  });

  it('formats download sizes and speeds', () => {
    expect(formatMegabytes(124925349)).toBe('119 MB');
    expect(formatMegabytes(4.6 * 1024 * 1024)).toBe('4.6 MB');
    expect(formatSpeed(6.4 * 1024 * 1024)).toBe('6.4 MB/s');
    expect(formatSpeed(850 * 1024)).toBe('850 KB/s');
    expect(formatSpeed(10)).toBe('1 KB/s');
  });
});
