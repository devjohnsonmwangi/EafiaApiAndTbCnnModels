import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  Request as NestRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { XRaysService } from './xrays.service';
import { CreateXRayDto, UpdateXRayDto, XRayResponseDto } from './xray.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClientIp } from '../../common/decorators';
import { User, UserRole } from '../users/user.entity'; // Import User entity
import {
  ResponseFormatter,
  ApiResponse,
} from '../../common/utils/response.formatter';

// Define the request to include the actual User entity
interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('X-Rays')
@Controller('xrays')
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class XRaysController {
  constructor(private xraysService: XRaysService) {}

  @Post()
  @ApiOperation({ summary: 'Upload new X-ray image' })
  async create(
    @Body() createXRayDto: CreateXRayDto,
    @NestRequest() req: AuthenticatedRequest,
    @ClientIp() clientIp: string,
  ): Promise<ApiResponse<XRayResponseDto>> {
    try {
      const xray = await this.xraysService.create(
        createXRayDto,
        req.user,
        clientIp,
      );
      return ResponseFormatter.created(
        'X-ray uploaded successfully. Validation in progress...',
        xray as unknown as XRayResponseDto,
      );
    } catch (error) {
      return ResponseFormatter.badRequest(
        error instanceof Error ? error.message : 'Failed to upload X-ray',
      ) as unknown as ApiResponse<XRayResponseDto>;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all X-rays' })
  async findAll(
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<XRayResponseDto[]>> {
    try {
      const xrays = await this.xraysService.findAll(req.user);
      return ResponseFormatter.success(
        'X-rays retrieved successfully',
        xrays as unknown as XRayResponseDto[],
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.internalError(
        error instanceof Error ? error.message : 'Failed to retrieve X-rays',
      ) as unknown as ApiResponse<XRayResponseDto[]>;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get X-ray by ID' })
  async findById(
    @Param('id') id: string,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<XRayResponseDto>> {
    try {
      const xray = await this.xraysService.findById(id, req.user);
      return ResponseFormatter.success(
        'X-ray retrieved successfully',
        xray as unknown as XRayResponseDto,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.notFound(
        error instanceof Error ? error.message : 'X-ray not found',
      ) as unknown as ApiResponse<XRayResponseDto>;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update X-ray information' })
  async update(
    @Param('id') id: string,
    @Body() updateXRayDto: UpdateXRayDto,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<XRayResponseDto>> {
    try {
      const xray = await this.xraysService.update(id, updateXRayDto, req.user);
      return ResponseFormatter.success(
        'X-ray updated successfully',
        xray as unknown as XRayResponseDto,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access denied',
      ) as unknown as ApiResponse<XRayResponseDto>;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete X-ray' })
  async delete(
    @Param('id') id: string,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.xraysService.delete(id, req.user);
      return ResponseFormatter.success(
        'X-ray deleted successfully',
        { message: 'X-ray deleted' },
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access denied',
      ) as unknown as ApiResponse<{ message: string }>;
    }
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all X-rays for a patient' })
  async findByPatientId(
    @Param('patientId') patientId: string,
    @NestRequest() req: AuthenticatedRequest,
  ): Promise<ApiResponse<XRayResponseDto[]>> {
    try {
      const xrays = await this.xraysService.findByPatientId(
        patientId,
        req.user,
      );
      return ResponseFormatter.success(
        'Patient X-rays retrieved successfully',
        xrays as unknown as XRayResponseDto[],
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseFormatter.forbidden(
        error instanceof Error ? error.message : 'Access denied',
      ) as unknown as ApiResponse<XRayResponseDto[]>;
    }
  }
}
