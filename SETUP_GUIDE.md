# Eafia TB Detection System - Setup & Implementation Guide

## 🎯 What Was Just Implemented

### **X-Ray Validation with TB Detection Pipeline**

A complete medical image validation and analysis system with:

✅ **X-Ray Validator Service** - Validates that images are legitimate medical X-rays
✅ **TB Predictor Service** - Detects tuberculosis with validation prerequisite  
✅ **Dual Input Support** - Base64 strings or file uploads
✅ **Confidence Thresholds** - Only processes confident X-ray detections
✅ **Error Guidance** - Clear messages when X-rays are invalid

---

## 📁 Project Structure

```
Eafia/
├── client/                    # React frontend
│   └── src/
│       ├── components/
│       └── pages/
├── cnn_models/               # Python ML models (8000)
│   ├── api.py               # Python FastAPI service
│   ├── pth_files/           # Pre-trained models
│   │   ├── tb_classifier.pth           ✅ TB detection
│   │   ├── xray_detector_model.py      ✅ X-ray validation
│   │   └── ...other models...
│   └── trained_models/
│       ├── tuberculosis_model.py
│       ├── xray_detector_model.py
│       └── ...
└── api/                      # NestJS API (3000) [NEW]
    ├── src/
    │   ├── main.ts
    │   ├── app.module.ts
    │   ├── xray-validation/  [NEW]
    │   │   ├── xray-validation.service.ts
    │   │   ├── xray-validation.controller.ts
    │   │   └── xray-validation.module.ts
    │   ├── tb-prediction/    [NEW]
    │   │   ├── tb-prediction.service.ts
    │   │   ├── tb-prediction.controller.ts
    │   │   └── tb-prediction.module.ts
    │   └── common/
    │       └── dtos/
    │           └── image.dto.ts
    ├── .env.example
    ├── TB_DETECTION_API_GUIDE.md
    └── SETUP_GUIDE.md
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Python ML Service Dependencies

```bash
cd Eafia/cnn_models
pip install -r requirements.txt
```

### Step 2: Start Python ML Service

```bash
cd Eafia/cnn_models
python -m uvicorn api:app --reload --port 8000
```

You should see:
```
Uvicorn running on http://127.0.0.1:8000
```

Open browser: http://localhost:8000/docs ← Interactive API docs

### Step 3: Install NestJS API Dependencies

In a new terminal:
```bash
cd Eafia/api
npm install
# or
pnpm install
```

### Step 4: Configure Environment

```bash
cd Eafia/api
cp .env.example .env
# Edit .env if needed (default settings should work)
```

### Step 5: Start NestJS API

```bash
npm run start:dev
```

You should see:
```
TB Detection API running on port 3000
```

---

## 🔍 Testing the System

### Option 1: Using Swagger (FastAPI - Python)

1. Open: http://localhost:8000/docs
2. Expand `/predict/xray_validation` endpoint
3. Click "Try it out"
4. Enter base64 image data
5. Click "Execute"

### Option 2: Using cURL

```bash
# Test X-ray validation
curl -X POST http://localhost:8000/predict/xray_validation \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "...your_base64_image..."}'

# Test TB prediction (through NestJS)
curl -X POST http://localhost:3000/predict/tb/base64 \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "...your_base64_image..."}'
```

### Option 3: Using JavaScript/Postman

```javascript
// Step 1: Validate X-ray
const validationResponse = await fetch('http://localhost:3000/validation/xray', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_base64: imageBase64 })
});

const validation = await validationResponse.json();
console.log('Validation Status:', validation.is_valid);

// Step 2: Predict TB (if validation passed)
if (validation.is_valid) {
  const tbResponse = await fetch('http://localhost:3000/predict/tb/base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 })
  });
  
  const result = await tbResponse.json();
  console.log('TB Prediction:', result.prediction, `(${(result.confidence * 100).toFixed(2)}%)`);
}
```

---

## 📊 Data Flow

### Successful Flow (Valid X-Ray):
```
Client
  ↓
POST /validation/xray (check if valid X-ray)
  ↓ [confidence > 70%]
  ↓
Python API → xray_detector model
  ↓ [is_xray = true]
  ↓
Return: { is_valid: true, ... }
  ↓
