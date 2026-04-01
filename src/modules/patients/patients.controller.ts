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
  BadRequestException,
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

      // Validate that at least one image source is provided
      if (
        (createPatientDto.imageBase64 === undefined ||
          createPatientDto.imageBase64 === '') &&
        !createPatientDto.imageFile
      ) {
        throw new BadRequestException(
          'Either imageBase64 (JSON) or imageFile (multipart file) is required',
        );
      }

      const patient = await this.patientsService.create(
        createPatientDto,
        req.user.sub,
      );
      return ResponseFormatter.created(
        `Patient registered successfully with X-ray validation`,
        patient as unknown as PatientResponseDto,
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
}
