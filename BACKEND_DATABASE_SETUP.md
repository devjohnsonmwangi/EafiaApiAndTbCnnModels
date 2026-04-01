# Backend & Database Setup Guide

## ✅ Configured Components

This document provides setup and execution instructions for the TB Diagnostic System backend.

### What's Been Configured:
- ✅ **Environment Variables** (.env) - Neon serverless PostgreSQL + all services
- ✅ **Database Scripts** - 12 npm commands for schema management
- ✅ **TypeORM Setup** - Automatic entity discovery & synchronization
- ✅ **Database Indexes** - All entities have proper indexes on key fields
- ✅ **SSL/TLS** - Configured for Neon pooler security

---

## 🚀 Quick Start (5 minutes)

### 1. Backend API Server

```bash
cd Eafia/api

# Install dependencies
npm install
# or with pnpm
pnpm install

# Start development server (watches for changes)
npm run start:dev

# Navigate to: http://localhost:3000/api (Swagger documentation)
```

### 2. Database Setup

```bash
# Check database connection
npm run db:info

# Push schema to Neon (creates tables)
npm run db:push

# View migration status
npm run db:status
```

### 3. Python ML Service (Models)

```bash
cd cnn_models

# Create Python environment
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start ML API server (port 5000)
python api.py

# Navigate to: http://localhost:5000/docs (API docs)
```

---

## 📋 Environment Variables (.env)

Your `.env` file is configured with:

| Category | Variable | Value |
|----------|----------|-------|
| **Database** | `DATABASE_URL` | Neon PostgreSQL pooler endpoint |
| **Database** | `TYPEORM_SYNCHRONIZE` | `true` (dev), `false` (prod) |
| **Database** | `TYPEORM_LOGGING` | SQL query logging |
| **API Server** | `GATEWAY_PORT` | 3000 |
| **ML Service** | `ML_SERVICE_URL` | http://localhost:5000 |
| **Storage** | `SUPABASE_URL` | X-Ray image storage |
| **Security** | `JWT_SECRET` | Change this in production! |

**⚠️ IMPORTANT**: Never commit `.env` to version control!

---

## 🗄️ Database Management Commands

### Schema Operations

```bash
# Check database connection and schema info
npm run db:info

# Synchronize schema with entities (safe - no data loss)
npm run db:push

# Drop entire schema (caution! data loss)
npm run db:drop

# Reset database (drop + sync + seed)
npm run db:reset
```

### Migration Commands (for production)

```bash
# Generate migration from entity changes
npm run db:migrate:generate

# Run pending migrations
npm run db:migrate:run

# Revert last migration
npm run db:migrate:revert

# View migration status
npm run db:status
```

### Data Management

```bash
# Seed database with initial data
npm run db:seed
```

---

## 📊 Database Schema

### Tables Created Automatically:

1. **users** - System users (physicians, radiologists, admins)
   - Indexes: email, role, license
   - Fields: id, email, firstName, lastName, passwordHash, role, license, specialization, createdAt, updatedAt

2. **patients** - Patient records
   - Indexes: physicianId, email, createdAt
   - Fields: id, firstName, lastName, email, phone, dateOfBirth, medicalHistory, allergies, physicianId

3. **xray_scans** (or xrays) - X-Ray images
   - Indexes: patientId, status, uploadedAt
   - Fields: id, fileName, fileSize, contentType, status, qualityScore, patientId

4. **diagnosis_results** - Prediction results
   - Indexes: patientId, xrayId, diseaseType, createdAt
   - Fields: id, patientId, xrayId, diseaseType, prediction, confidenceScore, confidenceLevel, diseaseIntensity, affectedAreas, affectedPercentage, heatmapBase64, modelName, deviceIpAddress, createdAt, updatedAt

---

## 🔐 Neon Database Connection

Your backend is connected to **Neon Serverless PostgreSQL** with:

- **Pooler Enabled**: Connection pooling for better resource usage
- **SSL/TLS**: Secure encrypted connections
- **Auto-Scaling**: Scales to handle traffic spikes
- **Pay-per-use**: Only pay for compute used

### Connection Details:
```
Host: ep-autumn-lab-amazx6ey-pooler.c-5.us-east-1.aws.neon.tech
Port: 5432
SSL Mode: require
Connection Pooling: Yes
```

---

## 🐍 Python ML Models API

### Available Models:

Located in `cnn_models/pth_files/`:
- `tb_classifier.pth` - Tuberculosis detection
- `pneumonia_classifier.pth` - Pneumonia detection
- `Normal_Abnormal_lungcancer_classifier.pth` - Lung cancer detection
- `bone_fracture_classifier.pth` - Bone fracture detection