Client sends same image to TB detection
  ↓
POST /predict/tb/base64
  ↓
Python API → tb_classifier model
  ↓
Return: { prediction: "Tuberculosis", confidence: 0.92, ... }
  ↓
Display results to user
```

### Error Flow (Invalid/Non-Medical Image):
```
Client sends image
  ↓
POST /validation/xray
  ↓
Python API → xray_detector model
  ↓ [confidence < 70% OR is_xray = false]
  ↓
Return: { is_valid: false, message: "Please provide a valid chest X-ray" }
  ↓
NestJS throws HTTP 400
  ↓
Display error message to user
  ↓
❌ TB detection NOT called
```

---

## 🔧 API Endpoints

### NestJS API (Port 3000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | API info |
| `/validation/xray` | POST | Validate if image is X-ray |
| `/predict/tb/base64` | POST | TB detection from base64 |
| `/predict/tb/file` | POST | TB detection from file upload |

### Python API (Port 8000) - Direct Access

| Endpoint | Purpose |
|----------|---------|
| `/predict/xray_validation` | Validate X-ray |
| `/predict/tuberculosis` | TB detection |
| `/predict/pneumonia` | Pneumonia detection |
| `/predict/bone_fracture` | Fracture detection |
| `/predict/lung_cancer` | Lung cancer detection |
| `/health` | Health check |
| `/docs` | Swagger documentation |

---

## ✅ Validation Workflow

### Confidence Thresholds

```
X-Ray Confidence Score:
├─ 90-100% → ✅ Definitely X-ray (process immediately)
├─ 70-90%  → ✅ Likely X-ray (process)
├─ 50-70%  → ❌ Uncertain (ask for better image)
└─ 0-50%   → ❌ Not an X-ray (reject)

TB Prediction Confidence:
├─ 90-100% → ✅ Strong indication of TB
├─ 70-90%  → ⚠️  Likely TB (recommend specialist review)
├─ 50-70%  → ⚠️  Possible TB (unclear, needs expert)
└─ 0-50%   → ✅ Likely Normal (low TB risk)
```

---

## 📝 Request/Response Examples

### X-Ray Validation Request
```json
POST /validation/xray
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

### X-Ray Validation Response (Valid)
```json
{
  "is_valid": true,
  "is_xray": true,
  "prediction": "X-Ray",
  "confidence": 0.94,
  "heatmap_base64": "data:image/png;base64,...",
  "message": "Valid X-ray image. Proceeding to TB detection..."
}
```

### X-Ray Validation Response (Invalid)
```json
{
  "statusCode": 400,
  "message": "Invalid X-ray image detected. Please provide a valid chest X-ray image. (Confidence: 32.15%)",
  "is_valid": false,
  "is_xray": false,
  "prediction": "Not X-Ray",
  "confidence": 0.68
}
```

### TB Prediction Response
```json
{
  "prediction": "Tuberculosis",
  "confidence": 0.92,
  "heatmap": "data:image/png;base64,...",
  "model": "tb_classifier_v1",
  "validation_passed": true,
  "validation_message": "X-ray validation passed successfully"
}
```

---

## 🐛 Troubleshooting

### Problem: "Connection refused" when starting API
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solution:** Python API not running
```bash
# Start Python API first in another terminal
cd Eafia/cnn_models
python -m uvicorn api:app --reload --port 8000
```

### Problem: "Module not found" errors
```
Error: Cannot find module 'axios'
```

**Solution:** Install dependencies
```bash
cd Eafia/api
npm install
npm install axios class-validator class-transformer @nestjs/platform-express
```

### Problem: CORS errors from frontend
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:** CORS is already enabled in NestJS. If still issues:
- Check that frontend URL matches allowed origins in both:
  - `Eafia/api/src/main.ts` (NestJS)
  - `Eafia/cnn_models/api.py` (Python)

### Problem: File upload shows "File must be an image"
**Solution:** Ensure uploaded file has proper image MIME type (image/jpeg, image/png)

### Problem: All images fail validation
**Solution:** Check Python API is running on correct port:
- Default: http://localhost:8000
- Can customize: Edit `.env` file → `PYTHON_API_URL`

---

## 🔐 Environment Variables

Edit `Eafia/api/.env`:

