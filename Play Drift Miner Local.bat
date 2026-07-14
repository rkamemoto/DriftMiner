@echo off
cd /d "%~dp0"
set "NODE_EXE=C:\Users\RyanKamemoto\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"
echo Drift Miner will run at:
echo http://127.0.0.1:8765/index.html
echo.
echo Keep this window open, then reload that address in the browser.
echo.
"%NODE_EXE%" local-server.js
pause
