﻿# scripts/restore.ps1 - 数据库还原脚本
# 用法: .\restore.ps1 -BackupFile <备份文件路径> [-Force]
param(
    [Parameter(Mandatory=True)]
    [string]$BackupFile,
    [switch]$Force
)

# 加载 .env 文件
function Load-EnvFile {
    param([string]`)
    if (-not (Test-Path $envFile)) { return @{} }
    $envVars = @{}
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
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

# 检查备份文件
if (-not (Test-Path $BackupFile)) {
    Write-Error "备份文件不存在: $BackupFile"
    exit 1
}

# 解压（如果是 .gz）
$sqlFile = $BackupFile
if ($BackupFile -match '\.gz$') {
    Write-Host "解压备份文件..." -ForegroundColor Cyan
    $sqlFile = $BackupFile -replace '\.gz$', ''
    $gzipStream = [System.IO.Compression.GzipStream]::new(
        [System.IO.File]::OpenRead($BackupFile),
        [System.IO.Compression.CompressionMode]::Decompress
    )
    $fileStream = [System.IO.File]::OpenWrite($sqlFile)
    $gzipStream.CopyTo($fileStream)
    $gzipStream.Close()
    $fileStream.Close()
    Write-Host "解压完成: $sqlFile"
}

# 确认还原
if (-not $Force) {
    $confirm = Read-Host "⚠️  将覆盖数据库 []，确认继续? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "已取消"
        if (Test-Path $sqlFile) { Remove-Item $sqlFile -Force }
        exit 0
    }
}

Write-Host "开始还原数据库: $dbName" -ForegroundColor Cyan

# 执行还原
$mysql = "mysql"
$args = @(
    "--user=$dbUser",
    "--password=$dbPass",
    "--host=$dbHost",
    "--port=$dbPort",
    "$dbName"
)

try {
    Get-Content $sqlFile | & $mysql @args
    Write-Host "✅ 还原完成" -ForegroundColor Green
} catch {
    Write-Error "还原失败: $_"
    exit 1
} finally {
    # 清理临时解压文件
    if ($BackupFile -match '\.gz$' -and (Test-Path $sqlFile)) {
        Remove-Item $sqlFile -Force
    }
}