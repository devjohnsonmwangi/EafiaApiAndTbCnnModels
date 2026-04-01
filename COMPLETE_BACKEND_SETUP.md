# 🏥 Eafia TB Detection API - Complete Backend Implementation

## 📋 What Was Built

A **production-ready authentication system** with full database integration, role-based access control, and TB detection workflow.

### ✨ Features Implemented

#### 1. **Authentication & Authorization**
- ✅ User registration with email, password hashing (bcrypt)
- ✅ JWT-based login with access & refresh tokens
- ✅ Role-based access control (RBAC): **Physician, Admin, Super Admin**
- ✅ Token refresh mechanism
- ✅ Device IP tracking on login

#### 2. **Role-Based Data Access**
```
PHYSICIAN → Can register & view ONLY their own patients
ADMIN    → Can manage all patients & users (except super admin)
SUPER_ADMIN → Full system access, can delete users
```

#### 3. **Database Schema (TypeORM Entities)**
- **Users** - Physicians, admins, super admins with role management
- **Patients** - Associated with physicians, medical history, contact info
- **XRays** - Medical X-ray images (base64), validation status, metadata
- **DiagnosisResults** - TB detection results with intensity levels (None, Mild, Moderate, Severe, Critical)

#### 4. **TB Diagnosis Intensity Levels**
- **NONE** - No TB detected
- **MILD** - Minimal lesions (early stage)
- **MODERATE** - Clear lesions (developing TB)
- **SEVERE** - Extensive lesions (advanced TB)
- **CRITICAL** - Very extensive, life-threatening

#### 5. **Request/Response System**
- ✅ All endpoints return structured API responses with:
  - Success/error status
  - Detailed messages
  - Processing time (milliseconds)
  - Timestamp
  - Device IP address captured
- ✅ Graceful error handling with appropriate HTTP status codes

#### 6. **Logging & Monitoring**
- ✅ Request logging middleware with processing times
- ✅ Device IP capture on each request
- ✅ Database query logging (development)
- ✅ Slow query detection (>1000ms)
- ✅ Automatic log file generation

#### 7. **Database & Caching**
- ✅ **Neon Serverless PostgreSQL** configuration ready
- ✅ **TypeORM** with automatic schema synchronization (dev) 
- ✅ **Cache-manager** implementation with 1-hour TTL default
- ✅ Database indexes on frequently queried fields
- ✅ Soft deletes (deletedAt field) for data retention

#### 8. **Security**
- ✅ Helmet.js for HTTP headers security
- ✅ CORS enabled and configurable
- ✅ Password hashing with bcrypt (10-round salt)
- ✅ JWT token validation on protected routes
- ✅ Input validation with class-validator
- ✅ SQL injection prevention via TypeORM

#### 9. **API Documentation**
- ✅ **Swagger/OpenAPI** integration at `/api`
- ✅ Bearer token authentication in Swagger
- ✅ Detailed endpoint descriptions
- ✅ Request/response schemas documented
- ✅ Try-it-out functionality in browser

---

## 📁 Project Structure

