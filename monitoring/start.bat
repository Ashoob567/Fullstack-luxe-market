@echo off
REM Quick start script for Luxe Market monitoring (Windows)

echo ===================================
echo Luxe Market - Monitoring Setup
echo ===================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo X Error: Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Start monitoring stack
echo Starting Prometheus and Grafana...
docker-compose up -d

REM Wait for services to be ready
echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker ps | findstr "luxe-prometheus" >nul
if errorlevel 1 (
    echo.
    echo X Error: Services failed to start
    echo Check logs with: docker-compose logs
    pause
    exit /b 1
)

echo.
echo [OK] Monitoring stack is ready!
echo.
echo ===================================
echo Access Points:
echo ===================================
echo Grafana:    http://localhost:3000
echo    Username:   admin
echo    Password:   admin
echo.
echo Prometheus: http://localhost:9090
echo.
echo Django Metrics: http://localhost:8000/metrics
echo.
echo ===================================
echo Next Steps:
echo ===================================
echo 1. Make sure Django is running: python manage.py runserver
echo 2. Open Grafana at http://localhost:3000
echo 3. Navigate to Dashboards -^> Luxe Market - Overview
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause
