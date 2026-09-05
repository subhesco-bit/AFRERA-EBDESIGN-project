@echo off
REM PostgreSQL Manager Script for EBDESIGN
REM Version: 1.0 | Date: 2026-09-04

setlocal enabledelayedexpansion

set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
set "DATA_DIR=C:\pgdata"
set "LOG_FILE=%DATA_DIR%\pg.log"

cls
echo.
echo ========================================
echo   PostgreSQL Manager for EBDESIGN
echo ========================================
echo.
echo 1. Start PostgreSQL
echo 2. Stop PostgreSQL
echo 3. Check Status
echo 4. Restart PostgreSQL
echo 5. Create Database (ebdesign)
echo 6. Connect to Database
echo 7. View Logs
echo 8. Exit
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto start_pg
if "%choice%"=="2" goto stop_pg
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto restart_pg
if "%choice%"=="5" goto create_db
if "%choice%"=="6" goto connect_db
if "%choice%"=="7" goto view_logs
if "%choice%"=="8" exit /b 0

echo Invalid choice. Exiting.
pause
exit /b 1

:start_pg
cls
echo Starting PostgreSQL...
"%PG_BIN%\pg_ctl.exe" -D "%DATA_DIR%" -l "%LOG_FILE%" start
echo.
timeout /t 3
goto check_status

:stop_pg
cls
echo Stopping PostgreSQL...
"%PG_BIN%\pg_ctl.exe" -D "%DATA_DIR%" stop
echo PostgreSQL stopped.
pause
exit /b 0

:check_status
cls
echo Checking PostgreSQL status...
echo.
"%PG_BIN%\pg_ctl.exe" -D "%DATA_DIR%" status
echo.
echo Checking port 5432...
netstat -ano | findstr ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 5432 is LISTENING
) else (
    echo Port 5432 is NOT LISTENING
)
echo.
pause
goto start

:restart_pg
cls
echo Restarting PostgreSQL...
"%PG_BIN%\pg_ctl.exe" -D "%DATA_DIR%" restart
echo.
timeout /t 3
goto check_status

:create_db
cls
echo Creating 'ebdesign' database...
"%PG_BIN%\createdb.exe" -U postgres -h localhost ebdesign
if %errorlevel% equ 0 (
    echo Database 'ebdesign' created successfully!
) else (
    echo Failed to create database.
)
echo.
pause
goto start

:connect_db
cls
echo Connecting to PostgreSQL...
echo.
"%PG_BIN%\psql.exe" -U postgres -h localhost -d postgres
goto start

:view_logs
cls
echo Recent PostgreSQL Logs:
echo.
if exist "%LOG_FILE%" (
    powershell -Command "Get-Content '%LOG_FILE%' -Tail 30"
) else (
    echo Log file not found at: %LOG_FILE%
)
echo.
pause
goto start

:start
pause
cls
goto main_menu

:main_menu
cls
echo.
echo ========================================
echo   PostgreSQL Manager for EBDESIGN
echo ========================================
echo.
echo 1. Start PostgreSQL
echo 2. Stop PostgreSQL
echo 3. Check Status
echo 4. Restart PostgreSQL
echo 5. Create Database (ebdesign)
echo 6. Connect to Database
echo 7. View Logs
echo 8. Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto start_pg
if "%choice%"=="2" goto stop_pg
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto restart_pg
if "%choice%"=="5" goto create_db
if "%choice%"=="6" goto connect_db
if "%choice%"=="7" goto view_logs
if "%choice%"=="8" exit /b 0

echo Invalid choice. Exiting.
pause
exit /b 1
