@echo off
chcp 65001 >nul
echo === M7 Smoke Test ===

echo.
echo [1] Login as admin
curl -s -X POST http://127.0.0.1:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"123456\"}" > %TEMP%\m7_login.json
type %TEMP%\m7_login.json
echo.

for /f "tokens=*" %%a in ('powershell -Command "(Get-Content %TEMP%\m7_login.json | ConvertFrom-Json).data.token"') do set TOKEN=%%a
echo Token: %TOKEN%

echo.
echo [2] GET /api/v1/users (list)
curl -s http://127.0.0.1:3000/api/v1/users -H "Authorization: Bearer %TOKEN%"
echo.

echo.
echo [3] GET /api/v1/users/1 (detail)
curl -s http://127.0.0.1:3000/api/v1/users/1 -H "Authorization: Bearer %TOKEN%"
echo.

echo.
echo [4] GET /api/v1/users/roles
curl -s http://127.0.0.1:3000/api/v1/users/roles -H "Authorization: Bearer %TOKEN%"
echo.

echo.
echo [5] POST /api/v1/users (create test user)
curl -s -X POST http://127.0.0.1:3000/api/v1/users -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"username\":\"testuser_m7\",\"password\":\"test123456\",\"realName\":\"M7测试用户\",\"email\":\"m7test@test.com\",\"roleId\":2}"
echo.

echo.
echo [6] PUT /api/v1/users (update test user - find by username)
for /f "tokens=*" %%a in ('powershell -Command "(curl -s http://127.0.0.1:3000/api/v1/users -H 'Authorization: Bearer %TOKEN%' | ConvertFrom-Json).data | Where-Object {$_.username -eq 'testuser_m7'} | Select-Object -ExpandProperty id"') do set TESTID=%%a
echo Test user ID: %TESTID%
curl -s -X PUT http://127.0.0.1:3000/api/v1/users/%TESTID% -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"realName\":\"M7测试用户_已更新\",\"phone\":\"13800138000\"}"
echo.

echo.
echo [7] POST /api/v1/users/%TESTID%/reset-password
curl -s -X POST http://127.0.0.1:3000/api/v1/users/%TESTID%/reset-password -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"newPassword\":\"newpass123\"}"
echo.

echo.
echo [8] DELETE /api/v1/users/%TESTID%
curl -s -X DELETE http://127.0.0.1:3000/api/v1/users/%TESTID% -H "Authorization: Bearer %TOKEN%"
echo.

echo.
echo === Done ===
