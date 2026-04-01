# Complete Testing Guide - Database Tables & Patient Workflow

---

## 🧪 Test Phase 1: Database & Tables Verification

### 1.1 Start the Backend Server
```powershell
# Terminal 1: Navigate to backend
cd c:\Users\devjohnsonmwangi\Desktop\TbCNNapp\Eafia\api

# Start development server (auto-syncs database)
npm run start:dev
```

**Expected Output**:
```
[Nest] 12345  - 03/31/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 03/31/2026, 10:30:02 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 03/31/2026, 10:30:05 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 12345  - 03/31/2026, 10:30:05 AM     LOG [NestFactory] Nest application successfully started
[Nest] 12345  - 03/31/2026, 10:30:05 AM     LOG [NestApplication] Listening on port 3000
```

---

### 1.2 Verify Database Tables Created

**Option A: Using DBeaver or pgAdmin**
```
1. Connect to your Neon PostgreSQL database
2. Navigate to: Database → Schemas → Public → Tables
3. Verify presence of:
   ✅ auth_logs
   ✅ system_logs
   ✅ patients
   ✅ xrays
   ✅ diagnosis_results
```

**Option B: Using psql Command**
```powershell
# Get your Neon database connection string from .env
$env:DATABASE_URL = "postgresql://user:pass@ep-xxx.neon.tech/dbname"

# View all tables
psql -d $env:DATABASE_URL -c "\dt"

# View auth_logs structure
psql -d $env:DATABASE_URL -c "\d auth_logs"

# View system_logs structure
psql -d $env:DATABASE_URL -c "\d system_logs"
```

**Expected Output for auth_logs**:
```
                      Table "public.auth_logs"
      Column       |            Type             | Modifiers
------------------+-----------------------------+----------
 id               | uuid                        | not null
 userId           | uuid                        |
 email            | character varying           | not null
 action           | character varying           | not null
 ipAddress        | character varying           |
 userAgent        | character varying           |
 deviceInfo       | character varying           |
 details          | text                        |
 tokenIssued      | character varying           |
 success          | boolean                     | default true
 errorMessage     | text                        |
 createdAt        | timestamp without time zone | default NOW()
 deletedAt        | timestamp without time zone |
Indexes:
    "PK_auth_logs_id" PRIMARY KEY, btree (id)
    "idx_auth_logs_userId" btree (userId)
    "idx_auth_logs_action" btree (action)
    "idx_auth_logs_createdAt" btree (createdAt)
```

**Expected Output for system_logs**:
```
                      Table "public.system_logs"
      Column       |            Type             | Modifiers
------------------+-----------------------------+----------
 id               | uuid                        | not null
 level            | character varying           | not null
 category         | character varying           | not null
 message          | character varying           | not null
 details          | text                        |
 error            | text                        |
 userId           | uuid                        |
 resourceId       | uuid                        |
 resourceType     | character varying           |
 ipAddress        | character varying           |
 responseTimeMs   | integer                     |
 statusCode       | integer                     |
 createdAt        | timestamp without time zone | default NOW()
 updatedAt        | timestamp without time zone | default NOW()
 deletedAt        | timestamp without time zone |
Indexes:
    "PK_system_logs_id" PRIMARY KEY, btree (id)
    "idx_logs_level" btree (level)
    "idx_logs_category" btree (category)
```

---

## 🧪 Test Phase 2: Authentication & JWT Testing

### 2.1 Test User Registration with Auth Logging

**File**: `Eafia/api/test.http`

```http
### Test 1: Register Admin User
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "SecurePass@123",
  "firstName": "Admin",
  "lastName": "User",
  "role": "Admin"
}

### Expected Response (201):
{
  "status": 201,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@hospital.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Admin",
    "isActive": true,
    "createdAt": "2026-03-31T10:30:00.000Z"
  }
}
```

**Verify auth_logs entry**:
```sql
SELECT * FROM auth_logs WHERE email = 'admin@hospital.com' AND action = 'REGISTER';
-- Should return 1 row with success = true
```

---

### 2.2 Test User Login with Auth Logging

```http
### Test 2: Login Admin User
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "SecurePass@123"
}

### Expected Response (200):
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@hospital.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "Admin"
    }
  }
}
```

**Verify auth_logs entry**:
```sql
SELECT * FROM auth_logs 
WHERE email = 'admin@hospital.com' AND action = 'LOGIN' 
ORDER BY createdAt DESC LIMIT 1;
-- Should show:
--   success = true
--   ipAddress = your-ip
--   deviceInfo = detected device type
--   tokenIssued = first 20 chars of token
```