```
src/
├── config/
│   └── typeorm.config.ts          # Database configuration
├── common/
│   ├── decorators/
│   │   ├── index.ts               # ClientIp, ProcessingTime decorators
│   │   └── roles.decorator.ts     # Role-based access decorator
│   ├── guards/
│   │   ├── jwt.guard.ts           # JWT token validation
│   │   └── roles.guard.ts         # Role-based authorization
│   ├── middleware/
│   │   └── logger.middleware.ts   # Request logging with IP & timing
│   └── utils/
│       └── response.formatter.ts  # Standardized API responses
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts        # Register, login, token refresh
│   │   ├── auth.controller.ts     # Auth endpoints
│   │   ├── auth.module.ts
│   │   └── auth.dto.ts
│   ├── users/
│   │   ├── user.entity.ts         # User schema (Physician, Admin, Super Admin)
│   │   ├── users.service.ts       # User management
│   │   ├── users.controller.ts    # User endpoints
│   │   └── users.module.ts
│   ├── patients/
│   │   ├── patient.entity.ts      # Patient schema
│   │   ├── patients.service.ts    # RBAC-aware patient service
│   │   ├── patients.controller.ts # Patient endpoints
│   │   ├── patients.module.ts
│   │   └── patient.dto.ts
│   ├── xrays/
│   │   ├── xray.entity.ts         # X-ray schema with validation status
│   │   ├── xrays.service.ts       # X-ray management & validation
│   │   ├── xrays.controller.ts    # X-ray endpoints
│   │   ├── xrays.module.ts
│   │   └── xray.dto.ts
│   ├── diagnosis-results/
│   │   ├── diagnosis-result.entity.ts  # Diagnosis schema with intensity
│   │   ├── diagnosis-results.service.ts
│   │   ├── diagnosis-results.controller.ts
│   │   ├── diagnosis-results.module.ts
│   │   └── diagnosis-result.dto.ts
│   ├── tb-prediction/              # Existing ML integration module
│   └── xray-validation/            # Existing ML validation module
├── app.module.ts                   # Root module with all imports
├── main.ts                         # App bootstrap with Swagger setup
└── app.controller.ts               # Root controller

...and supporting files
```

---

## 🚀 Setup Instructions

### 1. **Install Dependencies**

```bash
cd Eafia/api
npm install
# or
pnpm install
```

This installs:
- NestJS framework & modules
- TypeORM for database
- JWT for authentication
- PostgreSQL driver
- Swagger for API docs
- Bcrypt for password hashing
- Cache-manager for caching
- Helmet for security
- Axios for HTTP requests

### 2. **Configure Database**

Edit `.env.development`:

```bash
# Option A: Local PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=eafia_tb_detection

# Option B: Neon Serverless (Production)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/eafia_tb_detection?sslmode=require
```

### 3. **Set JWT Secrets**

Edit `.env.development`:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

> ⚠️ **CHANGE THESE IN PRODUCTION** - Use `openssl rand -hex 32` to generate secure keys

### 4. **Start Python ML Service** (in separate terminal)

```bash
cd Eafia/cnn_models
python -m uvicorn api:app --reload --port 8000
```

### 5. **Start NestJS API**

```bash
npm run start:dev
```

Expected output:
```
✅ TB Detection API running on http://localhost:3000
📚 Swagger docs available at http://localhost:3000/api
```

---

## 🔐 Authentication Flow

### Register New User

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "firstName": "Dr.",
  "lastName": "Smith",
  "password": "SecurePassword123!",
  "role": "physician",
  "license": "MD12345",
  "specialization": "Chest Radiologist",
  "phone": "+1234567890"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "doctor@hospital.com",
    "role": "physician",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "24h"
  },
  "processingTimeMs": 245,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

### Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "SecurePassword123!"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": "24h"
  },
  "processingTimeMs": 156,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

### Use Access Token

```bash
GET /patients
Authorization: Bearer <accessToken>
```

### Refresh Token

```bash
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

---

## 👥 Role-Based Access Control

### Access Matrix

| Endpoint | Physician | Admin | Super Admin |
|----------|-----------|-------|------------|
| Register Patient | Own Only | All | All |
| View Patient | Own Only | All | All |
| Update Patient | Own Only | All | All |
| Delete Patient | Own Only | All | All |
| Upload X-Ray | Own Patients | All | All |
| View Diagnosis | Own Patients | All | All |
| Manage Users | ❌ | Limited | ✅ |
| Deactivate User | ❌ | Others | ✅ |
| Delete User | ❌ | ❌ | ✅ |

---

## 📊 API Endpoints

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh-token` - Refresh access token

### Users (`/users`)
- `GET /users/:id` - Get user details
- `GET /users` - List all users (Admin/SuperAdmin)
- `PATCH /users/:id/deactivate` - Deactivate user
- `PATCH /users/:id/activate` - Activate user
- `DELETE /users/:id` - Delete user (SuperAdmin)

