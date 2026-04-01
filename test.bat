@echo off
REM TB Detection API - Quick Test Script (Windows Batch)
REM Usage: Run from Eafia\api directory: test.bat

setlocal enabledelayedexpansion
cls

echo ==========================================
echo TB Detection API - Test Suite (Windows)
echo ==========================================
echo.

REM Configuration
set API_URL=http://localhost:3000
set ML_SERVICE_URL=http://localhost:5000
set PASSED=0
set FAILED=0

color 0A
echo.
echo ---- HEALTH ^& CONNECTIVITY ----
echo.

REM Test API Health
echo Testing: API Health...
curl -s -o nul -w "%%{http_code}" %API_URL%/ >temp_http_code.txt
set /p HTTP_CODE=<temp_http_code.txt
if "!HTTP_CODE!"=="200" (
    echo [PASS] API Health
    set /a PASSED=!PASSED!+1
) else (
    echo [FAIL] API Health (HTTP !HTTP_CODE!)
    set /a FAILED=!FAILED!+1
)

REM Test Swagger
echo Testing: API Swagger...
curl -s -o nul -w "%%{http_code}" %API_URL%/api >temp_http_code.txt
set /p HTTP_CODE=<temp_http_code.txt
if "!HTTP_CODE!"=="200" (
    echo [PASS] Swagger Docs
    set /a PASSED=!PASSED!+1
) else (
    echo [FAIL] Swagger Docs (HTTP !HTTP_CODE!)
    set /a FAILED=!FAILED!+1
)

REM Test ML Service Health
echo Testing: ML Service Health...
curl -s -o nul -w "%%{http_code}" %ML_SERVICE_URL%/health >temp_http_code.txt
set /p HTTP_CODE=<temp_http_code.txt
if "!HTTP_CODE!"=="200" (
    echo [PASS] ML Service Health
    set /a PASSED=!PASSED!+1
) else (
    echo [FAIL] ML Service Health (not running?)
    set /a FAILED=!FAILED!+1
)

echo.
echo ---- AUTHENTICATION ----
echo.

REM User Registration
echo Testing: User Registration...
(
    echo {
    echo   "email": "admin.test@tbdetection.com",
    echo   "password": "TestPassword123!",
    echo   "firstName": "Admin",
    echo   "lastName": "Test",
    echo   "role": "admin"
    echo }
) > temp_register.json

curl -s -X POST %API_URL%/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d @temp_register.json -o nul -w "%%{http_code}" >temp_http_code.txt

set /p HTTP_CODE=<temp_http_code.txt
if "!HTTP_CODE!"=="201" (
    echo [PASS] User Registration
    set /a PASSED=!PASSED!+1
) else if "!HTTP_CODE!"=="200" (
    echo [PASS] User Registration
    set /a PASSED=!PASSED!+1
) else (
    echo [FAIL] User Registration (HTTP !HTTP_CODE!)
    set /a FAILED=!FAILED!+1
)

REM User Login
echo Testing: User Login...
(
    echo {
    echo   "email": "admin.test@tbdetection.com",
    echo   "password": "TestPassword123!"
    echo }
) > temp_login.json

curl -s -X POST %API_URL%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d @temp_login.json >temp_login_response.json

for /f "delims=" %%A in ('findstr "access_token" temp_login_response.json') do (
    set "TOKEN_LINE=%%A"
)

if defined TOKEN_LINE (
    echo [PASS] User Login
    set /a PASSED=!PASSED!+1
    REM Extract token (simplified - actual extraction more complex)
) else (
    echo [FAIL] User Login (no token)
    set /a FAILED=!FAILED!+1
)

echo.
echo ---- DATABASE ^& USERS ----
echo.

REM Get Users (requires token - simplified)
echo Testing: Get Users...
echo [SKIP] Requires valid token extraction (see api.http for full test)
echo.

echo ---- ML SERVICE INTEGRATION ----
echo.

REM Test TB Prediction (Direct)
echo Testing: Direct ML TB Prediction...
(
    echo {
    echo   "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAAIABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z"
    echo }
) > temp_predict.json

curl -s -X POST %ML_SERVICE_URL%/predict/tb ^
  -H "Content-Type: application/json" ^
  -d @temp_predict.json >temp_predict_response.json

findstr "tb_detected" temp_predict_response.json >nul
if !errorlevel! equ 0 (
    echo [PASS] TB Prediction
    set /a PASSED=!PASSED!+1
) else (
    echo [FAIL] TB Prediction (ML Service not running)
    set /a FAILED=!FAILED!+1
)

REM Test X-Ray Validation (Direct)
echo Testing: Direct ML X-Ray Validation...

curl -s -X POST %ML_SERVICE_URL%/validate/xray ^
  -H "Content-Type: application/json" ^
  -d @temp_predict.json >temp_validate_response.json

findstr "is_xray" temp_validate_response.json >nul
if !errorlevel! equ 0 (
    echo [PASS] X-Ray Validation
    set /a PASSED=!PASSED!+1
) else (
    echo [FAIL] X-Ray Validation (ML Service not running)
    set /a FAILED=!FAILED!+1
)

echo.
echo ==========================================
echo TEST SUMMARY
echo ==========================================
echo.

set /a TOTAL=!PASSED!+!FAILED!
echo Total Tests Run: !TOTAL!
echo Passed: !PASSED!
echo Failed: !FAILED!

echo.
echo ==========================================
echo TROUBLESHOOTING
echo ==========================================
echo.

if !FAILED! gtr 0 (
    color 0C
    echo [!] Some tests failed. Check:
    echo.
    echo 1. Is Backend running?
    echo    pnpm start:dev
    echo.
    echo 2. Is ML Service running?
    echo    python cnn_models/api.py
    echo.
    echo 3. Is Database connected?
    echo    pnpm db:info
    echo.
    echo For more details, see: ML_SYNC_TESTING.md
) else (
    color 0A
    echo [✓] All tests passed!
    echo.
    echo Your TB Detection API is ready for:
    echo - Creating patient records
    echo - Uploading X-ray images
    echo - Running TB predictions
    echo - Viewing diagnosis results
    echo.
    echo For detailed testing, see:
    echo - api.http (Interactive REST Client tests)
    echo - ML_SYNC_TESTING.md (Detailed procedures)
)

echo.
echo Press any key to exit...
pause >nul

REM Cleanup
del /q temp_*.txt 2>nul
del /q temp_*.json 2>nul

endlocal
