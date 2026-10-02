@echo off
net start MySQL80
start "" /B "C:\Program Files\nodejs\node.exe" "%~dp0dist\win-unpacked\resources\server\index.js"
timeout /t 3 /nobreak >nul
start "" "%~dp0dist\win-unpacked\MAKLADA PFE PROJECT.exe"