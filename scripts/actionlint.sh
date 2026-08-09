#!/usr/bin/env bash
set -euo pipefail

ACTIONLINT_VERSION="1.7.12"

# gh がトークンを持たない場合、git の credential helper 経由で github.com 用のトークンを取得する
if [ -z "${GH_TOKEN:-}" ] && [ -z "${GITHUB_TOKEN:-}" ]; then
  token="$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | awk -F= '/^password=/{print $2}')"
  [ -n "$token" ] && export GH_TOKEN="$token"
fi

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"
case "$arch" in
x86_64) arch="amd64" ;;
aarch64 | arm64) arch="arm64" ;;
esac

cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/actionlint/${ACTIONLINT_VERSION}/${os}_${arch}"
bin="${cache_dir}/actionlint"

if [ ! -x "$bin" ]; then
  archive="actionlint_${ACTIONLINT_VERSION}_${os}_${arch}.tar.gz"
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  gh release download "v${ACTIONLINT_VERSION}" \
    --repo rhysd/actionlint \
    --pattern "$archive" \
    --dir "$tmp_dir"
  gh attestation verify \
    "$tmp_dir/$archive" \
    --repo rhysd/actionlint

  mkdir -p "$cache_dir"
  tar -xzf "$tmp_dir/$archive" -C "$cache_dir" actionlint
fi

exec "$bin" "$@"
