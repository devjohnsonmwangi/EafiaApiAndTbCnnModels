import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseFormatter, ApiResponse } from '../utils/response.formatter';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        // Handle NestJS exceptions (ValidationPipe, HttpException, etc.)
        const response = exceptionResponse as Record<string, unknown>;

        if (Array.isArray(response.message)) {
          // Handle validation errors (array of messages)
          message = (response.message as string[]).join(', ');
          error = response.error as string;
        } else if (typeof response.message === 'string') {
          // Handle single message
          message = response.message;
          error = response.error as string;
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      // Special handling for common exceptions
      if (exception instanceof BadRequestException) {
        error = 'BAD_REQUEST';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = 'INTERNAL_ERROR';
    }

    const apiResponse: ApiResponse<null> = ResponseFormatter.error(
      message,
      error ?? 'UNKNOWN_ERROR',
      statusCode,
    );

    response.status(statusCode).json(apiResponse);
  }
}
