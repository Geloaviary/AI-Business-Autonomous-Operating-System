#!/usr/bin/env bash
set -euo pipefail

# update-repo.sh
# -----------------------------------------------------------------------------
# Syncs this upgrade into an existing local clone of your BAOS repository.
# Uses only cp/find/git — no rsync dependency, since it isn't reliably
# preinstalled everywhere this needs to run.
#
# Does NOT commit or push automatically — it stops after syncing so you can
# review exactly what changed with `git status` / `git diff` before deciding
# to commit.
#
# Usage:
#   ./update-repo.sh /path/to/your/existing/baos-repo-clone
#
# What it does:
#   1. Removes everything in your repo clone EXCEPT .git/ itself.
#   2. Copies this upgrade's files in fresh.
#   3. Shows `git status` so you can see exactly what changed, added, or
#      was removed (e.g. the old adapters/qad-client.js and
#      adapters/platform-memory-client.js this upgrade removed).
#
# After running this, node_modules/ and .next/ at the repo root will be
# gone (they're gitignored, never committed, and safe to lose) — you'll
# need to `npm install` again there. That's expected, not a bug.
#
# What it deliberately does NOT do: git add, git commit, git push.
# Those are your call, after you've looked at the diff.
# -----------------------------------------------------------------------------

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_REPO="${1:-}"

if [ -z "$TARGET_REPO" ]; then
  echo "Usage: ./update-repo.sh /path/to/your/existing/baos-repo-clone"
  exit 1
fi

if [ ! -d "$TARGET_REPO/.git" ]; then
  echo "Error: $TARGET_REPO does not look like a git repository (no .git directory found)."
  echo "Clone your existing repo first, e.g.:"
  echo "  git clone https://github.com/<you>/<repo>.git $TARGET_REPO"
  exit 1
fi

echo "Syncing upgrade from:"
echo "  $SOURCE_DIR"
echo "into your existing repo at:"
echo "  $TARGET_REPO"
echo ""

# Remove everything in the target except .git itself, then copy the
# upgrade in fresh. This is a full mirror, not a merge — anything this
# upgrade removed (e.g. old adapter files) won't reappear.
find "$TARGET_REPO" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Copy everything from the upgrade source, excluding this script itself
# (no reason for it to live inside the repo it updates) and anything that
# shouldn't be copied even though it's absent from the packaged source
# anyway (kept here for safety if run against a raw unpacked directory).
for item in "$SOURCE_DIR"/*; do
  name="$(basename "$item")"
  case "$name" in
    update-repo.sh|node_modules|.next|marketplace-packages|.staging-*)
      continue
      ;;
  esac
  cp -r "$item" "$TARGET_REPO/"
done

# Hidden files (.gitignore) need a separate pass since the glob above doesn't match dotfiles.
for item in "$SOURCE_DIR"/.[!.]*; do
  [ -e "$item" ] || continue
  name="$(basename "$item")"
  [ "$name" = ".git" ] && continue
  cp -r "$item" "$TARGET_REPO/"
done

echo "Sync complete. Here's what changed in your repo:"
echo ""
cd "$TARGET_REPO"
git status

echo ""
echo "Next steps, once you've reviewed the above:"
echo "  cd $TARGET_REPO"
echo "  git add -A"
echo "  git commit -m \"Upgrade: standalone Platform Memory + QAD, researched workforce staffing, knowledge.js/views.js\""
echo "  git push"
echo ""
echo "Then, since node_modules was removed by the sync:"
echo "  cd $TARGET_REPO && npm install"
