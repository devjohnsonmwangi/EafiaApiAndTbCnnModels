# 🩺 Eafia TB Detection API - Comprehensive Documentation

A production-ready **NestJS backend service** that provides medical image validation and tuberculosis detection through AI-powered analysis. Integrates with PostgreSQL database, JWT authentication, role-based access control, and Python ML models for chest X-ray analysis.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Project Structure](#-project-structure)
- [Core Modules](#-core-modules)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Authentication & Authorization](#-authentication--authorization)
- [Configuration](#-configuration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Security](#-security)
- [Support & Resources](#-support--resources)

---

## Overview

The Eafia API is the central nervous system of the TB Detection System, handling:
- **User Management** - Admin, Physician, and Radiologist roles
- **Patient Registry** - Complete patient information storage
- **Medical Image Processing** - TB detection via ResNet18 CNN
- **X-Ray Validation** - Ensures images are legitimate medical X-rays
- **Diagnosis & Results** - Stores and tracks TB test outcomes
- **System Logging** - Comprehensive audit trail for compliance

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Node**: 18+ | **Database**: PostgreSQL

---

## 🎯 Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **X-Ray Validation** | Validates images are actual medical X-rays before processing | ✅ |
| **TB Detection** | AI-powered prediction with confidence scores | ✅ |
| **Quality Control** | 70% confidence threshold on validation | ✅ |
| **Interpretability** | Heatmap generation for model predictions | ✅ |
| **Flexible Input** | Base64 strings or file uploads supported | ✅ |
| **Role-Based Access** | Admin/Super Admin/Physician/Radiologist controls | ✅ |
| **JWT Auth** | Access & refresh token system | ✅ |
| **Database Persistence** | PostgreSQL with TypeORM | ✅ |
| **System Logging** | Audit trails & activity monitoring | ✅ |
| **CORS Enabled** | Frontend integration ready | ✅ |
| **Error Handling** | Comprehensive error responses with guidance | ✅ |
| **Swagger Documentation** | Auto-generated OpenAPI docs | ✅ |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                    │
│              Redux State + React Router + Tailwind              │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────────┐
│              NestJS Backend API (Port 3000)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Modules:                                                │   │
│  │  • Auth Module (JWT, Guards, Strategies)                │   │
│  │  • User Management (CRUD, Role Validation)              │   │
│  │  • Patient Registry (Data Persistence)                  │   │
│  │  • X-Ray Validation Service (Calls Python API)          │   │
│  │  • TB Prediction Service (Calls Python API)             │   │
│  │  • Diagnosis Results Management                         │   │
│  │  • System Logging (Audit Trails)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  Database: PostgreSQL with TypeORM                               │
│  Entities: User, Patient, XRay, DiagnosisResult, SystemLog      │
├──────────────────────────────────────────────────────────────────┤
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────────┐
│           Python ML Service - FastAPI (Port 8000)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Models & Utilities:                                     │   │
│  │  • xray_detector (ResNet18 - validates X-rays)          │   │
│  │  • tb_classifier (ResNet18 - detects TB)                │   │
│  │  • Image preprocessing & normalization                   │   │
│  │  • Base64 encoding/decoding                             │   │
│  │  • Confidence score calculation                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Required Software
- **Node.js** v18.0.0 or higher
- **npm** v9+ or **pnpm** v8+ 
- **Python** 3.8 or higher
- **PostgreSQL** 12+
- **Git** for version control

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended for ML)
- **Disk Space**: 2GB for dependencies + models
- **Network**: Internet for package installation

### Accounts & Services (Optional)
- GitHub account (for repository)
- Render/Heroku account (for deployment)

---

## 🚀 Installation & Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/devjohnsonmwangi/EafiaApiAndTbCnnModels.git
cd TbCNNapp/Eafia/api
```

### Step 2: Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### Step 3: Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env with your settings
```

**Key Environment Variables:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tb_detection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=tb_detection

# JWT Secrets (Generate unique values!)
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# ML Service
PYTHON_API_URL=http://localhost:8000
XRAY_CONFIDENCE_THRESHOLD=0.7

# CORS
CORS_ORIGIN=http://localhost:3000

# API Documentation
SWAGGER_ENABLED=true
```

### Step 4: Setup Database
```bash
# Create database (one-time setup)
npx typeorm database:create

# Run migrations
npm run db:migrate:run

# Seed sample data (optional)
npm run db:seed
```

### Step 5: Start Python ML Service (in separate terminal)
```bash
cd ../cnn_models
python -m uvicorn api:app --reload --port 8000

# Verify it's running
curl http://localhost:8000/health
```

### Step 6: Start NestJS API
```bash
# Development mode with auto-reload
npm run start:dev

# API will be available at http://localhost:3000
# Swagger docs at http://localhost:3000/api/docs
```

✅ **Setup Complete!** The API is now running.

---

## 💾 Project Structure

```
api/
├── src/
│   ├── main.ts                              # Application entry point
│   ├── app.module.ts                        # Root module (imports all modules)
│   ├── app.controller.ts                    # Health check endpoint
│   ├── app.service.ts                       # Root service
│   │
│   ├── config/                              # Configuration files
│   │   ├── database.config.ts               # TypeORM database setup
│   │   ├── swagger.config.ts                # Swagger documentation config
│   │   └── typeorm.config.ts                # TypeORM configuration
│   │
│   ├── common/                              # Shared utilities
│   │   ├── dtos/                            # Data Transfer Objects
│   │   │   ├── image.dto.ts                 # Image validation DTOs
│   │   │   └── auth.dto.ts                  # Auth-related DTOs
│   │   ├── guards/                          # Authentication guards
│   │   │   ├── jwt.guard.ts                 # JWT verification
│   │   │   └── role.guard.ts                # Role-based access
│   │   ├── decorators/                      # Custom decorators
│   │   │   ├── roles.decorator.ts           # Role requirement decorator
│   │   │   └── current-user.decorator.ts    # Get current user
│   │   ├── entities/                        # Database entities
│   │   │   ├── user.entity.ts               # User definition
│   │   │   ├── patient.entity.ts            # Patient records
│   │   │   ├── xray.entity.ts               # X-ray images
│   │   │   ├── diagnosis.entity.ts          # Diagnosis results
│   │   │   └── system-log.entity.ts         # System audit logs
│   │   └── enums/                           # Type enumerations
│   │       └── user-role.enum.ts            # Role types
│   │
│   ├── modules/                             # Feature modules
│   │   ├── auth/                            # Authentication module
│   │   │   ├── auth.controller.ts           # Login, register, refresh endpoints
│   │   │   ├── auth.service.ts              # JWT token generation
│   │   │   ├── auth.module.ts               # Module definition
│   │   │   ├── strategies/                  # Passport strategies
│   │   │   │   └── jwt.strategy.ts          # JWT validation strategy
│   │   │   └── guards/                      # Custom auth guards
│   │   │
│   │   ├── users/                           # User management module
│   │   │   ├── users.controller.ts          # User CRUD endpoints
│   │   │   ├── users.service.ts             # User repository & logic
│   │   │   └── users.module.ts              # Module definition
│   │   │
│   │   ├── patients/                        # Patient management module
│   │   │   ├── patients.controller.ts       # Patient endpoints
│   │   │   ├── patients.service.ts          # Patient repository & logic
│   │   │   └── patients.module.ts           # Module definition
│   │   │
│   │   ├── xray-validation/                 # X-ray validation module
│   │   │   ├── xray-validation.controller.ts    # Validation endpoint
│   │   │   ├── xray-validation.service.ts       # Validation logic
│   │   │   └── xray-validation.module.ts        # Module definition
│   │   │
│   │   ├── tb-prediction/                   # TB prediction module
│   │   │   ├── tb-prediction.controller.ts  # Prediction endpoints
│   │   │   ├── tb-prediction.service.ts     # Prediction logic
│   │   │   └── tb-prediction.module.ts      # Module definition
│   │   │
│   │   └── logging/                         # System logging module
│   │       ├── system-logging.controller.ts # Log retrieval endpoints
│   │       ├── system-logging.service.ts    # Log filtering & queries
│   │       └── system-logging.module.ts     # Module definition
│   │
│   ├── database/                            # Database utilities
│   │   ├── seed.ts                          # Sample data seeder
│   │   └── migrations/                      # Database migrations
│   │
│   └── scripts/                             # Utility scripts
│       ├── db-info.ts                       # Database inspection tool
│       └── db-push.ts                       # Schema push utility
│
├── test/                                    # Test suite
│   ├── jest-e2e.json                        # E2E test configuration
│   ├── app.e2e-spec.ts                      # End-to-end tests
│
├── dist/                                    # Compiled output (generated)
├── node_modules/                            # Dependencies (generated)
│
├── package.json                             # Dependencies & scripts
├── tsconfig.json                            # TypeScript configuration
├── tsconfig.build.json                      # Build-specific TS config
├── .env.example                             # Environment template
├── .eslintrc.js                             # ESLint rules
├── nest-cli.json                            # NestJS CLI config
└── README.md                                # This file
```

---

## 🔧 Core Modules

### 1. **Authentication Module** (`auth/`)
Handles user login, registration, and JWT token management.

**Key Files:**
- `auth.controller.ts` - `/auth/login`, `/auth/register`, `/auth/refresh` endpoints
- `auth.service.ts` - JWT token generation and validation
- `jwt.strategy.ts` - Passport JWT verification

**Workflow:**
1. User provides email + password
2. Service validates credentials
3. Tokens generated (access: 1hr, refresh: 7 days)
4. Tokens stored in frontend Redux
5. All requests include Authorization header

---

### 2. **User Management Module** (`users/`)
CRUD operations for physicians, radiologists, and admins.

**Key Features:**
- Get all users with role filtering
- Create new healthcare professionals
- Update user profiles
- Delete users (soft delete recommended)

**Endpoints:**
- `GET /users` - List all with optional role filter
- `POST /users` - Create new user
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Deactivate user

---

### 3. **Patient Management Module** (`patients/`)
Stores and manages patient registry data.

**Key Features:**
- Complete patient demographics
- Medical history tracking
- Allergy information
- Linked to healthcare professionals

**Endpoints:**
- `GET /patients` - List patients (filtered by physician)
- `POST /patients` - Register new patient
- `GET /patients/:id` - Get patient details
- `PUT /patients/:id` - Update patient info
- `DELETE /patients/:id` - Remove patient record

---

### 4. **X-Ray Validation Module** (`xray-validation/`)
Validates that images are legitimate medical X-rays.

**Quality Control:**
- Minimum 70% confidence required
- Prevents non-XRay images from processing
- Returns detailed error messages

**Endpoints:**
- `POST /validation/xray` - Validate X-ray image

**Example Request:**
```bash
curl -X POST http://localhost:3000/validation/xray \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

---

### 5. **TB Prediction Module** (`tb-prediction/`)
Analyzes validated X-rays for tuberculosis presence.

**Capabilities:**
- Base64 image input
- File upload input
- Confidence scores
- Interpretable heatmaps

**Endpoints:**
- `POST /predict/tb/base64` - Predict from Base64
- `POST /predict/tb/file` - Predict from file upload

---

### 6. **System Logging Module** (`logging/`)
Tracks all system activities for compliance and debugging.

**Audit Categories:**
- User actions (login, logout, register)
- Data modifications (create, update, delete)
- Predictions (X-ray analysis results)
- Errors (system failures)

**Endpoints:**
- `GET /logs` - Paginated logs
- `GET /logs/recent` - Last 50 entries
- `GET /logs/errors` - Error logs only
- `GET /logs/audit` - Audit-specific logs

---

## 🔌 API Endpoints

### Authentication
```
POST   /auth/register              Create new account
POST   /auth/login                 User login
POST   /auth/refresh               Refresh access token
GET    /auth/validate              Verify current session
```

### Users
```
GET    /users                      List all users
GET    /users/:id                  Get user by ID
POST   /users                      Create new user
PUT    /users/:id                  Update user
DELETE /users/:id                  Delete user
```

### Patients
```
GET    /patients                   List patients
GET    /patients/:id               Get patient by ID
POST   /patients                   Register new patient
PUT    /patients/:id               Update patient
DELETE /patients/:id               Delete patient
```

### X-Ray Validation
```
POST   /validation/xray            Validate X-ray image
```

### TB Prediction
```
POST   /predict/tb/base64          Predict from Base64
POST   /predict/tb/file            Predict from file upload
GET    /predictions/:id            Get prediction history
```

### System Logging
```
GET    /logs                       Get paginated logs
GET    /logs/recent                Get recent logs
GET    /logs/errors                Get error logs
GET    /logs/audit                 Get audit logs
```

### Health
```
GET    /health                     API health status
GET    /api/docs                   Swagger documentation
```

---

## 📊 Database Schema

### Users Table
```sql
- id: UUID (Primary Key)
- email: String (Unique)
- password: String (Hashed)
- firstName: String
- lastName: String
- role: Enum (admin, super_admin, physician, radiologist)
- isActive: Boolean
- createdAt: Timestamp
- updatedAt: Timestamp
```

### Patients Table
```sql
- id: UUID (Primary Key)
- firstName: String
- lastName: String
- email: String
- phone: String
- dateOfBirth: Date
- gender: Enum (Male, Female, Other)
- medicalHistory: Text
- allergies: Text
- address: String
- createdBy: UUID (Foreign Key → Users)
- createdAt: Timestamp
- updatedAt: Timestamp
```

### XRays Table
```sql
- id: UUID (Primary Key)
- patientId: UUID (Foreign Key → Patients)
- imageBase64: LongText
- uploadedAt: Timestamp
- fileSize: Integer
- fileName: String
```

### DiagnosisResults Table
```sql
- id: UUID (Primary Key)
- xrayId: UUID (Foreign Key → XRays)
- patientId: UUID (Foreign Key → Patients)
- prediction: Enum (Tuberculosis, Normal)
- confidence: Float
- heatmap: LongText
- analyzedAt: Timestamp
- analyzedBy: UUID (Foreign Key → Users)
```

### SystemLogs Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key → Users)
- action: String
- category: Enum (user_action, data_modification, prediction, error)
- severity: Enum (info, warning, error, critical)
- message: String
- metadata: JSON
- timestamp: Timestamp
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user-id",
  "email": "physician@hospital.com",
  "role": "physician",
  "iat": 1704067200,
  "exp": 1704070800
}
```

### Role-Based Access Control

| Role | Permissions |
|------|------------|
| **super_admin** | Full system access, user management, logs |
| **admin** | Dashboard access, user oversight, logs |
| **physician** | Patient management, X-ray uploads, analysis |
| **radiologist** | View analysis results, quality assurance |

### Protected Routes Example
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@Get('users')
getAllUsers() {
  return this.usersService.findAll();
}
```

---

## ⚙️ Configuration

### Environment Variables Priority
1. `.env` file (highest priority)
2. `process.env` (system variables)
3. `.env.example` (defaults)

### Important Settings

**Data Validation Thresholds:**
```env
XRAY_CONFIDENCE_THRESHOLD=0.7        # Minimum 70% confidence
TB_CONFIDENCE_THRESHOLD=0.6          # TB detection threshold
MIN_IMAGE_SIZE=102400                # 100KB minimum
MAX_IMAGE_SIZE=10485760              # 10MB maximum
```

**Token Configuration:**
```env
JWT_EXPIRATION=3600                  # 1 hour
JWT_REFRESH_EXPIRATION=604800        # 7 days
TOKEN_BLACKLIST_TTL=604800           # Blacklist duration
```

---

## 🛠️ Development

### Run Development Server
```bash
npm run start:dev
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### Linting & Formatting
```bash
# Fix linting issues
npm run lint

# Format code
npm run format
```

### Database Operations
```bash
# Create migration
npm run db:migrate:create -- -n CreateUsersTable

# Generate migration from entities
npm run db:migrate:generate

# Run pending migrations
npm run db:migrate:run

# Revert last migration
npm run db:migrate:revert

# Seed sample data
npm run db:seed

# Reset database (⚠️ Deletes all data)
npm run db:reset
```

---

## 🚀 Deployment

### Heroku Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create eafia-api

# Set environment variables
heroku config:set JWT_SECRET=your_secret \
  DATABASE_URL=postgresql://... \
  NODE_ENV=production

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Render Deployment
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy using Start Command: `npm run start:prod`

### Docker Deployment
```bash
# Build image
docker build -t eafia-api:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  eafia-api:latest
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port 3000 already in use** | `lsof -i :3000` then `kill -9 <PID>` |
| **Connection refused to Python API** | Verify Python service runs on 8000 |
| **Database connection error** | Check .env DATABASE_URL and PostgreSQL running |
| **JWT token invalid** | Ensure JWT_SECRET matches between services |
| **CORS errors** | Update CORS_ORIGIN in .env to match frontend URL |
| **Module not found** | Run `npm install` to install dependencies |
| **Type errors on build** | Run `npm run build` for full diagnostic |

---

## 🔒 Security

### Best Practices Implemented
- ✅ **Password Hashing** - bcryptjs with salt rounds
- ✅ **JWT Tokens** - Secure token-based authentication
- ✅ **CORS Protection** - Whitelist allowed origins
- ✅ **Input Validation** - class-validator on all DTOs
- ✅ **Rate Limiting** - Configurable per endpoint
- ✅ **Helmet Protection** - Security headers
- ✅ **Audit Logging** - All changes tracked
- ✅ **SQL Injection Prevention** - TypeORM parameterized queries

### Security Checklist
- [ ] Change default JWT secrets
- [ ] Set strong database password
- [ ] Enable HTTPS in production
- [ ] Update CORS to production frontend URL
- [ ] Regular security audits
- [ ] Monitor system logs for anomalies
- [ ] Backup database regularly
- [ ] Implement rate limiting

---

## 📞 Support & Resources

### Documentation Files
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed installation
- **[TB_DETECTION_API_GUIDE.md](./TB_DETECTION_API_GUIDE.md)** - API endpoint reference
- **[DATABASE_SCHEMA_GUIDE.md](./DATABASE_SCHEMA_GUIDE.md)** - Schema details

### External Resources
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Passport.js Strategies](http://www.passportjs.org)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Debugging
```bash
# Enable debug mode
DEBUG=* npm run start:dev

# Check database connection
npm run db:info

# View migrations status
npm run db:status
```

---

## 📝 License

Part of the Eafia TB Detection System

## 🎓 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | NestJS 11.0.1 |
| **Language** | TypeScript 5.0+ |
| **Database** | PostgreSQL 12+ |
| **ORM** | TypeORM 0.3+ |
| **Authentication** | Passport.js + JWT |
| **Validation** | class-validator |
| **API Docs** | Swagger/OpenAPI |
| **Testing** | Jest |
| **ML Service** | FastAPI + PyTorch |

---

**🎯 Ready to detect TB with confidence!**

For questions or issues, check the documentation files or open an issue on GitHub.

See [QUICK_START.md](./QUICK_START.md) to get running in 5 minutes. 🚀
