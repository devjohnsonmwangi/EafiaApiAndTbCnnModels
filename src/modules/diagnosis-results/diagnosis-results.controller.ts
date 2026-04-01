import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DiagnosisResultsService } from './diagnosis-results.service';
import {
  CreateDiagnosisResultDto,
  DiagnosisResultResponseDto,
} from './diagnosis-result.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClientIp } from '../../common/decorators';
import { User, UserRole } from '../users/user.entity';
import {
  ResponseFormatter,
  ApiResponse,
} from '../../common/utils/response.formatter';

interface AuthorizedRequest extends ExpressRequest {
  user: User;
}

@ApiTags('Diagnosis Results')
@Controller('diagnosis-results')
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class DiagnosisResultsController {
  constructor(private diagnosisService: DiagnosisResultsService) {}

  @Post()
  @ApiOperation({ summary: 'Create diagnosis result from API' })
  async create(
    @Body() createDto: CreateDiagnosisResultDto,
    @Request() req: AuthorizedRequest,
    @ClientIp() clientIp: string,
  ): Promise<ApiResponse<DiagnosisResultResponseDto | null>> {
    const startTime = Date.now();
    try {
      const diagnosis = await this.diagnosisService.create(
        createDto,
        req.user,
        clientIp,
      );
      const processingTimeMs = Date.now() - startTime;
      return ResponseFormatter.created(
        'Diagnosis result recorded successfully',
        diagnosis as DiagnosisResultResponseDto,
        processingTimeMs,
      );
    } catch (error) {
      return ResponseFormatter.badRequest(
        error instanceof Error ? error.message : 'Failed to create diagnosis',
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all diagnosis results' })
  async findAll(
    @Request() req: AuthorizedRequest,
  ): Promise<ApiResponse<DiagnosisResultResponseDto[] | null>> {
    const startTime = Date.now();
    try {
      const results = await this.diagnosisService.findAll(req.user);
      const processingTimeMs = Date.now() - startTime;
      return ResponseFormatter.success(
        'Diagnosis results retrieved successfully',
        results as DiagnosisResultResponseDto[],
        HttpStatus.OK,
        processingTimeMs,
      );
    } catch (error) {
      return ResponseFormatter.internalError(
        error instanceof Error ? error.message : 'Failed to retrieve diagnosis',
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get diagnosis result by ID' })
  async findById(
    @Param('id') id: string,
    @Request() req: AuthorizedRequest,
  ): Promise<ApiResponse<DiagnosisResultResponseDto | null>> {
    const startTime = Date.now();
    try {
      const diagnosis = await this.diagnosisService.findById(id, req.user);
      const processingTimeMs = Date.now() - startTime;
      return ResponseFormatter.success(
        'Diagnosis result retrieved successfully',
        diagnosis as DiagnosisResultResponseDto,
        HttpStatus.OK,
        processingTimeMs,
      );
    } catch (error) {
      return ResponseFormatter.notFound(
        error instanceof Error ? error.message : 'Diagnosis result not found',
      );
    }
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all diagnosis results for a patient' })
  async findByPatientId(
    @Param('patientId') patientId: string,
    @Request() req: AuthorizedRequest,
  ): Promise<ApiResponse<DiagnosisResultResponseDto[] | null>> {
    const startTime = Date.now();
    try {
      const results = await this.diagnosisService.findByPatientId(
        patientId,
        req.user,
      );
      const processingTimeMs = Date.now() - startTime;
      return ResponseFormatter.success(
        'Patient diagnosis results retrieved successfully',
        results as DiagnosisResultResponseDto[],
        HttpStatus.OK,
        processingTimeMs,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access forbidden',
      );
    }
  }

  @Get('xray/:xrayId')
  @ApiOperation({ summary: 'Get diagnosis results for an X-ray' })
  async findByXRayId(
    @Param('xrayId') xrayId: string,
    @Request() req: AuthorizedRequest,
  ): Promise<ApiResponse<DiagnosisResultResponseDto[] | null>> {
    const startTime = Date.now();
    try {
      const results = await this.diagnosisService.findByXRayId(
        xrayId,
        req.user,
      );
      const processingTimeMs = Date.now() - startTime;
      return ResponseFormatter.success(
        'X-ray diagnosis results retrieved successfully',
        results as DiagnosisResultResponseDto[],
        HttpStatus.OK,
        processingTimeMs,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access forbidden',
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete diagnosis result' })
  async delete(
    @Param('id') id: string,
    @Request() req: AuthorizedRequest,
  ): Promise<ApiResponse<{ message: string } | null>> {
    const startTime = Date.now();
    try {
      await this.diagnosisService.delete(id, req.user);
      const processingTimeMs = Date.now() - startTime;
      return ResponseFormatter.success(
        'Diagnosis result deleted successfully',
        { message: 'Deleted' },
        HttpStatus.OK,
        processingTimeMs,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access forbidden',
      );
    }
  }
}
