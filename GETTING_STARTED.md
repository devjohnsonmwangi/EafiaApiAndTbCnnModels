# 🎯 Quick Start Guide - Eafia TB Detection Backend

**Everything is ready!** Follow this guide to launch your production-ready API in minutes.

---

## ⚡ 5-Minute Quick Start

### 1. Install Dependencies
```bash
cd Eafia/api
npm install
# or: pnpm install
```

### 2. Configure Database

**Option A: Local PostgreSQL (Development)**
```bash
# Create file .env.development with:
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=eafia_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=eafia_tb_detection

JWT_SECRET=your-jwt-secret-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
PYTHON_API_URL=http://localhost:8000
CACHE_TTL=3600
```

**Option B: Neon Serverless (Production)**
```bash
# Create file .env.production with:
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/eafia_tb_detection?sslmode=require

JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
PYTHON_API_URL=https://your-ml-service.com
CACHE_TTL=3600
```

### 3. Start the API
```bash
npm run start:dev
```

**You should see:**
```
✅ Server is running on http://localhost:3000
📚 Swagger API documentation: http://localhost:3000/api
✨ Ready for incoming requests
```

### 4. Test the API
Open in browser: **http://localhost:3000/api**

---

## 📚 Documentation Files

| Document | Purpose | Read When |
|----------|---------|-----------|
| [COMPLETE_BACKEND_SETUP.md](COMPLETE_BACKEND_SETUP.md) | Full system overview and setup | First-time setup |
| [API_REFERENCE.md](API_REFERENCE.md) | All 25 API endpoints with examples | Integrating with frontend |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Manual & automated testing | Testing the API |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | Database configuration & migration | Database troubleshooting |

---

## 🎬 Getting Started Workflow

### Step 1: Set Up Database
```bash
# For local PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE eafia_tb_detection;
CREATE USER eafia_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE eafia_tb_detection TO eafia_user;
```

### Step 2: Clone & Install
```bash
cd Eafia/api
npm install
```

### Step 3: Configure Environment
```bash
# Create .env.development
cp .env.example .env.development

# Edit with your database credentials
nano .env.development
```

### Step 4: Start Services

**Terminal 1 - Start Python ML Service:**
```bash
cd Eafia/cnn_models
python -m uvicorn api:app --reload --port 8000
```

**Terminal 2 - Start NestJS API:**
```bash
cd Eafia/api
npm run start:dev
```

### Step 5: Verify Everything Works
1. Open http://localhost:3000/api
2. Register a user in Swagger
3. Create a patient
4. Upload an X-ray
5. Create a diagnosis

---

## 🔑 Key Features Ready to Use

### ✅ Authentication
- User registration with email & password
- JWT-based login
- Token refresh mechanism
- Password hashing with bcrypt

### ✅ Authorization (3 Roles)
```
PHYSICIAN    → Register own patients, see own records
ADMIN        → Manage users & patients
SUPER_ADMIN  → Full system access
```

### ✅ Patient Management
- Register patients with complete medical history
- Physicians see only their patients
- Full CRUD operations with role-based access

### ✅ X-Ray Management
- Upload chest X-rays (base64 encoded)
- Automatic validation via Python ML service
- Track validation status (PENDING → COMPLETED)
- Store X-ray confidence scores

### ✅ TB Diagnosis
- Record diagnosis results with TB intensity levels:
  - **NONE** - No TB
  - **MILD** - Early stage
  - **MODERATE** - Developing TB
  - **SEVERE** - Advanced
  - **CRITICAL** - Life-threatening
- Store heatmaps and clinical findings
- Physician recommendations included

### ✅ Monitoring
- Processing time on every endpoint (milliseconds)
- Device IP capture for security tracking
- Request/response logging
- Database query performance monitoring

### ✅ Security
- Helmet.js for HTTP headers
- CORS configured
- Input validation via class-validator
- SQL injection prevention
- Password hashing

### ✅ Documentation
- Interactive Swagger/OpenAPI at `/api`
- Request/response examples
- Bearer token authentication

---

## 📊 System Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend (Port 5173)       │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTP/JSON
                   ▼
┌─────────────────────────────────────────┐
│  NestJS API (Port 3000)                  │
│  - Auth (Register, Login)                │
│  - Users (RBAC)                          │
│  - Patients (Physician Isolation)        │
│  - X-Rays (Upload & Validation)          │
│  - Diagnosis Results (TB Intensity)      │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼                    ▼
  PostgreSQL Database   Python ML Service
  (Local or Neon)      (Port 8000)
  - Users              - TB Detection
  - Patients           - Image Validation
  - X-Rays             - Heatmap Generation
  - Diagnoses          - Confidence Scoring
```

---

## 🚀 Deployment Quick Links

### Local Development
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

### Docker Deployment
```bash
docker build -t eafia-api .
docker run -p 3000:3000 -e DATABASE_URL=... eafia-api
```

### Cloud Platforms Supported
- **Heroku** - Git push deployment
- **Railway** - Easy PostgreSQL integration
- **Render** - Serverless PostgreSQL
- **AWS Elastic Beanstalk** - Full control
- **DigitalOcean App Platform** - Simple setup

---

## 🔍 Common Workflows

### Register & Login
```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"doc@test.com","password":"Pass123!","role":"physician"}'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doc@test.com","password":"Pass123!"}'

# 3. Use token in requests
curl -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer <token>"
```

### Create Patient & Upload X-Ray
```bash
# 1. Register patient
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer <token>" \
  -d '{"firstName":"John","lastName":"Doe",...}'

