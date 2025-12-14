#!/bin/sh
set -eu

APPS_LIST="OpenCorp-ER:opencorp-er
DEV-ER:dev-er"

stop_running_app() {
  exec_name="$1"

  if command -v pgrep >/dev/null 2>&1; then
    pids=$(pgrep -f "$exec_name" || true)
    if [ -n "$pids" ]; then
      for pid in $pids; do
        kill "$pid" 2>/dev/null || true
      done
      sleep 2 || true
      for pid in $pids; do
        kill -9 "$pid" 2>/dev/null || true
      done
    fi
  fi
}

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

cleanup_desktop_entry() {
  exec_name="$1"
  desktop_file="/usr/share/applications/$exec_name.desktop"

  rm -f "$desktop_file"
  rm -f "/usr/bin/$exec_name"
  rm -f "/usr/share/pixmaps/$exec_name.png"
  for size in 64 128 256 512; do
    rm -f "$(printf "/usr/share/icons/hicolor/%sx%s/apps/%s.png" "$size" "$size" "$exec_name")"
  done
  rm -f "/usr/share/icons/hicolor/0x0/apps/$exec_name.png"
}

echo "$APPS_LIST" | while IFS=":" read -r _ exec_name; do
  [ -z "$exec_name" ] && continue
  stop_running_app "$exec_name"
  cleanup_desktop_entry "$exec_name"
done

refresh_desktop_database
refresh_icon_cache
