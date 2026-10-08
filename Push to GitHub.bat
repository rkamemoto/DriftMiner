@echo off
setlocal
cd /d "%~dp0"

rem Which branch are we on?
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
echo Branch: %BRANCH%
echo.

rem Show what will be saved
git status --short
echo.

rem Stop if any new/changed file is too big for GitHub (100 MB limit)
powershell -NoProfile -Command "$big = git ls-files -o -m --exclude-standard | Where-Object { (Test-Path -LiteralPath $_) -and (Get-Item -LiteralPath $_).Length -gt 95MB }; if ($big) { Write-Host 'These files are over 95 MB and GitHub will reject them:' -ForegroundColor Red; $big | ForEach-Object { Write-Host ('  ' + $_) -ForegroundColor Red }; Write-Host 'Export them smaller (e.g. MP3) or move them out of the folder, then run this again.'; exit 1 }"
if errorlevel 1 goto :done

rem Add everything (new, changed, deleted)
git add -A

rem Commit only if there is something to commit
git diff --cached --quiet
if not errorlevel 1 (
  echo Nothing new to commit.
) else (
  set "MSG="
  set /p "MSG=Commit message (press Enter for an automatic one): "
  if not defined MSG set "MSG=Update from %COMPUTERNAME% on %DATE% %TIME%"
  call git commit -m "%%MSG%%"
  if errorlevel 1 goto :fail
)
echo.

rem Push; if GitHub has newer commits, merge them in first and try again
git push -u origin %BRANCH%
if not errorlevel 1 goto :ok
echo.
echo Push was rejected - pulling the latest changes from GitHub and retrying...
git pull --no-rebase --no-edit origin %BRANCH%
if errorlevel 1 (
  echo.
  echo The pull hit a merge conflict. Ask Claude for help before doing anything else.
  goto :fail
)
git push -u origin %BRANCH%
if errorlevel 1 goto :fail

:ok
echo.
echo Done - everything is on GitHub.
goto :done

:fail
echo.
echo Something went wrong. Copy the messages above and send them to Claude.

:done
echo.
pause
