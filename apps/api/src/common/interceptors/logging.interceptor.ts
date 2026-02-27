import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

interface RequestLog {
    requestId: string;
    method: string;
    url: string;
    ip: string;
    userAgent?: string;
    userId?: string;
    body?: any;
    query?: any;
    params?: any;
}

interface ResponseLog extends RequestLog {
    statusCode: number;
    duration: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        // Generate or use existing request ID
        const requestId = (request.headers['x-request-id'] as string) || uuidv4();
        request.headers['x-request-id'] = requestId;
        response.setHeader('X-Request-Id', requestId);

        const startTime = Date.now();

        // Build request log
        const requestLog: RequestLog = {
            requestId,
            method: request.method,
            url: request.url,
            ip: this.getClientIp(request),
            userAgent: request.headers['user-agent'],
            userId: (request as any).user?.id,
        };

        // Log request body for non-GET requests (excluding sensitive data)
        if (request.method !== 'GET' && request.body) {
            requestLog.body = this.sanitizeBody(request.body);
        }

        // Log query params if present
        if (Object.keys(request.query).length > 0) {
            requestLog.query = request.query;
        }

        // Log route params if present
        if (Object.keys(request.params).length > 0) {
            requestLog.params = request.params;
        }

        // Log incoming request
        this.logger.log(`→ ${request.method} ${request.url}`, JSON.stringify(requestLog));

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                const responseLog: ResponseLog = {
                    ...requestLog,
                    statusCode: response.statusCode,
                    duration,
                };

                // Color-code based on status
                const statusEmoji = this.getStatusEmoji(response.statusCode);

                this.logger.log(
                    `← ${statusEmoji} ${request.method} ${request.url} ${response.statusCode} - ${duration}ms`,
                    JSON.stringify(responseLog)
                );
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                const statusCode = error.status || error.statusCode || 500;

                this.logger.error(
                    `← ❌ ${request.method} ${request.url} ${statusCode} - ${duration}ms`,
                    JSON.stringify({
                        ...requestLog,
                        statusCode,
                        duration,
                        error: error.message,
                    })
                );

                throw error;
            })
        );
    }

    private getClientIp(request: Request): string {
        const forwarded = request.headers['x-forwarded-for'];
        if (forwarded) {
            const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
                .split(',')
                .map((ip) => ip.trim());
            return ips[0];
        }

        return (
            request.headers['x-real-ip'] as string ||
            request.connection?.remoteAddress ||
            request.ip ||
            'unknown'
        );
    }

    private sanitizeBody(body: any): any {
        const sensitiveFields = [
            'password',
            'passwordConfirm',
            'currentPassword',
            'newPassword',
            'token',
            'refreshToken',
            'accessToken',
            'secret',
            'apiKey',
            'creditCard',
            'cvv',
            'ssn',
        ];

        if (typeof body !== 'object' || body === null) {
            return body;
        }

        const sanitized = { ...body };

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    private getStatusEmoji(statusCode: number): string {
        if (statusCode >= 500) return '🔴';
        if (statusCode >= 400) return '🟠';
        if (statusCode >= 300) return '🔵';
        if (statusCode >= 200) return '🟢';
        return '⚪';
    }
}
