# ML Model Synchronization & Testing Guide

## Overview

This document provides comprehensive testing procedures to verify ML model integration and synchronization with the TB Detection API.

---

## 1. ML Service Configuration

### 1.1 Backend Environment Setup

**File:** `.env` and `.env.development`

```env
# ML Service URL (Primary)
PYTHON_API_URL=http://localhost:5000

# ML Service URL (Fallback)
ML_SERVICE_URL=http://localhost:5000

# ML Model Timeout
ML_REQUEST_TIMEOUT=30000  # 30 seconds
```

**Verification:**
```bash
# Check .env has correct URL
grep PYTHON_API_URL .env

# Expected Output:
# PYTHON_API_URL=http://localhost:5000
```

### 1.2 ML Service Files

**Location:** `cnn_models/`

```
cnn_models/
├── api.py                          (Flask application)
├── requirements.txt                (Python dependencies)
├── pth_files/
│   ├── tb_classifier.pth           (TB detection - PRIMARY)
│   ├── Normal_Abnormal_lungcancer_classifier.pth
│   ├── pneumonia_classifier.pth
│   └── bone_fracture_classifier.pth
├── trained_models/
│   ├── tuberculosis_model.py
│   ├── xray_detector_model.py
│   ├── pneumonia_model.py
│   ├── bone_fracture_model.py
│   └── lung_cancer_model.py
└── utils/
    └── heatmap.py
```

---

## 2. Starting the ML Service

### 2.1 Verify Python Environment

```bash
# Activate Python environment
cd C:\Users\devjohnsonmwangi\Desktop\TbCNNapp

# Windows
.venv\Scripts\Activate.ps1

# Verify Python
python --version
# Expected: Python 3.9+
```

### 2.2 Install Dependencies

```bash
cd cnn_models

# Install required packages
pip install -r requirements.txt

# Required packages:
# - torch==2.0.1
# - torchvision
# - flask
# - numpy
# - pillow
```

### 2.3 Start ML Service

```bash
cd cnn_models

# Start Flask API
python api.py

# Expected Output:
# * Running on http://127.0.0.1:5000
# WARNING: This is a development server. Do not use it in production.
```

### 2.4 Verify ML Service is Running

```bash
# Terminal 2 (new terminal)
curl http://localhost:5000/health -H "Content-Type: application/json"

# Expected Response:
# {"status": "ok", "service": "TB Detection ML Service"}

# Or using PowerShell:
Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get
```

---

## 3. ML Model Endpoints

### 3.1 X-Ray Validation Endpoint

**Purpose:** Check if uploaded image is actually a chest X-ray

**Direct ML Service Call:**
```bash
curl -X POST http://localhost:5000/validate/xray \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "iVBORw0KGgo..."
  }'
```

**API Wrapper Call (Recommended):**
```bash
curl -X POST http://localhost:3000/api/validation/xray \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "imageBase64": "iVBORw0KGgo..."
  }'
```

**Response Format:**
```json
{
  "is_xray": true,
  "confidence": 0.96,
  "prediction": "Valid chest X-ray",
  "heatmap_base64": "optional visualization"
}
```

### 3.2 TB Prediction Endpoint

**Purpose:** Detect tuberculosis in chest X-ray

**Direct ML Service Call:**
```bash
curl -X POST http://localhost:5000/predict/tb \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "iVBORw0KGgo..."
  }'
```

**API Wrapper Call (Recommended):**
```bash
curl -X POST http://localhost:3000/api/predict/tb/base64 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "imageBase64": "iVBORw0KGgo...",
    "patientId": "uuid-here"
  }'
```

**Response Format:**
```json
{
  "tb_detected": true,
  "confidence": 0.92,
  "prediction": "TB detected in left upper lobe",
  "heatmap_base64": "iVBORw0KGgo...",
  "mlModel": "tb_classifier.pth",
  "processingTime": 3.45,
  "confidence_intervals": {
    "tb_positive": 0.92,
    "tb_negative": 0.08
  }
}
```

---

## 4. ML Model Synchronization Tests

### 4.1 Setup Test Environment

```bash
# Terminal 1: Start Python ML Service
cd C:\Users\devjohnsonmwangi\Desktop\TbCNNapp\cnn_models
.venv\Scripts\Activate.ps1
python api.py

# Terminal 2: Start Backend API
cd C:\Users\devjohnsonmwangi\Desktop\TbCNNapp\Eafia\api
pnpm start:dev

# Terminal 3: Run Tests
# Use the api.http file with REST Client
```

### 4.2 Test Direct ML Service Communication

**Test 1: Health Check**
```http
GET http://localhost:5000/health
```

Expected: `{"status": "ok"}`

**Test 2: Direct TB Prediction**
```http
POST http://localhost:5000/predict/tb
Content-Type: application/json

{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

Expected: TB prediction with confidence

**Test 3: Direct X-Ray Validation**
```http
POST http://localhost:5000/validate/xray
Content-Type: application/json

