import { HttpException, HttpStatus } from "@nestjs/common";

export class BusinessException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message,
        error: "Business Rule Violation",
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: "Not Found",
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;

    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: "Conflict",
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidOperationException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: "Invalid Operation",
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InsufficientPermissionsException extends HttpException {
  constructor(action?: string) {
    const message = action
      ? `You do not have permission to ${action}`
      : "Insufficient permissions";

    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: "Forbidden",
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Too many requests. ${retryAfter ? `Please try again in ${retryAfter} seconds.` : "Please try again later."}`,
        error: "Too Many Requests",
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
