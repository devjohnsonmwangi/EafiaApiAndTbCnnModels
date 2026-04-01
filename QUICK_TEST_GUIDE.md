# TB Detection API - Quick Test Guide

## 📋 Testing Options for Windows

You have **3 ways** to test the TB Detection API:

---

## **Option 1: Interactive Testing with VS Code REST Client** ⭐ RECOMMENDED

### Setup (One-time)
1. Open VS Code
2. Install extension: **REST Client** by Huachao Zheng (humao.rest-client)
3. Open the file: `api.http`

### Usage
- Each test has a "Send Request" clickable button
- Run tests section by section
- View responses in the side panel
- Excellent for debugging and understanding the API

### Time Required
- 5-10 minutes for full test suite
- Perfect for manual validation and debugging

### Tests Included
- ✅ Health checks (API + ML Service)
- ✅ Authentication (register, login, token)
- ✅ All CRUD operations (users, patients, X-rays, diagnoses)
- ✅ ML model integration (direct + API wrapper)
- ✅ End-to-end workflows
- ✅ Error scenarios

**File:** `./api.http`

---

## **Option 2: Automated Testing with PowerShell** ⚡ FASTEST

### Prerequisites
- PowerShell 5.1+ (built-in on Windows)
- Backend running: `pnpm start:dev`
- ML Service running: `python cnn_models/api.py`
- Both should be running in separate terminal windows

### Usage
```powershell
cd C:\Users\devjohnsonmwangi\Desktop\TbCNNapp\Eafia\api
.\test.ps1
```

### Time Required
- 30-60 seconds for complete test suite
- Instant pass/fail results

### Output Format
```
===========================================
TB Detection API - Test Suite (Windows)
===========================================

1. HEALTH & CONNECTIVITY
Testing: API Health ... ✓ PASS (HTTP 200)
Testing: ML Service Health ... ✓ PASS (HTTP 200)

2. AUTHENTICATION
Testing: Register User ... ✓ PASS (HTTP 201)
Testing: User Login ... ✓ PASS (HTTP 200)

3. USERS MODULE
Testing: Get All Users ... ✓ PASS (HTTP 200)

4. ML MODEL INTEGRATION
Testing: Direct ML X-Ray Validation ... ✓ PASS
Testing: Direct ML TB Prediction ... ✓ PASS

===========================================
TEST SUMMARY
===========================================
Total Tests: 9
Passed: 9 ✓
Failed: 0

NEXT STEPS
✓ All tests passed!
```

**File:** `.\test.ps1`

---

## **Option 3: Manual Step-by-Step Testing** 📖 DETAILED

Use this guide for deep understanding and troubleshooting.

### Prerequisites
- Both Backend and ML Service running
- Text editor or Postman for manual requests

### Steps
1. Start with health checks
2. Test authentication flow
3. Test each module independently
4. Test ML service integration
5. Test end-to-end workflows
6. Compare direct ML vs. API wrapper responses
7. Verify database storage and retrieval

### Detailed Instructions
See: `./ML_SYNC_TESTING.md`

---

## 🚀 Getting Started (Complete Workflow)

### Step 1: Start Both Services (Use 2 Terminal Window Sessions)

**Terminal 1 - Backend:**
```cmd
cd C:\Users\devjohnsonmwangi\Desktop\TbCNNapp\Eafia\api
pnpm install          # (only if needed)
pnpm start:dev
```

Expected output:
```
[Nest] 12345 - 01/15/2025, 10:30:15 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345 - 01/15/2025, 10:30:20 AM     LOG [InstanceLoader] AuthModule dependencies initialized
...
[Nest] 12345 - 01/15/2025, 10:30:22 AM     LOG [NestApplication] Nest application successfully started on port 3000
```

**Terminal 2 - ML Service:**
```cmd
cd C:\Users\devjohnsonmwangi\Desktop\TbCNNapp\Eafia\cnn_models
python -m venv venv          # (one-time, if needed)
venv\Scripts\activate        # Activate virtual environment
pip install -r requirements.txt  # (one-time, if needed)
python api.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
 * Restarting with reloader
```

### Step 2: Run Your Chosen Test

**Choose ONE:**
- **Interactive:** Open `api.http` in VS Code, click "Send Request" buttons
- **Automated:** Run `.\test.ps1` in PowerShell
- **Manual:** Follow `ML_SYNC_TESTING.md` step-by-step

### Step 3: Verify Results

✅ **Success Indicators:**
- All tests show green checkmarks
- HTTP responses include status 200-201
- ML predictions return confidence scores
- Database queries return data
- Token-based authentication works

❌ **Failure Troubleshooting:**
See "Troubleshooting Guide" section below

---

## 🔧 Troubleshooting Guide

### **Problem: Backend won't start**

**Error:** `ECONNREFUSED` or database connection errors

**Solution:**
1. Verify Neon PostgreSQL credentials in `.env.development`
2. Check internet connection (Neon is cloud-based)
3. Verify DATABASE_HOST is correct:
   ```
   DATABASE_HOST=ep-autumn-lab-amazx6ey-pooler.c-5.us-east-1.aws.neon.tech
   ```
4. Restart: `pnpm start:dev`

---

### **Problem: ML Service returns 404 errors**

**Error:** `Cannot GET /health` or `/predict/tb` not found

**Solution:**
1. Ensure `python api.py` is running in `cnn_models/` directory
2. Check that Python services started successfully on port 5000
3. Verify all model files exist in `cnn_models/pth_files/`:
   - `tb_classifier.pth`
   - `Normal_Abnormal_lungcancer_classifier.pth`
   - `pneumonia_classifier.pth`
   - `bone_fracture_classifier.pth`
4. Check Python console for error messages

