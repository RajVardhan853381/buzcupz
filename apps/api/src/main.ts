import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Create the app
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get("app.port") || 3001;
  const nodeEnv = configService.get("app.nodeEnv") || "development";

  // Initialize Sentry for error tracking (production only)
  const sentryDsn = configService.get("sentry.dsn");
  if (sentryDsn && nodeEnv === "production") {
    Sentry.init({
      dsn: sentryDsn,
      environment: nodeEnv,
      tracesSampleRate: 0.1, // Sample 10% of transactions
      profilesSampleRate: 0.1, // Sample 10% for profiling
      integrations: [new ProfilingIntegration()],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        return event;
      },
    });
    logger.log("📊 Sentry error tracking initialized");
  }

  // Trust proxy (for rate limiting behind reverse proxy)
  const trustedProxies = configService.get("security.trustedProxies") || [
    "127.0.0.1",
  ];
  app.set("trust proxy", trustedProxies);

  // Global prefix
  app.setGlobalPrefix("api");

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Security: Helmet
  const helmetConfig = configService.get("security.helmet");
  app.use(
    helmet({
      contentSecurityPolicy:
        nodeEnv === "production" ? helmetConfig?.contentSecurityPolicy : false,
      crossOriginEmbedderPolicy:
        helmetConfig?.crossOriginEmbedderPolicy ?? false,
      crossOriginResourcePolicy: helmetConfig?.crossOriginResourcePolicy ?? {
        policy: "cross-origin",
      },
    }),
  );

  // Security: CORS
  const corsConfig = configService.get("security.cors");
  if (corsConfig?.enabled) {
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }

        const allowedOrigins = corsConfig.origins || [];

        // Check if origin is allowed
        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          return callback(null, true);
        }

        // Check for wildcard subdomains (e.g., *.cafeelevate.com)
        const isAllowed = allowedOrigins.some((allowed: string) => {
          if (allowed.startsWith("*.")) {
            const domain = allowed.slice(2);
            return origin.endsWith(domain);
          }
          return false;
        });

        if (isAllowed) {
          return callback(null, true);
        }

        logger.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"), false);
      },
      methods: corsConfig.methods,
      allowedHeaders: corsConfig.allowedHeaders,
      exposedHeaders: corsConfig.exposedHeaders,
      credentials: corsConfig.credentials,
      maxAge: corsConfig.maxAge,
    });
  }

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === "production",
    }),
  );

  // Swagger Documentation (only in development)
  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("BuzCupz Core API")
      .setDescription("Enterprise Restaurant Operating System - Core API v1.0")
      .setVersion("1.0.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .addTag("Auth", "Authentication endpoints")
      .addTag("Menu", "Menu management")
      .addTag("Orders", "Order management")
      .addTag("Reservations", "Reservation management")
      .addTag("Tables", "Table management")
      .addTag("Inventory", "Inventory management")
      .addTag("Analytics", "Analytics & Reports")
      .addTag("Upload", "File uploads")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "none",
        filter: true,
        showRequestDuration: true,
      },
    });

    logger.log(
      `📚 Swagger docs available at http://localhost:${port}/api/docs`,
    );
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port, "0.0.0.0");

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
}

bootstrap();
