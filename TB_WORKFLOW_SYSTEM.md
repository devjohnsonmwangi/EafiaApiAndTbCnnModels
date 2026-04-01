# TB-Positive Workflow System Documentation

## Overview

This document describes the comprehensive TB-positive diagnosis workflow system implemented in the Eafia TB Detection API. When a patient receives a **TB-POSITIVE diagnosis**, the system automatically triggers a series of automated actions:

1. **Notifications** sent to physician and radiologist
2. **Follow-up appointments** automatically scheduled with appropriate timing and urgency
3. **Medical reports** generated and stored
4. **Patient status** updated in the system

## Architecture

### New Entities

#### 1. Notification Entity (`notification.entity.ts`)
Stores all notifications related to patient diagnoses, particularly TB-positive alerts.

**Key Fields:**
- `type`: TB_POSITIVE_ALERT, TB_NEGATIVE_ALERT, APPOINTMENT_REMINDER, etc.
- `channel`: EMAIL, SMS, IN_APP, PUSH
- `status`: PENDING, SENT, DELIVERED, FAILED, READ
- `recipientId`: User who receives the notification
- `diagnosisResultId`: References the diagnosis that triggered this

**Example Notification Types:**
```
- TB_POSITIVE_ALERT: Alert about TB-positive diagnosis
- TB_NEGATIVE_ALERT: Alert about TB-negative result
- APPOINTMENT_REMINDER: Reminder for scheduled follow-up
- FOLLOW_UP_REQUIRED: Notification that follow-up is needed
- REPORT_READY: Medical report is ready
- XRAY_VALIDATION_FAILED: X-ray validation failed
```

#### 2. FollowUpAppointment Entity (`follow-up-appointment.entity.ts`)
Manages all scheduled follow-up appointments for TB patients.

**Key Fields:**
- `type`: CLINICAL_CONSULTATION, TREATMENT_PLANNING, FOLLOW_UP_XRAY, LAB_TESTS, MEDICATION_REVIEW, SPECIALIST_REFERRAL
- `status`: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW
- `appointmentDate`: Scheduled time
- `isUrgent`: Boolean flag for urgent appointments
- `sequenceNumber`: Order in series (1st, 2nd, 3rd follow-up, etc.)

**Appointment Scheduling Logic:**
- **CRITICAL/SEVERE TB**: Urgent appointments within 1-3 days
- **MODERATE TB**: Standard appointments within 2-7 days
- **MILD TB**: Standard appointments within 3-7 days

#### 3. MedicalReport Entity (`medical-report.entity.ts`)
Stores generated medical reports for TB diagnoses.

**Key Fields:**
- `type`: DIAGNOSIS_REPORT, TREATMENT_PLAN, FOLLOW_UP_SUMMARY, etc.
- `status`: DRAFT, GENERATED, REVIEWED, APPROVED, PUBLISHED
- `tbDiagnosis`: TB_POSITIVE, TB_NEGATIVE, TB_SUSPECTED
- `treatmentRecommendations`: Specific drug regimen (e.g., RIPE)
- `durationMonths`: Expected treatment duration
- `sentToPatient/Physician/Radiologist`: Tracking flags
- `pdfBase64`: Generated PDF stored as Base64

#### 4. Patient Status Fields
Updated Patient entity with TB-specific fields:
```typescript
tbStatus: 'negative' | 'positive' | 'suspected' | 'unknown'
notificationSent: boolean
lastTBTestDate: string
requiresFollowUp: boolean
```

### Services

#### TbWorkflowService (`tb-workflow.service.ts`)
Main orchestrator service that handles all TB-positive workflow actions.

**Key Methods:**

1. **executeTBPositiveWorkflow(diagnosis, patient, physician)**
   - Main entry point when TB-positive diagnosis is created
   - Orchestrates all four workflow steps
   - Returns workflow IDs for tracking

2. **sendTBPositiveNotifications(diagnosis, patient, physician)**
   - Creates notifications for physician and all radiologists
   - Includes diagnosis details and urgency level
   - Prepares email content with actionable information

3. **createFollowUpAppointments(diagnosis, patient, physician)**
   - Creates 4-5 sequential follow-up appointments
   - Scheduling based on TB intensity (CRITICAL, SEVERE, MODERATE, MILD)
   - Includes clinical consultation, treatment planning, X-rays, lab tests

4. **generateDiagnosisReport(diagnosis, patient, physician)**
   - Creates HTML diagnosis report
   - Includes patient info, diagnosis results, recommendations
   - Stores as MedicalReport entity

