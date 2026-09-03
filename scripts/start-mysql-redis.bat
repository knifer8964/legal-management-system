@echo off
chcp 65001 >nul
start /b "MySQL84" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file=C:\my.ini --console > "C:\Users\gate\.qclaw\workspace-agent-d64c8186\legal-management-system\logs\mysql.log" 2>&1
start /b "Redis" "C:\Program Files\Redis\redis-server.exe" > "C:\Users\gate\.qclaw\workspace-agent-d64c8186\legal-management-system\logs\redis.log" 2>&1
