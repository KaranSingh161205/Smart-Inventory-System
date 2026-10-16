@echo off
echo ========================================================
echo Campus Hub Store - Smart Inventory & POS System
echo Launching Backend (Port 8000) and Frontend (Port 5173)...
echo ========================================================

start "Campus Hub Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "Campus Hub Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo - Main App: http://localhost:5173 (or http://127.0.0.1:8000)
echo - API Docs: http://127.0.0.1:8000/docs
echo.
pause
