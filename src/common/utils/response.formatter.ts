export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
  processingTimeMs?: number;
  timestamp: string;
}

export class ResponseFormatter {
  static success<T>(
    message: string,
    data: T,
    statusCode: number = 200,
    processingTimeMs?: number,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      statusCode,
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string,
    error: string,
    statusCode: number = 400,
    processingTimeMs?: number,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      error,
      statusCode,
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  static created<T>(
    message: string,
    data: T,
    processingTimeMs?: number,
  ): ApiResponse<T> {
    return this.success(message, data, 201, processingTimeMs);
  }

  static notFound(message: string = 'Resource not found'): ApiResponse<null> {
    return this.error(message, 'NOT_FOUND', 404);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiResponse<null> {
    return this.error(message, 'UNAUTHORIZED', 401);
  }

  static forbidden(message: string = 'Forbidden'): ApiResponse<null> {
    return this.error(message, 'FORBIDDEN', 403);
  }

  static badRequest(message: string): ApiResponse<null> {
    return this.error(message, 'BAD_REQUEST', 400);
  }

  static conflict(message: string): ApiResponse<null> {
    return this.error(message, 'CONFLICT', 409);
  }

  static internalError(
    message: string = 'Internal server error',
  ): ApiResponse<null> {
    return this.error(message, 'INTERNAL_ERROR', 500);
  }
}
