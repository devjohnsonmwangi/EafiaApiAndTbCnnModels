# 🔐 Generating Valid Authentication Tokens

## Problem
The tokens in `api.http` were signed with a different `JWT_SECRET` than what's currently in `.env`, causing 401 validation errors.

## Solution: Two Approaches

### ✅ Approach 1: Use the REST API (Recommended)

**Step 1: Register Test Users**
```bash
# Register Admin User
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tbdetection.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "phone": "+1234567890",
    "license": "ADM001",
    "specialization": "Hospital Admin"
  }'

# Register Physician User
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "physician@tbdetection.com",
    "password": "SecurePassword123!",
    "firstName": "Dr.",
    "lastName": "Smith",
    "role": "physician",
    "specialization": "Pulmonologist",
    "license": "LIC123456",
    "phone": "+1234567891"
  }'
```

**Step 2: Login to Get Tokens**
```bash
# Login Admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tbdetection.com",
    "password": "SecurePassword123!"
  }'

# Login Physician
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "physician@tbdetection.com",
    "password": "SecurePassword123!"
  }'
```

**Step 3: Copy tokens from response and paste into api.http**
```
@adminToken = [copy accessToken from login response]
@adminRefreshToken = [copy refreshToken from login response]
@physicianToken = [copy accessToken from physician login response]
@physicianRefreshToken = [copy refreshToken from physician login response]
```

---

### ✅ Approach 2: Use Node.js Script (Quick Generation)

Create `generate-tokens.js` in the api folder:

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';

const adminPayload = {
  sub: '4d0415d9-ab2e-4550-ae71-f1d3e0fa1523',
  email: 'admin@tbdetection.com',
  role: 'admin'
};

const physicianPayload = {
  sub: '250185cd-debf-4b82-8ec0-c79ff6e45ac6',
  email: 'physician@tbdetection.com',
  role: 'physician'
};

const adminAccessToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '24h' });
const adminRefreshToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '7d' });

const physicianAccessToken = jwt.sign(physicianPayload, JWT_SECRET, { expiresIn: '24h' });
const physicianRefreshToken = jwt.sign(physicianPayload, JWT_SECRET, { expiresIn: '7d' });

console.log('=== ADMIN TOKENS ===');
console.log('Access Token:', adminAccessToken);
console.log('Refresh Token:', adminRefreshToken);
console.log('\n=== PHYSICIAN TOKENS ===');
console.log('Access Token:', physicianAccessToken);
console.log('Refresh Token:', physicianRefreshToken);
console.log('\nCopy these tokens to api.http');
```

Run it:
```bash
node generate-tokens.js
```

---

## ✅ How Authorization Works in Your App

### Physicians
- ✅ **Can create patients** → Patient is automatically linked to them
- ✅ **Can only see their own patients**
- ✅ **Can upload X-rays** for their patients
- ✅ **Can view diagnosis results** for their patients
- ❌ **Cannot** see other physicians' patients
- ❌ **Cannot** manage users

### Admins
- ✅ **Full access** to everything
- ✅ **Can see all patients** (from all physicians)
- ✅ **Can modify any patient** record
- ✅ **Can manage users** (create, delete, deactivate)
- ✅ **Can access system settings**
- ✅ **Can modify X-rays and results**

---

## 🔍 Token Validation Flow

1. Client sends request with `Authorization: Bearer <token>`
2. **JwtGuard** extracts token from header
3. Verifies signature using `JWT_SECRET` from `.env`
4. If valid → Attaches user payload to request object
5. **RolesGuard** checks if user role matches required roles
6. If authorized → Proceeds to controller
7. If not → Returns 403 Forbidden

**Why tokens fail:**
- ❌ Token signed with different secret than `.env` JWT_SECRET
- ❌ Token expired
- ❌ Token missing from Authorization header
- ❌ Authorization header format incorrect (must be `Bearer <token>`)

---

## Required Headers for All Protected Routes

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Next Steps

1. **Start API Server**: `npm run start:dev`
2. **Register Users** (or login with existing ones)
3. **Copy tokens** to api.http
4. **Run requests** from "SECTION 3" onwards
