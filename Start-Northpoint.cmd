@echo off
where node >nul 2>&1
if errorlevel 1 (
  echo Northpoint needs Node.js 24 or later.
  pause
  exit /b 1
)
if not exist "%~dp0node_modules\express\package.json" (
  echo In this folder, run npm ci once to install Northpoint's dependencies.
  pause
  exit /b 1
)
node "%~dp0serve.mjs" --open
if errorlevel 1 pause
