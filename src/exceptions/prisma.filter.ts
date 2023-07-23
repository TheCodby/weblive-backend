import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const code = exception.code;
    console.log(exception);
    if (code === 'P2002') {
      return response.status(409).json({
        message: `Duplicate value for field ${exception.meta.target}`,
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
