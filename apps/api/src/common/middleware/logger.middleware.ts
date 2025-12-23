import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Request');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const correlationId = req.headers['x-correlation-id'];

    this.logger.debug(
      `[${correlationId || 'no-id'}] ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    next();
  }
}