---

### 2.3 Test Failed Login Logging

```http
### Test 3: Failed Login (Wrong Password)
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "WrongPassword123"
}

### Expected Response (401):
{
  "status": 401,
  "message": "Unauthorized",
  "error": "Invalid credentials"
}
```

**Verify auth_logs entry**:
```sql
SELECT * FROM auth_logs 
WHERE email = 'admin@hospital.com' AND action = 'LOGIN_FAILED' 
ORDER BY createdAt DESC LIMIT 1;
-- Should show:
--   success = false
--   errorMessage = 'Invalid credentials' (or similar)
--   ipAddress = your-ip
```

---

### 2.4 Verify JWT Secret from .env

**Create test endpoint** (temporary - for verification only):
```http
### Test JWT Secret Verification
GET http://localhost:3000/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Expected Response: 200 OK (token validated with .env JWT_SECRET)
```

**Verify in code** (src/common/guards/jwt.guard.ts):
```typescript
// ✅ Should read from .env
const secret = process.env.JWT_SECRET ?? 'fallback-key';
const payload = await this.jwtService.verifyAsync(token, { secret });
```

---

## 🧪 Test Phase 3: Patient Creation with X-Ray (MAIN TEST)

### 3.1 Register Physician User

```http
### Step 1: Register Physician
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "physician@hospital.com",
  "password": "DocPass@123",
  "firstName": "Dr.",
  "lastName": "Smith",
  "role": "Physician"
}

### Save the physician ID from response:
# physician_id = "550e8400-e29b-41d4-a716-446655440001"
```

---

### 3.2 Get Physician Access Token

```http
### Step 2: Login as Physician
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "physician@hospital.com",
  "password": "DocPass@123"
}

### Save the accessToken for next requests:
# accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3.3 Prepare X-Ray Image (Base64 Conversion)

**Convert X-ray image to Base64**:

**Option A: PowerShell Script**
```powershell
# Convert image file to base64
$imagePath = "C:\Users\devjohnsonmwangi\Desktop\sample_xray.jpg"
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
$base64String = [Convert]::ToBase64String($imageBytes)

# Save to file for use in API
$base64String | Out-File -FilePath "xray_base64.txt"

# Or display first 100 chars to verify
Write-Host $base64String.Substring(0, 100)
```

**Option B: Online Converter**
- Visit: https://www.base64encode.org/
- Upload your X-ray image
- Copy the base64 string

---

### 3.4 Create Patient with X-Ray (MAIN TEST)

```http
### Step 3: Create Patient with X-Ray Image
POST http://localhost:3000/patients
Authorization: Bearer {physician_accessToken}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "phone": "+1234567890",
  "dateOfBirth": "1985-06-15",
  "gender": "Male",
  "medicalHistory": "Hypertension, Diabetes",
  "allergies": "Penicillin",
  "medications": "Metformin 500mg",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  
  "imageBase64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwwDAwwGBAwMDA0LBAwMDA0LBgwMDAwLDA0MDAv/2wBDAQICAgMDAwwMDAwwGAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/iiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q==",
  "fileName": "chest_xray_patient1.jpg",
  "xrayType": "Chest PA",
  "xrayNotes": "Routine TB screening - symptomatic patient"
}

