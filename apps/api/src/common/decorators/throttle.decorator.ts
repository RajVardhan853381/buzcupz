import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Throttle, SkipThrottle as NestSkipThrottle } from '@nestjs/throttler';

/**
 * Skip throttling for this endpoint
 */
export const SkipThrottle = () => NestSkipThrottle({ default: true });

/**
 * Apply strict throttling (5 requests per minute)
 * Use for auth endpoints
 */
export const StrictThrottle = () => Throttle({ default: { limit: 5, ttl: 60000 } });

/**
 * Apply relaxed throttling (300 requests per minute)
 * Use for read-heavy endpoints
 */
export const RelaxedThrottle = () => Throttle({ default: { limit: 300, ttl: 60000 } });

/**
 * Apply custom throttling
 */
export const CustomThrottle = (limit: number, ttl: number) =>
    Throttle({ default: { limit, ttl } });

/**
 * Apply very strict throttling for sensitive operations
 * 3 requests per hour
 */
export const VeryStrictThrottle = () =>
    Throttle({ default: { limit: 3, ttl: 3600000 } });
