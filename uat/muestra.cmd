@echo off
rem Doble clic: levanta el entorno de la muestra y abre Playwright UI y Cypress.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0muestra.ps1"
if errorlevel 1 (
  echo.
  echo Algo salio mal: lee el mensaje de arriba ^(en rojo^) y mandale una foto a Lucas.
)
pause
