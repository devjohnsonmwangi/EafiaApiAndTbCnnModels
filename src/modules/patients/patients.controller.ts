import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  Request as NestRequest,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientResponseDto,
} from './patient.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import {
  ResponseFormatter,
  ApiResponse,
} from '../../common/utils/response.formatter';

type MultipartFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

/**
 * Interface to define the user attached to the request.
 * Includes 'sub' which is typically the user ID in JWT payloads.
 */
interface AuthenticatedRequest extends Request {
  user: User & { sub: string };
  file?: MultipartFile;
}

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('imageFile', { limits: { fileSize: 50 * 1024 * 1024 } }),
  ) // 50MB limit
  @ApiOperation({ summary: 'Register a new patient with X-ray image' })
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<PatientResponseDto>> {
    try {
      // Attach the uploaded file to the DTO if present
      if (req.file !== undefined) {
        createPatientDto.imageFile = req.file;
      }

      // X-ray is now optional, but provide meaningful feedback
      const hasXrayData =
        (createPatientDto.imageBase64 !== undefined &&
          createPatientDto.imageBase64 !== '') ||
        createPatientDto.imageFile !== undefined;

      const patient = await this.patientsService.create(
        createPatientDto,
        req.user.sub,
      );

      // Fetch complete patient data with all relations
      const completePatient = await this.patientsService.findById(
        patient.id,
        req.user,
      );

      const message = hasXrayData
        ? `Patient registered successfully with X-ray validation`
        : `Patient registered successfully. X-ray can be uploaded later`;

      return ResponseFormatter.created(
        message,
        completePatient as unknown as PatientResponseDto,
      );
    } catch (error) {
      return ResponseFormatter.badRequest(
        error instanceof Error ? error.message : 'Failed to create patient',
      ) as unknown as ApiResponse<PatientResponseDto>;
    }
  }

  @Get()
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all patients (physicians see own, admins see all)',
  })
  async findAll(
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<PatientResponseDto[]>> {
    try {
      const patients = await this.patientsService.findAll(req.user);
      return ResponseFormatter.success(
        'Patients retrieved successfully',
        patients as unknown as PatientResponseDto[],
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.internalError(
        error instanceof Error ? error.message : 'Failed to retrieve patients',
      ) as unknown as ApiResponse<PatientResponseDto[]>;
    }
  }

  @Get(':id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get patient by ID' })
  async findById(
    @Param('id') id: string,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<PatientResponseDto>> {
    try {
      const patient = await this.patientsService.findById(id, req.user);
      return ResponseFormatter.success(
        'Patient retrieved successfully',
        patient as unknown as PatientResponseDto,
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseFormatter.notFound(
          error.message,
        ) as unknown as ApiResponse<PatientResponseDto>;
      }
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access denied',
      ) as unknown as ApiResponse<PatientResponseDto>;
    }
  }

  @Put(':id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('imageFile'))
  @ApiOperation({
    summary: 'Update patient information and optionally add/update X-ray',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<PatientResponseDto>> {
    try {
      // Handle file upload if provided
      if (req.file) {
        updatePatientDto.imageFile = req.file;
      }

      const patient = await this.patientsService.update(
        id,
        updatePatientDto,
        req.user,
      );
      return ResponseFormatter.success(
        'Patient updated successfully',
        patient as unknown as PatientResponseDto,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access denied',
      ) as unknown as ApiResponse<PatientResponseDto>;
    }
  }

  @Delete(':id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete patient record' })
  async delete(
    @Param('id') id: string,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.patientsService.delete(id, req.user);
      return ResponseFormatter.success(
        'Patient deleted successfully',
        { message: 'Patient deleted' },
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access denied',
      ) as unknown as ApiResponse<{ message: string }>;
    }
  }

  @Post(':patientId/xrays/resubmit')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('imageFile', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  @ApiOperation({
    summary: 'Resubmit failed X-ray for a patient with new image',
  })
  async resubmitXray(
    @Param('patientId') patientId: string,
    @Body() body: { imageBase64?: string },
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<PatientResponseDto>> {
    try {
      let imageBase64 = body.imageBase64;

      // Convert uploaded file to base64 if provided
      if (req.file !== undefined) {
        imageBase64 = req.file.buffer.toString('base64');
      }

      if (
        imageBase64 === undefined ||
        imageBase64 === null ||
        imageBase64.trim().length === 0
      ) {
        return ResponseFormatter.badRequest(
          'X-ray image (imageBase64 or file) is required for resubmission',
        ) as unknown as ApiResponse<PatientResponseDto>;
      }

      const patient = await this.patientsService.resubmitXray(
        patientId,
        imageBase64,
        req.user,
      );

      return ResponseFormatter.success(
        'X-ray resubmission successful. TB diagnosis completed.',
        patient as unknown as PatientResponseDto,
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseFormatter.notFound(
          error.message,
        ) as unknown as ApiResponse<PatientResponseDto>;
      }
      return ResponseFormatter.badRequest(
        error instanceof Error ? error.message : 'Failed to resubmit X-ray',
      ) as unknown as ApiResponse<PatientResponseDto>;
    }
  }

  @Post(':patientId/xrays/:xrayId/trigger-analysis')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Trigger TB diagnosis analysis on an existing stored X-ray',
  })
  async triggerXrayAnalysis(
    @Param('patientId') patientId: string,
    @Param('xrayId') xrayId: string,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<PatientResponseDto>> {
    try {
      const patient = await this.patientsService.triggerXrayAnalysis(
        patientId,
        xrayId,
        req.user,
      );

      return ResponseFormatter.success(
        'X-ray analysis triggered successfully. TB diagnosis completed.',
        patient as unknown as PatientResponseDto,
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseFormatter.notFound(
          error.message,
        ) as unknown as ApiResponse<PatientResponseDto>;
      }
      return ResponseFormatter.badRequest(
        error instanceof Error
          ? error.message
          : 'Failed to trigger X-ray analysis',
      ) as unknown as ApiResponse<PatientResponseDto>;
    }
  }
}
