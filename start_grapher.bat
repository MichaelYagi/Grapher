@echo off 
cd /d "%~dp0" 
call .venv\Scripts\activate.bat 
python backend\src\main.py 
pause
