@echo off
title Canteen Management System

REM Start backend hidden (no window visible)
start /min /b node "D:\Projects\Canteen\Canteen\canteen-back\dist\server.js"

REM Wait a few seconds for server to start
timeout /t 5 >nul

REM Open browser
start http://localhost:5000

exit