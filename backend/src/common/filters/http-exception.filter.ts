import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as { message?: string | string[]; error?: string };
        if (Array.isArray(r.message)) message = r.message[0] ?? r.error ?? message;
        else if (typeof r.message === 'string') message = r.message;
        else if (typeof r.error === 'string') message = r.error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`${request.method} ${request.url} → ${exception.message}`, exception.stack);
    }

    response.status(status).json({ error: message, status });
  }
}
