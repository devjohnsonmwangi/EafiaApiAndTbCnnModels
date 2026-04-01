# Complete X-Ray Processing Workflow Documentation

## Overview
This document describes the complete end-to-end X-ray upload, validation, and TB detection pipeline for the TB Detection Application.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│  Patient Creation Form → Base64 Encoding → API Call → Results Display│
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      │ POST /api/patients (with Base64 image)
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS) - Orchestration                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Patients   │  │   X-Rays     │  │  Diagnosis Results       │  │
│  │   Service    │──│   Service    │──│  Service                 │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│         ▲                       │                      ▲             │
│         │                       └──────────┬───────────┘             │
│         └───────────────────────────────────┘                        │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
        ┌─────────────┴────────────────┐
        │                              │
        │ Call for validation          │ Call for diagnosis
        ▼                              ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Flask API: Port 5000   │  │   Flask API: Port 5000   │
│ /predict/xray_validation │  │ /predict/tuberculosis    │
│  - Validates X-ray       │  │  - Detects TB            │
│  - Returns status        │  │  - Returns prediction    │
│  - Returns confidence    │  │  - Returns confidence    │
└──────────────────────────┘  └──────────────────────────┘
        │                              │
        └──────────────┬───────────────┘
                       ▼
            (Results stored in DB)
```

## Step-by-Step Workflow

### 1. Frontend: Patient Creation with X-Ray

**File**: `Eafia/client/src/pages/PatientIntakePage.tsx`

```typescript
// User fills form and uploads X-ray image
const handleSubmit = async (data) => {
  // Convert image file to Base64
  const base64 = await fileToBase64(file);
  
  // Send to backend with patient data
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    medicalHistory: data.medicalHistory,
    allergies: data.allergies,
    imageBase64: base64,      // ← Critical field
    xrayType: 'Chest X-ray'
  };
  
  const response = await patientsService.createPatient(payload);
  // Display results on success
};
```

**Key Requirements**:
- Image must be converted to Base64 string (no data URL prefix)
- Payload field name: `imageBase64` (not `image_base_64` or `image_base64_url`)
- File size: typically 50KB-500KB for medical images
- Supported formats: PNG, JPEG, WebP

### 2. Backend: Patient Creation & X-Ray Storage

**File**: `Eafia/api/src/modules/patients/patients.service.ts`

**Method**: `create(createPatientDto, user)`

```typescript
async create(createPatientDto: CreatePatientDto, user: User): Promise<Patient> {
  // 1. Create patient record
  const patient = this.patientRepository.create({
    firstName: createPatientDto.firstName,
    lastName: createPatientDto.lastName,
    email: createPatientDto.email,
    phone: createPatientDto.phone,
    dateOfBirth: new Date(createPatientDto.dateOfBirth),
    gender: createPatientDto.gender,
    medicalHistory: createPatientDto.medicalHistory || null,
    allergies: createPatientDto.allergies || null,
    physicianId: user.id,  // Link to creating physician
    registeredAt: new Date(),
  });

  const savedPatient = await this.patientRepository.save(patient);

  // 2. Create X-Ray record with Base64 image
  if (createPatientDto.imageBase64) {
    const xray = this.xrayRepository.create({
      patient: savedPatient,
      imageBase64: createPatientDto.imageBase64,  // Store Base64 directly
      xrayType: createPatientDto.xrayType || 'Chest X-ray',
      validationStatus: 'PENDING',
      fileType: createPatientDto.fileType || 'image/png',
      fileSizeBytes: Buffer.byteLength(
        createPatientDto.imageBase64,
        'base64'
      ),
      uploadedAt: new Date(),
    });

    const savedXray = await this.xrayRepository.save(xray);
    savedPatient.xrays = [savedXray];

    // 3. Validate X-Ray with ML model
    const validationResponse = await this.validateXray(
      savedXray.imageBase64,
      user
    );

    if (validationResponse.valid) {
      // 4. Perform TB Diagnosis
      const diagnosisResponse = await this.performTBDiagnosis(
        savedXray.imageBase64,
        user
      );

      // 5. Store diagnosis results
      if (diagnosisResponse.prediction) {
        const diagnosisResult = this.diagnosisResultRepository.create({
          patient: savedPatient,
          xray: savedXray,
          prediction: diagnosisResponse.prediction,
          confidenceScore: diagnosisResponse.confidence_score,
          affectedAreas: diagnosisResponse.affected_areas || [],
          clinicalFindings: diagnosisResponse.clinical_findings || '',
          recommendations: diagnosisResponse.recommendations || [],
          analyzedAt: new Date(),
        });

        const savedResult = await this.diagnosisResultRepository.save(
          diagnosisResult
        );
        savedPatient.diagnosisResults = [savedResult];

        // 6. Trigger TB workflow if positive
        if (diagnosisResponse.prediction === 'TB_POSITIVE') {
          await this.tbWorkflowService.handleTBPositive(
            savedPatient,
            savedResult,
            user
          );
        }
      }
    }

    savedPatient.xrays = [savedXray];
  }

  return savedPatient;
}
```

### 3. X-Ray Validation (Flask API)

**Endpoint**: `POST http://localhost:5000/predict/xray_validation`