5. **updatePatientTBStatus(patient, diagnosis)**
   - Sets patient.tbStatus = 'positive'
   - Sets patient.notificationSent = true
   - Sets patient.requiresFollowUp = true
   - Updates lastTBTestDate

6. **executeTBNegativeWorkflow(diagnosis, patient)**
   - Updates patient.tbStatus = 'negative'
   - Records TB-negative test date

## Workflow Trigger

The TB workflow is automatically triggered in the **DiagnosisResultsService.create()** method:

```typescript
// When creating a new diagnosis result
if (createDto.prediction?.toUpperCase().includes('POSITIVE')) {
  await this.tbWorkflowService.executeTBPositiveWorkflow(
    savedDiagnosis,
    patient,
    physician,
  );
}
```

## Notification Details

### TB-Positive Alert Email
When TB-positive diagnosis is confirmed:

**Recipients:**
- Attending Physician
- All Radiologists in the system

**Email Content:**
```
Subject: 🚨 TB-POSITIVE Diagnosis Alert - Patient [Name]

Content Includes:
- Patient ID and demographics
- Confidence Score (percentage)
- TB Intensity level
- Affected Areas and Percentage
- Clinical Findings
- Recommendations
- URGENT ACTION REQUIRED section with next steps:
  1. Review diagnosis results immediately
  2. Contact patient for follow-up appointment
  3. Initiate treatment planning
  4. Prepare specialist referral if needed
```

## Follow-Up Appointment Scheduling

### For CRITICAL/SEVERE TB (Days from diagnosis):
1. **Day 1**: Clinical Consultation - TB Treatment Initiation (URGENT)
2. **Day 3**: Treatment Planning Session (URGENT)
3. **Day 3**: Laboratory Tests - Blood & Sputum (URGENT)
4. **Day 14**: Follow-up Chest X-ray
5. **Day 30**: First Month Medication Review

### For MODERATE TB (Days from diagnosis):
1. **Day 2**: Clinical Consultation - TB Treatment Review
2. **Day 3**: Laboratory Tests - Blood & Sputum
3. **Day 5**: Treatment Planning Session
4. **Day 21**: Follow-up Chest X-ray
5. **Day 45**: First Month Medication Review

### For MILD TB (Days from diagnosis):
1. **Day 3**: Clinical Consultation - TB Treatment Initiation
2. **Day 3**: Laboratory Tests - Blood & Sputum
3. **Day 7**: Treatment Planning Session
4. **Day 28**: Follow-up Chest X-ray

## Medical Report Structure

### Diagnosis Report Content
```
- Patient Information (Name, Email, Phone, DOB)
- Diagnosis Results (Status, Confidence %, TB Intensity)
- Clinical Findings
- Recommendations
- Treatment Plan
  * Standard 6-month RIPE regimen details
  * Initial 2-month and continuation 4-month phases
- Instructions (appointment, tests, isolation, etc.)
- Report Metadata (date, physician, ML model)
```

## Database Tables Created

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `notifications` | System notifications | patientId, recipientId, diagnosisResultId |
| `follow_up_appointments` | Scheduled follow-ups | patientId, physicianId, diagnosisResultId |
| `medical_reports` | Generated reports | patientId, diagnosisResultId, generatedBy, reviewedBy |

## Database Migration

When deploying, the following SQL tables will be created automatically (TypeORM synchronize=true):

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  recipientId UUID NOT NULL,
  diagnosisResultId UUID,
  type VARCHAR NOT NULL,
  channel VARCHAR NOT NULL DEFAULT 'email',
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  sentAt TIMESTAMP,
  deliveredAt TIMESTAMP,
  readAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (patientId) REFERENCES patients(id),
  FOREIGN KEY (recipientId) REFERENCES users(id)
);

-- Follow-up appointments table
CREATE TABLE follow_up_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  physicianId UUID,
  diagnosisResultId UUID,
  type VARCHAR NOT NULL,
  title VARCHAR(255) NOT NULL,
  appointmentDate TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'scheduled',
  isUrgent BOOLEAN DEFAULT false,
  sequenceNumber INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (patientId) REFERENCES patients(id),
  FOREIGN KEY (physicianId) REFERENCES users(id)
);

-- Medical reports table
CREATE TABLE medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  diagnosisResultId UUID,
  generatedBy UUID,
  reviewedBy UUID,
  type VARCHAR NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',
  tbDiagnosis VARCHAR(50),
  confidenceScore FLOAT,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (patientId) REFERENCES patients(id),
  FOREIGN KEY (generatedBy) REFERENCES users(id),
  FOREIGN KEY (reviewedBy) REFERENCES users(id)
);

