#!/usr/bin/env bash
set -eu

usage() {
  cat <<'USAGE'
Usage: ./install.sh <claude|codex> [--replace] [--dry-run]

Installs managed assistant configuration files from this repository.

Targets:
  claude  installs claude/CLAUDE.md, claude/settings.json, claude/skills
          into ~/.claude
  codex   installs codex/AGENTS.md, codex/config.toml,
          codex/rules/default.rules, and codex/skills into ~/.codex

By default, only managed files are replaced. Existing files are moved into
~/.assistant-config-backups/<target>-<timestamp>/ first.

--replace moves the entire target directory into the backup and creates a
clean target directory. For Codex, this also moves auth, sessions, logs,
caches, and system skills into the backup, so the default mode is usually
the right choice.
USAGE
}

fail() {
  printf 'install: %s\n' "$1" >&2
  exit 1
}

repo_root() {
  CDPATH= cd -- "$(dirname -- "$0")" && pwd
}

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

copy_item() {
  src=$1
  dest=$2
  dry_run=$3

  if [ "$dry_run" = "1" ]; then
    printf 'copy %s -> %s\n' "$src" "$dest"
    return
  fi

  parent=$(dirname -- "$dest")
  mkdir -p "$parent"
  cp -a "$src" "$dest"
}

backup_item() {
  target_item=$1
  backup_root=$2
  target_root=$3
  dry_run=$4

  [ -e "$target_item" ] || return 0

  rel=${target_item#"$target_root"/}
  backup_item_path="$backup_root/$rel"

  if [ "$dry_run" = "1" ]; then
    printf 'backup %s -> %s\n' "$target_item" "$backup_item_path"
    return
  fi

  mkdir -p "$(dirname -- "$backup_item_path")"
  mv "$target_item" "$backup_item_path"
}

install_managed_item() {
  src=$1
  target_root=$2
  rel=$3
  backup_root=$4
  dry_run=$5

  dest="$target_root/$rel"
  backup_item "$dest" "$backup_root" "$target_root" "$dry_run"
  copy_item "$src" "$dest" "$dry_run"
}

install_codex_skill_dirs() {
  src_root=$1
  target_root=$2
  backup_root=$3
  dry_run=$4

  if [ "$dry_run" = "0" ]; then
    mkdir -p "$target_root/skills"
  fi

  for skill_dir in "$src_root"/skills/*; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename -- "$skill_dir")
    install_managed_item "$skill_dir" "$target_root" "skills/$skill_name" "$backup_root" "$dry_run"
  done
}

main() {
  [ "$#" -ge 1 ] || { usage; exit 2; }

  target_name=$1
  shift

  replace=0
  dry_run=0

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --replace) replace=1 ;;
      --dry-run) dry_run=1 ;;
      -h|--help) usage; exit 0 ;;
      *) fail "unknown option: $1" ;;
    esac
    shift
  done

  root=$(repo_root)
  backup_root="$HOME/.assistant-config-backups/${target_name}-$(timestamp)"

  case "$target_name" in
    claude)
      src_root="$root/claude"
      target_root="$HOME/.claude"
      ;;
    codex)
      src_root="$root/codex"
      target_root="$HOME/.codex"
      ;;
    *)
      usage
      exit 2
      ;;
  esac

  [ -d "$src_root" ] || fail "source directory not found: $src_root"

  if [ "$replace" = "1" ] && [ -e "$target_root" ]; then
    if [ "$dry_run" = "1" ]; then
      printf 'backup whole target %s -> %s\n' "$target_root" "$backup_root"
      printf 'create clean target %s\n' "$target_root"
    else
      mkdir -p "$(dirname -- "$backup_root")"
      mv "$target_root" "$backup_root"
      mkdir -p "$target_root"
    fi
  elif [ "$dry_run" = "0" ]; then
    mkdir -p "$target_root"
    mkdir -p "$backup_root"
  fi

  case "$target_name" in
    claude)
      install_managed_item "$src_root/CLAUDE.md" "$target_root" "CLAUDE.md" "$backup_root" "$dry_run"
      install_managed_item "$src_root/settings.json" "$target_root" "settings.json" "$backup_root" "$dry_run"
      install_managed_item "$src_root/skills" "$target_root" "skills" "$backup_root" "$dry_run"
      ;;
    codex)
      install_managed_item "$src_root/AGENTS.md" "$target_root" "AGENTS.md" "$backup_root" "$dry_run"
      install_managed_item "$src_root/config.toml" "$target_root" "config.toml" "$backup_root" "$dry_run"
      install_managed_item "$src_root/rules/default.rules" "$target_root" "rules/default.rules" "$backup_root" "$dry_run"
      install_codex_skill_dirs "$src_root" "$target_root" "$backup_root" "$dry_run"
      ;;
  esac

  if [ "$dry_run" = "1" ]; then
    printf 'dry run complete\n'
  else
    printf 'installed %s config into %s\n' "$target_name" "$target_root"
    printf 'backup: %s\n' "$backup_root"
  fi
}

main "$@"
