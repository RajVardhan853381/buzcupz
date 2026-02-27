/**
 * Application configuration
 *
 * IMPORTANT: No default values for secrets!
 * All required values are validated by env.validation.ts at startup.
 * Missing or insecure values will prevent the application from starting.
 */
export default () => ({
  // API Configuration
  api: {
    port: parseInt(process.env.API_PORT ?? "3001", 10),
    prefix: process.env.API_PREFIX || "api/v1",
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    url: process.env.REDIS_URL,
  },

  // JWT - NO DEFAULT VALUES for secrets (validated at startup)
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  // Frontend URLs
  frontend: {
    webUrl: process.env.WEB_URL || "http://localhost:5173",
    bookingUrl: process.env.BOOKING_URL || "http://localhost:5174",
  },

  // Email (SendGrid)
  email: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: process.env.SENDGRID_FROM_NAME || "Restaurant Platform",
  },

  // SMS (Twilio)
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // File Storage
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION || "us-east-1",
  },

  // Sentry Error Tracking
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },

  // Application
  app: {
    port: parseInt(process.env.API_PORT ?? "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV !== "production",
    isProduction: process.env.NODE_ENV === "production",
  },
});