-- Patient TB status fields (ALTER TABLE patients)
ALTER TABLE patients ADD COLUMN tbStatus VARCHAR DEFAULT 'unknown';
ALTER TABLE patients ADD COLUMN notificationSent BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN lastTBTestDate VARCHAR;
ALTER TABLE patients ADD COLUMN requiresFollowUp BOOLEAN DEFAULT false;
```

## Usage Example

### 1. Create a TB-Positive Diagnosis
```bash
POST /diagnosis-results
Content-Type: application/json

{
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "xrayId": "550e8400-e29b-41d4-a716-446655440001",
  "prediction": "TB_POSITIVE",
  "confidenceScore": 0.92,
  "confidenceLevel": "very_high",
  "tbIntensity": "moderate",
  "affectedAreas": "Upper left lobe, right apex",
  "affectedPercentage": 35,
  "clinicalFindings": "Multiple confluent infiltrates in upper lobes with cavitation",
  "recommendations": "Initiate anti-TB therapy immediately, contact tracing required",
  "modelName": "tb_classifier_v2"
}
```

### 2. Automatic Workflow Execution
Once the diagnosis is created with TB_POSITIVE prediction, the system automatically:

1. Creates notifications for physician and radiologists
2. Creates 4-5 follow-up appointments
3. Generates a diagnosis report
4. Updates patient status to TB-positive
5. Sets requiresFollowUp flag

### 3. Retrieve User Notifications
```bash
GET /notifications?userId={userId}&limit=20
```

### 4. Get Patient Follow-Ups
```bash
GET /follow-ups?patientId={patientId}
```

### 5. Get Patient Reports
```bash
GET /medical-reports?patientId={patientId}
```

## Error Handling

The TB workflow includes comprehensive error handling:

- Notifications are logged but don't prevent diagnosis creation
- If workflow execution fails, the diagnosis is still saved
- Errors are logged with full stack traces
- Non-critical workflow failures don't block the primary operation

## Future Enhancements

1. **Email Integration**: Implement actual email sending (SendGrid, AWS SES)
2. **SMS Notifications**: Add SMS channel for urgent alerts
3. **PDF Generation**: Convert HTML reports to PDF with pdfkit
4. **Appointment Confirmation**: Track appointment confirmations from recipients
5. **Treatment Tracking**: Monitor medication compliance and adverse effects
6. **Contact Tracing**: Automatically identify and notify close contacts
7. **Specialist Referral**: Auto-route to TB specialists based on severity
8. **Treatment Outcomes**: Track patient recovery and cure rates

## Testing

To test the TB workflow:

1. Create a patient via the patients API
2. Upload an X-ray via the xrays API
3. Create a diagnosis with TB_POSITIVE prediction
4. Verify notifications are created:
   ```bash
   SELECT * FROM notifications WHERE type = 'tb_positive_alert';
   ```
5. Verify follow-ups are created:
   ```bash
   SELECT * FROM follow_up_appointments WHERE "patientId" = '{patientId}';
   ```
6. Verify reports are created:
   ```bash
   SELECT * FROM medical_reports WHERE "patientId" = '{patientId}';
   ```
7. Verify patient status is updated:
   ```bash
   SELECT "tbStatus", "notificationSent", "requiresFollowUp" FROM patients WHERE id = '{patientId}';
   ```

## Files Modified/Created

### New Files Created:
- `src/modules/notifications/notification.entity.ts`
- `src/modules/notifications/notifications.module.ts`
- `src/modules/follow-ups/follow-up-appointment.entity.ts`
- `src/modules/follow-ups/follow-ups.module.ts`
- `src/modules/medical-reports/medical-report.entity.ts`
- `src/modules/medical-reports/medical-reports.module.ts`
- `src/modules/tb-workflow/tb-workflow.service.ts`
- `src/modules/tb-workflow/tb-workflow.module.ts`

### Files Modified:
- `src/modules/patients/patient.entity.ts` (added TB status fields)
- `src/modules/diagnosis-results/diagnosis-results.service.ts` (trigger workflow)
- `src/modules/diagnosis-results/diagnosis-results.module.ts` (import workflow module)
- `src/config/typeorm.config.ts` (registered new entities)
- `src/app.module.ts` (imported new modules)

## Compliance & Standards

This workflow system follows:
- **WHO Guidelines**: Standard 6-month RIPE treatment regimen
- **TB Control Standards**: Proper classification of TB intensity and urgency
- **Healthcare IT Standards**: HIPAA-compliant logging and auditing
- **Best Practices**: Asynchronous execution, error handling, retry logic

