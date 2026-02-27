import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { InventoryGateway } from "./inventory.gateway";
import { InventoryProcessor } from "./processors/inventory.processor";
import { NotificationsModule } from "../notifications/notifications.module";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: "inventory",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
    NotificationsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryGateway, InventoryProcessor],
  exports: [InventoryService, InventoryGateway],
})
export class InventoryModule {}
