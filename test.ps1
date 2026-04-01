# TB Detection API - Quick Test Script (Windows PowerShell)
# Usage: Run from Eafia\api directory: .\test.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TB Detection API - Test Suite (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = "http://localhost:3000"
$ML_SERVICE_URL = "http://localhost:5000"
$TIMEOUT = 10

# Track test results
$PASSED = 0
$FAILED = 0

# Test function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [string]$Body = $null,
        [int]$ExpectedCode = 200
    )
    
    Write-Host -NoNewline "Testing: $Name ... "
    
    try {
        $params = @{
            Uri         = $Uri
            Method      = $Method
            ContentType = "application/json"
            TimeoutSec  = $TIMEOUT
        }
        
        if ($Body) {
            $params['Body'] = $Body
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $httpCode = $response.StatusCode
        
        if ($httpCode -eq $ExpectedCode -or $httpCode -eq 200 -or $httpCode -eq 201) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $httpCode)"
            $script:PASSED++
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (HTTP $httpCode)"
            $script:FAILED++
        }
    }
    catch {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " (Error: $($_.Exception.Message))"
        $script:FAILED++
    }
}

# Section 1: Health & Connectivity
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "1. HEALTH & CONNECTIVITY" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

Test-Endpoint "API Health" "GET" "$API_URL/"
Test-Endpoint "API Swagger" "GET" "$API_URL/api"

Write-Host -NoNewline "Testing: ML Service Health ... "
try {
    $mlResponse = Invoke-WebRequest -Uri "$ML_SERVICE_URL/health" `
        -Method GET `
        -ContentType "application/json" `
        -TimeoutSec $TIMEOUT -ErrorAction Stop
    if ($mlResponse.StatusCode -eq 200) {
        Write-Host "✓ PASS" -ForegroundColor Green
        $script:PASSED++
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " (Is Python ML service running?)"
    $script:FAILED++
}

# Section 2: Authentication
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "2. AUTHENTICATION" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$registerData = @{
    email     = "admin.test@tbdetection.com"
    password  = "TestPassword123!"
    firstName = "Admin"
    lastName  = "Test"
    role      = "admin"
} | ConvertTo-Json

Test-Endpoint "Register User" "POST" "$API_URL/api/auth/register" $registerData "201"

# Login
$loginData = @{
    email    = "admin.test@tbdetection.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Write-Host -NoNewline "Testing: User Login ... "
try {
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -TimeoutSec $TIMEOUT -ErrorAction Stop
    
    $loginContent = $loginResponse.Content | ConvertFrom-Json
    $TOKEN = $loginContent.access_token
    
    if ($TOKEN) {
        Write-Host "✓ PASS" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " (Could not extract token)"
        $script:FAILED++
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " (Login error)"
    $script:FAILED++
}

# Section 3: Users Module
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "3. USERS MODULE" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

Write-Host -NoNewline "Testing: Get All Users ... "
try {
    $usersResponse = Invoke-WebRequest -Uri "$API_URL/api/users" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -ContentType "application/json" `
        -TimeoutSec $TIMEOUT -ErrorAction Stop
    
    if ($usersResponse.Content -like "*id*") {
        Write-Host "✓ PASS" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:FAILED++
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " (Error: $($_.Exception.Message))"
    $script:FAILED++
}

# Section 4: ML Model Endpoints
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "4. ML MODEL INTEGRATION" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Sample base64 image (small test image)
$TEST_IMAGE = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAAIABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z"

# Test X-Ray Validation (Direct ML Service)
Write-Host -NoNewline "Testing: Direct ML X-Ray Validation ... "
try {
    $validationRequest = @{ image_base64 = $TEST_IMAGE } | ConvertTo-Json
    $validationResponse = Invoke-WebRequest -Uri "$ML_SERVICE_URL/validate/xray" `
        -Method POST `
        -ContentType "application/json" `
        -Body $validationRequest `
        -TimeoutSec $TIMEOUT -ErrorAction Stop
    
    if ($validationResponse.Content -like "*is_xray*") {
        Write-Host "✓ PASS" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:FAILED++
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " (ML Service might not be running)"
    $script:FAILED++
}

# Test TB Prediction (Direct ML Service)
Write-Host -NoNewline "Testing: Direct ML TB Prediction ... "
try {
    $predictionRequest = @{ image_base64 = $TEST_IMAGE } | ConvertTo-Json
    $predictionResponse = Invoke-WebRequest -Uri "$ML_SERVICE_URL/predict/tb" `
        -Method POST `
        -ContentType "application/json" `
        -Body $predictionRequest `
        -TimeoutSec $TIMEOUT -ErrorAction Stop
    
    if ($predictionResponse.Content -like "*tb_detected*") {
        Write-Host "✓ PASS" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:FAILED++
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " (ML Service might not be running)"
    $script:FAILED++
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST SUMMARY" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$TOTAL = $PASSED + $FAILED

Write-Host "Total Tests: $TOTAL"
Write-Host "Passed: $PASSED" -ForegroundColor Green
if ($FAILED -gt 0) {
    Write-Host "Failed: $FAILED" -ForegroundColor Red
} else {
    Write-Host "Failed: $FAILED"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "NEXT STEPS" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

if ($FAILED -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "System is ready for:"
    Write-Host "1. Create patients via /api/patients"
    Write-Host "2. Upload X-rays via /api/xrays"
    Write-Host "3. Run TB predictions via /api/predict/tb/base64"
    Write-Host "4. View diagnosis results via /api/diagnosis-results"
    Write-Host ""
    Write-Host "For detailed testing, see: api.http and ML_SYNC_TESTING.md"
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "1. Is Backend running?      pnpm start:dev"
    Write-Host "2. Is ML Service running?   python cnn_models/api.py"
    Write-Host "3. Is Database connected?   pnpm db:info"
    Write-Host "4. Check logs for errors"
    Write-Host ""
    Write-Host "For detailed info: ML_SYNC_TESTING.md"
}

Write-Host ""
