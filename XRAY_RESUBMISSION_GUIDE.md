# X-Ray Resubmission Feature Guide

## Overview

This document describes the X-ray resubmission functionality that allows patients and healthcare providers to resubmit failed X-ray images for TB diagnosis.

## Feature Description

When an X-ray fails validation (e.g., due to image quality issues, incorrect format, or insufficient clarity), users can now resubmit a new X-ray image without creating a new patient record. The system will:

1. Retrieve the patient's details using UUID
2. Identify the most recent failed X-ray
3. Accept a new X-ray image for validation and analysis
4. Update the existing diagnosis record with new results

## API Endpoint

### Resubmit X-Ray

**Endpoint:** `POST /patients/:patientId/xrays/resubmit`

**Authentication:** JWT Bearer Token (Required)

**Roles:** PHYSICIAN, ADMIN, SUPER_ADMIN

**Request Parameters:**

```typescript
// Path Parameters
patientId: string (UUID of the patient)

// Body (multipart/form-data or JSON)
{
  imageBase64?: string  // Optional: Base64-encoded X-ray image
}

// OR File Upload
- Form field: imageFile (JPEG, PNG, DICOM - max 50MB)
```

**Request Examples:**

**Option 1: Upload File**
```bash
curl -X POST \
  http://localhost:3000/patients/{patientId}/xrays/resubmit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "imageFile=@/path/to/xray.jpg"
```

**Option 2: Send Base64 String**
```bash
curl -X POST \
  http://localhost:3000/patients/{patientId}/xrays/resubmit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
  }'
```

**Response Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "X-ray resubmission successful. TB diagnosis completed.",
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "xrays": [
      {
        "id": "xray-uuid",
        "imageBase64": "...",
        "status": "COMPLETED",
        "isValid": true,
        "diagnosisResults": [
          {
            "id": "diagnosis-uuid",
            "prediction": "TB_NEGATIVE",
            "confidenceScore": 0.95,
            "status": "COMPLETED",
            "heatmapBase64": "..."
          }
        ]
      }
    ],
    "diagnosisResults": [...]
  }
}
```

**Response Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Invalid X-ray image: Image is not a valid medical X-ray",
  "error": "BadRequestException"
}
```

**Response Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Patient with ID {patientId} not found",
  "error": "NotFoundException"
}
```

**Response Error (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "You can only view your own patients",
  "error": "ForbiddenException"
}
```

## Backend Implementation

### Service Method: `resubmitXray()`

**Location:** `src/modules/patients/patients.service.ts`

**Functionality:**

1. **Access Control:** Verifies user has permission to modify the patient's records
2. **Failed X-ray Retrieval:** Finds the most recent failed X-ray for the patient
3. **Validation:** Validates the new X-ray image with ML service
4. **Diagnosis:** Performs TB diagnosis if validation passes
5. **Status Update:** Updates X-ray and diagnosis status accordingly
6. **Logging:** Records all operations for audit trail

**Key Features:**

- Type-safe implementation with explicit null/undefined checks
- Comprehensive error handling with meaningful error messages
- System logging for audit trail
- Transactional consistency (all database updates succeed or all fail)
- Proper relationship management between X-rays and diagnoses

### Flow Diagram

```
┌─────────────────────────────────────────┐
│ POST /patients/:patientId/xrays/resubmit│
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Verify Patient  │
        │    Access       │
        └────────┬────────┘
                 │
        ┌────────▼──────────┐
        │ Find Failed X-rays│
        │ (sort by date)    │
        └────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │ Validate X-ray with │
      │  ML Service         │
      └──────┬──────┬───────┘
             │      │
       VALID │      │ INVALID
             │      │
             ▼      ▼
      ┌──────────────────┐
      │ Perform TB       │ Update to FAILED
      │ Diagnosis        │ Status
      └────────┬────────┘
               │
               ▼
        ┌──────────────────┐
        │ Update Diagnosis │
        │ Status to        │
        │ COMPLETED        │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Log Success     │
        │ Return Patient  │
        └───────┬─────────┘
                │
                ▼
           Success 200 OK
```

## Frontend Implementation

### Component Usage

The resubmission feature should be called from components that display failed X-ray information:

```typescript
// Example in PatientDetailsPage.tsx
async function handleXrayResubmission(patientId: string, file: File) {
  try {
    const formData = new FormData();
    formData.append('imageFile', file);

    const response = await fetch(
      `/api/patients/${patientId}/xrays/resubmit`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      }
    );

    const result = await response.json();
    
    if (result.statusCode === 200) {
      // Update UI with new diagnosis results
      setPatientData(result.data);
      setSuccessMessage('X-ray resubmitted successfully!');
    } else {
      setErrorMessage(result.message);
    }
  } catch (error) {
    setErrorMessage('Failed to resubmit X-ray');
  }
}
```

### UI Components

**Failed X-ray Resubmission Card:**

```tsx
<Card className="p-4 border-yellow-200 bg-yellow-50">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-yellow-800">Failed X-Ray</h3>
      <p className="text-sm text-yellow-700">
        Reason: {failedXray.validationError}
      </p>
    </div>
    <button
      onClick={() => setShowResubmitModal(true)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Resubmit X-Ray
    </button>
  </div>
</Card>
```

