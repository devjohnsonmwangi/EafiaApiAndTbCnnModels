# API Test File - Manual Token Management

## Overview
The `api.http` file now uses manually-defined constants for all tokens and resource IDs, instead of automatically extracting them from responses.

## Configuration Structure

### 1. Server Configuration (Lines 7-10)
```http
@baseUrl = http://localhost:3000
@apiUrl = http://localhost:3000
@mlServiceUrl = http://localhost:5000
```
- Update these if your services run on different hostnames/ports

### 2. Token Constants (Lines 14-28)
```http
### Admin Credentials & Tokens
@adminToken = your_admin_access_token_here
@adminRefreshToken = your_admin_refresh_token_here
@userId = your_admin_user_id_here

### Physician Credentials & Tokens
@physicianToken = your_physician_access_token_here
@physicianRefreshToken = your_physician_refresh_token_here
@physicianId = your_physician_user_id_here
```
- **These MUST be manually updated** with actual values from login responses

### 3. Resource IDs (Lines 30-33)
```http
@patientId = patient_id_here
@xrayId = xray_id_here
@diagnosisId = diagnosis_id_here
```
- Set after creating resources in Sections 4, 5, and 8

---

## How to Use the File

### Step 1: Get Authentication Tokens
1. Open **Section 2** (Authentication module)
2. Run: **2.1 Register New User (Admin)** → Get admin ID
3. Run: **2.4 Login Admin User**
   - Copy `access_token` from response
   - Copy `refresh_token` from response
   - Copy `user.id` from response
4. Paste these values into the constants at the top:
   ```
   @adminToken = <access_token_here>
   @adminRefreshToken = <refresh_token_here>
   @userId = <user_id_here>
   ```
5. Repeat for Physician user (steps 2.2 and 2.5)

### Step 2: Test Protected Endpoints
1. Run **Section 3** (Users module) - Uses `@adminToken`
2. Run **Section 4** (Patients module) - Uses `@physicianToken`
   - After creating patient: Copy `id` → paste into `@patientId`
3. Run **Section 5** (X-Rays module) - Uses `@physicianToken`
   - After creating X-Ray: Copy `id` → paste into `@xrayId`
4. Continue with other sections

### Step 3: Create Workflow Tests
1. Update the constants at the top with your current tokens
2. Run any request section without needing automatic extraction
3. Copy new resource IDs as you create them

---

## Advantages of Manual Token Management

✅ **No dependency parsing needed** - Works even if responses fail  
✅ **Reusable tokens** - Use same token for multiple test runs  
✅ **Easy token swaps** - Switch between test users without re-login  
✅ **Offline testing** - Can test with pre-saved tokens  
✅ **Team collaboration** - Share token values with teammates  
✅ **Long-lived tokens** - Use tokens for multiple minutes without re-logging in  

---

## Example Workflow

```
1. Run: 2.4 Login Admin User
   Response: { "access_token": "eyJhbGc...", "refresh_token": "eyJyZW...", "user": { "id": "abc123" } }

2. Paste into constants at top:
   @adminToken = eyJhbGc...
   @adminRefreshToken = eyJyZW...
   @userId = abc123

3. Run: 3.1 Get All Users
   Uses: Authorization: Bearer {{adminToken}} ✅

4. Run: 4.1 Create Patient
   Response: { "id": "patient-456" }

5. Paste into constants:
   @patientId = patient-456

6. Run: 5.1 Create X-Ray
   Uses: @patientId in request ✅
```

---

## Important Notes

- **Tokens expire** - After 24 hours, re-run login to get new tokens
- **Keep tokens safe** - Don't commit real tokens to version control
- **Test data** - Use development/test credentials, never production
- **Token format** - Tokens should start with `eyJ...` (base64 JWT format)
- **ID format** - UUIDs like `550e8400-e29b-41d4-a716-446655440000`

---

## Reference

- Admin token extracted from: **Section 2.4 Login Admin User** response
- Physician token extracted from: **Section 2.5 Login Physician User** response
- Patient ID extracted from: **Section 4.1 Create Patient** response
- X-Ray ID extracted from: **Section 5.1 Create X-Ray** response
- Diagnosis ID extracted from: **Section 8.1 Create Diagnosis Result** response

