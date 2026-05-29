@echo off
echo ==========================================
echo Starting CollabMind Development Stack...
echo ==========================================

REM Start Express backend
echo Starting backend server on port 5000...
start "CollabMind Backend Server" cmd /k "node server/server.js"

REM Start Vite client
echo Starting frontend client on port 5173...
start "CollabMind React Client" cmd /k "cd client && npx vite"

echo All services launched! Check the spawned terminal windows for logs.
echo Frontend URL: http://localhost:5173
echo Backend API:  http://localhost:5000
echo ==========================================
pause
