# TB Detection API with X-Ray Validation

## Overview

This API provides TB detection capabilities with **mandatory X-ray validation** before predictions. The system validates that uploaded images are legitimate medical X-rays before passing them to the TB classifier model.

### Architecture
```
Client → NestJS API (Port 3000)
         ↓
      Validation Service (checks if image is valid X-ray)
         ↓
    [X-Ray Valid?]
         ├─ NO → Return validation error with guidance
         └─ YES → TB Prediction Service
              ↓
           Python Core API (Port 8000)
              ├─ xray_detector model (validates X-ray)
              └─ tb_classifier model (detects TB)
```

## Features

✅ **X-Ray Validation** - Validates images are legitimate medical X-rays
✅ **TB Detection** - Predicts tuberculosis presence with confidence scores
✅ **Heatmap Generation** - Visual attention maps for interpretability
✅ **Multiple Input Formats** - Base64 strings or file uploads
✅ **Error Handling** - Clear messages when validation fails
✅ **CORS Enabled** - Works with frontend applications

## Installation

### Prerequisites
- Node.js 18+
- Python 3.8+ (for ML service)
- npm or pnpm

### Setup Steps

1. **Install NestJS API dependencies:**
```bash
cd Eafia/api
npm install
# or
pnpm install
```

2. **Install required packages:**
```bash
npm install axios class-validator class-transformer @nestjs/platform-express
```

3. **Create .env file:**
```bash
cp .env.example .env
# Update PYTHON_API_URL if your Python service runs on a different port
```

4. **Start the Python ML Service (in another terminal):**
```bash
cd Eafia/cnn_models
python -m pip install -r requirements.txt
python -m uvicorn api:app --reload --port 8000
```

5. **Start the NestJS API:**
```bash
npm run start:dev
```

API will be available at: **http://localhost:3000**

## Endpoints

### Health Check
```
GET /
GET /health
```

### X-Ray Validation
```
POST /validation/xray
Content-Type: application/json

Request:
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}

Response (Valid X-Ray):
{
  "is_valid": true,
  "is_xray": true,
  "prediction": "X-Ray",
  "confidence": 0.95,
  "heatmap_base64": "...",
  "message": "Valid X-ray image. Proceeding to TB detection..."
}

Response (Invalid):
{
  "statusCode": 400,
  "message": "Invalid X-ray image detected. Please provide a valid chest X-ray image. (Confidence: 25.43%)",
  "is_valid": false,
  "is_xray": false,
  "prediction": "Not X-Ray",
  "confidence": 0.75
}
```

### TB Prediction (Base64)
```
POST /predict/tb/base64
Content-Type: application/json

Request:
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}

Response:
{
  "prediction": "Tuberculosis",
  "confidence": 0.92,
  "heatmap": "...",
  "model": "tb_classifier_v1",
  "validation_passed": true,
  "validation_message": "X-ray validation passed successfully"
}
```

### TB Prediction (File Upload)
```
POST /predict/tb/file
Content-Type: multipart/form-data
Body: file (image file)

Response:
{
  "prediction": "Normal",
  "confidence": 0.87,
  "model": "tb_classifier_v1",
  "validation_passed": true,
  "validation_message": "X-ray validation passed successfully"
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
// Validate X-ray
const response = await fetch('http://localhost:3000/validation/xray', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_base64: yourBase64Image })
});

const validation = await response.json();

if (!validation.is_valid) {
  console.error('Invalid X-ray:', validation.message);
  return;
}

// Predict TB
const tbResponse = await fetch('http://localhost:3000/predict/tb/base64', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_base64: yourBase64Image })
});

const tbResult = await tbResponse.json();
console.log('TB Prediction:', tbResult.prediction, `(${(tbResult.confidence * 100).toFixed(2)}%)`);
```

### Python Requests
```python
import requests
import base64

# Load and encode image
with open('xray.jpg', 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Validate X-ray
validation = requests.post(
    'http://localhost:3000/validation/xray',
    json={'image_base64': image_b64}
)

if validation.status_code != 200:
    print(f"Validation failed: {validation.json()['message']}")
else:
    # Predict TB
    tb_result = requests.post(
        'http://localhost:3000/predict/tb/base64',
        json={'image_base64': image_b64}
    )
    print(f"TB Result: {tb_result.json()}")
```

### cURL
```bash
# Validate X-ray
curl -X POST http://localhost:3000/validation/xray \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "..base64_image.."}'

# Predict TB with file
curl -X POST http://localhost:3000/predict/tb/file \
  -F "file=@xray.jpg"
```

## Error Responses

### Bad X-Ray Image (400)
```json
{
  "statusCode": 400,
  "message": "Invalid X-ray image detected. Please provide a valid chest X-ray image. (Confidence: 32.15%)",
  "validation_passed": false
}
```

### No Image Provided (400)
```json
{
  "statusCode": 400,
  "message": "No image data provided. Please provide a valid base64 encoded X-ray image."
}
```

### ML Service Unavailable (500)
```json
{
  "statusCode": 500,
  "message": "Validation service error: Connection refused. Please ensure the Python ML service is running at http://localhost:8000"
}
```

## Configuration

Edit `.env` to adjust:
```bash
# Server Port
PORT=3000

# Python ML Service URL
PYTHON_API_URL=http://localhost:8000

# Minimum confidence threshold for X-ray validation (0-1)
XRAY_CONFIDENCE_THRESHOLD=0.7
```

## Model Information

### X-Ray Detector
- **Purpose:** Validates that uploaded image is a medical X-ray
- **Model:** ResNet18
- **Input:** 224x224 RGB image
- **Output:** "X-Ray" or "Not X-Ray" with confidence

### TB Classifier
- **Purpose:** Detects tuberculosis presence
- **Model:** ResNet18 (2-class)
- **Input:** 224x224 RGB chest X-ray
- **Classes:** "Normal", "Tuberculosis"
- **Output:** Prediction + confidence score + heatmap

## Workflow

1. User uploads image (base64 or file)
2. **Validation Service** checks if it's a valid X-ray
3. If confidence < 70%:
   - Return error: "Please provide a valid chest X-ray image"
   - Stop processing
4. If valid:
   - Pass to **TB Classifier**
   - Return TB detection result

## Development

### Run in Watch Mode
```bash
npm run start:dev
```

### Testing
```bash
npm run test
```

### Build for Production
```bash
npm run build
npm run start:prod
```

## Troubleshooting

**Issue:** "Connection refused" error
- **Solution:** Make sure Python API is running on port 8000
```bash
cd Eafia/cnn_models
python -m uvicorn api:app --reload --port 8000
```

**Issue:** "Module not found" errors in NestJS
- **Solution:** Install all dependencies
```bash
npm install
npm install axios class-validator class-transformer @nestjs/platform-express
```

**Issue:** CORS errors from frontend
- **Solution:** Check that CORS is enabled in `main.ts`

**Issue:** Image validation always fails
- **Solution:** Check image format, ensure it's PNG/JPG with proper base64 encoding

## Next Steps

To use this API with the frontend:

1. Import the API client in your React app
2. Create a service to call the TB prediction endpoint
3. Add validation error handling for invalid X-rays
4. Update the UI to show validation status
5. Display TB prediction results with confidence scores

Example integration in React will be provided separately.
