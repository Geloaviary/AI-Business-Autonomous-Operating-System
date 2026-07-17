#!/bin/bash
# UPDATE-GITHUB.sh — BAOS Auto GitHub Updater
# -----------------------------------------------------------------------------
# Double-click (or run: ./UPDATE-GITHUB.sh) from inside your BAOS project
# folder. Commits and pushes everything in this folder to GitHub.
#
# For a clean upgrade (old, removed files actually go away), replace your
# entire local folder with a freshly extracted copy of the latest zip
# before running this — don't just copy new files on top of old ones, or
# files that were removed in the upgrade will look "still there" to git.
# If you'd rather have that handled automatically against a SEPARATE
# existing clone, use update-repo.sh instead.
# -----------------------------------------------------------------------------
clear
echo "===================================================="
echo " BAOS — Auto GitHub Updater"
echo "===================================================="
echo ""

read -p "Enter your GitHub username: " USERNAME
if [ -z "$USERNAME" ]; then
  echo "A GitHub username is required."
  exit 1
fi

read -p "Enter your repository name [baos]: " REPONAME
REPONAME="${REPONAME:-baos}"

cd "$(dirname "$0")"

if ! command -v git &> /dev/null; then
  echo "Git is not installed. Get it at https://git-scm.com"
  exit 1
fi

if [ ! -d ".git" ]; then
  git init
  git branch -M main
  git remote add origin "https://github.com/$USERNAME/$REPONAME.git"
else
  git remote set-url origin "https://github.com/$USERNAME/$REPONAME.git" 2>/dev/null \
    || git remote add origin "https://github.com/$USERNAME/$REPONAME.git"
fi

git add -A

if git diff --cached --quiet; then
  echo ""
  echo "No changes to commit — your repo already matches this folder."
else
  git commit -m "Update BAOS"
fi

git push -u origin main

echo ""
echo "===================================================="
echo " SUCCESS! Pushed to https://github.com/$USERNAME/$REPONAME"
echo " If you set up the Vercel GitHub integration, it will"
echo " redeploy automatically in about a minute."
echo "===================================================="