### Patients (`/patients`)
- `POST /patients` - Register new patient
- `GET /patients` - List patients (role-based)
- `GET /patients/:id` - Get patient details
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### X-Rays (`/xrays`)
- `POST /xrays` - Upload X-ray image
- `GET /xrays` - List X-rays
- `GET /xrays/:id` - Get X-ray details
- `PUT /xrays/:id` - Update X-ray metadata
- `DELETE /xrays/:id` - Delete X-ray
- `GET /xrays/patient/:patientId` - Get X-rays for patient

### Diagnosis Results (`/diagnosis-results`)
- `POST /diagnosis-results` - Create diagnosis
- `GET /diagnosis-results` - List diagnoses
- `GET /diagnosis-results/:id` - Get diagnosis
- `GET /diagnosis-results/patient/:patientId` - Patient diagnoses
- `GET /diagnosis-results/xray/:xrayId` - X-ray diagnoses
- `DELETE /diagnosis-results/:id` - Delete diagnosis

---

## 🧪 Testing the System

### 1. Open Swagger UI

Navigate to: **http://localhost:3000/api**

### 2. Register User

1. Expand `/auth/register`
2. Click "Try it out"
3. Fill in the form:
   ```json
   {
     "email": "test@example.com",
     "firstName": "Test",
     "lastName": "User",
     "password": "TestPassword123!",
     "role": "physician"
   }
   ```
4. Click "Execute"
5. Copy the **accessToken** from response

### 3. Authenticate in Swagger

1. Click "Authorize" button (top right)
2. Paste: `Bearer <accessToken>`
3. Click "Authorize"

### 4. Test Protected Endpoint

1. Expand `POST /patients`
2. Click "Try it out"
3. Enter patient data:
   ```json
   {
     "firstName": "John",
     "lastName": "Doe",
     "email": "john@example.com",
     "phone": "+1234567890",
     "dateOfBirth": "1990-01-01",
     "gender": "Male"
   }
   ```
4. Click "Execute"

---

## 📋 Database Schema Overview

### Users Table
```sql
- id (UUID, primary key)
- email (unique varchar)
- firstName, lastName (varchar)
- passwordHash (varchar, hashed)
- role (enum: physician, admin, super_admin)
- license (varchar, optional)
- specialization (varchar, optional)
- phone (varchar, optional)
- isActive (boolean, default: true)
- lastLoginIp (varchar, tracks last login IP)
- createdAt, updatedAt, deletedAt (timestamps)
- Indexes: email, role, createdAt
```

### Patients Table
```sql
- id (UUID, primary key)
- firstName, lastName (varchar)
- email (unique varchar)
- phone (varchar)
- dateOfBirth (date)
- gender (enum: Male, Female, Other)
- medicalHistory, allergies, medications (text)
- address, city, state, postalCode, country (varchar)
- physicianId (UUID, foreign key to users)
- createdAt, updatedAt, deletedAt (timestamps)
- Indexes: physicianId, email, createdAt
```

### XRays Table
```sql
- id (UUID, primary key)
- patientId (UUID, foreign key)
- imageBase64 (text, base64 image data)
- fileName, fileType (varchar)
- fileSizeBytes (integer)
- status (enum: pending, validating, processing, completed, failed)
- xrayType (varchar, eg. "chest")
- notes (text)
- isValid (boolean, validation result)
- validationConfidence (float, 0-1)
- validationError (text, if failed)
- deviceIpAddress (varchar, IP of uploader)
- createdAt, updatedAt, deletedAt (timestamps)
- Indexes: patientId, status, createdAt
```

