@echo off
setlocal
cd /d "%~dp0"
py -3 --version >nul 2>nul
if not errorlevel 1 goto use_py
python --version >nul 2>nul
if not errorlevel 1 goto use_python
echo Python 3 no esta disponible. Instala Python y vuelve a intentarlo.
pause
exit /b 1
:use_py
py -3 iniciar.py
goto finish
:use_python
python iniciar.py
:finish
if errorlevel 1 pause
