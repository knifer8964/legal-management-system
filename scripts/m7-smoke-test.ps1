# M7 Smoke Test
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$base = 'http://127.0.0.1:3000/api/v1'

# Login
$loginBody = @{ username = 'admin'; password = '123456' } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody
$token = $loginResp.data.token
Write-Host "[1] Login OK - token length: $($token.Length)"

$headers = @{ Authorization = "Bearer $token" }

# GET /users
Write-Host "`n[2] GET /users"
$usersResp = Invoke-RestMethod -Uri "$base/users" -Headers $headers
$usersResp | ConvertTo-Json -Depth 5

# GET /users/1
Write-Host "`n[3] GET /users/1"
$user1 = Invoke-RestMethod -Uri "$base/users/1" -Headers $headers
$user1 | ConvertTo-Json -Depth 5

# GET /users/roles
Write-Host "`n[4] GET /users/roles"
$rolesResp = Invoke-RestMethod -Uri "$base/users/roles" -Headers $headers
$rolesResp | ConvertTo-Json -Depth 3

# POST /users (create)
Write-Host "`n[5] POST /users (create testuser_m7)"
$createBody = @{
    username = 'testuser_m7'
    password = 'test123456'
    realName = 'M7测试用户'
    email    = 'm7test@test.com'
    roleId   = 2
} | ConvertTo-Json
$createResp = Invoke-RestMethod -Uri "$base/users" -Method Post -Headers $headers -ContentType 'application/json' -Body $createBody
$createResp | ConvertTo-Json -Depth 5
$testId = $createResp.data.id
Write-Host "Created user ID: $testId"

# PUT /users/:id (update)
Write-Host "`n[6] PUT /users/$testId"
$updateBody = @{
    realName = 'M7测试用户_已更新'
    phone    = '13800138000'
} | ConvertTo-Json
$updateResp = Invoke-RestMethod -Uri "$base/users/$testId" -Method Put -Headers $headers -ContentType 'application/json' -Body $updateBody
$updateResp | ConvertTo-Json -Depth 5

# POST /users/:id/reset-password
Write-Host "`n[7] POST /users/$testId/reset-password"
$resetBody = @{ newPassword = 'newpass123' } | ConvertTo-Json
$resetResp = Invoke-RestMethod -Uri "$base/users/$testId/reset-password" -Method Post -Headers $headers -ContentType 'application/json' -Body $resetBody
$resetResp | ConvertTo-Json -Depth 3

# DELETE /users/:id
Write-Host "`n[8] DELETE /users/$testId"
$delResp = Invoke-RestMethod -Uri "$base/users/$testId" -Method Delete -Headers $headers
$delResp | ConvertTo-Json -Depth 3

Write-Host "`n=== All M7 smoke tests passed ==="