# 2. Upload X-ray (get patientId first)
curl -X POST http://localhost:3000/xrays \
  -H "Authorization: Bearer <token>" \
  -d '{"patientId":"<id>","imageBase64":"data:image/jpeg;base64,..."}'

# 3. Create diagnosis (after validation completes)
curl -X POST http://localhost:3000/diagnosis-results \
  -H "Authorization: Bearer <token>" \
  -d '{"patientId":"<id>","xrayId":"<id>","tbIntensity":"MODERATE",...}'
```

---

## ✅ Pre-Launch Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL installed and running
- [ ] Database `eafia_tb_detection` created
- [ ] `.env.development` file configured
- [ ] `npm install` completed without errors
- [ ] `npm run start:dev` starts without errors
- [ ] Swagger loads at http://localhost:3000/api
- [ ] Can register user in Swagger
- [ ] Database tables auto-created (check with psql)

---

## 🆘 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify credentials in .env
DATABASE_USER=eafia_user
DATABASE_PASSWORD=<correct-password>
DATABASE_HOST=localhost
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "JWT_SECRET not set"
```bash
# Add to .env.development
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-also-32-chars
```

### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **Authentication** |
| POST | `/auth/register` | Create new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh-token` | Refresh access token |
| **Users** |
| GET | `/users/:id` | Get user details |
| GET | `/users` | List all users (Admin) |
| PATCH | `/users/:id/deactivate` | Deactivate user |
| **Patients** |
| POST | `/patients` | Register patient |
| GET | `/patients` | List patients |
| GET | `/patients/:id` | Get patient details |
| PUT | `/patients/:id` | Update patient |
| DELETE | `/patients/:id` | Delete patient |
| **X-Rays** |
| POST | `/xrays` | Upload X-ray |
| GET | `/xrays` | List X-rays |
| GET | `/xrays/:id` | Get X-ray details |
| GET | `/xrays/patient/:patientId` | Patient's X-rays |
| **Diagnosis** |
| POST | `/diagnosis-results` | Create diagnosis |
| GET | `/diagnosis-results` | List diagnoses |
| GET | `/diagnosis-results/:id` | Get diagnosis |
| GET | `/diagnosis-results/patient/:patientId` | Patient diagnoses |

---

## 🎓 Learning Path

1. **Start here**: [COMPLETE_BACKEND_SETUP.md](COMPLETE_BACKEND_SETUP.md)
   - Understand system architecture
   - See all features implemented

2. **Try endpoints**: [API_REFERENCE.md](API_REFERENCE.md)
   - Copy/paste example curl commands
   - Test in Swagger UI

3. **Debug issues**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
   - Detailed testing procedures
   - Common errors & solutions

4. **Optimize setup**: [DATABASE_SETUP.md](DATABASE_SETUP.md)
   - Production database configuration
   - Performance tuning

---

## 🌟 What's Included

### Code (35+ Files)
- ✅ 4 database entities with relationships
- ✅ 5 feature modules (Auth, Users, Patients, XRays, DiagnosisResults)
- ✅ Complete service layer with business logic
- ✅ Full controller layer with response formatting
- ✅ JWT guards and role-based access control
- ✅ Request logging middleware
- ✅ Response formatter utility
- ✅ Environment configuration
- ✅ Swagger/OpenAPI documentation
- ✅ Error handling

### Configuration
- ✅ TypeORM setup for PostgreSQL
- ✅ JWT configuration
- ✅ Cache module integration
- ✅ CORS enabled
- ✅ Helmet security headers
- ✅ Input validation

### Documentation
- ✅ Complete backend setup guide
- ✅ API reference with 25 endpoints
- ✅ Testing guide with examples
- ✅ Database setup and migration guide
- ✅ This quick start guide

---

## 🎯 Next Steps

### Immediate (Next 5 minutes)
1. Install dependencies: `npm install`
2. Configure `.env.development`
3. Start API: `npm run start:dev`
4. Open Swagger: http://localhost:3000/api

### Short Term (Next hour)
1. Register test user
2. Create test patient
3. Upload test X-ray
4. Create test diagnosis
5. Verify all endpoints work

### Medium Term (Today)
1. Set up PostgreSQL properly
2. Review database schema
3. Integrate with React frontend
4. Test complete workflow

### Long Term (This week)
1. Deploy to production (Neon + Heroku/Railway)
2. Set up monitoring
3. Configure backups
4. Load testing

---

## 📖 Full Documentation

All detailed information is in separate guides:

- **[COMPLETE_BACKEND_SETUP.md](COMPLETE_BACKEND_SETUP.md)** - Full system documentation (📄 ~400 lines)
- **[API_REFERENCE.md](API_REFERENCE.md)** - All 25 API endpoints with examples (📄 ~900 lines)
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures and debugging (📄 ~700 lines)
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database configuration and optimization (📄 ~800 lines)

---

## 💡 Pro Tips

1. **Use Swagger for development** - Try endpoints without writing code
2. **Check logs for debugging** - Lots of helpful info in terminal
3. **Monitor processing times** - Every response shows milliseconds
4. **Test role-based access** - Register users with different roles
5. **Use cURL for integration** - Easy to run tests via scripts

---

## ✨ You're All Set!

```bash
npm run start:dev
```

Your production-ready TB Detection API is ready to go! 🚀

**Questions?** Refer to the comprehensive documentation files.

**Integration?** Copy endpoints from [API_REFERENCE.md](API_REFERENCE.md)

**Debugging?** Check [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

**Happy coding!** 🎉
