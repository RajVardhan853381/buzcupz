import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

// Config
import configuration from "./config/configuration";
import throttlerConfig from "./config/throttler.config";
import securityConfig from "./config/security.config";
import { validateEnv } from "./config/env.validation";

// Core modules
import { DatabaseModule } from "./database/database.module";
import { WebSocketModule } from "./websocket/websocket.module";

// Feature modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RestaurantsModule } from "./modules/restaurants/restaurants.module";
import { MenuModule } from "./modules/menu/menu.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { TablesModule } from "./modules/tables/tables.module";
import { ReservationsModule } from "./modules/reservations/reservations.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { WastageModule } from "./modules/wastage/wastage.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { CustomerCounterModule } from "./modules/customer-counter/customer-counter.module";
import { UploadModule } from "./modules/upload/upload.module";
import { HealthModule } from "./modules/health/health.module";
import { CostManagementModule } from "./modules/cost-management/cost-management.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { PrintingModule } from "./modules/printing/printing.module";

import { StorageModule } from "./modules/storage/storage.module";
import { ComplianceModule } from "./modules/compliance/compliance.module";
import { SupportModule } from "./modules/support/support.module";
import { AdminModule } from "./modules/admin/admin.module";

// Guards & Filters
import { ThrottlerGuard } from "@nestjs/throttler";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, throttlerConfig, securityConfig],
      envFilePath: [".env.local", ".env"],
      validate: validateEnv,
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: "default",
            ttl: config.get("throttler.default.ttl"),
            limit: config.get("throttler.default.limit"),
          },
        ],
      }),
    }),

    // Schedule for cron jobs
    ScheduleModule.forRoot(),

    // BullMQ for job queues
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
        },
      }),
    }),

    // Core modules
    DatabaseModule,
    WebSocketModule,
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MenuModule,
    OrdersModule,
    TablesModule,
    ReservationsModule,
    InventoryModule,
    WastageModule,
    AnalyticsModule,
    NotificationsModule,
    CustomerCounterModule,
    UploadModule,
    CostManagementModule,
    TasksModule,
    PrintingModule,

    StorageModule, // Global file storage (S3/local)
    ComplianceModule, // GDPR & Legal
    SupportModule, // Customer support system
    AdminModule, // Admin dashboard
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