{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

Expected: `{"is_xray": true/false, "confidence": 0.xx}`

### 4.3 Test API Wrapper Communication

**Test 4: API Health Check**
```http
GET http://localhost:3000/
```

Expected: 200 OK

**Test 5: API TB Prediction Wrapper**
```http
POST http://localhost:3000/api/predict/tb/base64
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "patientId": "{{patientUUID}}"
}
```

Expected: Same TB prediction + metadata

**Test 6: API X-Ray Validation Wrapper**
```http
POST http://localhost:3000/api/validation/xray
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

Expected: X-ray validation result

### 4.4 Verify Response Consistency

**For each model call, verify:**

1. **Direct ML Service Response:**
```
GET http://localhost:5000/predict/tb
Response A: { tb_detected: true, confidence: 0.92, ... }
```

2. **API Wrapper Response:**
```
GET http://localhost:3000/api/predict/tb/base64
Response B: { tb_detected: true, confidence: 0.92, ... }
```

3. **Comparison:**
```
A.tb_detected == B.tb_detected ✅
A.confidence == B.confidence ✅
A.prediction == B.prediction ✅
B has extra fields (patientId, createdAt, etc.) ✅
```

---

## 5. Model File Verification

### 5.1 Check Model Files Exist

```bash
# List model files
dir C:\Users\devjohnsonmwangi\Desktop\TbCNNapp\cnn_models\pth_files\

# Expected files:
# - tb_classifier.pth (TB detection)
# - Normal_Abnormal_lungcancer_classifier.pth
# - pneumonia_classifier.pth
# - bone_fracture_classifier.pth
```

### 5.2 Verify Model Files Load Correctly

```python
# In Python terminal
import torch
import os

models = {
    'TB': 'cnn_models/pth_files/tb_classifier.pth',
    'Validation': 'cnn_models/pth_files/Normal_Abnormal_lungcancer_classifier.pth',
    'Pneumonia': 'cnn_models/pth_files/pneumonia_classifier.pth',
    'Fracture': 'cnn_models/pth_files/bone_fracture_classifier.pth'
}

for name, path in models.items():
    if os.path.exists(path):
        try:
            model = torch.load(path, map_location='cpu')
            print(f"✅ {name}: {path}")
            print(f"   Size: {os.path.getsize(path) / (1024*1024):.2f} MB")
        except Exception as e:
            print(f"❌ {name}: {e}")
    else:
        print(f"❌ {name}: File not found - {path}")
```

Expected Output:
```
✅ TB: cnn_models/pth_files/tb_classifier.pth
   Size: 45.32 MB
✅ Validation: cnn_models/pth_files/Normal_Abnormal_lungcancer_classifier.pth
   Size: 52.18 MB
...
```

### 5.3 Check Model Architecture

```python
# Verify model structure
import torch

model = torch.load('cnn_models/pth_files/tb_classifier.pth', map_location='cpu')
print(model)

# Should output neural network architecture
# Look for: Conv layers, pooling, fully connected layers
```

---

## 6. API Service Integration Tests

### 6.1 Service Files to Test

**Files that call ML Service:**
- `src/tb-prediction/tb-prediction.service.ts`
- `src/xray-validation/xray-validation.service.ts`
- `src/modules/xrays/xrays.service.ts`

### 6.2 Verify Environment Variables

```typescript
// In TypeScript file
const mlServiceUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
console.log('ML Service URL:', mlServiceUrl);

// Should output: http://localhost:5000
```

```bash
# In terminal - verify .env
grep PYTHON_API_URL Eafia/api/.env

# Expected:
# PYTHON_API_URL=http://localhost:5000
```

### 6.3 Check Service Methods

**tb-prediction.service.ts**
```typescript
// Should have method like:
async predictTB(imageBase64: string, patientId: string) {
  const response = await axios.post(
    `${this.mlServiceUrl}/predict/tb`,
    { image_base64: imageBase64 }
  );
  return response.data;
}
```

**xray-validation.service.ts**
```typescript
// Should have method like:
async validateXray(imageBase64: string) {
  const response = await axios.post(
    `${this.mlServiceUrl}/validate/xray`,
    { image_base64: imageBase64 }
  );
  return response.data;
}
```

### 6.4 Test Service Calls

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"physician@tbdetection.com","password":"SecurePassword123!"}' \
  | jq -r '.access_token')

# Create patient first
PATIENT_ID=$(curl -s -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Test","lastName":"Patient","email":"test@example.com",
    "dateOfBirth":"1990-01-01","physicianId":"PHYSICIAN_UUID"
  }' | jq -r '.id')

# Test TB prediction
curl -X POST http://localhost:3000/api/predict/tb/base64 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64":"iVBORw0KGgo...",
    "patientId":"'$PATIENT_ID'"
  }'

# Response should include ML model output stored in database
```

---

## 7. End-to-End Synchronization Test

### 7.1 Complete Test Flow

```bash
# Step 1: Start Services
# Terminal 1: ML Service
cd cnn_models && python api.py

# Terminal 2: Backend
cd Eafia/api && pnpm start:dev

# Step 2: Test Direct ML
curl -X POST http://localhost:5000/predict/tb \
  -H "Content-Type: application/json" \
  -d '{"image_base64":"..."}'
# ✅ Should return: { tb_detected: true/false, confidence: 0.xx, ... }

# Step 3: Test API Wrapper
curl -X POST http://localhost:3000/api/predict/tb/base64 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"...","patientId":"..."}'
# ✅ Should return same prediction + database metadata

# Step 4: Verify Database Storage
# Query diagnosis_results table
# SELECT * FROM diagnosis_results WHERE patient_id = '...'
# ✅ Should show stored ML predictions

# Step 5: Retrieve from API
curl http://localhost:3000/api/diagnosis-results/patient/PATIENT_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
# ✅ Should return all diagnoses with ML outputs
```

### 7.2 Success Criteria

- ✅ ML Service responds to direct requests
- ✅ API correctly forwards to ML Service
- ✅ Response data matches between direct and wrapper
- ✅ Database stores predictions correctly
- ✅ API retrieves predictions with full metadata
- ✅ Heatmaps generated and returned
- ✅ Confidence scores consistent
- ✅ Response times under 5 seconds

---

## 8. Troubleshooting Synchronization Issues

### Issue 1: ML Service Not Responding

**Symptoms:**
```
Error: ECONNREFUSED at http://localhost:5000
```

**Troubleshooting:**
```bash
# Check if service is running
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Check for errors in ML service
# Look for: "address already in use"
# Solution: Kill process on port 5000

taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # macOS/Linux

# Restart ML service
python api.py
```

### Issue 2: Model Load Errors

**Symptoms:**
```
Error: Unable to load model from 'tb_classifier.pth'
```

**Troubleshooting:**
```bash
# Verify file exists
test -f cnn_models/pth_files/tb_classifier.pth

# Check file size (should be 40-50 MB)
ls -lh cnn_models/pth_files/tb_classifier.pth

# Verify PyTorch installation
python -c "import torch; print(torch.__version__)"
# Expected: 2.0.1+

# Try loading in Python
python -c "import torch; model = torch.load('cnn_models/pth_files/tb_classifier.pth')"
```

### Issue 3: Inconsistent Predictions

**Symptoms:**
```
Direct ML: confidence=0.92
API Wrapper: confidence=0.89 (different!)
```

**Troubleshooting:**
```bash
# Check if models are deterministic
# Add seed before prediction
torch.manual_seed(42)

# Verify image preprocessing is identical
# Check if Base64 decoding is same
# Check if image normalization parameters match

# Compare full responses
# Ensure no data loss in transmission
```

### Issue 4: Database Not Storing Predictions

**Symptoms:**
```
Prediction returns successfully but diagnosis_results table is empty
```

**Troubleshooting:**
```typescript
// Check if service saves to database
// In diagnosis-results.service.ts

// Should have:
const diagnosis = this.diagnosisRepository.create({
  patientId,
  xrayId,
  mlConfidence: result.confidence,
  isTbDetected: result.tb_detected,
  // ... other fields
});

return await this.diagnosisRepository.save(diagnosis);
```

```bash
# Verify database connection
pnpm db:info  # Should show successful connection

# Query database directly
psql -h ep-autumn-lab-amazx6ey-pooler.c-5.us-east-1.aws.neon.tech \
  -U neondb_owner -d neondb \
  -c "SELECT COUNT(*) FROM diagnosis_results;"
```

---

## 9. Performance Benchmarks

### Expected Response Times

```
Operation                   Expected Time    Actual Time
─────────────────────────────────────────────────────────
ML Health Check            < 100ms
X-Ray Validation           1-2 seconds
TB Prediction              2-5 seconds
API Wrapper (no ML)        < 100ms
Database Save              < 100ms
Full Pipeline              4-8 seconds
```

### Monitor During Testing

```bash
# Watch ML Service logs
tail -f cnn_models/logs/

# Watch Backend logs
tail -f Eafia/api/logs/

# Monitor memory usage during prediction
# (TB predict loads ~1-2GB of model weights)

# Monitor API response times
# Check "processingTime" in response: should be 2-5 seconds
```

---

## 10. Final Validation Checklist

- [ ] ML Service health check responds
- [ ] Model files load without errors
- [ ] Direct ML predictions consistent
- [ ] API successfully forwards requests
- [ ] API wrapper returns enriched responses
- [ ] Database stores all predictions
- [ ] Predictions retrieval works
- [ ] Heatmaps generated and returned
- [ ] Confidence scores 0.0-1.0 range
- [ ] Response times within bounds
- [ ] Error handling works (invalid image)
- [ ] Token authentication enforced
- [ ] Patient associations correct
- [ ] X-ray associations correct
- [ ] All tests pass in api.http

---

## Testing Checklist

Use the `api.http` file in VS Code with REST Client to systematically test:
1. ✅ Section 1: Health checks
2. ✅ Section 2: Authentication
3. ✅ Section 3: Users
4. ✅ Section 4: Patients
5. ✅ Section 5: X-rays
6. ✅ Section 6: X-ray Validation
7. ✅ Section 7: TB Prediction
8. ✅ Section 8: Diagnosis
9. ✅ Section 9: Direct ML Service Tests
10. ✅ Section 10: End-to-end workflow

**Mark each section complete and timestamp when verified!**

