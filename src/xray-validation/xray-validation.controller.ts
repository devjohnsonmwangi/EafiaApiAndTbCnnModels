import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  XrayValidationService,
  XrayValidationResult,
} from './xray-validation.service';
import {
  ImageInputDto,
  XrayValidationResponseDto,
} from '../common/dtos/image.dto';

@Controller('validation')
export class XrayValidationController {
  constructor(private readonly xrayValidationService: XrayValidationService) {}

  @Post('xray')
  async validateXray(
    @Body() imageInput: ImageInputDto,
  ): Promise<XrayValidationResponseDto> {
    try {
      const result: XrayValidationResult =
        await this.xrayValidationService.validateXray(imageInput.image_base64);

      if (!result.is_valid) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            is_valid: false,
            is_xray: result.is_xray,
            prediction: result.prediction,
            confidence: result.confidence,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        is_valid: result.is_valid,
        is_xray: result.is_xray,
        prediction: result.prediction,
        confidence: result.confidence,
        heatmap_base64: result.heatmap_base64,
        message: result.message,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'X-ray validation failed';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
