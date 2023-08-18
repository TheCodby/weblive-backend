import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const code = exception.code;
    if (code === 'P2002') {
      return response.status(409).json({
        message: `${exception.meta.target} already exists`,
      });
    } else if (code === 'P2000') {
      return response.status(403).json({
        message: `The provided value for the column is too long for the column's type. Column: ${exception.meta.column_name}`,
      });
    } else if (code === 'P2025') {
      return response.status(404).json({
        message: 'Record not found',
      });
    }
    return response.status(500).json({
      message: 'Internal server error',
    });
  }
}
