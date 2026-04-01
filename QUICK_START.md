# ⚡ QUICK START - TB Detection API (5 Minutes)

## Terminal 1: Start Python ML Service

```bash
cd Eafia/cnn_models
python -m uvicorn api:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ **Python API ready at:** http://localhost:8000/docs

---

## Terminal 2: Start NestJS API

```bash
cd Eafia/api
npm install  # Run this once
npm run start:dev
```

Expected output:
```
TB Detection API running on port 3000
```

✅ **NestJS API ready at:** http://localhost:3000

---

## Test 1: Health Check

```bash
curl http://localhost:3000
```

Response:
```json
{
  "statusCode": 200,
  "message": "TB Detection API is running",
  ...
}
```

---

## Test 2: Validate X-Ray (with test image)

### Get a test image:
```bash
# Using a sample base64 encoded image
curl -X POST http://localhost:3000/validation/xray \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "data:image/jpeg;base64,..."}'
```

### Expected Response (Valid X-Ray):
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

### Expected Response (Invalid Image):
```json
{
  "statusCode": 400,
  "message": "Invalid X-ray image detected. Please provide a valid chest X-ray image. (Confidence: 32.15%)",
  "is_valid": false,
  "is_xray": false
}
```

---

## Test 3: TB Prediction (Base64)

```bash
curl -X POST http://localhost:3000/predict/tb/base64 \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "data:image/jpeg;base64,..."}'
```

### Response if validation passes:
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

### Response if validation fails:
```json
{
  "statusCode": 400,
  "message": "Invalid X-ray image detected. Please provide a valid chest X-ray image.",
  "validation_passed": false,
  "prediction": "INVALID_IMAGE"
}
```

---

## Test 4: TB Prediction (File Upload)

```bash
curl -X POST http://localhost:3000/predict/tb/file \
  -F "file=@/path/to/xray.jpg"
```

---

## 🔍 Direct Python API Testing (Optional)

Visit: http://localhost:8000/docs

Then:
1. Expand `/predict/xray_validation` endpoint
2. Click "Try it out"
3. Paste base64 image data
4. Click "Execute"

---

## ❌ Troubleshooting

### Error: "Connection refused" (Python API)
→ Make sure Terminal 1 is running

### Error: "Module not found" 
→ Run `npm install` in Eafia/api/

### Error: "ENOENT: no such file or directory"
→ Make sure you're in the right directory

### All images fail validation
→ Check Python API is on http://localhost:8000
→ Edit Eafia/api/.env to change `PYTHON_API_URL`

---

## 📊 System Architecture

```
Your Test Client
         ↓
    NestJS API (3000)
         ↓
   Validation Service ←→ Python API (8000) → xray_detector
         ↓
      (if valid)
         ↓
   TB Prediction Service ←→ Python API (8000) → tb_classifier
         ↓
    Response to Client
```

---

## 🎯 Key Endpoints

| Service | Endpoint | Purpose |
|---------|----------|---------|
| **NestJS** | POST `/validation/xray` | Validate X-ray |
| **NestJS** | POST `/predict/tb/base64` | TB detection |
| **NestJS** | POST `/predict/tb/file` | TB from file |
| **Python** | POST `/predict/xray_validation` | X-ray validation |
| **Python** | POST `/predict/tuberculosis` | TB detection |
| **Python** | GET `/docs` | Swagger UI |

---

## 📋 Workflow Summary

1. **User uploads image** (base64 or file)
2. **NestJS validates**: Is it a valid X-ray?
   - `confidence < 70%` → ❌ Reject with message
   - `confidence > 70%` → ✅ Continue to TB detection
3. **TB prediction**: Is TB present?
   - Return prediction + confidence + heatmap
4. **Display results** to user

---

## ✨ What's Available

✅ X-ray image validation  
✅ TB detection from valid X-rays  
✅ Confidence scoring  
✅ Heatmap visualization  
✅ Error messages  
✅ File & base64 input  
✅ CORS for frontend  

---

## 🚀 Next Steps

1. Test all endpoints above
2. Integrate with React frontend in `Eafia/client/`
3. Handle validation errors in UI
4. Display TB results with heatmaps
5. Deploy both services to production

---

**Ready to detect TB safely! ✅**

Make sure both services are running before testing.
