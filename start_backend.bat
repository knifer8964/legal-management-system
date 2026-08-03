@echo off
cd /d "C:\Users\gate\.qclaw\workspace-agent-d64c8186\legal-management-system\backend"
echo [%date% %time%] Starting backend...
node dist/index.js
pause
