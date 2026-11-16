@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\next\dist\bin\next" (
  call npm.cmd ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Open http://localhost:3001 after the server reports Ready.
call npm.cmd run dev -- --port 3001
pause
