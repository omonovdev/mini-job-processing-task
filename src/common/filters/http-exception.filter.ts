import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { BusinessException } from '../exceptions/business.exception.js';

interface ExceptionBody {
  message?: string | string[];
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const result = this.buildResponse(exception, request);

    if (result.statusCode >= 500) {
      const msg = Array.isArray(result.message)
        ? result.message.join(', ')
        : result.message;
      this.logger.error(
        `${request.method} ${request.url} ${result.statusCode} - ${msg}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(result.statusCode).json(result);
  }

  private buildResponse(exception: unknown, request: Request) {
    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof BusinessException) {
      const body = exception.getResponse() as ExceptionBody;
      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        message: body.message || exception.message,
        path,
        timestamp,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : (body as ExceptionBody).message || exception.message;

      return { statusCode: status, message, path, timestamp };
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      path,
      timestamp,
    };
  }
}
