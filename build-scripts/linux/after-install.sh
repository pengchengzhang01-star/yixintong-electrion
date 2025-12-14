#!/bin/sh
set -eu

# Log to help debugging on user machines.
LOG_FILE="/var/log/opencorp-install.log"
mkdir -p "$(dirname "$LOG_FILE")" || true
touch "$LOG_FILE" || true
exec >>"$LOG_FILE" 2>&1
echo "===== $(date -Iseconds) Installing OpenIM desktop entries ====="

# Supported app variants (prod/dev). Missing binaries are skipped.
APPS_LIST="OpenCorp-ER:opencorp-er:OpenIM PC Client.
DEV-ER:dev-er:OpenIM Dev Client."

refresh_desktop_database() {
  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications || true
  fi
}

refresh_icon_cache() {
  if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q /usr/share/icons/hicolor || true
  fi
}

install_icons() {
  exec_name="$1"
  product_dir="$2"
  icon_source=""
  candidates="
    /usr/share/icons/hicolor/512x512/apps/$exec_name.png
    /usr/share/icons/hicolor/256x256/apps/$exec_name.png
    /usr/share/icons/hicolor/128x128/apps/$exec_name.png
    /usr/share/icons/hicolor/64x64/apps/$exec_name.png
    /usr/share/icons/hicolor/0x0/apps/$exec_name.png
    $product_dir/resources/app.asar.unpacked/dist/icons/icon.png
    $product_dir/resources/app.asar.unpacked/dist/icons/$exec_name.png
    $product_dir/resources/$exec_name.png
    $product_dir/resources/icons/icon.png
    $product_dir/resources/icons/$exec_name.png
  "

  for candidate in $candidates; do
    [ -z "$candidate" ] && continue
    if [ -f "$candidate" ]; then
      icon_source="$candidate"
      break
    fi
  done

  if [ -z "$icon_source" ]; then
    echo "No icon found for $exec_name, skipping icon installation"
    return
  fi

  # Ensure target icon dirs exist.
  for size in 64 128 256 512; do
    install -d -m 0755 "$(printf "/usr/share/icons/hicolor/%sx%s/apps" "$size" "$size")"
  done

  for size in 64 128 256 512; do
    install -D -m 0644 "$icon_source" "$(printf "/usr/share/icons/hicolor/%sx%s/apps/%s.png" "$size" "$size" "$exec_name")"
  done

  # Keep a pixmaps copy for absolute Icon fallback.
  install -d -m 0755 "/usr/share/pixmaps"
  install -D -m 0644 "$icon_source" "/usr/share/pixmaps/$exec_name.png"
}

create_desktop_entry() {
  product_name="$1"
  exec_name="$2"
  comment="$3"
  install_dir="/opt/$product_name"
  binary_path="$install_dir/$exec_name"
  bin_link="/usr/bin/$exec_name"
  desktop_file="/usr/share/applications/$exec_name.desktop"

  if [ ! -x "$binary_path" ]; then
    echo "Skip $exec_name: binary not found at $binary_path"
    return
  fi

  # Ensure sandbox permissions (matches electron-builder default).
  if [ -f "$install_dir/chrome-sandbox" ]; then
    chmod 4755 "$install_dir/chrome-sandbox" || true
  fi

  # Ensure launcher symlink exists.
  ln -sf "$binary_path" "$bin_link"

  install_icons "$exec_name" "$install_dir"

  cat >"$desktop_file" <<EOF
[Desktop Entry]
Name=$product_name
Exec=$bin_link %U
TryExec=$bin_link
Terminal=false
Type=Application
Icon=$exec_name
StartupWMClass=$product_name
Comment=$comment
Categories=Network;InstantMessaging;Chat;
MimeType=x-scheme-handler/openim;
EOF
}

echo "$APPS_LIST" | while IFS=":" read -r product exec_name comment; do
  [ -z "$product" ] && continue
  create_desktop_entry "$product" "$exec_name" "$comment"
done

refresh_desktop_database
refresh_icon_cache
