import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosisResult } from './diagnosis-result.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateDiagnosisResultDto } from './diagnosis-result.dto';

@Injectable()
export class DiagnosisResultsService {
  constructor(
    @InjectRepository(DiagnosisResult)
    private readonly diagnosisRepository: Repository<DiagnosisResult>,
  ) {}

  async create(
    createDto: CreateDiagnosisResultDto,
    _user: User,
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

    return await this.diagnosisRepository.save(diagnosis);
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
