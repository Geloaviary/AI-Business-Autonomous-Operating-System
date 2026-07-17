@echo off
title BAOS — Auto GitHub Updater
color 0A
echo.
echo  ====================================================
echo   BAOS — Auto GitHub Updater
echo  ====================================================
echo.
set /p USERNAME= Enter your GitHub username and press Enter:
if "%USERNAME%"=="" (echo A GitHub username is required. & pause & exit)
set /p REPONAME= Enter your repository name [baos] and press Enter:
if "%REPONAME%"=="" set REPONAME=baos
echo.
cd /d "%~dp0"
git --version >nul 2>&1
if %errorlevel% neq 0 (echo Git not installed. Get it at git-scm.com & pause & exit)
if not exist ".git" (
  git init
  git branch -M main
  git remote add origin https://github.com/%USERNAME%/%REPONAME%.git
) else (
  git remote set-url origin https://github.com/%USERNAME%/%REPONAME%.git 2>nul || git remote add origin https://github.com/%USERNAME%/%REPONAME%.git
)
git add -A
git diff --cached --quiet
if %errorlevel% equ 0 (
  echo No changes to commit — your repo already matches this folder.
) else (
  git commit -m "Update BAOS"
)
git push -u origin main
echo.
echo  ====================================================
echo   SUCCESS! Pushed to https://github.com/%USERNAME%/%REPONAME%
echo   If you set up the Vercel GitHub integration, it will
echo   redeploy automatically in about a minute.
echo  ====================================================
echo.
pause