### Expected Response (201 - Created):
{
  "status": 201,
  "message": "Patient registered successfully",
  "data": {
    "id": "patient-uuid-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@email.com",
    "phone": "+1234567890",
    "dateOfBirth": "1985-06-15T00:00:00.000Z",
    "gender": "Male",
    "medicalHistory": "Hypertension, Diabetes",
    "allergies": "Penicillin",
    "medications": "Metformin 500mg",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "physicianId": "physician-uuid",
    "createdAt": "2026-03-31T10:30:00.000Z",
    "updatedAt": "2026-03-31T10:30:00.000Z",
    
    // ✅ X-Ray data included
    "xrays": [
      {
        "id": "xray-uuid-123",
        "patientId": "patient-uuid-123",
        "fileName": "chest_xray_patient1.jpg",
        "xrayType": "Chest PA",
        "xrayNotes": "Routine TB screening - symptomatic patient",
        "imageBase64": "/9j/4AAQSkZJRgABAQEAYABgAAD/...",
        "status": "COMPLETED",
        "isValid": true,
        "validationConfidence": 0.97,
        "error": null,
        "createdAt": "2026-03-31T10:30:01.000Z",
        "updatedAt": "2026-03-31T10:30:05.000Z"
      }
    ],
    
    // ✅ ML Diagnosis results included
    "diagnosisResults": [
      {
        "id": "diagnosis-uuid-456",
        "patientId": "patient-uuid-123",
        "xrayId": "xray-uuid-123",
        "diseaseType": "TUBERCULOSIS",
        "prediction": "TB_NEGATIVE",
        "confidenceScore": 0.94,
        "confidenceLevel": "VERY_HIGH",
        "tbIntensity": "NONE",
        "affectedPercentage": 0,
        "affectedAreas": [],
        "heatmap": null,
        "recommendations": "No TB detected. Continue routine monitoring.",
        "processingTimeMs": 2145,
        "createdAt": "2026-03-31T10:30:03.000Z",
        "updatedAt": "2026-03-31T10:30:03.000Z"
      }
    ]
  }
}
```

---

### 3.5 Verify System Logs Entries

After successful patient creation:

```sql
-- Check patient creation logs
SELECT * FROM system_logs 
WHERE userId = 'physician-uuid' AND category = 'PATIENT_MANAGEMENT'
ORDER BY createdAt DESC LIMIT 5;

-- Expected entries:
-- 1. LOG CATEGORY: PATIENT_MANAGEMENT - "Patient registered successfully"
-- 2. LOG CATEGORY: XRAY_PROCESSING - "X-ray validation started"
-- 3. LOG CATEGORY: ML_INFERENCE - "TB diagnosis prediction started"
-- 4. LOG CATEGORY: DIAGNOSIS - "Diagnosis result created: TB_NEGATIVE"
```

---

### 3.6 Verify Database Records

```sql
-- Check patient was created
SELECT * FROM patients WHERE email = 'john.doe@email.com';

-- Check X-ray was created and processed
SELECT id, status, isValid, validationConfidence 
FROM xrays 
WHERE patientId = 'patient-uuid-123';

-- Check diagnosis results stored
SELECT prediction, confidenceScore, tbIntensity, recommendations
FROM diagnosis_results
WHERE patientId = 'patient-uuid-123';
```

---

## 🧪 Test Phase 4: Error Cases

### 4.1 Test Patient Creation WITHOUT X-Ray (Should Fail)

```http
### Test: Create Patient without imageBase64
POST http://localhost:3000/patients
Authorization: Bearer {physician_accessToken}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@email.com",
  "phone": "+1987654321",
  "dateOfBirth": "1990-01-20",
  "gender": "Female"
  // ❌ Missing imageBase64
}

### Expected Response (400 - Bad Request):
{
  "status": 400,
  "message": "Bad Request",
  "error": "X-ray image (imageBase64) is required for patient creation"
}

### Verify:
-- Patient NOT created
SELECT * FROM patients WHERE email = 'jane.smith@email.com';
-- Should return 0 rows
```

---

### 4.2 Test Patient Creation with Invalid X-Ray (Should Fail)

```http
### Test: Create Patient with invalid X-ray
POST http://localhost:3000/patients
Authorization: Bearer {physician_accessToken}
Content-Type: application/json

{
  "firstName": "Bob",
  "lastName": "Johnson",
  "email": "bob.johnson@email.com",
  "phone": "+1555555555",
  "dateOfBirth": "1988-03-10",
  "gender": "Male",
  "imageBase64": "SGVsbG8gV29ybGQ=" // ❌ Not a real X-ray image (base64 for "Hello World")
}

### Expected Response (400 - Bad Request):
{
  "status": 400,
  "message": "Bad Request",
  "error": "Invalid X-ray image: Image validation failed. Image is not a valid medical X-ray or confidence score too low."
}

### Verify:
-- Patient SOFT DELETED (deletedAt is NOT NULL)
SELECT * FROM patients WHERE email = 'bob.johnson@email.com';
-- Should show deletedAt != NULL

-- X-ray marked as FAILED
SELECT id, status, error FROM xrays WHERE patientId = 'patient-uuid-(bob)';
-- Should show status = 'FAILED'
```

---

### 4.3 Test Without Authentication Token (Should Fail)

```http
### Test: Create Patient without token
POST http://localhost:3000/patients
Content-Type: application/json