### Running ML Service:

```bash
# From project root
cd cnn_models

# Setup (first time only)
python -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt

# Run API server
python api.py

# Running on: http://localhost:5000
# API Docs: http://localhost:5000/docs
```

### ML Model Endpoints (example):

```bash
# Predict TB (POST)
curl -X POST http://localhost:5000/predict/tb \
  -F "file=@xray.jpg"

# Predict Pneumonia
curl -X POST http://localhost:5000/predict/pneumonia \
  -F "file=@xray.jpg"

# Predict Lung Cancer
curl -X POST http://localhost:5000/predict/lung-cancer \
  -F "file=@xray.jpg"

# Predict Bone Fracture
curl -X POST http://localhost:5000/predict/bone-fracture \
  -F "file=@xray.jpg"
```

---

## 🚢 Full System Start (All Services)

### Terminal 1 - Backend API:
```bash
cd Eafia/api
npm run start:dev
# Running on http://localhost:3000
# Swagger Docs: http://localhost:3000/api
```

### Terminal 2 - ML Service:
```bash
cd cnn_models
source venv/bin/activate  # or venv\Scripts\activate
python api.py
# Running on http://localhost:5000
# Docs: http://localhost:5000/docs
```

### Terminal 3 - Frontend (optional):
```bash
cd Eafia/client
npm run dev
# Running on http://localhost:5173
```

---

## 🚀 Production Deployment

### 1. Build Backend:
```bash
npm run build
```

### 2. Push Schema to Neon:
```bash
npm run db:push
```

### 3. Run Migrations:
```bash
npm run db:migrate:run
```

### 4. Set Production Environment:
```bash
NODE_ENV=production
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false
```

### 5. Start Production Server:
```bash
npm run start:prod
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```
Error: ECONNREFUSED or FATAL: database does not exist

Fix:
1. Check DATABASE_URL in .env
2. Verify Neon console has database created
3. Copy correct connection string from Neon dashboard
4. Test with: npm run db:info
```

### Migrations Failed
```
Error: No migrations found

Fix:
npm run db:migrate:generate  # Generate from entities
npm run db:migrate:run       # Run migrations
```

### Port Already in Use
```
Error: listen EADDRINUSE :::3000

Fix:
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill process or change GATEWAY_PORT in .env
```

### ML Service Unavailable
```
Error: Cannot reach ML service at http://localhost:5000

Fix:
1. Start Python API: python cnn_models/api.py
2. Check ML_SERVICE_URL in .env
3. Verify port 5000 is not blocked
```

---

## 📈 Performance & Monitoring

### Monitor Database:
```bash
# Check connection status
npm run db:info

# View slow queries (TYPEORM_LOGGING=true)
# Monitor in .env TYPEORM_LOGGING setting
```

### Monitor API Server:
```bash
# Health check endpoint
curl http://localhost:3000/health

# Swagger documentation
http://localhost:3000/api
```

---

## 📝 Common Tasks

### Add New Entity:
1. Create `src/modules/[name]/[name].entity.ts`
2. Add `@Entity()` and `@Index()` decorators
3. Run: `npm run db:push`

### Create Database Backup:
```bash
# Neon Dashboard → Settings → Backups
# Or use pg_dump
pg_dump DATABASE_URL > backup.sql
```

### Restore from Backup:
```bash
psql DATABASE_URL < backup.sql
```

### View Database Logs:
```bash
# Neon Dashboard → Monitoring → Logs
```

---

## ✅ Verification Checklist

- [ ] `.env` configured with DATABASE_URL
- [ ] `npm run db:info` connects successfully
- [ ] `npm run db:push` creates tables
- [ ] `npm run start:dev` starts API on port 3000
- [ ] Swagger docs available at http://localhost:3000/api
- [ ] Python ML service starts on port 5000
- [ ] API can connect to database
- [ ] ML service can load models

---

## 🔗 Useful Links

- **Neon Dashboard**: https://console.neon.tech
- **Supabase Dashboard**: https://app.supabase.com
- **TypeORM Docs**: https://typeorm.io
- **NestJS Docs**: https://docs.nestjs.com
- **Swagger/OpenAPI**: http://localhost:3000/api

---

## 📞 Support

For issues:
1. Check `.env` configuration
2. Run `npm run db:info` to test connection
3. Check logs: `tail -f logs/error.log`
4. Verify all services are running
5. Check firewall/port availability

---

**Last Updated**: March 31, 2026
**Backend Version**: 1.0.0
**Database**: Neon Serverless PostgreSQL
**Status**: ✅ Production Ready
