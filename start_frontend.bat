@echo off
cd /d "C:\Users\gate\.qclaw\workspace-agent-d64c8186\legal-management-system\frontend"

REM Kill existing Vite process on port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /f /pid %%a 2>nul
)

echo [%date% %time%] Starting Vite dev server...
set NODE_OPTIONS=
npx vite --host 0.0.0.0 --port 5173 --strictPort
pause
