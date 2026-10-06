@echo off
cd /d "%~dp0"
set "NODE_EXE=C:\Users\RyanKamemoto\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; $paths = @('${env:ProgramFiles}\Google\Chrome\Application\chrome.exe', '${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe', '${env:LocalAppData}\Google\Chrome\Application\chrome.exe'); $chrome = $paths | Where-Object { Test-Path $_ } | Select-Object -First 1; if ($chrome) { Start-Process $chrome 'http://127.0.0.1:8765/stage6/stage6.html' }"
"%NODE_EXE%" local-server.js
pause