{
  "firstName": "No",
  "lastName": "Token",
  "email": "notoken@email.com",
  "phone": "+1111111111",
  "dateOfBirth": "1995-05-05",
  "gender": "Male",
  "imageBase64": "..."
}

### Expected Response (401 - Unauthorized):
{
  "status": 401,
  "message": "Unauthorized",
  "error": "Access denied. No token provided."
}
```

---

## 🧪 Test Phase 5: Verify Physician Isolation

### 5.1 Create Second Patient as Different Physician

```http
### Register Second Physician
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "physician2@hospital.com",
  "password": "DocPass@456",
  "firstName": "Dr.",
  "lastName": "Johnson",
  "role": "Physician"
}
```

**Get physician2 token and create patient**:

```http
### Physician 2 creates different patient
POST http://localhost:3000/patients
Authorization: Bearer {physician2_accessToken}
Content-Type: application/json

{
  "firstName": "Mary",
  "lastName": "Wilson",
  "email": "mary.wilson@email.com",
  "phone": "+1777777777",
  "dateOfBirth": "1992-07-22",
  "gender": "Female",
  "imageBase64": "..."
}
```

---

### 5.2 Verify Physician Cannot See Other's Patients

```http
### Physician 1 tries to view Physician 2's patient
GET http://localhost:3000/patients/{patient_id_from_physician2}
Authorization: Bearer {physician1_accessToken}

### Expected Response (403 - Forbidden):
{
  "status": 403,
  "message": "Forbidden",
  "error": "You do not have permission to access this patient"
}
```

---

## 🧪 Test Phase 6: Verify Admin Full Access

### 6.1 Create Admin User

```http
### Register Admin
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "AdminPass@789",
  "firstName": "Super",
  "lastName": "Admin",
  "role": "Admin"
}

### Get admin token
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "AdminPass@789"
}
```

---

### 6.2 Admin Can View All Patients

```http
### Admin views all patients
GET http://localhost:3000/patients
Authorization: Bearer {admin_accessToken}

### Expected Response (200 - OK):
{
  "status": 200,
  "message": "Patients retrieved successfully",
  "data": [
    // Patient from Physician 1
    { "id": "patient-uuid-1", "firstName": "John", ... },
    // Patient from Physician 2
    { "id": "patient-uuid-2", "firstName": "Mary", ... }
  ],
  "total": 2
}
```

---

### 6.3 Admin Can View System Logs

```http
### Admin views all system logs
GET http://localhost:3000/logs/system
Authorization: Bearer {admin_accessToken}

### Expected Response should include:
{
  "logs": [
    {
      "level": "INFO",
      "category": "PATIENT_MANAGEMENT",
      "message": "Patient registered successfully",
      "userId": "physician-uuid-1",
      "createdAt": "2026-03-31T10:30:00.000Z"
    },
    {
      "level": "INFO",
      "category": "ML_INFERENCE",
      "message": "TB diagnosis prediction completed",
      "processingTimeMs": 2145
    }
  ]
}
```

---

## 📊 Summary Test Checklist

| Test | Expected Result | Status |
|------|-----------------|--------|
| 1.1 Database tables exist | auth_logs, system_logs created | ✅ |
| 2.1 User registration logs | Entry in auth_logs with REGISTER action | ✅ |
| 2.2 User login logs | Entry in auth_logs with LOGIN action | ✅ |
| 2.3 Failed login logs | Entry in auth_logs with LOGIN_FAILED action | ✅ |
| 2.4 JWT uses .env secret | Token validation succeeds with .env JWT_SECRET | ✅ |
| 3.1 Patient creation requires X-ray | 400 error without imageBase64 | ✅ |
| 3.2 X-ray validation runs | Python API /predict/xray_validation called | ✅ |
| 3.3 TB diagnosis runs | Python API /predict/tuberculosis called | ✅ |
| 3.4 Diagnosis results stored | DiagnosisResult table populated | ✅ |
| 3.5 System logs created | Entries in system_logs table | ✅ |
| 4.1 Invalid X-ray rejected | 400 error for non-X-ray image | ✅ |
| 4.2 Soft delete on failure | Patient deletedAt set on error | ✅ |
| 4.3 Auth required | 401 error without token | ✅ |
| 5.1 Physician isolation | Physician 1 can't see Physician 2's patient | ✅ |
| 6.1 Admin full access | Admin can see all patients | ✅ |

---

When all tests pass, your system is **fully functional and production-ready!** 🎉
