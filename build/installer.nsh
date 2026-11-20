; Custom steps for the Windows installer. electron-builder includes this file
; because it is build/installer.nsh.

!macro customInstall
  ; An update moves the files of the old version to a temporary folder, then
  ; deletes them. A file that is in use, for example OwnYourNiimbot.exe of an
  ; AI assistant bridge, stays in that folder, and Windows can change the
  ; shortcuts to point at it. That copy has no other files, so it cannot start.
  ; Point the shortcuts that exist at this installation again.
  ${if} ${FileExists} "$newStartMenuLink"
    CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
  ${endIf}
  ${if} ${FileExists} "$newDesktopLink"
    CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
  ${endIf}
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'

  ; Start the app after an update from its own file, not through a shortcut.
  StrCpy $launchLink "$appExe"
!macroend
