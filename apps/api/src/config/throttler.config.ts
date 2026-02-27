import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
    // Default rate limit - 100 requests per minute
    default: {
        ttl: 60000, // 1 minute in milliseconds
        limit: 100,
    },

    // Strict rate limit for auth endpoints - 5 requests per minute
    auth: {
        ttl: 60000,
        limit: 5,
    },

    // Relaxed rate limit for read operations - 300 requests per minute
    read: {
        ttl: 60000,
        limit: 300,
    },

    // Very strict for password reset - 3 requests per hour
    passwordReset: {
        ttl: 3600000, // 1 hour
        limit: 3,
    },

    // Skip throttling for these IPs (internal services)
    skipIps: (process.env.THROTTLE_SKIP_IPS || '').split(',').filter(Boolean),
}));
