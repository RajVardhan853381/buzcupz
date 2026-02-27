import * as Joi from 'joi';

/**
 * Environment variable validation schema
 * Validates all required and optional environment variables at application startup.
 * The application will fail to start if validation fails.
 */
export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .required()
        .messages({
            'any.required': 'NODE_ENV is required. Set to "development", "production", or "test".',
            'any.only': 'NODE_ENV must be one of: development, production, test',
        }),

    API_PORT: Joi.number()
        .integer()
        .min(1024)
        .max(65535)
        .default(3001)
        .messages({
            'number.min': 'API_PORT must be between 1024 and 65535',
            'number.max': 'API_PORT must be between 1024 and 65535',
        }),

    API_PREFIX: Joi.string().default('api/v1'),

    DATABASE_URL: Joi.string()
        .uri({ scheme: ['postgresql', 'postgres'] })
        .required()
        .messages({
            'any.required': 'DATABASE_URL is required. Example: postgresql://user:password@db:5432/dbname',
            'string.uri': 'DATABASE_URL must be a valid PostgreSQL connection string',
        }),

    REDIS_URL: Joi.string()
        .uri({ scheme: ['redis', 'rediss'] })
        .required()
        .messages({
            'any.required': 'REDIS_URL is required. Example: redis://redis:6379',
            'string.uri': 'REDIS_URL must be a valid Redis connection string',
        }),

    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().port().default(6379),

    JWT_SECRET: Joi.string()
        .min(32)
        .required()
        .custom((value, helpers) => {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('change') || lowerValue.includes('example')) {
                return helpers.error('string.insecure');
            }
            return value;
        })
        .messages({
            'any.required': 'JWT_SECRET is required. Generate with: openssl rand -hex 32',
            'string.min': 'JWT_SECRET must be at least 32 characters for security',
            'string.insecure': 'JWT_SECRET must not contain placeholder words like "change" or "example"',
        }),

    JWT_REFRESH_SECRET: Joi.string()
        .min(32)
        .required()
        .custom((value, helpers) => {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('change') || lowerValue.includes('example')) {
                return helpers.error('string.insecure');
            }
            return value;
        })
        .messages({
            'any.required': 'JWT_REFRESH_SECRET is required. Generate with: openssl rand -hex 32',
            'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters for security',
            'string.insecure': 'JWT_REFRESH_SECRET must not contain placeholder words like "change" or "example"',
        }),

    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

    WEB_URL: Joi.string().uri().default('http://localhost:5173'),
    BOOKING_URL: Joi.string().uri().default('http://localhost:5174'),

    CORS_ORIGINS: Joi.string().default('http://localhost:5173'),

    SENDGRID_API_KEY: Joi.string().allow('').optional(),
    SENDGRID_FROM_EMAIL: Joi.string().email().allow('').optional(),
    SENDGRID_FROM_NAME: Joi.string().default('Restaurant Platform'),

    TWILIO_ACCOUNT_SID: Joi.string().allow('').optional(),
    TWILIO_AUTH_TOKEN: Joi.string().allow('').optional(),
    TWILIO_PHONE_NUMBER: Joi.string().allow('').optional(),

    S3_ENDPOINT: Joi.string().uri().allow('').optional(),
    S3_BUCKET: Joi.string().allow('').optional(),
    S3_ACCESS_KEY: Joi.string().allow('').optional(),
    S3_SECRET_KEY: Joi.string().allow('').optional(),
    S3_REGION: Joi.string().default('us-east-1'),

    STORAGE_PROVIDER: Joi.string()
        .valid('local', 's3', 'supabase')
        .default('local'),

    SUPABASE_URL: Joi.string().uri().allow('').optional(),
    SUPABASE_SERVICE_KEY: Joi.string().allow('').optional(),
    SUPABASE_STORAGE_BUCKET: Joi.string().allow('').optional(),

    THROTTLE_TTL: Joi.number().default(60000),
    THROTTLE_LIMIT: Joi.number().default(100),
    THROTTLE_SKIP_IPS: Joi.string().default(''),

    TRUSTED_PROXIES: Joi.string().default('127.0.0.1'),

    SENTRY_DSN: Joi.string().uri().allow('').optional(),

    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'log', 'debug', 'verbose')
        .default('log'),
}).options({
    allowUnknown: true,
    stripUnknown: false,
});

/**
 * Validate environment variables
 * @throws Error if validation fails
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
    const { error, value } = envValidationSchema.validate(config, {
        abortEarly: false, // Report all errors, not just the first one
    });

    if (error) {
        const errorMessages = error.details
            .map((detail) => `  - ${detail.message}`)
            .join('\n');

        throw new Error(
            `\n\nEnvironment validation failed:\n${errorMessages}\n\n` +
            `Please check your .env file and ensure all required variables are set correctly.\n` +
            `For production, generate secure secrets with: openssl rand -hex 32\n`
        );
    }

    return value;
}
