# JWT Token Generator for TB Detection API
# Instructions for generating tokens signed with the JWT_SECRET from .env

Write-Host ""
Write-Host "JWT Token Generator for TB Detection API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "IMPORTANT: To get valid tokens, follow these steps:" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 1: Start your API server" -ForegroundColor Green
Write-Host "  npm run start:dev" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 2: Register Admin User (use REST API client)" -ForegroundColor Green
Write-Host "  POST http://localhost:3000/auth/register" -ForegroundColor Gray
Write-Host "  Content-Type: application/json" -ForegroundColor Gray
Write-Host "  Body: {" -ForegroundColor Gray
Write-Host '    "email": "admin@tbdetection.com",' -ForegroundColor Gray
Write-Host '    "password": "SecurePassword123!",' -ForegroundColor Gray
Write-Host '    "firstName": "Admin",' -ForegroundColor Gray
Write-Host '    "lastName": "User",' -ForegroundColor Gray
Write-Host '    "role": "admin",' -ForegroundColor Gray
Write-Host '    "phone": "+1234567890",' -ForegroundColor Gray
Write-Host '    "license": "ADM001",' -ForegroundColor Gray
Write-Host '    "specialization": "Hospital Admin"' -ForegroundColor Gray
Write-Host "  }" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 3: Register Physician User" -ForegroundColor Green
Write-Host "  POST http://localhost:3000/auth/register" -ForegroundColor Gray
Write-Host "  Body: {" -ForegroundColor Gray
Write-Host '    "email": "physician@tbdetection.com",' -ForegroundColor Gray
Write-Host '    "password": "SecurePassword123!",' -ForegroundColor Gray
Write-Host '    "firstName": "Dr.",' -ForegroundColor Gray
Write-Host '    "lastName": "Smith",' -ForegroundColor Gray
Write-Host '    "role": "physician",' -ForegroundColor Gray
Write-Host '    "specialization": "Pulmonologist",' -ForegroundColor Gray
Write-Host '    "license": "LIC123456",' -ForegroundColor Gray
Write-Host '    "phone": "+1234567891"' -ForegroundColor Gray
Write-Host "  }" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 4: Login Admin User" -ForegroundColor Green
Write-Host "  POST http://localhost:3000/auth/login" -ForegroundColor Gray
Write-Host "  Body: {" -ForegroundColor Gray
Write-Host '    "email": "admin@tbdetection.com",' -ForegroundColor Gray
Write-Host '    "password": "SecurePassword123!"' -ForegroundColor Gray
Write-Host "  }" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 5: Copy response tokens and update api.http" -ForegroundColor Green
Write-Host "  Copy accessToken into @adminToken" -ForegroundColor Gray
Write-Host "  Copy refreshToken into @adminRefreshToken" -ForegroundColor Gray
Write-Host ""

Write-Host "STEP 6: Do the same for Physician user" -ForegroundColor Green
Write-Host "  Login physician at /auth/login" -ForegroundColor Gray
Write-Host "  Copy tokens to @physicianToken and @physicianRefreshToken" -ForegroundColor Gray
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AUTHORIZATION RULES" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PHYSICIAN CAPABILITIES:" -ForegroundColor Yellow
Write-Host "  - Create new patients (linked to them)" -ForegroundColor Gray
Write-Host "  - View only their own patients" -ForegroundColor Gray
Write-Host "  - Upload X-rays for their patients" -ForegroundColor Gray
Write-Host "  - View diagnosis results for their patients" -ForegroundColor Gray
Write-Host "  - Cannot access other physicians' data" -ForegroundColor Gray
Write-Host ""

Write-Host "ADMIN CAPABILITIES:" -ForegroundColor Yellow
Write-Host "  - Full access to all resources" -ForegroundColor Gray
Write-Host "  - View all patients (all physicians)" -ForegroundColor Gray
Write-Host "  - Modify any patient record" -ForegroundColor Gray
Write-Host "  - Manage all users (create, delete, deactivate)" -ForegroundColor Gray
Write-Host "  - Access system settings" -ForegroundColor Gray
Write-Host "  - Moderate X-rays and results" -ForegroundColor Gray
Write-Host ""
