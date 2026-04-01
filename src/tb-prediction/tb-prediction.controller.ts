import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TbPredictionService } from './tb-prediction.service';
import {
  ImageInputDto,
  TbPredictionResponseDto,
} from '../common/dtos/image.dto';

/**
 * Local interface to define the Multer file structure.
 * This fixes the namespace resolution and decorator metadata errors.
 */
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('predict')
export class TbPredictionController {
  constructor(private readonly tbPredictionService: TbPredictionService) {}

  /**
   * Predict TB from base64 encoded image
   */
  @Post('tb/base64')
  async predictTBFromBase64(
    @Body() imageInput: ImageInputDto,
  ): Promise<TbPredictionResponseDto> {
    try {
      const result = await this.tbPredictionService.predictTB(
        imageInput.image_base64,
      );

      if (result.validation_passed === false) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.validation_message,
            validation_passed: false,
            prediction: result.prediction,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'TB prediction failed';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Predict TB from uploaded file
   */
  @Post('tb/file')
  @UseInterceptors(FileInterceptor('file'))
  async predictTBFromFile(
    @UploadedFile() file?: MulterFile, // Used the local interface here
  ): Promise<TbPredictionResponseDto> {
    try {
      // Strict null/undefined check
      if (file === undefined || file === null) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Explicit boolean check for strict-boolean-expressions
      const isImage = file.mimetype.startsWith('image/');
      if (isImage === false) {
        throw new HttpException(
          'File must be an image (PNG, JPG, JPEG, etc.)',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.tbPredictionService.predictTBFromFile(
        file.buffer,
      );

      if (result.validation_passed === false) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.validation_message,
            validation_passed: false,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'TB prediction failed';
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
