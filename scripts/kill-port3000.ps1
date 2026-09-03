# 杀掉占用3000端口的进程
$conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
foreach ($c in $conns) {
    $pid = $c.OwningProcess
    if ($pid) {
        Write-Host "Killing PID $pid on port 3000"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Done"
