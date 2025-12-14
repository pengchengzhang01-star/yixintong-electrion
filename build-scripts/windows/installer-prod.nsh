; NSIS 自定义安装脚本 - 正式环境
; 设置默认安装路径，避免与测试版冲突

!macro preInit
  ; 设置默认安装目录为 OpenCorp-ER
  SetRegView 64
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{a8f5e9c4-3b2d-4e1f-9c8a-7d6b5e4a3c2b}" "InstallLocation" "$PROGRAMFILES64\OpenCorp-ER"
  SetRegView 32
!macroend

; 自定义默认安装路径
!macro customInstallMode
  StrCpy $INSTDIR "$PROGRAMFILES64\OpenCorp-ER"
!macroend

; 安装完成后的自定义操作
!macro customInstall
  ; 可以在这里添加自定义的安装后操作
!macroend