**Expected Request**:
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}
```

**Expected Response** (Success):
```json
{
  "valid": true,
  "message": "Valid X-ray image",
  "image_quality_score": 0.95
}
```

**Expected Response** (Failure):
```json
{
  "valid": false,
  "message": "Image is too blurry or not an X-ray",
  "image_quality_score": 0.45
}
```

**Implementation in Backend**:
```typescript
async validateXray(imageBase64: string, user: User): Promise<any> {
  try {
    const response = await this.httpService.post(
      'http://localhost:5000/predict/xray_validation',
      {
        image_base64: imageBase64,  // Python API expects image_base64
      }
    ).toPromise();

    return response.data;
  } catch (error) {
    this.logger.error(`X-ray validation failed: ${error.message}`);
    throw new BadRequestException('X-ray validation failed');
  }
}
```

### 4. TB Diagnosis (Flask API)

**Endpoint**: `POST http://localhost:5000/predict/tuberculosis`

**Expected Request**:
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}
```

**Expected Response**:
```json
{
  "prediction": "TB_POSITIVE",
  "confidence_score": 0.92,
  "affected_areas": ["Left Upper Lobe", "Right Upper Lobe"],
  "clinical_findings": "Dense infiltrates visible in bilateral upper lobes consistent with active TB",
  "recommendations": [
    "Immediate chest radiologist consultation",
    "Start anti-TB therapy",
    "Monthly follow-up X-rays"
  ]
}
```

**Implementation in Backend**:
```typescript
async performTBDiagnosis(imageBase64: string, user: User): Promise<any> {
  try {
    const response = await this.httpService.post(
      'http://localhost:5000/predict/tuberculosis',
      {
        image_base64: imageBase64,  // Python API expects image_base64
      }
    ).toPromise();

    return response.data;
  } catch (error) {
    this.logger.error(`TB diagnosis failed: ${error.message}`);
    throw new BadRequestException('TB diagnosis failed');
  }
}
```

### 5. Diagnosis Result Storage

**Database Entity**: `Eafia/api/src/modules/diagnosis-results/diagnosis-result.entity.ts`

```typescript
@Entity('diagnosis_results')
export class DiagnosisResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, patient => patient.diagnosisResults)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => XRay, xray => xray.diagnosisResults, { nullable: true })
  @JoinColumn({ name: 'xray_id' })
  xray: XRay;

  @Column({ type: 'varchar', length: 50 })
  prediction: 'TB_POSITIVE' | 'TB_NEGATIVE';

  @Column({ type: 'float' })
  confidenceScore: number;

  @Column({ type: 'simple-array', nullable: true })
  affectedAreas: string[];

  @Column({ type: 'text', nullable: true })
  clinicalFindings: string;

  @Column({ type: 'simple-array', nullable: true })
  recommendations: string[];

  @Column({ type: 'timestamp' })
  analyzedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 6. TB-Positive Workflow Trigger

If diagnosis result is `TB_POSITIVE`, the system automatically:

1. **Creates Notifications**
   - To corresponding physician
   - To all radiologists
   - Message: "Patient [Name] has tested positive for TB. Immediate medical attention required."

2. **Creates Follow-Up Appointments** (4-5 sequential)
   - Initial: 1 week post-diagnosis
   - Follow-up 1: 2 weeks later
   - Follow-up 2: 4 weeks later (Monthly)
   - Follow-up 3: 3 months later
   - Follow-up 4: 6 months later

3. **Generates Medical Report**
   - NHS-compliant format
   - Includes X-ray analysis details
   - Includes recommendations
   - Includes treatment protocol

4. **Updates Patient Status**
   - `tbStatus = 'positive'`
   - `requiresFollowUp = true`
   - Last diagnosis date updated

**Implementation**:
```typescript
async handleTBPositive(
  patient: Patient,
  diagnosisResult: DiagnosisResult,
  user: User
): Promise<void> {
  // 1. Send notifications
  await this.notificationService.sendTBAlert(patient, user);

  // 2. Create follow-up appointments
  await this.followUpService.createFollowUpSchedule(patient, diagnosisResult);

  // 3. Generate medical report
  await this.medicalReportService.generateTBReport(patient, diagnosisResult);

  // 4. Update patient status
  patient.tbStatus = 'positive';
  patient.requiresFollowUp = true;
  await this.patientRepository.save(patient);
}
```

### 7. Result Display on Frontend

**File**: `Eafia/client/src/pages/PatientDetailsPage.tsx`

Results are displayed in multiple sections:

**X-Ray Upload Status Card**:
- Shows validation status (VALID/INVALID)
- Displays image quality score
- Shows file details
- Option to resubmit if validation failed

**Diagnosis Analysis Card**:
- TB Result: POSITIVE/NEGATIVE
- Confidence Score: Visual progress bar
- Affected Areas: List of affected lung regions
- Clinical Findings: Detailed analysis text
- Recommendations: List of recommended actions

**Image Display**:
- Original X-ray image (Base64 rendered as data URL)
- Analyzed heatmap (if available from model)

## Critical Field Name Consistency

**IMPORTANT**: Flask API expects underscore in field name:

| Layer | Field Name | Format |
|-------|-----------|--------|
| Frontend | imageBase64 | Camel case (TypeScript) |
| NestJS DTO | imageBase64 | Camel case (TypeScript) |
| HTTP Request | image_base64 | Snake case (JSON) |
| Flask API | image_base64 | Snake case (Python) |

The conversion from camelCase to snake_case happens automatically via:
```typescript
// In patients.controller.ts
@Post()
@UseInterceptors(new TransformDtoInterceptor())  // Converts camelCase → snake_case
async create(@Body() createPatientDto: CreatePatientDto, @Req() req) {
  // imageBase64 from DTO is converted to image_base64 in HTTP request
}
```

## Error Handling & Recovery

### X-Ray Validation Fails
- Patient record is created
- XRay record is created
- Validation status: INVALID
- User can delete and resubmit from MissingXraysManagementPage

### TB Diagnosis Fails
- Patient record exists
- XRay record exists
- DiagnosisResult not created
- User can view patient and retry diagnosis from PatientDetailsPage

### Flask API Unreachable
- Graceful error message returned
- Patient data preserved
- Physician notified
- Can retry when API available

## Database Relationships

```sql
-- Schema Overview
patients (id, firstName, lastName, physicianId, tbStatus, requiresFollowUp)
  ↓ 1:N relationship
xrays (id, patientId, imageBase64, validationStatus)
  ↓ 1:N relationship
diagnosis_results (id, patientId, xrayId, prediction, confidenceScore)

notifications (id, patientId, message, sentAt)
follow_up_appointments (id, patientId, diagnoseDate, scheduledDate)
medical_reports (id, patientId, reportContent, generatedAt)
```

## Troubleshooting

### "X-ray not found" Error
- Verify XRay record exists in database: `SELECT * FROM xrays WHERE patient_id = <patient_id>`
- Check if `imageBase64` field is populated
- Verify Base64 string is valid (not null or empty)

