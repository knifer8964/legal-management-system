﻿# scripts/backup.ps1 - 数据库备份脚本
# 用法: .\backup.ps1 [-OutputDir <备份目录>] [-RetainDays <保留天数>]
param(
    [string]$OutputDir = "..\backups",
    [int]$RetainDays = 30
)

# 加载 .env 文件
function Load-EnvFile {
    param([string]$envFile)
    if (-not (Test-Path $envFile)) { return @{} }
    $envVars = @{}
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$) {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
        }
    }
    return $envVars
}

$envFile = Join-Path $PSScriptRoot "..\.env"
$envVars = Load-EnvFile -envFile $envFile

# 解析数据库连接信息
$dbUrl = $envVars["DATABASE_URL"]
if (-not $dbUrl) {
    Write-Error "未找到 DATABASE_URL，请检查 .env 文件"
    exit 1
}

# 解析 mysql://user:pass@host:port/dbname
if ($dbUrl -match 'mysql://([^:]+):([^@]+)@([^:]+):?(\d+)?/([^?]+)') {
    $dbUser = $matches[1]
    $dbPass = $matches[2]
    $dbHost = $matches[3]
    $dbPort = if ($matches[4]) { $matches[4] } else { 3306 }
    $dbName = $matches[5]
} else {
    Write-Error "无法解析 DATABASE_URL"
    exit 1
}

# 创建备份目录
$backupDir = Join-Path $PSScriptRoot $OutputDir
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# 生成备份文件名
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $backupDir "backup_$dbName.$timestamp.sql"
$backupFileCompressed = "$backupFile.gz"

Write-Host "开始备份数据库: $dbName" -ForegroundColor Cyan
Write-Host "备份文件: $backupFileCompressed"

# 执行备份
$mysqldump = "mysqldump"
$args = @(
    "--user=$dbUser",
    "--password=$dbPass",
    "--host=$dbHost",
    "--port=$dbPort",
    "--single-transaction",
    "--routines",
    "--triggers",
    "$dbName"
)

try {
    & $mysqldump @args | Out-File -FilePath $backupFile -Encoding UTF8
    
    # 压缩备份文件
    if (Test-Path $backupFile) {
        Write-Host "压缩备份文件..." -ForegroundColor Cyan
        $gzipStream = [System.IO.Compression.GzipStream]::new(
            [System.IO.File]::OpenWrite($backupFileCompressed),
            [System.IO.Compression.CompressionMode]::Compress
        )
        $fileStream = [System.IO.File]::OpenRead($backupFile)
        $fileStream.CopyTo($gzipStream)
        $gzipStream.Close()
        $fileStream.Close()
        Remove-Item $backupFile
        
        Write-Host "✅ 备份完成: $backupFileCompressed" -ForegroundColor Green
        Write-Host "文件大小: $((Get-Item $backupFileCompressed).Length / 1MB) MB"
    }
} catch {
    Write-Error "备份失败: $_"
    exit 1
}

# 删除过期备份
Write-Host "清理 $RetainDays 天前的备份..." -ForegroundColor Cyan
$cutoffDate = (Get-Date).AddDays(-$RetainDays)
Get-ChildItem -Path $backupDir -Filter "backup_*.sql.gz" | Where-Object {
    $_.CreationTime -lt $cutoffDate
} | ForEach-Object {
    Write-Host "删除过期备份: $($_.Name)"
    Remove-Item $_.FullName -Force
}

Write-Host "✅ 备份任务完成" -ForegroundColor Green