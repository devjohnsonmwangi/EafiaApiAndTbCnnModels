import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../notifications/notification.entity';
import {
  FollowUpAppointment,
  FollowUpType,
  AppointmentStatus,
} from '../follow-ups/follow-up-appointment.entity';
import {
  MedicalReport,
  ReportType,
  ReportStatus,
} from '../medical-reports/medical-report.entity';
import { Patient } from '../patients/patient.entity';
import {
  DiagnosisResult,
  TBIntensity,
} from '../diagnosis-results/diagnosis-result.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class TbWorkflowService {
  private readonly logger = new Logger(TbWorkflowService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(FollowUpAppointment)
    private followUpRepository: Repository<FollowUpAppointment>,
    @InjectRepository(MedicalReport)
    private reportRepository: Repository<MedicalReport>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Main method to execute TB-positive workflow
   * Called when a TB-positive diagnosis is confirmed
   */
  async executeTBPositiveWorkflow(
    diagnosis: DiagnosisResult,
    patient: Patient,
    physician: User,
  ): Promise<{
    notificationIds: string[];
    appointmentIds: string[];
    reportId: string;
  }> {
    this.logger.log(`Executing TB-positive workflow for patient ${patient.id}`);

    try {
      // Step 1: Send notifications
      const notificationIds = await this.sendTBPositiveNotifications(
        diagnosis,
        patient,
        physician,
      );

      // Step 2: Create follow-up appointments
      const appointmentIds = await this.createFollowUpAppointments(
        diagnosis,
        patient,
        physician,
      );

      // Step 3: Generate medical report
      const reportId = await this.generateDiagnosisReport(
        diagnosis,
        patient,
        physician,
      );

      // Step 4: Update patient status
      await this.updatePatientTBStatus(patient, diagnosis);

      this.logger.log(
        `TB-positive workflow completed for patient ${patient.id}`,
      );

      return {
        notificationIds,
        appointmentIds,
        reportId,
      };
    } catch (error) {
      this.logger.error(
        `Error executing TB-positive workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Send notifications to physician and radiologist
   */
  private async sendTBPositiveNotifications(
    diagnosis: DiagnosisResult,
    patient: Patient,
    physician: User,
  ): Promise<string[]> {
    this.logger.log(`Creating notifications for TB-positive diagnosis`);

    const notificationIds: string[] = [];

    try {
      // Find radiologists in the system
      const radiologists = await this.userRepository.find({
        where: { role: UserRole.RADIOLOGIST },
      });

      // Prepare notification message
      const confidencePercent = (diagnosis.confidenceScore * 100).toFixed(1);
      const subject = `🚨 TB-POSITIVE Diagnosis Alert - Patient ${patient.firstName} ${patient.lastName}`;

      const message = `
TB-POSITIVE diagnosis has been confirmed for patient ${patient.firstName} ${patient.lastName}.

Patient ID: ${patient.id}
Confidence Score: ${confidencePercent}%
TB Intensity: ${diagnosis.tbIntensity}
Affected Areas: ${diagnosis.affectedAreas ?? 'Not specified'}
Affected Percentage: ${diagnosis.affectedPercentage ?? 0}%

Clinical Findings:
${diagnosis.clinicalFindings ?? 'To be determined'}

Recommendations:
${diagnosis.recommendations ?? 'Please review diagnosis results for recommendations'}

URGENT ACTION REQUIRED:
1. Review diagnosis results immediately
2. Contact patient for follow-up appointment scheduling
3. Initiate treatment planning session
4. Prepare referral for TB specialist if needed

Please log into the system to view complete diagnosis details and charts.
      `;

      // Send notification to physician
      if (physician != null) {
        const physicianNotif = await this.notificationRepository.save({
          patientId: patient.id,
          recipientId: physician.id,
          diagnosisResultId: diagnosis.id,
          type: NotificationType.TB_POSITIVE_ALERT,
          channel: NotificationChannel.EMAIL,
          subject,
          message,
          recipientEmail: physician.email,
          status: NotificationStatus.PENDING,
          details: JSON.stringify({
            diagnosisId: diagnosis.id,
            confidenceScore: diagnosis.confidenceScore,
            tbIntensity: diagnosis.tbIntensity,
          }),
        });
        notificationIds.push(physicianNotif.id);
        this.logger.log(`Notification created for physician ${physician.id}`);
      }

      // Send notification to all radiologists
      for (const radiologist of radiologists) {
        const radiologistNotif = await this.notificationRepository.save({
          patientId: patient.id,
          recipientId: radiologist.id,
          diagnosisResultId: diagnosis.id,
          type: NotificationType.TB_POSITIVE_ALERT,
          channel: NotificationChannel.EMAIL,
          subject,
          message,
          recipientEmail: radiologist.email,
          status: NotificationStatus.PENDING,
          details: JSON.stringify({
            diagnosisId: diagnosis.id,
            confidenceScore: diagnosis.confidenceScore,
            tbIntensity: diagnosis.tbIntensity,
          }),
        });
        notificationIds.push(radiologistNotif.id);
        this.logger.log(
          `Notification created for radiologist ${radiologist.id}`,
        );
      }

      return notificationIds;
    } catch (error) {
      this.logger.error(
        `Error sending notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Create follow-up appointments for TB-positive patient
   */
  private async createFollowUpAppointments(
    diagnosis: DiagnosisResult,
    patient: Patient,
    physician: User,
  ): Promise<string[]> {
    this.logger.log(`Creating follow-up appointments`);

    const appointmentIds: string[] = [];

    try {
      // Calculate appointment timings based on TB intensity
      const baseDate = new Date();
      const appointmentConfigs: Array<{
        type: FollowUpType;
        daysFromNow: number;
        title: string;
        isUrgent: boolean;
      }> = [];

      if (
        diagnosis.tbIntensity != null &&
        (diagnosis.tbIntensity === TBIntensity.CRITICAL ||
          diagnosis.tbIntensity === TBIntensity.SEVERE)
      ) {
        // Urgent appointments for severe/critical TB
        appointmentConfigs.push(
          {
            type: FollowUpType.CLINICAL_CONSULTATION,
            daysFromNow: 1,
            title: 'URGENT: Clinical Consultation - TB Treatment Initiation',
            isUrgent: true,
          },
          {
            type: FollowUpType.TREATMENT_PLANNING,
            daysFromNow: 3,
            title: 'URGENT: Treatment Planning Session',
            isUrgent: true,
          },
          {
            type: FollowUpType.FOLLOW_UP_XRAY,
            daysFromNow: 14,
            title: 'Follow-up Chest X-ray',
            isUrgent: false,
          },
          {
            type: FollowUpType.LAB_TESTS,
            daysFromNow: 3,
            title: 'Laboratory Tests (Blood & Sputum)',
            isUrgent: true,
          },
          {
            type: FollowUpType.MEDICATION_REVIEW,
            daysFromNow: 30,
            title: 'First Month Medication Review',
            isUrgent: false,
          },
        );
      } else if (
        diagnosis.tbIntensity != null &&
        diagnosis.tbIntensity === TBIntensity.MODERATE
      ) {
        // Standard appointments for moderate TB
        appointmentConfigs.push(
          {
            type: FollowUpType.CLINICAL_CONSULTATION,
            daysFromNow: 2,
            title: 'Clinical Consultation - TB Treatment Review',
            isUrgent: false,
          },
          {
            type: FollowUpType.TREATMENT_PLANNING,
            daysFromNow: 5,
            title: 'Treatment Planning Session',
            isUrgent: false,
          },
          {
            type: FollowUpType.LAB_TESTS,
            daysFromNow: 3,
            title: 'Laboratory Tests (Blood & Sputum)',
            isUrgent: false,
          },
          {
            type: FollowUpType.FOLLOW_UP_XRAY,
            daysFromNow: 21,
            title: 'Follow-up Chest X-ray',
            isUrgent: false,
          },
          {
            type: FollowUpType.MEDICATION_REVIEW,
            daysFromNow: 45,
            title: 'First Month Medication Review',
            isUrgent: false,
          },
        );
      } else if (diagnosis.tbIntensity != null) {
        // Standard appointments for mild TB
        appointmentConfigs.push(
          {
            type: FollowUpType.CLINICAL_CONSULTATION,
            daysFromNow: 3,
            title: 'Clinical Consultation - TB Treatment Initiation',
            isUrgent: false,
          },
          {
            type: FollowUpType.TREATMENT_PLANNING,
            daysFromNow: 7,
            title: 'Treatment Planning Session',
            isUrgent: false,
          },
          {
            type: FollowUpType.LAB_TESTS,
            daysFromNow: 3,
            title: 'Laboratory Tests (Blood & Sputum)',
            isUrgent: false,
          },
          {
            type: FollowUpType.FOLLOW_UP_XRAY,
            daysFromNow: 28,
            title: 'Follow-up Chest X-ray',
            isUrgent: false,
          },
        );
      }

      // Create appointments
      for (let i = 0; i < appointmentConfigs.length; i += 1) {
        const config = appointmentConfigs[i];
        if (config == null) {
          continue;
        }
        const appointmentDate = new Date(baseDate);
        appointmentDate.setDate(
          appointmentDate.getDate() + (config.daysFromNow ?? 0),
        );

        const appointment = await this.followUpRepository.save({
          patientId: patient.id,
          physicianId: physician.id,
          diagnosisResultId: diagnosis.id,
          type: config.type,
          title: config.title,
          description: `Follow-up appointment created due to TB-positive diagnosis`,
          appointmentDate,
          durationMinutes:
            config.type === FollowUpType.CLINICAL_CONSULTATION ? 45 : 30,
          location: 'TB Clinic',
          status: AppointmentStatus.SCHEDULED,
          isUrgent: config.isUrgent,
          sequenceNumber: i + 1,
        });

        appointmentIds.push(appointment.id);
        this.logger.log(`Follow-up appointment created: ${appointment.id}`);
      }

      return appointmentIds;
    } catch (error) {
      this.logger.error(
        `Error creating follow-up appointments: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Generate diagnosis report
   */
  private async generateDiagnosisReport(
    diagnosis: DiagnosisResult,
    patient: Patient,
    physician: User,
  ): Promise<string> {
    this.logger.log(`Generating diagnosis report`);

    try {
      const confidencePercent = (diagnosis.confidenceScore * 100).toFixed(1);

      const reportContent = `
<html>
<body>
<h1>TB DIAGNOSIS REPORT</h1>
<h2>Patient Information</h2>
<p><strong>Name:</strong> ${patient.firstName} ${patient.lastName}</p>
<p><strong>Email:</strong> ${patient.email}</p>
<p><strong>Phone:</strong> ${patient.phone}</p>
<p><strong>Date of Birth:</strong> ${patient.dateOfBirth?.toString() ?? 'N/A'}</p>

<h2>Diagnosis Results</h2>
<p><strong>Diagnosis Status:</strong> TB POSITIVE</p>
<p><strong>Confidence Score:</strong> ${confidencePercent}%</p>
<p><strong>TB Intensity:</strong> ${diagnosis.tbIntensity}</p>
<p><strong>Affected Areas:</strong> ${diagnosis.affectedAreas ?? 'Not specified'}</p>
<p><strong>Affected Percentage:</strong> ${diagnosis.affectedPercentage ?? 0}%</p>

<h2>Clinical Findings</h2>
<p>${diagnosis.clinicalFindings ?? 'To be determined by radiologist'}</p>

<h2>Recommendations</h2>
<p>${diagnosis.recommendations ?? 'Standard TB treatment protocol recommended'}</p>

<h2>Treatment Plan</h2>
<p>Standard TB treatment regimen should be initiated immediately:</p>
<ul>
<li>Duration: 6 months standard (RIPE: Rifampicin, Isoniazid, Pyrazinamide, Ethambutol)</li>
<li>Initial phase: 2 months with 4-drug combination</li>
<li>Continuation phase: 4 months with Rifampicin and Isoniazid</li>
</ul>

<h2>Instructions</h2>
<ol>
<li>Immediate appointment scheduling required</li>
<li>Laboratory tests (TB culture, sensitivity testing) pending</li>
<li>Isolation precautions if applicable</li>
<li>Contact tracing for close contacts</li>
<li>Food and dietary support for nutritional status</li>
<li>Regular follow-up X-rays every 4 weeks</li>
</ol>

<h2>Report Generated</h2>
<p><strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</p>
<p><strong>Generated by:</strong> ${physician.firstName} ${physician.lastName} (${physician.email})</p>
<p><strong>ML Model:</strong> ${diagnosis.modelName ?? 'TB Classifier v1'}</p>
</body>
</html>
      `;

      const report = await this.reportRepository.save({
        patientId: patient.id,
        diagnosisResultId: diagnosis.id,
        generatedBy: physician.id,
        type: ReportType.DIAGNOSIS_REPORT,
        title: `TB Diagnostic Report - ${patient.firstName} ${patient.lastName}`,
        content: reportContent,
        summary: `TB-POSITIVE diagnosis with ${confidencePercent}% confidence. Treatment initiation recommended.`,
        status: ReportStatus.GENERATED,
        tbDiagnosis: 'TB_POSITIVE',
        confidenceScore: diagnosis.confidenceScore,
        treatmentRecommendations: 'Standard 6-month RIPE regimen recommended',
        durationMonths: '6',
        recipientEmails: `${physician.email}`,
        fileName: `TB_Diagnosis_Report_${patient.firstName}_${patient.lastName}_${new Date().getTime()}.pdf`,
      });

      this.logger.log(`Diagnosis report created: ${report.id}`);
      return report.id;
    } catch (error) {
      this.logger.error(
        `Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Update patient TB status
   */
  private async updatePatientTBStatus(
    patient: Patient,
    _diagnosis: DiagnosisResult,
  ): Promise<void> {
    this.logger.log(`Updating patient TB status`);

    try {
      patient.tbStatus = 'positive';
      patient.notificationSent = true;
      patient.requiresFollowUp = true;
      patient.lastTBTestDate = new Date().toISOString().split('T')[0] ?? null;

      await this.patientRepository.save(patient);
      this.logger.log(`Patient status updated: ${patient.id}`);
    } catch (error) {
      this.logger.error(
        `Error updating patient status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Execute workflow for TB-negative diagnosis
   */
  async executeTBNegativeWorkflow(
    _diagnosis: DiagnosisResult,
    patient: Patient,
  ): Promise<void> {
    this.logger.log(
      `Recording TB-negative diagnosis for patient ${patient.id}`,
    );

    try {
      patient.tbStatus = 'negative';
      patient.lastTBTestDate = new Date().toISOString().split('T')[0] ?? null;

      await this.patientRepository.save(patient);
      this.logger.log(`Patient TB status updated to negative: ${patient.id}`);
    } catch (error) {
      this.logger.error(
        `Error executing TB-negative workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get follow-up appointments for a patient
   */
  async getPatientFollowUps(patientId: string): Promise<FollowUpAppointment[]> {
    return this.followUpRepository.find({
      where: { patientId },
      order: { appointmentDate: 'ASC' },
    });
  }

  /**
   * Get medical reports for a patient
   */
  async getPatientReports(patientId: string): Promise<MedicalReport[]> {
    return this.reportRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }
}
