@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing PID %%a
    taskkill /f /pid %%a
)
echo Done
