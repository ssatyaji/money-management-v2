import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Duplicate entry for field: ${(exception.meta?.target as string[])?.join(', ')}`;
        code = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed';
        code = 'FOREIGN_KEY_ERROR';
        break;
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation violation';
        code = 'RELATION_ERROR';
        break;
      default:
        this.logger.error(`Unhandled Prisma error: ${exception.code}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