### DiagnosisResults Table
```sql
- id (UUID, primary key)
- patientId, xrayId (UUID, foreign keys)
- diseaseType (enum: tuberculosis, pneumonia, lung_cancer, bone_fracture)
- prediction (varchar, "TB_POSITIVE", "TB_NEGATIVE", etc.)
- confidenceScore (float, 0-1)
- confidenceLevel (enum: low, moderate, high, very_high)
- tbIntensity (enum: none, mild, moderate, severe, critical)
- affectedAreas, clinicalFindings, recommendations (text)
- affectedPercentage (float, 0-100)
- heatmapBase64 (text, visual heatmap)
- modelName (varchar, "tb_classifier_v1")
- processingTimeMs (integer, time to analyze)
- deviceIpAddress (varchar)
- createdAt, updatedAt, deletedAt (timestamps)
- Indexes: patientId, xrayId, diseaseType, createdAt
```

---

## ⚙️ Environment Variables

### Development (.env.development)

```bash
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=eafia_tb_detection

# JWT
JWT_SECRET=your-super-secret-key-32-chars-min
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRATION=7d

# ML Service
PYTHON_API_URL=http://localhost:8000

# Cache
CACHE_TTL=3600

# Logging
LOG_LEVEL=debug

# Swagger
SWAGGER_ENABLED=true
```

### Production (.env.production)

```bash
NODE_ENV=production
PORT=3000

# Database (Neon Serverless)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require

# JWT (use strong keys from: openssl rand -hex 32)
JWT_SECRET=<generate-new-secret>
JWT_REFRESH_SECRET=<generate-new-secret>

# ML Service
PYTHON_API_URL=https://your-ml-service.com

# Cache
CACHE_TTL=3600

# Logging
LOG_LEVEL=error

# Swagger
SWAGGER_ENABLED=false
```

---

## 🔍 Response Format

All endpoints return standardized responses:

### Success Response (200)
```json
{
  "success": true,
  "message": "Patient retrieved successfully",
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    ...
  },
  "statusCode": 200,
  "processingTimeMs": 125,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

### Error Response (400+)
```json
{
  "success": false,
  "message": "Patient not found",
  "error": "NOT_FOUND",
  "statusCode": 404,
  "processingTimeMs": 45,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

## 📈 Performance & Monitoring

### Processing Time Tracking
- Every request logs processing time in milliseconds
- Slow queries logged when > 1000ms
- Useful for identifying bottlenecks

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling via TypeORM
- Query result caching available
- Soft deletes for data retention

### Logging
- Request/response logging via middleware
- Device IP captured for each request
- Database query logging in development
- Error stack traces in logs

---

## 🧑‍💻 Next Steps

1. **Create a super admin user:**
   ```bash
   # In database or via register endpoint
   # Then manually set role to 'super_admin'
   ```

2. **Configure Neon Serverless for production:**
   - Sign up at https://neon.tech
   - Create a PostgreSQL database
   - Copy connection string to `.env.production`

3. **Deploy to the cloud:**
   - Heroku, Railway, Render, or AWS recommended
   - Set environment variables in platform
   - Run migrations on deploy

4. **Integrate with React frontend:**
   - Use the access token in API calls
   - Store token in localStorage or secure cookie
   - Implement token refresh on expiration
   - Handle 401 responses for re-authentication

5. **Monitor in production:**
   - Set up error tracking (Sentry)
   - Monitor database performance
   - Track API response times
   - Set up alerts for failures

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Port 3000 already in use | Change PORT in .env or kill process |
| Database connection error | Check DATABASE_URL and credentials |
| JWT token invalid | Ensure JWT_SECRET matches on verify |
| Role-based access denied | Verify user role in database |
| Swagger not showing | Check SWAGGER_ENABLED=true in .env |

---

## 🎯 What's Ready to Use

✅ User authentication with JWT  
✅ Role-based access control (Physician, Admin, Super Admin)  
✅ Patient management with physician isolation  
✅ X-ray upload and validation  
✅ TB diagnosis recording with intensity levels  
✅ Device IP tracking and logging  
✅ API documentation with Swagger  
✅ Database with PostgreSQL (Neon ready)  
✅ Caching system  
✅ Error handling and responses  
✅ Security headers (Helmet)  

---

**System Ready for Production! 🚀**

Run `npm install && npm run start:dev` to begin!
