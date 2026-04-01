import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestWithMetadata extends Request {
  clientIp?: string;
  startTime?: number;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: RequestWithMetadata, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    // Capture the original response send method

    const originalRes = res.send.bind(res);

    res.send = function (data) {
      const processingTime = Date.now() - startTime;
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        clientIp,
        processingTimeMs: processingTime,
        userAgent: req.get('user-agent'),
      };

      if (processingTime > 1000) {
        console.warn('⚠️ SLOW REQUEST:', logData);
      } else {
        console.log('✓ REQUEST:', logData);
      }

      return originalRes(data);
    };

    // Store client IP in request for later use

    req.clientIp = clientIp;

    req.startTime = startTime;

    next();
  }
}
