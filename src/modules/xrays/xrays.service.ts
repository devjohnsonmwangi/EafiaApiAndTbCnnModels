import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XRay, XRayStatus } from './xray.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateXRayDto, UpdateXRayDto } from './xray.dto';
import axios from 'axios';

/**
 * Interface for the Python validation API response
 */
interface XRayValidationResponse {
  is_xray: boolean;
  confidence: number;
}

@Injectable()
export class XRaysService {
  constructor(
    @InjectRepository(XRay)
    private readonly xraysRepository: Repository<XRay>,
  ) {}

  async create(
    createXRayDto: CreateXRayDto,
    _user: User,
    clientIp: string,
  ): Promise<XRay> {
    const xray = this.xraysRepository.create({
      ...createXRayDto,
      status: XRayStatus.PENDING,
      deviceIpAddress: clientIp,
    });

    const saved = await this.xraysRepository.save(xray);

    // Validate X-ray asynchronously
    // Fixed: changed _err: any to _err: unknown
    this.validateXray(saved.id, createXRayDto.imageBase64).catch(
      (_err: unknown) => {
        // Async validation error - logged silently or use a Logger
      },
    );

    return saved;
  }

  private async validateXray(
    xrayId: string,
    imageBase64: string,
  ): Promise<void> {
    try {
      const xray = await this.xraysRepository.findOne({
        where: { id: xrayId },
      });
      if (xray === null) return;

      xray.status = XRayStatus.VALIDATING;
      await this.xraysRepository.save(xray);

      // Use PYTHON_API_URL with fallback to ML_SERVICE_URL, then default
      const apiUrl =
        process.env.PYTHON_API_URL !== undefined &&
        process.env.PYTHON_API_URL !== ''
          ? process.env.PYTHON_API_URL
          : (process.env.ML_SERVICE_URL ?? 'http://localhost:5000');

      // Fixed: Added generic type to axios.post to remove 'any' from response.data
      const { data } = await axios.post<XRayValidationResponse>(
        `${apiUrl}/predict/xray_validation`,
        { image_base_64: imageBase64 },
        { timeout: 30000 },
      );

      // Fixed: Explicit boolean comparisons for strict-boolean-expressions
      xray.isValid = data.is_xray;
      xray.validationConfidence = data.confidence;
      xray.status =
        data.is_xray === true ? XRayStatus.PROCESSING : XRayStatus.FAILED;

      if (data.is_xray === false) {
        xray.validationError = 'Not a valid medical X-ray image';
      }

      await this.xraysRepository.save(xray);
    } catch (error) {
      const xray = await this.xraysRepository.findOne({
        where: { id: xrayId },
      });
      if (xray === null) return;

      xray.status = XRayStatus.FAILED;
      xray.validationError =
        error instanceof Error ? error.message : 'Unknown validation error';

      await this.xraysRepository.save(xray);
    }
  }

  async findAll(user: User): Promise<XRay[]> {
    const query = this.xraysRepository.createQueryBuilder('xray');

    if (user.role === UserRole.PHYSICIAN) {
      query
        .innerJoin('xray.patient', 'patient')
        .where('patient.physicianId = :physicianId', {
          physicianId: user.id,
        });
    }

    return query.orderBy('xray.createdAt', 'DESC').getMany();
  }

  async findById(id: string, user: User): Promise<XRay> {
    const xray = await this.xraysRepository.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (xray === null) throw new NotFoundException('X-ray not found');

    if (
      user.role === UserRole.PHYSICIAN &&
      xray.patient.physicianId !== user.id
    ) {
      throw new ForbiddenException("You can only view your patients's X-rays");
    }

    return xray;
  }

  async update(
    id: string,
    updateXRayDto: UpdateXRayDto,
    user: User,
  ): Promise<XRay> {
    const xray = await this.findById(id, user);
    Object.assign(xray, updateXRayDto);

    return await this.xraysRepository.save(xray);
  }

  async delete(id: string, user: User): Promise<void> {
    const xray = await this.findById(id, user);
    xray.deletedAt = new Date();
    await this.xraysRepository.save(xray);
  }

  async findByPatientId(patientId: string, user: User): Promise<XRay[]> {
    const query = this.xraysRepository
      .createQueryBuilder('xray')
      .where('xray.patientId = :patientId', { patientId });

    if (user.role === UserRole.PHYSICIAN) {
      query
        .innerJoin('xray.patient', 'patient')
        .andWhere('patient.physicianId = :physicianId', {
          physicianId: user.id,
        });
    }

    return query.getMany();
  }
}
