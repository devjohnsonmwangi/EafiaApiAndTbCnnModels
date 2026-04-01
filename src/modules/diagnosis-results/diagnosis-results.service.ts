import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosisResult } from './diagnosis-result.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateDiagnosisResultDto } from './diagnosis-result.dto';
import { TbWorkflowService } from '../tb-workflow/tb-workflow.service';
import { PatientsService } from '../patients/patients.service';

@Injectable()
export class DiagnosisResultsService {
  private readonly logger = new Logger(DiagnosisResultsService.name);

  constructor(
    @InjectRepository(DiagnosisResult)
    private readonly diagnosisRepository: Repository<DiagnosisResult>,
    private readonly tbWorkflowService: TbWorkflowService,
    private readonly patientsService: PatientsService,
  ) {}

  async create(
    createDto: CreateDiagnosisResultDto,
    user: User,
    clientIp: string,
  ): Promise<DiagnosisResult> {
    const diagnosis = this.diagnosisRepository.create({
      patientId: createDto.patientId,
      xrayId: createDto.xrayId,
      diseaseType: createDto.diseaseType,
      prediction: createDto.prediction,
      confidenceScore: createDto.confidenceScore,
      confidenceLevel: createDto.confidenceLevel,
      tbIntensity: createDto.tbIntensity,
      affectedAreas: createDto.affectedAreas,
      affectedPercentage: createDto.affectedPercentage,
      heatmapBase64: createDto.heatmapBase64,
      clinicalFindings: createDto.clinicalFindings,
      recommendations: createDto.recommendations,
      modelName: createDto.modelName,
      processingTimeMs: createDto.processingTimeMs,
      deviceIpAddress: clientIp,
    });

    const savedDiagnosis = await this.diagnosisRepository.save(diagnosis);

    // Trigger TB workflow if diagnosis is TB-positive
    try {
      if (
        createDto.prediction?.toUpperCase() === 'TUBERCULOSIS' ||
        createDto.prediction === 'Tuberculosis'
      ) {
        this.logger.log(
          `TB-positive diagnosis detected for patient ${createDto.patientId}`,
        );

        const patient = await this.patientsService.findById(
          createDto.patientId,
          user,
        );

        // Get the physician from the patient or from the current user
        const physician =
          user.role === UserRole.PHYSICIAN ? user : (patient.physician ?? user);

        await this.tbWorkflowService.executeTBPositiveWorkflow(
          savedDiagnosis,
          patient,
          physician,
        );

        this.logger.log(
          `TB workflow executed successfully for patient ${createDto.patientId}`,
        );
      } else if (
        createDto.prediction?.toUpperCase() === 'NORMAL' ||
        createDto.prediction === 'Normal'
      ) {
        const patient = await this.patientsService.findById(
          createDto.patientId,
          user,
        );
        await this.tbWorkflowService.executeTBNegativeWorkflow(
          savedDiagnosis,
          patient,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error executing TB workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - the diagnosis was already saved
      // Log the error but allow the diagnosis result to be returned
    }

    return savedDiagnosis;
  }

  async findAll(user: User): Promise<DiagnosisResult[]> {
    const query = this.diagnosisRepository.createQueryBuilder('diagnosis');

    if (user.role === UserRole.PHYSICIAN) {
      query
        .innerJoin('diagnosis.patient', 'patient')
        .where('patient.physicianId = :physicianId', {
          physicianId: user.id,
        });
    }

    return query.orderBy('diagnosis.createdAt', 'DESC').getMany();
  }

  async findById(id: string, user: User): Promise<DiagnosisResult> {
    const result = await this.diagnosisRepository.findOne({
      where: { id },
      relations: ['patient', 'xray'],
    });

    // Fixed: Explicit null check for strict-boolean-expressions
    if (result === null) {
      throw new NotFoundException('Diagnosis result not found');
    }

    if (
      user.role === UserRole.PHYSICIAN &&
      result.patient.physicianId !== user.id
    ) {
      throw new ForbiddenException('You can only view your patients diagnoses');
    }

    return result;
  }

  async findByPatientId(
    patientId: string,
    user: User,
  ): Promise<DiagnosisResult[]> {
    const query = this.diagnosisRepository
      .createQueryBuilder('diagnosis')
      .where('diagnosis.patientId = :patientId', {
        patientId,
      });

    if (user.role === UserRole.PHYSICIAN) {
      query
        .innerJoin('diagnosis.patient', 'patient')
        .andWhere('patient.physicianId = :physicianId', {
          physicianId: user.id,
        });
    }

    return query.orderBy('diagnosis.createdAt', 'DESC').getMany();
  }

  async findByXRayId(xrayId: string, user: User): Promise<DiagnosisResult[]> {
    const query = this.diagnosisRepository
      .createQueryBuilder('diagnosis')
      .where('diagnosis.xrayId = :xrayId', {
        xrayId,
      });

    if (user.role === UserRole.PHYSICIAN) {
      query
        .innerJoin('diagnosis.patient', 'patient')
        .andWhere('patient.physicianId = :physicianId', {
          physicianId: user.id,
        });
    }

    return query.getMany();
  }

  async delete(id: string, user: User): Promise<void> {
    const result = await this.findById(id, user);

    result.deletedAt = new Date();

    await this.diagnosisRepository.save(result);
  }
}
