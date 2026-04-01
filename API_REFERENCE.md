# 🔌 API Reference Guide - Eafia TB Detection Backend

Quick reference for all API endpoints with examples.

---

## 🔐 Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /auth/register`

**Description:** Create a new user account

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "firstName": "Dr",
  "lastName": "Smith",
  "password": "SecurePass123!",
  "role": "physician",
  "license": "MD12345",
  "specialization": "Radiologist",
  "phone": "+1234567890"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@hospital.com",
    "firstName": "Dr",
    "lastName": "Smith",
    "role": "physician",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "statusCode": 201,
  "processingTimeMs": 245,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email already registered",
  "error": "CONFLICT",
  "statusCode": 400,
  "processingTimeMs": 50,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 2. Login User

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and get tokens

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@hospital.com",
    "role": "physician",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "statusCode": 200,
  "processingTimeMs": 156,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "UNAUTHORIZED",
  "statusCode": 401,
  "processingTimeMs": 120,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 3. Refresh Access Token

**Endpoint:** `POST /auth/refresh-token`

**Description:** Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "statusCode": 200,
  "processingTimeMs": 85,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

## 👥 User Management Endpoints

### 4. Get User Details

**Endpoint:** `GET /users/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@hospital.com",
    "firstName": "Dr",
    "lastName": "Smith",
    "role": "physician",
    "license": "MD12345",
    "specialization": "Radiologist",
    "phone": "+1234567890",
    "isActive": true,
    "lastLoginIp": "192.168.1.100",
    "createdAt": "2026-03-30T10:00:00.000Z"
  },
  "statusCode": 200,
  "processingTimeMs": 45,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 5. List All Users (Admin/SuperAdmin Only)

**Endpoint:** `GET /users`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `take` (optional): Number of records to return (default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "doctor@hospital.com",
      "firstName": "Dr",
      "lastName": "Smith",
      "role": "physician",
      "isActive": true,
      "createdAt": "2026-03-30T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "admin@hospital.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-03-30T09:00:00.000Z"
    }
  ],
  "statusCode": 200,
  "processingTimeMs": 120,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 6. Deactivate User

**Endpoint:** `PATCH /users/:id/deactivate`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@hospital.com",
    "isActive": false
  },
  "statusCode": 200,
  "processingTimeMs": 75,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 7. Activate User

**Endpoint:** `PATCH /users/:id/activate`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@hospital.com",
    "isActive": true
  },
  "statusCode": 200,
  "processingTimeMs": 65,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 8. Delete User (SuperAdmin Only)

**Endpoint:** `DELETE /users/:id`

**Headers:**
```
Authorization: Bearer <superAdminToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Account permanently deleted"
  },
  "statusCode": 200,
  "processingTimeMs": 100,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

## 🏥 Patient Management Endpoints

### 9. Register New Patient

**Endpoint:** `POST /patients`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "medicalHistory": "TB exposure in 2022, treated",
  "allergies": "Penicillin",
  "medications": "None current",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "medicalHistory": "TB exposure in 2022, treated",
    "allergies": "Penicillin",
    "medications": "None current",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "physicianId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-30T10:30:00.000Z"
  },
  "statusCode": 201,
  "processingTimeMs": 185,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 10. List Patients

**Endpoint:** `GET /patients`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Query Parameters:**
- `skip` (optional): Number of records to skip
- `take` (optional): Number of records to return

**Note:** Physicians see only their own patients. Admins see all.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patients retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "gender": "Male",
      "physicianId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2026-03-30T10:30:00.000Z"
    }
  ],
  "statusCode": 200,
  "processingTimeMs": 95,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 11. Get Patient Details

**Endpoint:** `GET /patients/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patient retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "medicalHistory": "TB exposure in 2022, treated",
    "allergies": "Penicillin",
    "medications": "None current",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "physicianId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:30:00.000Z"
  },
  "statusCode": 200,
  "processingTimeMs": 50,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 12. Update Patient

**Endpoint:** `PUT /patients/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Request Body:** (any fields to update)
```json
{
  "phone": "+9876543210",
  "medicalHistory": "Updated medical history"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patient updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "phone": "+9876543210",
    "medicalHistory": "Updated medical history",
    "updatedAt": "2026-03-30T11:00:00.000Z"
  },
  "statusCode": 200,
  "processingTimeMs": 120,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 13. Delete Patient

**Endpoint:** `DELETE /patients/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patient deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "message": "Patient soft deleted"
  },
  "statusCode": 200,
  "processingTimeMs": 75,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

## 📸 X-Ray Management Endpoints

### 14. Upload X-Ray

**Endpoint:** `POST /xrays`

