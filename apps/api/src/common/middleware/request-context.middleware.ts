import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Add request ID if not present
        if (!req.headers['x-request-id']) {
            req.headers['x-request-id'] = uuidv4();
        }

        // Add response header
        res.setHeader('X-Request-Id', req.headers['x-request-id'] as string);

        // Add timestamp
        (req as any).startTime = Date.now();

        next();
    }
}
