# 🩺 TB Detection API with X-Ray Validation

A NestJS-based REST API for detecting tuberculosis in chest X-rays with **mandatory image validation** to ensure only legitimate medical images are processed.

## 🎯 Features

- ✅ **X-Ray Validation** - Ensures uploaded images are actual medical X-rays
- ✅ **TB Detection** - Predicts tuberculosis presence with confidence scores
- ✅ **Confidence Thresholds** - Enforces quality control (70% validation threshold)
- ✅ **Heatmap Generation** - Visual attention maps for model interpretability
- ✅ **Dual Input** - Base64 strings or file uploads
- ✅ **Error Guidance** - Clear messages when images are invalid
- ✅ **CORS Enabled** - Ready for web frontend integration

## 🏗️ Architecture

```
Frontend (React)
    ↓
NestJS API (Port 3000)
    ├─ Validation Service
    └─ TB Prediction Service
    ↓
Python FastAPI (Port 8000)
    ├─ xray_detector model (validates X-rays)
    └─ tb_classifier model (detects TB)
```

## 🚀 Quick Start

### 1. Start Python ML Service (Terminal 1)
```bash
cd ../cnn_models
python -m uvicorn api:app --reload --port 8000
```

### 2. Install Dependencies (Terminal 2)
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

### 4. Start NestJS API
```bash
npm run start:dev
```

API will be running at: **http://localhost:3000**

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** ⚡ Get up and running in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** 📖 Complete setup and integration guide  
- **[TB_DETECTION_API_GUIDE.md](./TB_DETECTION_API_GUIDE.md)** 📡 Full API reference
- **[.env.example](./.env.example)** ⚙️ Configuration template

## 🔌 Main Endpoints

### X-Ray Validation
```
POST /validation/xray
Content-Type: application/json

{
  "image_base64": "data:image/jpeg;base64,..."
}
```

### TB Prediction (Base64)
```
POST /predict/tb/base64
Content-Type: application/json

{
  "image_base64": "data:image/jpeg;base64,..."
}
```

### TB Prediction (File Upload)
```
POST /predict/tb/file
Content-Type: multipart/form-data

file: <image_file>
```

## 💾 Project Structure

```
src/
├── main.ts                          # App entry point
├── app.module.ts                    # Root module
├── app.controller.ts                # Root controller
├── app.service.ts                   # Root service
├── xray-validation/                 # X-ray validation module
│   ├── xray-validation.service.ts
│   ├── xray-validation.controller.ts
│   └── xray-validation.module.ts
├── tb-prediction/                   # TB prediction module
│   ├── tb-prediction.service.ts
│   ├── tb-prediction.controller.ts
│   └── tb-prediction.module.ts
└── common/
    └── dtos/
        └── image.dto.ts             # Data transfer objects
```

## 🔄 Validation Workflow

1. **User submits image**
2. **Validation Service** checks if image is a valid X-ray
   - Minimum confidence: 70%
3. **If invalid**: Return error with guidance
4. **If valid**: TB Prediction Service runs TB classifier
5. **Return results** with confidence + heatmap

## ⚙️ Configuration

Edit `.env` to customize:

```bash
# Server port
PORT=3000

# Python ML Service URL
PYTHON_API_URL=http://localhost:8000

# X-ray validation confidence threshold (0-1)
XRAY_CONFIDENCE_THRESHOLD=0.7
```

## 📊 Response Examples

### Valid X-Ray
```json
{
  "is_valid": true,
  "is_xray": true,
  "prediction": "X-Ray",
  "confidence": 0.94,
  "heatmap_base64": "...",
  "message": "Valid X-ray image. Proceeding to TB detection..."
}
```

### TB Detection Result
```json
{
  "prediction": "Tuberculosis",
  "confidence": 0.92,
  "heatmap": "...",
  "model": "tb_classifier_v1",
  "validation_passed": true,
  "validation_message": "X-ray validation passed successfully"
}
```

### Invalid Image
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

## 🛠️ Development

### Build
```bash
npm run build
```

### Run Tests
```bash
npm run test
```

### Production Build
```bash
npm run build
npm run start:prod
```

## 📋 Prerequisites

- Node.js 18+
- Python 3.8+ (for ML service)
- npm or pnpm
- FastAPI running on port 8000

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Start Python API: `python -m uvicorn api:app --reload --port 8000` |
| "Module not found" | Run: `npm install` |
| CORS errors | CORS is enabled in `main.ts` - check frontend URL matches |
| Image validation fails | Ensure image is valid X-ray in PNG/JPG format |

## 📡 Integration with Frontend

```typescript
// React example
const validateAndPredict = async (imageBase64: string) => {
  try {
    // Validate X-ray first
    const validation = await fetch('http://localhost:3000/validation/xray', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 })
    });

    if (!validation.ok) {
      throw new Error(await validation.text());
    }

    // Get TB prediction
    const prediction = await fetch('http://localhost:3000/predict/tb/base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 })
    });

    return prediction.json();
  } catch (error) {
    console.error('TB Detection Error:', error);
    throw error;
  }
};
```

## 🔐 Security Notes

- X-ray validation prevents non-medical images from being analyzed
- Confidence thresholds ensure only high-quality predictions
- Input validation on all endpoints
- CORS configured for trusted origins

## 📞 Support

For issues or questions:
1. Check Python API is running: http://localhost:8000/health
2. Verify .env configuration
3. Check dependencies: `npm install`
4. Review documentation files above

## 📝 License

Part of the Eafia TB Detection System

## 🎓 Technologies

- **Framework**: NestJS
- **Language**: TypeScript  
- **ML Service**: FastAPI (Python)
- **HTTP Client**: Axios
- **Validation**: class-validator
- **ML Framework**: PyTorch + ResNet18

---

**Ready to deploy TB detection with confidence! 🚀**

See [QUICK_START.md](./QUICK_START.md) to get running in 5 minutes.
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