**Headers:**
```
Authorization: Bearer <physicianToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "patientId": "550e8400-e29b-41d4-a716-446655440100",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
  "fileName": "chest_xray_2026.jpg",
  "fileType": "image/jpeg",
  "fileSizeBytes": 245000,
  "xrayType": "chest",
  "notes": "Follow-up chest X-ray for TB screening"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "X-ray uploaded successfully. Validation started.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440200",
    "patientId": "550e8400-e29b-41d4-a716-446655440100",
    "fileName": "chest_xray_2026.jpg",
    "status": "PENDING",
    "xrayType": "chest",
    "deviceIpAddress": "192.168.1.100",
    "createdAt": "2026-03-30T10:30:00.000Z"
  },
  "statusCode": 201,
  "processingTimeMs": 250,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 15. List X-Rays

**Endpoint:** `GET /xrays`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Query Parameters:**
- `status` (optional): PENDING, VALIDATING, PROCESSING, COMPLETED, FAILED
- `skip` (optional): Pagination offset
- `take` (optional): Pagination limit

**Success Response (200):**
```json
{
  "success": true,
  "message": "X-rays retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440200",
      "patientId": "550e8400-e29b-41d4-a716-446655440100",
      "fileName": "chest_xray_2026.jpg",
      "fileType": "image/jpeg",
      "status": "COMPLETED",
      "xrayType": "chest",
      "isValid": true,
      "validationConfidence": 0.98,
      "createdAt": "2026-03-30T10:30:00.000Z"
    }
  ],
  "statusCode": 200,
  "processingTimeMs": 120,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 16. Get X-Ray Details

**Endpoint:** `GET /xrays/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "X-ray retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440200",
    "patientId": "550e8400-e29b-41d4-a716-446655440100",
    "fileName": "chest_xray_2026.jpg",
    "fileType": "image/jpeg",
    "fileSizeBytes": 245000,
    "status": "COMPLETED",
    "xrayType": "chest",
    "notes": "Follow-up chest X-ray for TB screening",
    "isValid": true,
    "validationConfidence": 0.98,
    "deviceIpAddress": "192.168.1.100",
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:35:00.000Z"
  },
  "statusCode": 200,
  "processingTimeMs": 65,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 17. Update X-Ray Metadata

**Endpoint:** `PUT /xrays/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Request Body:**
```json
{
  "xrayType": "chest",
  "notes": "Updated clinical notes"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "X-ray updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440200",
    "notes": "Updated clinical notes",
    "updatedAt": "2026-03-30T11:00:00.000Z"
  },
  "statusCode": 200,
  "processingTimeMs": 85,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 18. Delete X-Ray

**Endpoint:** `DELETE /xrays/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "X-ray deleted successfully",
  "statusCode": 200,
  "processingTimeMs": 70,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 19. Get Patient's X-Rays

**Endpoint:** `GET /xrays/patient/:patientId`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patient X-rays retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440200",
      "patientId": "550e8400-e29b-41d4-a716-446655440100",
      "fileName": "chest_xray_2026.jpg",
      "status": "COMPLETED",
      "createdAt": "2026-03-30T10:30:00.000Z"
    }
  ],
  "statusCode": 200,
  "processingTimeMs": 95,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

## 🔬 Diagnosis Results Endpoints

### 20. Create Diagnosis Result

**Endpoint:** `POST /diagnosis-results`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Request Body:**
```json
{
  "patientId": "550e8400-e29b-41d4-a716-446655440100",
  "xrayId": "550e8400-e29b-41d4-a716-446655440200",
  "diseaseType": "tuberculosis",
  "prediction": "TB_POSITIVE",
  "confidenceScore": 0.92,
  "confidenceLevel": "VERY_HIGH",
  "tbIntensity": "MODERATE",
  "affectedAreas": "Left upper lobe, cavitary lesion",
  "affectedPercentage": 35,
  "clinicalFindings": "Consistent with active pulmonary TB",
  "recommendations": "Start anti-TB therapy immediately, refer to TB clinic",
  "modelName": "tb_classifier_v2",
  "processingTimeMs": 1250,
  "heatmapBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Diagnosis result created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440300",
    "patientId": "550e8400-e29b-41d4-a716-446655440100",
    "xrayId": "550e8400-e29b-41d4-a716-446655440200",
    "diseaseType": "tuberculosis",
    "prediction": "TB_POSITIVE",
    "confidenceScore": 0.92,
    "confidenceLevel": "VERY_HIGH",
    "tbIntensity": "MODERATE",
    "affectedAreas": "Left upper lobe, cavitary lesion",
    "affectedPercentage": 35,
    "recommendations": "Start anti-TB therapy immediately",
    "createdAt": "2026-03-30T10:30:00.000Z"
  },
  "statusCode": 201,
  "processingTimeMs": 320,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 21. List Diagnosis Results

**Endpoint:** `GET /diagnosis-results`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Query Parameters:**
- `diseaseType` (optional): tuberculosis, pneumonia, lung_cancer, bone_fracture
- `tbIntensity` (optional): none, mild, moderate, severe, critical
- `skip` (optional): Pagination offset
- `take` (optional): Pagination limit

**Success Response (200):**
```json
{
  "success": true,
  "message": "Diagnosis results retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440300",
      "patientId": "550e8400-e29b-41d4-a716-446655440100",
      "xrayId": "550e8400-e29b-41d4-a716-446655440200",
      "diseaseType": "tuberculosis",
      "prediction": "TB_POSITIVE",
      "confidenceScore": 0.92,
      "confidenceLevel": "VERY_HIGH",
      "tbIntensity": "MODERATE",
      "createdAt": "2026-03-30T10:30:00.000Z"
    }
  ],
  "statusCode": 200,
  "processingTimeMs": 150,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 22. Get Diagnosis Details

