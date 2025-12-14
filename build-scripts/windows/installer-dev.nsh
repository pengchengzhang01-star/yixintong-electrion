; NSIS 自定义安装脚本 - 测试环境
; 设置默认安装路径，避免与正式版冲突

!macro preInit
  ; 设置默认安装目录为 DEV-ER
  SetRegView 64
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{f7d2e3a1-8b9c-4d5e-a6f3-9e8c7b6d5a4f}" "InstallLocation" "$PROGRAMFILES64\DEV-ER"
  SetRegView 32
!macroend

; 自定义默认安装路径
!macro customInstallMode
  StrCpy $INSTDIR "$PROGRAMFILES64\DEV-ER"
!macroend

; 安装完成后的自定义操作
!macro customInstall
  ; 可以在这里添加自定义的安装后操作
!macroend