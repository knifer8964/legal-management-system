[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$mysqlPaths = @(
    'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
    'C:\Program Files (x86)\MySQL\MySQL Server 8.4\bin\mysqld.exe'
    'C:\mysql-8.4.9-winx64\bin\mysqld.exe'
    'C:\tools\mysql\bin\mysqld.exe'
    'C:\mysqld.exe'
    'C:\xampp\mysql\bin\mysqld.exe'
    'C:\wamp\bin\mysql\mysql8.4.9\bin\mysqld.exe'
)
$redisPaths = @(
    'C:\Program Files\Redis\redis-server.exe'
    'C:\redis\redis-server.exe'
    'C:\tools\redis\redis-server.exe'
    'C:\Redis-x64-3.0.504\redis-server.exe'
)
foreach ($p in $mysqlPaths) { if (Test-Path $p) { Write-Output ('FOUND_MYSQL:' + $p) } }
foreach ($p in $redisPaths) { if (Test-Path $p) { Write-Output ('FOUND_REDIS:' + $p) } }