---

### **Problem: Tests fail with "Could not extract token"**

**Error:** Authentication test fails, no bearer token returned

**Solution:**
1. Ensure account creation is working
2. Check `.env.development` has JWT secrets:
   ```
   JWT_SECRET=your_secret_key_here
   JWT_REFRESH_SECRET=your_refresh_secret_here
   ```
3. Verify user registration endpoint works before login
4. Check Database connection

---

### **Problem: ML predictions don't match API responses**

**Error:** Direct `/predict/tb` response differs from `/api/predict/tb/base64`

**Solution:**
1. Both endpoints should return identical core fields
2. Compare responses side-by-side in `api.http`
3. Check `src/tb-prediction/` service implementation
4. Verify model files are same version on both services
5. Review `ML_SYNC_TESTING.md` "Synchronization Tests" section

---

### **Problem: REST Client says "Send Request" button doesn't appear**

**Error:** `api.http` shows no interactive buttons in VS Code

**Solution:**
1. Install "REST Client" extension (humao.rest-client)
2. Close and reopen the `api.http` file
3. Ensure VS Code recognizes it as HTTP file
4. Reload VS Code if needed: `Ctrl+Shift+P` → "Reload Window"

---

## 📊 Test Coverage

### Tests Included in All Options

| Category | Tests | Purpose |
|----------|-------|---------|
| **Health** | 3 | Verify Backend and ML Service running |
| **Authentication** | 2 | Register and login working |
| **Users CRUD** | 4 | Create, read, update, delete users |
| **Patients CRUD** | 4 | Manage patient records |
| **X-Rays CRUD** | 4 | Upload and manage X-ray files |
| **ML Validation** | 2 | Direct ML service X-ray validation |
| **TB Prediction** | 2 | Direct ML service predictions |
| **API Integration** | 2 | API wrapper tests for ML services |
| **Diagnosis Results** | 2 | Store and retrieve predictions |
| **End-to-End** | 1 | Complete TB detection workflow |
| **Error Scenarios** | 3 | 401, 400, 404 error handling |

**Total: 30+ comprehensive tests**

---

## ⏱️ Expected Performance

| Operation | Expected Time | Max Time |
|-----------|---------------|----------|
| API Health Check | <100ms | 500ms |
| User Registration | <200ms | 1s |
| User Login | <200ms | 1s |
| X-Ray Validation | 1-2 seconds | 5s |
| TB Prediction | 2-5 seconds | 10s |
| Database Query | <100ms | 500ms |
| Full Test Suite | 30-60 seconds | 2 minutes |

---

## 📝 API Endpoints Tested

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token

### Users Module
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Patients Module
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details

### X-Rays Module
- `GET /api/xrays` - List X-rays
- `POST /api/xrays` - Upload X-ray
- `GET /api/xrays/:id` - Get X-ray details
- `PUT /api/xrays/:id` - Update X-ray status

### TB Prediction (ML Integration)
- `POST /api/predict/tb/base64` - Predict TB from base64 image
- `POST /api/predict/tb/upload` - Predict TB from file upload

### Diagnosis Results
- `GET /api/diagnosis-results` - List all diagnoses
- `POST /api/diagnosis-results` - Store diagnosis
- `GET /api/diagnosis-results/:id` - Get diagnosis details

### ML Service Direct (Port 5000)
- `GET /health` - ML service health check
- `POST /predict/tb` - TB prediction (direct)
- `POST /predict/pneumonia` - Pneumonia detection
- `POST /predict/bone-fracture` - Bone fracture detection
- `POST /validate/xray` - X-ray type validation

---

## ✅ Success Checklist

After running tests, verify:

- [ ] Backend starts without errors
- [ ] ML Service starts without errors  
- [ ] Health checks pass (API responds)
- [ ] ML Service responds to requests
- [ ] User registration works
- [ ] User login returns access token
- [ ] Token-based requests work (Bearer token)
- [ ] Database operations succeed
- [ ] Direct ML calls return predictions
- [ ] API wrapper calls work
- [ ] End-to-end TB prediction workflow completes
- [ ] All tests show green status
- [ ] Inference times are within expected range
- [ ] No database connection errors
- [ ] JWT token handling works correctly

---

## 🔗 Additional Resources

- **Full API Documentation:** `API_REFERENCE.md`
- **ML Model Details:** `ML_SYNC_TESTING.md`
- **Backend Setup:** `COMPLETE_BACKEND_SETUP.md`
- **Database Guide:** `DATABASE_SETUP.md`
- **Troubleshooting:** `ML_SYNC_TESTING.md` (Troubleshooting section)

---

## 💡 Pro Tips

1. **Run tests in order:** Health → Auth → CRUD → ML Integration → End-to-end
2. **Compare responses:** Use REST Client side-panel to compare direct ML vs. API wrapper
3. **Check timing:** Note inference times to ensure ML models are performant
4. **Keep terminals open:** Leave both Backend and ML Service running in separate terminals
5. **Monitor logs:** Watch both terminal windows for errors during tests
6. **Reuse token:** The PowerShell script extracts login token and reuses it for subsequent tests
7. **Test isolated:** Each test is independent; failure in one doesn't affect others

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Create Test Data** - Use `/api/patients` to add real patient records
2. **Test Real X-rays** - Upload actual medical images via `/api/xrays`
3. **Run Predictions** - Process X-rays through TB detection pipeline
4. **Store Results** - Verify diagnoses are saved in database
5. **Deploy** - Move to staging/production environment
6. **Monitor** - Set up logging and monitoring for production

---

**Questions?** Check `ML_SYNC_TESTING.md` for detailed explanations and troubleshooting.

**Modified:** January 2025
**Version:** 1.0
