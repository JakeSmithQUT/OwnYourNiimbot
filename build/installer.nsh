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

  ; When the installer starts the app (a one-click install, or an update with
  ; --force-run), start it here and keep the installer window open until the
  ; app shows a window. The first start after an install can take several
  ; seconds while Windows checks the new files, and without this wait no
  ; window shows during that time.
  ${ifNot} ${Silent}
  ${orIf} ${isForceRun}
    ; Fill the progress bar: the files are installed.
    FindWindow $5 "#32770" "" $HWNDPARENT
    FindWindow $5 "#32770" "" $HWNDPARENT $5
    GetDlgItem $6 $5 1004
    SendMessage $6 0x402 30000 0
    GetDlgItem $6 $5 1000
    SendMessage $6 ${WM_SETTEXT} 0 "STR:Starting ${PRODUCT_NAME}..."

    ${if} ${isUpdated}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endIf}
    ${StdUtils.ExecShellAsUser} $0 "$appExe" "open" "$1"
    ${if} $0 == "ok"
    ${orIf} $0 == "fallback"
      ; The app is running, so the installer must not start a second copy.
      StrCpy $launchLink ""
      ; Wait up to 30 seconds for a visible window of the app.
      StrCpy $2 0
      ${Do}
        FindWindow $3 "Chrome_WidgetWin_1" "${PRODUCT_NAME}"
        ${if} $3 != 0
          System::Call 'user32::IsWindowVisible(p r3) i .r4'
          ${if} $4 != 0
            ${ExitDo}
          ${endIf}
        ${endIf}
        Sleep 250
        IntOp $2 $2 + 1
      ${LoopUntil} $2 >= 120
    ${endIf}
  ${endIf}
!macroend
