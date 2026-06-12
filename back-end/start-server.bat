@echo off
echo Starting Django backend server...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if Django is installed
python -c "import django" 2>nul
if errorlevel 1 (
    echo ERROR: Django not found in virtual environment
    echo Please run: pip install -r requirements/development.txt
    pause
    exit /b 1
)

REM Apply migrations (in case not done)
echo Checking migrations...
python manage.py migrate --noinput

REM Start server
echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop
echo.
python manage.py runserver
