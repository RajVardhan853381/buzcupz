import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
    details?: any;
    stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    constructor(private readonly configService: ConfigService) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const isProduction = this.configService.get('app.nodeEnv') === 'production';

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let details: any = undefined;

        // Handle different exception types
        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as any;
                message = responseObj.message || message;
                error = responseObj.error || exception.name;
                details = responseObj.details;
            }
        } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle Prisma errors
            const prismaError = this.handlePrismaError(exception);
            statusCode = prismaError.statusCode;
            message = prismaError.message;
            error = prismaError.error;
        } else if (exception instanceof Prisma.PrismaClientValidationError) {
            statusCode = HttpStatus.BAD_REQUEST;
            message = 'Invalid data provided';
            error = 'Validation Error';
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }

        // Build error response
        const errorResponse: ErrorResponse = {
            statusCode,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId: request.headers['x-request-id'] as string,
        };

        // Add details if available (not in production for sensitive errors)
        if (details && !isProduction) {
            errorResponse.details = details;
        }

        // Add stack trace in development
        if (!isProduction && exception instanceof Error) {
            errorResponse.stack = exception.stack;
        }

        // Log the error
        this.logError(exception, request, statusCode);

        // Send response
        response.status(statusCode).json(errorResponse);
    }

    private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
        statusCode: number;
        message: string;
        error: string;
    } {
        switch (error.code) {
            case 'P2002': {
                // Unique constraint violation
                const field = (error.meta?.target as string[])?.join(', ') || 'field';
                return {
                    statusCode: HttpStatus.CONFLICT,
                    message: `A record with this ${field} already exists`,
                    error: 'Conflict',
                };
            }
            case 'P2003': {
                // Foreign key constraint violation
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Related record not found',
                    error: 'Bad Request',
                };
            }
            case 'P2025': {
                // Record not found
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Record not found',
                    error: 'Not Found',
                };
            }
            case 'P2014': {
                // Required relation violation
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Required relation is missing',
                    error: 'Bad Request',
                };
            }
            default:
                return {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error occurred',
                    error: 'Internal Server Error',
                };
        }
    }

    private logError(
        exception: unknown,
        request: Request,
        statusCode: number
    ): void {
        const logContext = {
            statusCode,
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            userId: (request as any).user?.id,
            requestId: request.headers['x-request-id'],
        };

        if (statusCode >= 500) {
            this.logger.error(
                `${request.method} ${request.url} - ${statusCode}`,
                exception instanceof Error ? exception.stack : String(exception),
                JSON.stringify(logContext)
            );
        } else if (statusCode >= 400) {
            this.logger.warn(
                `${request.method} ${request.url} - ${statusCode}`,
                JSON.stringify({
                    ...logContext,
                    message: exception instanceof Error ? exception.message : String(exception),
                })
            );
        }
    }
}
