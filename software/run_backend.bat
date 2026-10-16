@echo off
echo ========================================================
echo Starting Smart Inventory & POS Backend (FastAPI + SQLite)
echo URL: http://127.0.0.1:8000
echo Docs: http://127.0.0.1:8000/docs
echo ========================================================
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
