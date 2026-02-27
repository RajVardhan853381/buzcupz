import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
    // CORS Configuration
    cors: {
        enabled: true,
        origins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
            .split(',')
            .map((origin) => origin.trim()),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
        ],
        exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
        credentials: true,
        maxAge: 86400, // 24 hours
    },

    // Helmet Configuration
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", ...(process.env.ALLOWED_CONNECT_SOURCES || '').split(',').filter(Boolean)],
            },
        },
        crossOriginEmbedderPolicy: false, // Required for some CDN images
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    },

    // Rate limiting bypass
    trustedProxies: (process.env.TRUSTED_PROXIES || '127.0.0.1')
        .split(',')
        .map((ip) => ip.trim()),
}));