```bash
# Server
PORT=3000
NODE_ENV=development

# Python ML Service URL
PYTHON_API_URL=http://localhost:8000

# X-Ray validation threshold (0-1)
XRAY_CONFIDENCE_THRESHOLD=0.7
```

---

## 📈 Next Steps

### 1. **Integrate with React Frontend**
Update `Eafia/client/src/services/tbApi.ts`:

```typescript
export const validateAndPredictTB = async (imageBase64: string) => {
  // Call NestJS validation endpoint
  const validationRes = await fetch('http://localhost:3000/validation/xray', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 })
  });

  if (!validationRes.ok) {
    const error = await validationRes.json();
    throw new Error(error.message);
  }

  // Call TB prediction endpoint
  const tbRes = await fetch('http://localhost:3000/predict/tb/base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 })
  });

  return tbRes.json();
};
```

### 2. **Add UI Error Handling**
In your React component:

```typescript
try {
  const result = await validateAndPredictTB(imageBase64);
  // Display result
} catch (error) {
  if (error.response?.status === 400) {
    // Show validation error
    setError(error.response.data.message);
  } else {
    // Show server error
    setError('TB detection service unavailable');
  }
}
```

### 3. **Deploy to Production**
- Set `NODE_ENV=production`
- Update `PYTHON_API_URL` to production Python service
- Configure SSL/TLS certificates
- Set strong secrets in `.env`

### 4. **Add Additional Models**
Currently supporting:
- ✅ TB Detection
- ✅ X-Ray Validation
- Available: Pneumonia, Lung Cancer, Bone Fracture (via Python API)

### 5. **Monitor Performance**
- Add logging to track prediction times
- Monitor model accuracy over time
- Set up alerts for service failures

---

## 📚 Documentation Files

- **[TB_DETECTION_API_GUIDE.md](./TB_DETECTION_API_GUIDE.md)** - Complete API endpoint documentation
- **[.env.example](./.env.example)** - Configuration template
- **[package.json](./package.json)** - Dependencies

---

## 🎓 How It Works

### X-Ray Detector Model
Uses ResNet18 pre-trained on ImageNet, fine-tuned to distinguish between:
- **X-Ray** (medical chest radiograph)
- **Non-X-Ray** (photo, screenshot, etc.)

**Input:** 224×224 RGB image
**Output:** Classification + confidence 0-1

### TB Classifier Model  
Uses ResNet18 binary classifier, trained on chest X-rays to detect:
- **Normal** (healthy lungs)
- **Tuberculosis** (TB positive)

**Input:** 224×224 RGB chest X-ray
**Output:** Classification + confidence 0-1 + heatmap visualization

---

## ✨ Features Summary

| Feature | Details |
|---------|---------|
| **Two-Stage Validation** | Validates X-ray, then detects TB |
| **Confidence Scores** | 0-1 scale, 0-100% display |
| **Heatmaps** | Visual attention maps for interpretability |
| **Error Messages** | Clear guidance when images rejected |
| **File Upload Support** | Direct image file submission |
| **Base64 Support** | For API integration |
| **CORS Enabled** | Works with web frontends |
| **Async Processing** | Non-blocking image analysis |
| **Speed** | ~200-500ms per prediction |

---

## ⚡ Performance Tips

1. **Compress images** before upload to reduce latency
2. **Reuse connections** for multiple predictions
3. **Cache validation results** if analyzing same image
4. **Run Python service on GPU** for faster inference (if available)

---

## 🔗 Related Files

- **Python API**: `Eafia/cnn_models/api.py`
- **React Frontend**: `Eafia/client/src/`
- **ML Models**: `Eafia/cnn_models/pth_files/`
- **Model Code**: `Eafia/cnn_models/trained_models/`

---

## 📞 Support

If services fail to connect:

1. **Check Python service**: http://localhost:8000/health
2. **Check NestJS service**: http://localhost:3000
3. **Check firewall**: Ensure ports 3000 and 8000 are not blocked
4. **Check .env**: Verify `PYTHON_API_URL` is correct
5. **Check dependencies**: Run `npm install` and `pip install -r requirements.txt`

---

**System Ready! 🎉**

Both services are now configured and ready for integration with the React frontend.