**Resubmission Modal:**

```tsx
<Modal isOpen={showResubmitModal} onClose={() => setShowResubmitModal(false)}>
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Resubmit X-Ray</h2>
    
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Upload New X-Ray Image
      </label>
      <FileInput
        accept=".jpg,.jpeg,.png,.dcm"
        maxSize={50 * 1024 * 1024}
        onFileSelect={handleFileSelect}
      />
    </div>
    
    <div className="flex gap-2">
      <button
        onClick={handleSubmitResubmission}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Submit
      </button>
      <button
        onClick={() => setShowResubmitModal(false)}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
      >
        Cancel
      </button>
    </div>
  </div>
</Modal>
```

## Workflow: Failed X-ray Resubmission Page

### Page Purpose

The resubmission page displays all patients with failed X-rays and allows physicians/radiologists to resubmit new images.

### Components

1. **Patient List with Failed X-rays**
   - Show patients with failed diagnoses
   - Display reason for failure
   - Show date of failed X-ray
   - Show resubmit button for each

2. **Resubmission Details Section**
   - Patient demographics
   - Previous failed X-ray info
   - New upload area
   - Submission status

3. **Action Buttons**
   - Upload New X-ray
   - Cancel
   - View History (previous attempts)

### Data Flow

```
User navigates to Failed X-rays page
        │
        ▼
Fetch patients with failed X-rays
        │
        ▼
Display patient cards with resubmit buttons
        │
        ▼ User clicks "Resubmit"
        │
        ▼
Show resubmission modal with upload
        │
        ▼ User uploads new X-ray
        │
        ▼
POST /patients/:patientId/xrays/resubmit
        │
        ▼ (wait for response)
        │
    Success: Update UI, show new diagnosis
    Failure: Show error message
```

## Error Handling

The system handles the following error scenarios:

| Error | HTTP Status | Message | Cause |
|-------|-------------|---------|-------|
| No failed X-rays | 400 | "No failed X-rays found for this patient" | Patient has no failed X-rays to resubmit |
| Invalid image | 400 | "Invalid X-ray image: [reason]" | X-ray validation failed |
| Patient not found | 404 | "Patient with ID {id} not found" | Patient doesn't exist |
| Access denied | 403 | "You can only view your own patients" | Physician trying to access another's patient |
| ML service down | 400 | "ML model service is not available..." | TB model service offline |
| Missing image | 400 | "X-ray image (imageBase64 or file) is required..." | No image provided in request |

## Data Persistence

### X-Ray Entity Updates

```typescript
xray.imageBase64 = newImageBase64;    // Update with new image
xray.status = XRayStatus.COMPLETED;   // Mark as completed
xray.isValid = true;                  // Mark as valid
xray.validationError = null;          // Clear error message
```

### Diagnosis Entity Updates

```typescript
diagnosis.prediction = newPrediction;          // TB_POSITIVE or TB_NEGATIVE
diagnosis.confidenceScore = newConfidence;    // Updated confidence
diagnosis.status = DiagnosisStatus.COMPLETED; // Mark complete
diagnosis.heatmapBase64 = newHeatmap;        // Updated heatmap
diagnosis.xrayId = xray.id;                   // Link to X-ray
```

## Best Practices

1. **User Feedback:** Always show clear error messages why X-ray failed
2. **Image Guidelines:** Display recommended X-ray requirements (size, format, clarity)
3. **Retry Limit:** Consider implementing retry limits if needed
4. **Audit Trail:** All resubmissions are logged for compliance
5. **Performance:** Show progress indication during validation/diagnosis
6. **Accessibility:** Ensure upload forms are keyboard accessible

## Testing

### Test Scenarios

1. **Successful Resubmission:**
   - Upload valid X-ray
   - Verify diagnosis is updated
   - Confirm patient record shows COMPLETED status

2. **Failed Validation:**
   - Upload invalid X-ray (blurry, wrong format)
   - Verify error message shows reason
   - Confirm diagnosis status remains FAILED

3. **Access Control:**
   - Physician tries to resubmit another physician's patient
   - Verify 403 Forbidden error

4. **No Failed X-rays:**
   - Call endpoint for patient with no failed X-rays
   - Verify 400 Bad Request error

### cURL Examples

**Test Successful Resubmission:**
```bash
curl -X POST \
  http://localhost:3000/patients/550e8400-e29b-41d4-a716-446655440000/xrays/resubmit \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "imageFile=@valid_xray.jpg"
```

**Test with Base64:**
```bash
curl -X POST \
  http://localhost:3000/patients/550e8400-e29b-41d4-a716-446655440000/xrays/resubmit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "'"$(base64 -w 0 < valid_xray.jpg)"'"
  }'
```

## Related Documentation

- [X-Ray Validation Guide](./XRAY_VALIDATION_GUIDE.md)
- [TB Diagnosis Workflow](./TB_DETECTION_API_GUIDE.md)
- [Patient Management API](./API_REFERENCE.md)
- [System Logging](./LOGGING_DOCUMENTATION.md)