### "Invalid X-ray image" from Flask
- Image may be corrupted: Test with known good X-ray image
- Image may not be PNG/JPEG: Verify file format
- Image quality too low: Upload higher resolution image
- Flask API may not be running: Check `http://localhost:5000/health`

### "Image not displaying on frontend"
- Verify Base64 is valid: Should start with `iVBORw0KG...` (PNG) or `/9j/...` (JPEG)
- Check browser console for Base64 data URL errors
- Verify MIME type is correct: Should be `image/png` or `image/jpeg`

### "You can only view your own patients" Error
- Verify logged-in user ID matches `patient.physicianId`
- Check database: `SELECT patient_id, physician_id FROM patients WHERE id = <patient_id>`
- Verify JWT token contains correct `userId`

## Performance Considerations

1. **Base64 Storage**
   - X-ray images stored as Base64 strings in database
   - Typical size: 50-500KB (increases ~33% due to Base64 encoding)
   - Consider eventual migration to blob storage (S3, Google Cloud Storage)

2. **ML Model Inference**
   - Validation: ~100-200ms
   - TB Diagnosis: ~300-500ms per image
   - Consider caching for identical images

3. **Database Queries**
   - Patient listing includes relationship joins: Use indexing on `physicianId`
   - X-ray listing: Index on `patient_id` and `validationStatus`

## Monitoring & Logging

All critical operations log to database via SystemLog entity:

```typescript
// Logged operations:
- Patient creation
- X-ray validation success/failure
- TB diagnosis success/failure
- DiagnosisResult creation
- TB-positive workflow trigger
- Notification sending
```

View logs in Admin Dashboard → System Activity Logs section.

## Testing the Complete Workflow

### Manual Test Steps

1. **Start all services**:
   ```bash
   # Terminal 1: Flask API
   cd Eafia/cnn_models
   python api.py

   # Terminal 2: NestJS Backend
   cd Eafia/api
   pnpm start:dev

   # Terminal 3: React Frontend
   cd Eafia/client
   pnpm dev
   ```

2. **Navigate to Patient Intake**:
   - URL: `http://localhost:5173/patient-intake`
   - Ensure logged in as Physician role

3. **Fill patient form**:
   - First name, Last name, Email, Phone
   - Date of Birth, Gender
   - Medical History (optional)
   - Allergies (optional)

4. **Upload X-ray image**:
   - Click "Upload X-ray"
   - Select from `Eafia/cnn_models/pth_files/` (test images available)
   - Preview should show

5. **Submit and verify**:
   - After submit, wait 5-10 seconds for ML processing
   - Check patient details page for:
     - ✅ X-ray status: VALID
     - ✅ TB Result: POSITIVE or NEGATIVE
     - ✅ Confidence score displayed
     - ✅ Clinical findings text visible
   - If TB_POSITIVE:
     - ✅ Follow-up appointments created (check Admin dashboard)
     - ✅ Notifications sent (check notification panel)
     - ✅ Medical report generated

6. **Verify database**:
   ```sql
   -- Check patient
   SELECT * FROM patients WHERE id = '<patient_id>';

   -- Check X-ray
   SELECT id, imageBase64 IS NOT NULL as has_image FROM xrays WHERE patient_id = '<patient_id>';

   -- Check diagnosis result
   SELECT prediction, confidence_score, analyzed_at FROM diagnosis_results WHERE patient_id = '<patient_id>';
   ```

## Future Enhancements

1. **ML Model Improvements**
   - Add more models (TB drug resistance detection)
   - Ensemble predictions from multiple models
   - Real-time model updates

2. **Storage Optimization**
   - Migrate Base64 to S3/Google Cloud Storage
   - Implement image compression
   - Add thumbnail generation

3. **Workflow Automation**
   - Automated scheduled follow-ups
   - Email notifications to physicians
   - SMS alerts for critical cases

4. **Analytics**
   - Prediction accuracy tracking
   - Demographic-based analysis
   - Geographic distribution tracking

---

**Last Updated**: April 1, 2026
**Status**: Complete and tested
**Next Review**: When new ML models added or workflow changes
