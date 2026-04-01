# 🧪 Testing Guide - Eafia TB Detection API

Complete testing guide for the backend API with Swagger, cURL, and Postman examples.

---

## 📚 Table of Contents

1. [Swagger UI Testing](#swagger-ui-testing)
2. [cURL Testing](#curl-testing)
3. [Test Scenarios](#test-scenarios)
4. [Postman Collection Import](#postman-collection)
5. [Debugging Tips](#debugging-tips)

---

## 🎯 Swagger UI Testing

### Getting Started with Swagger

1. **Start the API:**
   ```bash
   npm run start:dev
   ```

2. **Open Swagger UI:**
   ```
   http://localhost:3000/api
   ```

3. **You should see:**
   - Interactive API documentation
   - All endpoints grouped by module
   - Try-it-out functionality
   - Request/response examples

### Authenticating in Swagger

1. **Register a User:**
   - Scroll to `/auth/register`
   - Click "Try it out"
   - Fill in example data:
     ```json
     {
       "email": "test@example.com",
       "firstName": "Test",
       "lastName": "User",
       "password": "TestPass123!",
       "role": "physician"
     }
     ```
   - Click "Execute"
   - Copy the `accessToken` from response

2. **Authorize Future Requests:**
   - Click the green "Authorize" button (top right)
   - Paste in the field: `Bearer <accessToken>`
   - Click "Authorize"
   - All subsequent requests will include your token

3. **Test Protected Endpoint:**
   - Now try `/users/:id` - GET endpoint
   - It should work with your token

---

## 🔧 cURL Testing

### Prerequisites

```bash
# For Windows, ensure curl is available
# macOS/Linux: Built-in
# Windows: Use PowerShell or Git Bash
```

### 1. Register User (cURL)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "firstName": "Dr",
    "lastName": "Smith",
    "password": "SecurePass123!",
    "role": "physician",
    "license": "MD12345",
    "specialization": "Radiologist",
    "phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "...",
    "email": "doctor@hospital.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "24h"
  },
  "statusCode": 201,
  "processingTimeMs": 245,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

**Save the token:**
```bash
# On Windows (PowerShell)
$token = "eyJhbGciOiJIUzI1NiIs..."

# On macOS/Linux (Bash)
token="eyJhbGciOiJIUzI1NiIs..."
```

### 2. Login User (cURL)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123!"
  }'
```

### 3. Get User Details (cURL - Requires Token)

```bash
# macOS/Linux
curl -X GET http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $token"

# Windows PowerShell
curl -X GET 'http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000' `
  -H "Authorization: Bearer $token"
```

### 4. Register Patient (cURL)

```bash
curl -X POST http://localhost:3000/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  }'
```

### 5. Upload X-Ray (cURL with Base64 Image)

```bash
# First, convert image to base64 (macOS/Linux)
base64 < xray_image.jpg | tr -d '\n' > xray_base64.txt

# Or use online tool: https://www.base64encode.org/

# Then upload:
curl -X POST http://localhost:3000/xrays \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{
    "patientId": "550e8400-e29b-41d4-a716-446655440100",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
    "fileName": "chest_xray.jpg",
    "fileType": "image/jpeg",
    "fileSizeBytes": 245000,
    "xrayType": "chest",
    "notes": "Follow-up chest X-ray"
  }'
```

---

## 📋 Test Scenarios

### Scenario 1: Complete Physician Workflow

```bash
#!/bin/bash
# Save as test_workflow.sh

API_URL="http://localhost:3000"

# 1. Register as Physician
echo "📝 Registering physician..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "firstName": "Dr",
    "lastName": "Smith",
    "password": "SecurePass123!",
    "role": "physician"
  }')

echo $REGISTER_RESPONSE | python3 -m json.tool

# Extract token (macOS/Linux)
TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "✅ Token obtained: $TOKEN"

# 2. Register a patient
echo ""
echo "🏥 Registering patient..."
PATIENT_RESPONSE=$(curl -s -X POST $API_URL/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "Male"
  }')

echo $PATIENT_RESPONSE | python3 -m json.tool

PATIENT_ID=$(echo $PATIENT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])")

echo "✅ Patient registered: $PATIENT_ID"

# 3. List all patients
echo ""
echo "👥 Listing all patients..."
curl -s -X GET $API_URL/patients \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 4. Get specific patient
echo ""
echo "👤 Getting patient details..."
curl -s -X GET $API_URL/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "✨ Workflow test completed!"
```

**Run the test:**
```bash
chmod +x test_workflow.sh
./test_workflow.sh
```

### Scenario 2: Admin User Management

```bash
#!/bin/bash
# Save as test_admin.sh

API_URL="http://localhost:3000"
ADMIN_TOKEN="<paste-your-admin-token>"

# 1. Get all users
echo "👥 Listing all users..."
curl -s -X GET $API_URL/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# 2. Deactivate a user
USER_ID="550e8400-e29b-41d4-a716-446655440000"
echo ""
echo "🔒 Deactivating user..."
curl -s -X PATCH $API_URL/users/$USER_ID/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# 3. Activate a user
echo ""
echo "🔓 Activating user..."
curl -s -X PATCH $API_URL/users/$USER_ID/activate \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

### Scenario 3: Full TB Diagnosis Workflow

```bash
#!/bin/bash
# Save as test_diagnosis_flow.sh

API_URL="http://localhost:3000"
TOKEN="<paste-your-token>"
PATIENT_ID="<patient-id>"

# 1. Upload X-Ray
echo "📸 Uploading X-ray..."
XRAY_RESPONSE=$(curl -s -X POST $API_URL/xrays \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "'$PATIENT_ID'",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
    "fileName": "chest_xray.jpg",
    "fileType": "image/jpeg",
    "fileSizeBytes": 245000,
    "xrayType": "chest"
  }')

echo $XRAY_RESPONSE | python3 -m json.tool

XRAY_ID=$(echo $XRAY_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])")

echo "✅ X-ray uploaded: $XRAY_ID"

# 2. Wait for validation (typically 2-5 seconds)
echo ""
echo "⏳ Waiting for X-ray validation..."
sleep 3

# 3. Get X-ray status
echo ""
echo "🔍 Checking X-ray status..."
curl -s -X GET $API_URL/xrays/$XRAY_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 4. Create diagnosis result
echo ""
echo "🔬 Creating diagnosis result..."
DIAGNOSIS_RESPONSE=$(curl -s -X POST $API_URL/diagnosis-results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "'$PATIENT_ID'",
    "xrayId": "'$XRAY_ID'",
    "diseaseType": "tuberculosis",
    "prediction": "TB_POSITIVE",
    "confidenceScore": 0.92,
    "confidenceLevel": "VERY_HIGH",
    "tbIntensity": "MODERATE",
    "affectedAreas": "Left upper lobe",
    "affectedPercentage": 35,
    "recommendations": "Start anti-TB therapy",
    "modelName": "tb_classifier_v2",
    "processingTimeMs": 1250
  }')

echo $DIAGNOSIS_RESPONSE | python3 -m json.tool

# 5. List patient diagnoses
echo ""
echo "📋 Listing patient diagnoses..."
curl -s -X GET $API_URL/diagnosis-results/patient/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "✨ Diagnosis workflow completed!"
```

---

## 📮 Postman Collection

### Import Collection to Postman

1. **Create Collection:**
   - Open Postman
   - Click "Collections" → "Create New Collection"
   - Name it "Eafia TB API"

2. **Create Requests:**

   **Request 1: Register User**
   - Method: `POST`
   - URL: `http://localhost:3000/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "doctor@hospital.com",
       "firstName": "Dr",
       "lastName": "Smith",
       "password": "SecurePass123!",
       "role": "physician"
     }
     ```
   - Tests (add to verify response):
     ```javascript
     pm.test("Status is 201", () => {
       pm.response.to.have.status(201);
     });

     pm.test("Has access token", () => {
       pm.expect(pm.response.json().data).to.have.property("accessToken");
     });

     // Save token for next requests
     pm.environment.set("access_token", pm.response.json().data.accessToken);
     ```

   **Request 2: Get Current User**
   - Method: `GET`
   - URL: `http://localhost:3000/users/{{user_id}}`
   - Headers:
     - `Authorization: Bearer {{access_token}}`
   - Tests:
     ```javascript
     pm.test("Status is 200", () => {
       pm.response.to.have.status(200);
     });

     pm.test("Has user data", () => {
       pm.expect(pm.response.json().data).to.have.property("email");
     });
     ```

3. **Set Environment Variables:**
   - Click gear icon → "Manage Environments"
   - Create new environment "Local Development"
   - Add variables:
     ```
     base_url: http://localhost:3000
     access_token: <will-be-set-by-register-request>
     user_id: <will-be-set-by-register-request>
     ```

4. **Run Collection:**
   - Select collection
   - Click "Run" button
   - Execute requests in order

---

## 🐛 Debugging Tips

### 1. Check API is Running

```bash
# Quick health check
curl http://localhost:3000

# Should return 404 (endpoint not found) or homepage, not connection refused
```

### 2. View Detailed Logs

```bash
# In your terminal running `npm run start:dev`, you'll see:
[Nest] 12345 -- 03/30/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345 -- 03/30/2026, 10:30:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
...
```

### 3. Test Database Connection

```bash
# Check if database is accessible
psql "postgresql://user:password@localhost:5432/eafia_tb_detection" -c "SELECT 1"

# Or for Neon Serverless
psql "postgresql://user:password@ep-xxx.neon.tech/eafia_tb_detection?sslmode=require" -c "SELECT 1"
```

### 4. Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | API not running | Run `npm run start:dev` |
| `Cannot find module` | Dependencies not installed | Run `npm install` |
| `database does not exist` | Database not created | Create database manually |
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running | Start PostgreSQL service |
| `401 Unauthorized` | Missing or invalid token | Check Authorization header |
| `403 Forbidden` | Insufficient permissions | Check user role |

### 5. Test Token Validity

```bash
# Decode JWT token (online at https://jwt.io/)
# Or use online decoder to view:
# - exp (expiration time)
# - sub (user ID)
# - email (user email)
# - role (user role)
```

### 6. Enable Verbose Logging

Update `src/main.ts` to add more logging:

```typescript
// In bootstrap() function
app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
```

Then restart: `npm run start:dev`

---

## ✅ Verification Checklist

Before considering the API "ready":

- [ ] API starts without errors
- [ ] Swagger UI loads at http://localhost:3000/api
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Can create a patient (as physician)
- [ ] Physician can only see their own patients
- [ ] Admin can see all patients
- [ ] Can upload X-ray image
- [ ] X-ray validation completes
- [ ] Can create diagnosis result
- [ ] Processing time shows in responses
- [ ] Device IP captured in logs
- [ ] Error messages are descriptive
- [ ] Token refresh works
- [ ] Different roles behave differently

---

## 🚀 Performance Testing

### Simple Load Test

```bash
# Install Apache Bench (macOS)
# brew install httpd

# Test 1000 requests, 100 concurrent
ab -n 1000 -c 100 http://localhost:3000/

# Sample output:
# Requests per second:    123.45
# Time per request:       812 ms
# Failed requests:        0
```

### Monitor with CPU/Memory

```bash
# On macOS
top -o cpu -p $(lsof -t -i:3000)

# On Windows
Get-Process node | where-Object {$_.SI -eq 3000}
```

---

## 📊 Next: Integration Testing

Once manual testing passes:

1. Create integration tests:
   ```bash
   npm install --save-dev @nestjs/testing jest ts-jest
   ```

2. Test files structure:
   ```
   src/
   ├── modules/
   │   └── auth/
   │       └── auth.controller.spec.ts
   ```

3. Run tests:
   ```bash
   npm run test
   npm run test:cov  # With coverage
   ```

---

**Testing Guide Complete! Ready to verify your API.** ✨