**Endpoint:** `GET /diagnosis-results/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Diagnosis result retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440300",
    "patientId": "550e8400-e29b-41d4-a716-446655440100",
    "xrayId": "550e8400-e29b-41d4-a716-446655440200",
    "diseaseType": "tuberculosis",
    "prediction": "TB_POSITIVE",
    "confidenceScore": 0.92,
    "confidenceLevel": "VERY_HIGH",
    "tbIntensity": "MODERATE",
    "affectedAreas": "Left upper lobe, cavitary lesion",
    "affectedPercentage": 35,
    "clinicalFindings": "Consistent with active pulmonary TB",
    "recommendations": "Start anti-TB therapy immediately, refer to TB clinic",
    "modelName": "tb_classifier_v2",
    "processingTimeMs": 1250,
    "deviceIpAddress": "192.168.1.100",
    "heatmapBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
    "createdAt": "2026-03-30T10:30:00.000Z"
  },
  "statusCode": 200,
  "processingTimeMs": 85,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 23. Get Patient's Diagnosis Results

**Endpoint:** `GET /diagnosis-results/patient/:patientId`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patient diagnosis results retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440300",
      "xrayId": "550e8400-e29b-41d4-a716-446655440200",
      "diseaseType": "tuberculosis",
      "prediction": "TB_POSITIVE",
      "tbIntensity": "MODERATE",
      "confidenceScore": 0.92,
      "createdAt": "2026-03-30T10:30:00.000Z"
    }
  ],
  "statusCode": 200,
  "processingTimeMs": 110,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 24. Get X-Ray's Diagnosis Results

**Endpoint:** `GET /diagnosis-results/xray/:xrayId`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "X-ray diagnosis results retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440300",
      "diseaseType": "tuberculosis",
      "prediction": "TB_POSITIVE",
      "tbIntensity": "MODERATE",
      "confidenceScore": 0.92,
      "createdAt": "2026-03-30T10:30:00.000Z"
    }
  ],
  "statusCode": 200,
  "processingTimeMs": 95,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

### 25. Delete Diagnosis Result

**Endpoint:** `DELETE /diagnosis-results/:id`

**Headers:**
```
Authorization: Bearer <physicianToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Diagnosis result deleted successfully",
  "statusCode": 200,
  "processingTimeMs": 80,
  "timestamp": "2026-03-30T10:30:00.000Z"
}
```

---

## 🔑 Important Notes

### Authentication
- All protected endpoints require the `Authorization: Bearer <accessToken>` header
- Access tokens expire in **24 hours**
- Refresh tokens expire in **7 days**
- Get new tokens from `/auth/refresh-token`

### Role-Based Access
- **PHYSICIAN**: Register/manage own patients and X-rays
- **ADMIN**: Manage all patients, manage non-super-admin users
- **SUPER_ADMIN**: Full system access, can delete users

### Response Format
All responses follow this structure:
```json
{
  "success": boolean,
  "message": "Human readable message",
  "data": {...},
  "statusCode": 200,
  "processingTimeMs": 125,
  "timestamp": "ISO 8601 timestamp"
}
```

### HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

### Device IP Tracking
- Device IP is automatically captured from:
  1. `x-forwarded-for` header (proxies)
  2. `socket.remoteAddress` (direct connections)
- Stored in relevant entities (User.lastLoginIp, XRay.deviceIpAddress, etc.)

### Processing Time
- Included in every response in milliseconds
- Slow requests (>1000ms) logged as warnings
- Useful for performance monitoring

---

## 📖 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Ensure Authorization header includes "Bearer " prefix |
| 403 Forbidden | Check your user role has access to this endpoint |
| 404 Not Found | Verify resource ID exists and isn't soft-deleted |
| Slow endpoints | Check database performance, may need indexes |
| Token expired | Call `/auth/refresh-token` with refresh token |

---

**Ready to use! Test with Swagger at http://localhost:3000/api** 🚀
