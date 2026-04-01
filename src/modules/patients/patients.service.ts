import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { Patient } from './patient.entity';
import { User, UserRole } from '../users/user.entity';
import { XRay, XRayStatus } from '../xrays/xray.entity';
import {
  DiagnosisResult,
  DiseaseType,
  ConfidenceLevel,
  TBIntensity,
  DiagnosisStatus,
} from '../diagnosis-results/diagnosis-result.entity';
import { CreatePatientDto, UpdatePatientDto } from './patient.dto';
import { SystemLoggingService } from '../logging/system-logging.service';
import { SystemLogCategory } from '../logging/system-log.entity';
import axios from 'axios';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(XRay)
    private readonly xraysRepository: Repository<XRay>,
    @InjectRepository(DiagnosisResult)
    private readonly diagnosisRepository: Repository<DiagnosisResult>,
    private readonly systemLoggingService: SystemLoggingService,
  ) {}

  async create(
    createPatientDto: CreatePatientDto,
    physicianId: string,
  ): Promise<Patient> {
    // Create patient record first (X-ray is now optional)
    const patient = this.patientsRepository.create({
      firstName: createPatientDto.firstName,
      lastName: createPatientDto.lastName,
      email: createPatientDto.email,
      phone: createPatientDto.phone,
      dateOfBirth: createPatientDto.dateOfBirth,
      gender: createPatientDto.gender,
      medicalHistory: createPatientDto.medicalHistory,
      allergies: createPatientDto.allergies,
      medications: createPatientDto.medications,
      address: createPatientDto.address,
      city: createPatientDto.city,
      state: createPatientDto.state,
      postalCode: createPatientDto.postalCode,
      country: createPatientDto.country,
      physicianId,
    });

    const savedPatient = await this.patientsRepository.save(patient);

    // Convert image file to base64 if provided, otherwise use provided base64
    let imageBase64 = createPatientDto.imageBase64;

    if (
      createPatientDto.imageFile !== undefined &&
      createPatientDto.imageFile !== null
    ) {
      imageBase64 = this.fileToBase64(createPatientDto.imageFile);
    }

    // Check if X-ray data is provided
    const hasXrayData =
      imageBase64 !== undefined && imageBase64 !== '' && imageBase64 !== null;

    // If no X-ray provided, create patient with PENDING diagnosis
    if (!hasXrayData) {
      // Create a PENDING diagnosis record without X-ray reference
      const pendingDiagnosis = this.diagnosisRepository.create({
        patientId: savedPatient.id,
        xrayId: null, // No X-ray yet, will be set when X-ray is uploaded
        diseaseType: DiseaseType.TUBERCULOSIS,
        prediction: 'PENDING',
        confidenceScore: 0,
        confidenceLevel: ConfidenceLevel.LOW,
        tbIntensity: TBIntensity.NONE,
        status: DiagnosisStatus.PENDING,
        affectedAreas: null,
        affectedPercentage: null,
        heatmapBase64: null,
        clinicalFindings: 'Awaiting valid X-ray upload',
        recommendations: 'Please upload a valid chest X-ray image',
        modelName: null,
        processingTimeMs: null,
        deviceIpAddress: null,
      });

      await this.diagnosisRepository.save(pendingDiagnosis);

      await this.systemLoggingService.info(
        SystemLogCategory.PATIENT_MANAGEMENT,
        `Patient created without X-ray. PENDING diagnosis record created.`,
        {
          patientId: savedPatient.id,
          diagnosisId: pendingDiagnosis.id,
          physicianId,
        },
      );

      return savedPatient;
    }

    // X-ray data provided - validate and process it
    try {
      // Validate base64 format is a valid image
      const isValidBase64 = this.isValidBase64ImageFormat(imageBase64 ?? '');
      if (!isValidBase64) {
        // Create PENDING diagnosis instead of throwing error
        const pendingDiagnosis = this.diagnosisRepository.create({
          patientId: savedPatient.id,
          xrayId: null,
          diseaseType: DiseaseType.TUBERCULOSIS,
          prediction: 'FAILED',
          confidenceScore: 0,
          confidenceLevel: ConfidenceLevel.LOW,
          tbIntensity: TBIntensity.NONE,
          status: DiagnosisStatus.FAILED,
          affectedAreas: null,
          affectedPercentage: null,
          heatmapBase64: null,
          clinicalFindings: 'Invalid X-ray image format',
          recommendations: 'Please upload a valid JPEG, PNG, or DICOM image',
          modelName: null,
          processingTimeMs: null,
          deviceIpAddress: null,
        });

        await this.diagnosisRepository.save(pendingDiagnosis);

        await this.systemLoggingService.warn(
          SystemLogCategory.PATIENT_MANAGEMENT,
          `Patient created with invalid X-ray. FAILED diagnosis record created.`,
          {
            patientId: savedPatient.id,
            diagnosisId: pendingDiagnosis.id,
            error: 'Invalid X-ray image format',
          },
        );

        return savedPatient;
      }

      if (imageBase64 != null && imageBase64.length < 100) {
        // Create PENDING diagnosis instead of throwing error
        const pendingDiagnosis = this.diagnosisRepository.create({
          patientId: savedPatient.id,
          xrayId: null,
          diseaseType: DiseaseType.TUBERCULOSIS,
          prediction: 'FAILED',
          confidenceScore: 0,
          confidenceLevel: ConfidenceLevel.LOW,
          tbIntensity: TBIntensity.NONE,
          status: DiagnosisStatus.FAILED,
          affectedAreas: null,
          affectedPercentage: null,
          heatmapBase64: null,
          clinicalFindings: 'X-ray image too small',
          recommendations: 'Please upload a larger X-ray image',
          modelName: null,
          processingTimeMs: null,
          deviceIpAddress: null,
        });

        await this.diagnosisRepository.save(pendingDiagnosis);

        await this.systemLoggingService.warn(
          SystemLogCategory.PATIENT_MANAGEMENT,
          `Patient created with undersized X-ray. FAILED diagnosis record created.`,
          {
            patientId: savedPatient.id,
            diagnosisId: pendingDiagnosis.id,
            error: 'X-ray base64 string too short',
          },
        );

        return savedPatient;
      }

      // Check if ML service is healthy before processing X-ray
      const mlHealthy = await this.checkMLServiceHealth();
      if (!mlHealthy) {
        // Create PENDING diagnosis - ML service to be tried later
        const pendingDiagnosis = this.diagnosisRepository.create({
          patientId: savedPatient.id,
          xrayId: null,
          diseaseType: DiseaseType.TUBERCULOSIS,
          prediction: 'PENDING',
          confidenceScore: 0,
          confidenceLevel: ConfidenceLevel.LOW,
          tbIntensity: TBIntensity.NONE,
          status: DiagnosisStatus.PENDING,
          affectedAreas: null,
          affectedPercentage: null,
          heatmapBase64: null,
          clinicalFindings: 'ML service temporarily unavailable',
          recommendations: 'Will retry diagnosis processing later',
          modelName: null,
          processingTimeMs: null,
          deviceIpAddress: null,
        });

        await this.diagnosisRepository.save(pendingDiagnosis);

        await this.systemLoggingService.warn(
          SystemLogCategory.PATIENT_MANAGEMENT,
          `Patient created. ML service unavailable. PENDING diagnosis record created.`,
          {
            patientId: savedPatient.id,
            diagnosisId: pendingDiagnosis.id,
          },
        );

        return savedPatient;
      }

      // Create X-ray record with all fields properly set
      const xrayBase64ToSave = imageBase64 ?? '';

      // Verify imageBase64 has content
      if (!xrayBase64ToSave || xrayBase64ToSave.length === 0) {
        await this.systemLoggingService.error(
          SystemLogCategory.XRAY_PROCESSING,
          `Cannot create X-ray: imageBase64 is empty for patient ${savedPatient.id}`,
          undefined,
          {
            patientId: savedPatient.id,
            dataLength: xrayBase64ToSave.length,
          },
        );
        throw new BadRequestException('X-ray image data is empty or invalid');
      }

      const xray = this.xraysRepository.create({
        patientId: savedPatient.id,
        imageBase64: xrayBase64ToSave, // Use verified non-empty value
        fileName: createPatientDto.fileName ?? `xray_${savedPatient.id}.jpg`,
        fileType: 'image/jpeg', // Default type, can be inferred from base64 prefix
        fileSizeBytes: xrayBase64ToSave.length,
        xrayType: createPatientDto.xrayType ?? 'Chest PA',
        notes: createPatientDto.xrayNotes ?? null,
        status: XRayStatus.VALIDATING,
        isValid: false, // Will be set after validation
        validationConfidence: null,
        validationError: null,
        deviceIpAddress: null,
      });

      // Verify xray object was created properly
      if (!xray.imageBase64) {
        await this.systemLoggingService.error(
          SystemLogCategory.XRAY_PROCESSING,
          `X-ray object creation failed: imageBase64 not set for patient ${savedPatient.id}`,
          undefined,
          { patientId: savedPatient.id },
        );
        throw new BadRequestException(
          'Failed to create X-ray record: image data not set',
        );
      }

      let savedXray: XRay;
      try {
        savedXray = await this.xraysRepository.save(xray);

        // Verify the save succeeded and data was persisted
        if (
          savedXray === undefined ||
          savedXray === null ||
          savedXray.id === undefined
        ) {
          await this.systemLoggingService.error(
            SystemLogCategory.XRAY_PROCESSING,
            `X-ray save operation failed for patient ${savedPatient.id}`,
            undefined,
            { patientId: savedPatient.id },
          );
          throw new BadRequestException('Failed to save X-ray to database');
        }

        // Re-fetch from database to confirm imageBase64 was saved
        const verifyXray = await this.xraysRepository.findOne({
          where: { id: savedXray.id },
        });

        if (
          !verifyXray ||
          !verifyXray.imageBase64 ||
          verifyXray.imageBase64.length === 0
        ) {
          await this.systemLoggingService.warn(
            SystemLogCategory.XRAY_PROCESSING,
            `X-ray imageBase64 not persisted to database for patient ${savedPatient.id}`,
            {
              patientId: savedPatient.id,
              xrayId: savedXray.id,
              savedLength: savedXray.imageBase64?.length ?? 0,
              verifiedLength: verifyXray?.imageBase64?.length ?? 0,
            },
          );
        }
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        await this.systemLoggingService.error(
          SystemLogCategory.XRAY_PROCESSING,
          `Error saving X-ray for patient ${savedPatient.id}`,
          errorObj,
          { patientId: savedPatient.id },
        );
        throw new BadRequestException(
          `Failed to save X-ray: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      // Validate X-ray with ML service
      const validationResult = await this.validateXray(
        savedXray.id,
        imageBase64 ?? '',
      );

      if (validationResult.isValid === false) {
        savedXray.status = XRayStatus.FAILED;
        savedXray.isValid = false;
        savedXray.validationError = validationResult.error ?? null;
        await this.xraysRepository.save(savedXray);

        // Create FAILED diagnosis record
        const failedDiagnosis = this.diagnosisRepository.create({
          patientId: savedPatient.id,
          xrayId: savedXray.id,
          diseaseType: DiseaseType.TUBERCULOSIS,
          prediction: 'FAILED',
          confidenceScore: 0,
          confidenceLevel: ConfidenceLevel.LOW,
          tbIntensity: TBIntensity.NONE,
          status: DiagnosisStatus.FAILED,
          affectedAreas: null,
          affectedPercentage: null,
          heatmapBase64: null,
          clinicalFindings: 'Invalid X-ray image format',
          recommendations: 'Please upload a valid JPEG, PNG, or DICOM image',
          modelName: null,
          processingTimeMs: null,
          deviceIpAddress: null,
        });

        await this.diagnosisRepository.save(failedDiagnosis);

        await this.systemLoggingService.warn(
          SystemLogCategory.XRAY_PROCESSING,
          `Invalid X-ray image for patient ${savedPatient.id}: ${validationResult.error ?? 'Unknown error'}`,
          {
            patientId: savedPatient.id,
            xrayId: savedXray.id,
          },
        );

        return savedPatient; // Return patient but with FAILED diagnosis
      }

      // X-ray is valid - perform TB diagnosis
      const diagnosisResult = await this.performTBDiagnosis(
        savedPatient.id,
        savedXray.id,
        imageBase64 ?? '',
      );

      savedXray.status = XRayStatus.COMPLETED;
      savedXray.isValid = true;
      await this.xraysRepository.save(savedXray);

      // Update diagnosis status to COMPLETED
      if (diagnosisResult !== null) {
        // Reload the diagnosis result to ensure we have the latest saved data
        const updatedDiagnosis = await this.diagnosisRepository.findOne({
          where: { id: diagnosisResult.id },
        });

        if (updatedDiagnosis) {
          updatedDiagnosis.status = DiagnosisStatus.COMPLETED;
          updatedDiagnosis.xrayId = savedXray.id;
          await this.diagnosisRepository.save(updatedDiagnosis);

          await this.systemLoggingService.info(
            SystemLogCategory.DIAGNOSIS,
            `TB diagnosis completed for patient ${savedPatient.id}`,
            {
              patientId: savedPatient.id,
              diagnosisId: updatedDiagnosis.id,
              xrayId: savedXray.id,
              prediction: updatedDiagnosis.prediction,
              confidence: updatedDiagnosis.confidenceScore,
            },
          );
        }
      }

      await this.systemLoggingService.info(
        SystemLogCategory.PATIENT_MANAGEMENT,
        `Patient created with valid X-ray and TB diagnosis`,
        {
          patientId: savedPatient.id,
          xrayId: savedXray.id,
          physicianId,
        },
      );

      return savedPatient;
    } catch (err) {
      // Create PENDING diagnosis for fallback errors
      const errorDiagnosis = this.diagnosisRepository.create({
        patientId: savedPatient.id,
        xrayId: null,
        diseaseType: DiseaseType.TUBERCULOSIS,
        prediction: 'PENDING',
        confidenceScore: 0,
        confidenceLevel: ConfidenceLevel.LOW,
        tbIntensity: TBIntensity.NONE,
        status: DiagnosisStatus.PENDING,
        affectedAreas: null,
        affectedPercentage: null,
        heatmapBase64: null,
        clinicalFindings: `Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        recommendations: 'Diagnosis processing will be retried',
        modelName: null,
        processingTimeMs: null,
        deviceIpAddress: null,
      });

      await this.diagnosisRepository.save(errorDiagnosis);

      await this.systemLoggingService.error(
        SystemLogCategory.PATIENT_MANAGEMENT,
        `Error processing patient X-ray, created PENDING diagnosis`,
        err instanceof Error ? err : undefined,
        {
          patientId: savedPatient.id,
          physicianId,
        },
      );

      return savedPatient; // Return patient with PENDING diagnosis
    }
  }

  private async validateXray(
    _xrayId: string,
    imageBase64: string,
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const pythonApiUrl =
        process.env.PYTHON_API_URL !== undefined &&
        process.env.PYTHON_API_URL !== ''
          ? process.env.PYTHON_API_URL
          : 'http://localhost:5000';

      // Log validation request
      await this.systemLoggingService.info(
        SystemLogCategory.XRAY_PROCESSING,
        `Sending Base64 X-ray to Flask validation endpoint`,
        {
          xrayId: _xrayId,
          imageBase64Length: imageBase64?.length ?? 0,
          endpoint: '/predict/xray_validation',
        },
      );

      const response = await axios.post<{
        is_xray: boolean;
        confidence: number;
        status?: string;
        message?: string;
      }>(
        `${pythonApiUrl}/predict/xray_validation`,
        { image_base64: imageBase64 },
        { timeout: 30000 },
      );

      const { data } = response;

      // Log validation result
      await this.systemLoggingService.info(
        SystemLogCategory.XRAY_PROCESSING,
        `X-ray validation result received from Flask`,
        {
          xrayId: _xrayId,
          is_xray: data.is_xray,
          confidence: data.confidence,
        },
      );

      // During development phase: Accept any image that's decodable
      // In production, implement stricter validation once model is trained
      // For now, accept images if:
      // 1. Detector returns is_xray=true with ANY confidence
      // 2. OR if image confidence is > 0.2 (very lenient for development)
      const isValid = data.is_xray === true || data.confidence > 0.2;

      if (isValid) {
        await this.systemLoggingService.info(
          SystemLogCategory.XRAY_PROCESSING,
          `X-ray validation passed`,
          {
            xrayId: _xrayId,
            confidence: data.confidence,
          },
        );
      } else {
        await this.systemLoggingService.warn(
          SystemLogCategory.XRAY_PROCESSING,
          `X-ray validation failed`,
          {
            xrayId: _xrayId,
            is_xray: data.is_xray,
            confidence: data.confidence,
          },
        );
      }

      return {
        isValid,
        error: isValid
          ? undefined
          : `Image validation failed: is_xray=${data.is_xray}, confidence=${data.confidence}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.systemLoggingService.error(
        SystemLogCategory.XRAY_PROCESSING,
        `X-ray validation failed with error`,
        error instanceof Error ? error : undefined,
        {
          xrayId: _xrayId,
          error: errorMessage,
          imageBase64Length: imageBase64?.length ?? 0,
        },
      );

      return {
        isValid: false,
        error: `X-ray validation failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Check if the ML service (Python API) is healthy and running
   * @returns Promise<boolean> - true if service is healthy, false otherwise
   */
  private async checkMLServiceHealth(): Promise<boolean> {
    try {
      const pythonApiUrl =
        process.env.PYTHON_API_URL !== undefined &&
        process.env.PYTHON_API_URL !== ''
          ? process.env.PYTHON_API_URL
          : 'http://localhost:5000';

      const response = await axios.get(`${pythonApiUrl}/health`, {
        timeout: 5000,
      });

      // If we get a successful response, the service is healthy
      if (response.status === 200) {
        await this.systemLoggingService.debug(
          SystemLogCategory.ML_INFERENCE,
          'ML service health check passed',
        );
        return true;
      }

      return false;
    } catch (error) {
      await this.systemLoggingService.warn(
        SystemLogCategory.ML_INFERENCE,
        `ML service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      return false;
    }
  }

  /**
   * Convert an uploaded image file to base64 string
   * @param file - The file object from file upload
   * @returns string - The base64 encoded image string
   */
  private fileToBase64(file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }): string {
    if (file === undefined || file === null || file.buffer === undefined) {
      throw new BadRequestException('Invalid file provided');
    }

    // Validate file MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/dicom',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Supported types: JPEG, PNG, DICOM`,
      );
    }

    // Convert buffer to base64
    return file.buffer.toString('base64');
  }

  /**
   * Validate if the provided base64 string represents a valid image (JPEG or PNG)
   * @param base64String - The base64 encoded string to validate
   * @returns boolean - true if valid image format, false otherwise
   */
  private isValidBase64ImageFormat(base64String: string): boolean {
    try {
      // Check if it's valid base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64String)) {
        return false;
      }

      // Decode and check file signatures (magic numbers)
      const binaryString = Buffer.from(base64String, 'base64').toString(
        'binary',
      );

      // JPEG signature: FF D8 FF
      const jpegSignature =
        binaryString.charCodeAt(0) === 0xff &&
        binaryString.charCodeAt(1) === 0xd8 &&
        binaryString.charCodeAt(2) === 0xff;

      // PNG signature: 89 50 4E 47 (89 PNG)
      const pngSignature =
        binaryString.charCodeAt(0) === 0x89 &&
        binaryString.charCodeAt(1) === 0x50 &&
        binaryString.charCodeAt(2) === 0x4e &&
        binaryString.charCodeAt(3) === 0x47;

      // DICOM signature: 'DICM' at position 128
      const dicomSignature =
        binaryString.length > 132 &&
        binaryString.charCodeAt(128) === 0x44 &&
        binaryString.charCodeAt(129) === 0x49 &&
        binaryString.charCodeAt(130) === 0x43 &&
        binaryString.charCodeAt(131) === 0x4d;

      return jpegSignature || pngSignature || dicomSignature;
    } catch {
      return false;
    }
  }

  private async performTBDiagnosis(
    patientId: string,
    xrayId: string,
    imageBase64: string,
  ): Promise<DiagnosisResult | null> {
    try {
      const pythonApiUrl =
        process.env.PYTHON_API_URL !== undefined &&
        process.env.PYTHON_API_URL !== ''
          ? process.env.PYTHON_API_URL
          : 'http://localhost:5000';

      // Log before sending to Flask
      await this.systemLoggingService.info(
        SystemLogCategory.ML_INFERENCE,
        `Sending Base64 X-ray to Flask ML model for TB classification`,
        {
          patientId,
          xrayId,
          imageBase64Length: imageBase64?.length ?? 0,
          mlServiceUrl: pythonApiUrl,
          endpoint: '/predict/tuberculosis',
        },
      );

      const startTime = Date.now();
      const response = await axios.post<{
        prediction: string;
        confidence: number;
        heatmap?: string;
        model?: string;
        affected_percentage?: number;
        affected_areas?: string;
      }>(
        `${pythonApiUrl}/predict/tuberculosis`,
        { image_base64: imageBase64 },
        { timeout: 90000 }, // Increased to 90 seconds for ML processing
      );
      const processingTimeMs = Date.now() - startTime;

      const { data } = response;

      // Log successful response from Flask
      await this.systemLoggingService.info(
        SystemLogCategory.ML_INFERENCE,
        `Successfully received TB diagnosis from Flask model`,
        {
          patientId,
          xrayId,
          prediction: data.prediction,
          confidence: data.confidence,
          processingTimeMs,
          hasHeatmap: data.heatmap !== null && data.heatmap !== undefined,
          heatmapLength: data.heatmap?.length ?? 0,
        },
      );

      let confidenceLevel: ConfidenceLevel;
      if (data.confidence < 0.5) confidenceLevel = ConfidenceLevel.LOW;
      else if (data.confidence < 0.75)
        confidenceLevel = ConfidenceLevel.MODERATE;
      else if (data.confidence < 0.9) confidenceLevel = ConfidenceLevel.HIGH;
      else confidenceLevel = ConfidenceLevel.VERY_HIGH;

      let tbIntensity = TBIntensity.NONE;
      if (
        data.prediction !== undefined &&
        data.prediction.toUpperCase().includes('TUBERCULOSIS')
      ) {
        const affected = data.affected_percentage ?? 0;
        if (affected < 10) tbIntensity = TBIntensity.MILD;
        else if (affected < 30) tbIntensity = TBIntensity.MODERATE;
        else if (affected < 60) tbIntensity = TBIntensity.SEVERE;
        else tbIntensity = TBIntensity.CRITICAL;
      }

      // Create diagnosis record with all Flask response data
      const diagnosis = this.diagnosisRepository.create({
        patientId,
        xrayId: xrayId,
        diseaseType: DiseaseType.TUBERCULOSIS,
        prediction: data.prediction,
        confidenceScore: data.confidence,
        confidenceLevel,
        tbIntensity,
        affectedPercentage: data.affected_percentage,
        affectedAreas: data.affected_areas,
        heatmapBase64: data.heatmap, // Flask returns 'heatmap' field
        modelName:
          data.model !== null && data.model !== undefined
            ? data.model
            : 'tb_classifier_v1',
        processingTimeMs,
        recommendations: this.generateRecommendations(
          data.prediction,
          tbIntensity,
        ),
      });

      const savedDiagnosis = await this.diagnosisRepository.save(diagnosis);

      // Log successful database storage
      await this.systemLoggingService.info(
        SystemLogCategory.ML_INFERENCE,
        `TB diagnosis results successfully stored in database`,
        {
          patientId,
          xrayId,
          diagnosisId: savedDiagnosis.id,
          prediction: savedDiagnosis.prediction,
          confidence: savedDiagnosis.confidenceScore,
          heatmapStored:
            savedDiagnosis.heatmapBase64 !== null &&
            savedDiagnosis.heatmapBase64 !== undefined,
        },
      );

      return savedDiagnosis;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.systemLoggingService.error(
        SystemLogCategory.ML_INFERENCE,
        `Failed to perform TB diagnosis for patient ${patientId}`,
        error instanceof Error ? error : undefined,
        {
          patientId,
          xrayId,
          error: errorMessage,
          imageBase64Length: imageBase64?.length ?? 0,
        },
      );

      return null;
    }
  }

  private generateRecommendations(
    prediction: string,
    tbIntensity: TBIntensity,
  ): string {
    if (
      prediction !== 'Tuberculosis' &&
      !prediction.toUpperCase().includes('TUBERCULOSIS')
    ) {
      return 'No TB detected. Continue routine monitoring. Advise patient on TB prevention.';
    }

    let recommendation = 'TB Risk Detected. ';

    switch (tbIntensity) {
      case TBIntensity.MILD:
        recommendation +=
          'Early stage TB suspected. Recommend immediate consultation with pulmonologist. Consider chest CT scan and sputum tests.';
        break;
      case TBIntensity.MODERATE:
        recommendation +=
          'Confirmed TB suspected with moderate lesions. Urgent consultation required. Recommend immediate anti-TB treatment initiation.';
        break;
      case TBIntensity.SEVERE:
        recommendation +=
          'Advanced TB suspected. Urgent intervention required. Hospitalization may be necessary. Refer to TB specialist immediately.';
        break;
      case TBIntensity.CRITICAL:
        recommendation +=
          'Severe TB detected. CRITICAL - Immediate hospitalization and intensive treatment required. Patient may be at high risk of complications.';
        break;
      default:
        recommendation +=
          'TB presence indicated. Contact TB specialist for next steps.';
    }

    return recommendation;
  }

  async findAll(user: User): Promise<Patient[]> {
    const query = this.patientsRepository.createQueryBuilder('patient');

    // Filter by physician if user is a physician
    // Use user.sub from JWT token (not user.id) for access control check
    const userId: string = (user as unknown as { sub: string }).sub || user.id;
    if (user.role === UserRole.PHYSICIAN) {
      query.where('patient.physicianId = :physicianId', {
        physicianId: userId,
      });
    }

    // Always load relations and ensure not deleted
    const results = await query
      .leftJoinAndSelect('patient.physician', 'physician')
      .leftJoinAndSelect('patient.xrays', 'xrays')
      .leftJoinAndSelect('patient.diagnosisResults', 'diagnosisResults')
      .andWhere('patient.deletedAt IS NULL')
      .orderBy('patient.createdAt', 'DESC') // Show newest patients first
      .getMany();

    return results;
  }

  async findById(id: string, user: User): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['physician', 'xrays', 'diagnosisResults'],
    });

    if (patient === null) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Use user.sub from JWT token (not user.id) for access control check
    const userId: string = (user as unknown as { sub: string }).sub || user.id;
    if (user.role === UserRole.PHYSICIAN && patient.physicianId !== userId) {
      throw new ForbiddenException('You can only view your own patients');
    }

    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
    user: User,
  ): Promise<Patient> {
    const patient = await this.findById(id, user);

    // Update patient basic information
    if (updatePatientDto.firstName != null) {
      patient.firstName = updatePatientDto.firstName;
    }
    if (updatePatientDto.lastName != null) {
      patient.lastName = updatePatientDto.lastName;
    }
    if (updatePatientDto.phone != null) {
      patient.phone = updatePatientDto.phone;
    }
    if (updatePatientDto.medicalHistory !== undefined)
      patient.medicalHistory = updatePatientDto.medicalHistory;
    if (updatePatientDto.allergies !== undefined)
      patient.allergies = updatePatientDto.allergies;
    if (updatePatientDto.medications !== undefined)
      patient.medications = updatePatientDto.medications;
    if (updatePatientDto.address !== undefined)
      patient.address = updatePatientDto.address;
    if (updatePatientDto.city != null) {
      patient.city = updatePatientDto.city;
    }
    if (updatePatientDto.state !== undefined)
      patient.state = updatePatientDto.state;
    if (updatePatientDto.postalCode !== undefined)
      patient.postalCode = updatePatientDto.postalCode;
    if (updatePatientDto.country !== undefined)
      patient.country = updatePatientDto.country;

    // Handle X-ray update if provided
    if (
      updatePatientDto.imageBase64 != null ||
      updatePatientDto.imageFile != null
    ) {
      await this.handleXrayUpdate(patient, updatePatientDto);
    }

    return await this.patientsRepository.save(patient);
  }

  private async handleXrayUpdate(
    patient: Patient,
    updatePatientDto: UpdatePatientDto,
  ): Promise<void> {
    try {
      // Convert image file to base64 if provided
      let imageBase64 = updatePatientDto.imageBase64;

      if (
        updatePatientDto.imageFile !== undefined &&
        updatePatientDto.imageFile !== null
      ) {
        imageBase64 = this.fileToBase64(updatePatientDto.imageFile);
      }

      // Validate base64 format
      if (imageBase64 != null && imageBase64 === '') {
        throw new BadRequestException('No X-ray image data provided');
      }

      const isValidBase64 = this.isValidBase64ImageFormat(imageBase64 ?? '');
      if (!isValidBase64) {
        throw new BadRequestException(
          'Invalid X-ray image format. Please ensure the image is a valid JPEG, PNG, or DICOM file.',
        );
      }

      if (imageBase64 != null && imageBase64.length < 100) {
        throw new BadRequestException(
          'Invalid X-ray image: base64 string too short',
        );
      }

      // Check ML service health
      const mlHealthy = await this.checkMLServiceHealth();
      if (!mlHealthy) {
        throw new BadRequestException(
          'ML model service is not available. Please try again later.',
        );
      }

      // Create X-ray record
      const xray = this.xraysRepository.create({
        patientId: patient.id,
        imageBase64: imageBase64 ?? '',
        fileName:
          updatePatientDto.fileName ?? `xray_${patient.id}_${Date.now()}.jpg`,
        xrayType: updatePatientDto.xrayType ?? 'Chest PA',
        notes: updatePatientDto.xrayNotes,
        status: XRayStatus.VALIDATING,
      });

      const savedXray = await this.xraysRepository.save(xray);

      // Validate X-ray
      const validationResult = await this.validateXray(
        savedXray.id,
        imageBase64 ?? '',
      );

      if (validationResult.isValid === false) {
        savedXray.status = XRayStatus.FAILED;
        savedXray.isValid = false;
        savedXray.validationError = validationResult.error ?? null;
        await this.xraysRepository.save(savedXray);

        // Update diagnosis to FAILED status
        const existingDiagnosis = await this.diagnosisRepository.findOne({
          where: { patientId: patient.id },
          order: { createdAt: 'DESC' },
        });

        if (existingDiagnosis) {
          existingDiagnosis.status = DiagnosisStatus.FAILED;
          existingDiagnosis.prediction = 'FAILED';
          existingDiagnosis.clinicalFindings =
            validationResult.error ?? 'X-ray validation failed';
          existingDiagnosis.recommendations =
            'Please upload a valid medical X-ray image';
          await this.diagnosisRepository.save(existingDiagnosis);
        }

        await this.systemLoggingService.warn(
          SystemLogCategory.XRAY_PROCESSING,
          `Invalid X-ray image for patient ${patient.id}: ${validationResult.error ?? 'Unknown error'}`,
          {
            patientId: patient.id,
            xrayId: savedXray.id,
          },
        );

        throw new BadRequestException(
          `Invalid X-ray image: ${validationResult.error ?? 'Unknown error'}`,
        );
      }

      // X-ray is valid - perform TB diagnosis
      const diagnosisResult = await this.performTBDiagnosis(
        patient.id,
        savedXray.id,
        imageBase64 ?? '',
      );

      savedXray.status = XRayStatus.COMPLETED;
      savedXray.isValid = true;
      await this.xraysRepository.save(savedXray);

      // Update existing diagnosis or create new one
      const existingDiagnosis = await this.diagnosisRepository.findOne({
        where: { patientId: patient.id },
        order: { createdAt: 'DESC' },
      });

      if (diagnosisResult !== null) {
        if (
          existingDiagnosis &&
          existingDiagnosis.status === DiagnosisStatus.PENDING
        ) {
          // Update the existing PENDING diagnosis
          Object.assign(existingDiagnosis, diagnosisResult);
          existingDiagnosis.status = DiagnosisStatus.UPDATED;
          existingDiagnosis.xrayId = savedXray.id;
          await this.diagnosisRepository.save(existingDiagnosis);
        }

        await this.systemLoggingService.info(
          SystemLogCategory.DIAGNOSIS,
          `TB diagnosis updated for patient ${patient.id}`,
          {
            patientId: patient.id,
            xrayId: savedXray.id,
            diagnosisId: diagnosisResult.id,
            prediction: diagnosisResult.prediction,
            confidence: diagnosisResult.confidenceScore,
          },
        );
      }

      await this.systemLoggingService.info(
        SystemLogCategory.PATIENT_MANAGEMENT,
        `Patient X-ray updated with valid image and TB diagnosis`,
        {
          patientId: patient.id,
          xrayId: savedXray.id,
        },
      );
    } catch (err) {
      await this.systemLoggingService.error(
        SystemLogCategory.PATIENT_MANAGEMENT,
        `Failed to update patient X-ray`,
        err instanceof Error ? err : undefined,
        {
          patientId: patient.id,
        },
      );

      throw new BadRequestException(
        `X-ray update failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  async delete(id: string, user: User): Promise<void> {
    const patient = await this.findById(id, user);
    patient.deletedAt = new Date();

    await this.patientsRepository.save(patient);
  }

  async getPatientsByPhysician(physicianId: string): Promise<Patient[]> {
    return await this.patientsRepository.find({
      where: { physicianId },
      relations: ['xrays'],
    });
  }

  /**
   * Resubmit failed X-ray for a patient
   * Allows re-uploading a new X-ray image when previous one failed validation
   * @param patientId - The patient ID
   * @param imageBase64 - The new X-ray image in base64 format
   * @param user - The authenticated user
   * @returns Patient with updated X-ray and diagnosis
   */
  async resubmitXray(
    patientId: string,
    imageBase64: string,
    user: User,
  ): Promise<Patient> {
    // Verify patient access
    const patient = await this.findById(patientId, user);

    if (patient === undefined || patient === null) {
      throw new NotFoundException(`Patient with id ${patientId} not found`);
    }

    // Check if patient has failed X-rays
    const failedXrays = await this.xraysRepository.find({
      where: { patientId, status: XRayStatus.FAILED },
      order: { createdAt: 'DESC' },
    });

    let xrayToProcess: XRay;

    if (failedXrays.length > 0) {
      // Resubmit existing failed X-ray
      const failedXray = failedXrays[0];

      if (failedXray === undefined || failedXray === null) {
        throw new BadRequestException(
          'Failed to retrieve X-ray record for resubmission',
        );
      }

      xrayToProcess = failedXray;
    } else {
      // Create new X-ray for patient with no X-rays
      xrayToProcess = this.xraysRepository.create({
        patientId,
        imageBase64: imageBase64,
        fileName: `xray_${patientId}_${Date.now()}.jpg`,
        xrayType: 'Chest PA',
        status: XRayStatus.VALIDATING,
      });

      await this.xraysRepository.save(xrayToProcess);
    }

    // Validate the X-ray image
    const validationResult = await this.validateXray(
      xrayToProcess.id,
      imageBase64,
    );

    // Update the X-ray record with new data
    xrayToProcess.imageBase64 = imageBase64;
    xrayToProcess.status = XRayStatus.VALIDATING;
    xrayToProcess.validationError = null;
    xrayToProcess.isValid = false;
    xrayToProcess.patientId = patientId; // Ensure patientId is always set

    const updatedXray = await this.xraysRepository.save(xrayToProcess);

    // If validation fails, mark as failed and update diagnosis
    if (validationResult.isValid === false) {
      updatedXray.status = XRayStatus.FAILED;
      updatedXray.isValid = false;
      updatedXray.validationError = validationResult.error ?? null;
      await this.xraysRepository.save(updatedXray);

      // Update diagnosis to FAILED
      const diagnosis = await this.diagnosisRepository.findOne({
        where: { xrayId: updatedXray.id },
      });

      if (diagnosis !== null && diagnosis !== undefined) {
        diagnosis.status = DiagnosisStatus.FAILED;
        diagnosis.prediction = 'FAILED';
        diagnosis.clinicalFindings =
          validationResult.error ?? 'X-ray validation failed';
        diagnosis.recommendations = 'Please upload a valid medical X-ray image';
        await this.diagnosisRepository.save(diagnosis);
      }

      await this.systemLoggingService.warn(
        SystemLogCategory.XRAY_PROCESSING,
        `X-ray resubmission failed validation for patient ${patientId}`,
        {
          patientId,
          xrayId: updatedXray.id,
          error: validationResult.error,
        },
      );

      throw new BadRequestException(
        `Invalid X-ray image: ${validationResult.error ?? 'Unknown error'}`,
      );
    }

    // Validation passed - perform TB diagnosis
    const diagnosisResult = await this.performTBDiagnosis(
      patientId,
      updatedXray.id,
      imageBase64,
    );

    // Mark X-ray as completed
    updatedXray.status = XRayStatus.COMPLETED;
    updatedXray.isValid = true;
    await this.xraysRepository.save(updatedXray);

    // Update or create diagnosis record
    const diagnosis = await this.diagnosisRepository.findOne({
      where: { xrayId: updatedXray.id },
    });

    if (
      diagnosis !== null &&
      diagnosis !== undefined &&
      diagnosisResult !== null
    ) {
      Object.assign(diagnosis, diagnosisResult);
      diagnosis.status = DiagnosisStatus.COMPLETED;
      diagnosis.xrayId = updatedXray.id;
      await this.diagnosisRepository.save(diagnosis);
    } else if (diagnosisResult !== null && diagnosisResult !== undefined) {
      // Create new diagnosis if none exists
      const newDiagnosis = this.diagnosisRepository.create({
        ...diagnosisResult,
        patientId,
        xrayId: updatedXray.id,
        status: DiagnosisStatus.COMPLETED,
      });
      await this.diagnosisRepository.save(newDiagnosis);
    }

    await this.systemLoggingService.info(
      SystemLogCategory.XRAY_PROCESSING,
      `X-ray resubmission successful for patient ${patientId}`,
      {
        patientId,
        xrayId: updatedXray.id,
        prediction: diagnosisResult?.prediction ?? 'UNKNOWN',
        confidence: diagnosisResult?.confidenceScore ?? 0,
      },
    );

    // Return updated patient with all relations
    return await this.findById(patientId, user);
  }

  /**
   * Trigger TB diagnosis analysis on an existing X-ray that has Base64 data
   * but analysis failed or hasn't been performed yet
   */
  async triggerXrayAnalysis(
    patientId: string,
    xrayId: string,
    user: User,
  ): Promise<Patient> {
    // Verify patient access (includes access control check)
    const patient = await this.findById(patientId, user);

    if (patient === undefined || patient === null) {
      throw new NotFoundException('Patient not found');
    }

    // Get the X-ray record
    const xray = await this.xraysRepository.findOne({
      where: { id: xrayId, patientId },
    });

    if (xray === null || xray === undefined) {
      throw new NotFoundException('X-ray not found for this patient');
    }

    // Check if X-ray has Base64 data
    if (
      xray.imageBase64 === null ||
      xray.imageBase64 === undefined ||
      xray.imageBase64.length === 0
    ) {
      throw new BadRequestException(
        'X-ray does not have stored image data. Please resubmit with an image file.',
      );
    }

    // Set X-ray status to VALIDATING
    xray.status = XRayStatus.VALIDATING;
    xray.validationError = null;
    await this.xraysRepository.save(xray);

    // Validate X-ray
    const validationResult = await this.validateXray(xray.id, xray.imageBase64);

    if (validationResult.isValid === false) {
      xray.status = XRayStatus.FAILED;
      xray.isValid = false;
      xray.validationError = validationResult.error ?? null;
      await this.xraysRepository.save(xray);

      // Update or create diagnosis with FAILED status
      let diagnosis = await this.diagnosisRepository.findOne({
        where: { xrayId },
      });

      if (diagnosis !== null && diagnosis !== undefined) {
        diagnosis.status = DiagnosisStatus.FAILED;
        diagnosis.prediction = 'FAILED';
        diagnosis.clinicalFindings =
          validationResult.error ?? 'X-ray validation failed';
      } else {
        diagnosis = this.diagnosisRepository.create({
          patientId,
          xrayId,
          diseaseType: DiseaseType.TUBERCULOSIS,
          prediction: 'FAILED',
          confidenceScore: 0,
          confidenceLevel: ConfidenceLevel.LOW,
          tbIntensity: TBIntensity.NONE,
          status: DiagnosisStatus.FAILED,
          clinicalFindings: `X-ray validation failed: ${validationResult.error ?? 'Unknown error'}`,
          recommendations:
            'Please resubmit with a valid JPEG, PNG, or DICOM X-ray image',
        });
      }

      await this.diagnosisRepository.save(diagnosis);

      await this.systemLoggingService.warn(
        SystemLogCategory.ML_INFERENCE,
        `X-ray analysis failed validation for patient ${patientId}`,
        {
          patientId,
          xrayId,
          error: validationResult.error,
        },
      );

      throw new BadRequestException(
        `X-ray validation failed: ${validationResult.error ?? 'Unknown error'}`,
      );
    }

    // Validation passed - perform TB diagnosis
    const diagnosisResult = await this.performTBDiagnosis(
      patientId,
      xray.id,
      xray.imageBase64,
    );

    // Mark X-ray as completed
    xray.status = XRayStatus.COMPLETED;
    xray.isValid = true;
    await this.xraysRepository.save(xray);

    // Update or create diagnosis record
    const diagnosis = await this.diagnosisRepository.findOne({
      where: { xrayId },
    });

    if (diagnosis !== null && diagnosis !== undefined) {
      // Update existing diagnosis
      const updatedDiagnosis = {
        ...diagnosis,
        ...diagnosisResult,
        status: DiagnosisStatus.COMPLETED,
        xrayId: xray.id,
      };
      Object.assign(diagnosis, updatedDiagnosis);
      await this.diagnosisRepository.save(diagnosis);
    } else if (diagnosisResult !== null && diagnosisResult !== undefined) {
      // Create new diagnosis if none exists
      const newDiagnosis = this.diagnosisRepository.create({
        ...diagnosisResult,
        patientId,
        xrayId: xray.id,
        status: DiagnosisStatus.COMPLETED,
      });
      await this.diagnosisRepository.save(newDiagnosis);
    }

    await this.systemLoggingService.info(
      SystemLogCategory.ML_INFERENCE,
      `TB analysis triggered successfully for patient ${patientId}`,
      {
        patientId,
        xrayId,
        prediction: diagnosisResult?.prediction ?? 'UNKNOWN',
        confidence: diagnosisResult?.confidenceScore ?? 0,
      },
    );

    // Return updated patient with all relations
    return await this.findById(patientId, user);
  }
}
