import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrdersGateway } from "./orders.gateway";
import { OrderProcessor } from "./processors/order.processor";
import { DatabaseModule } from "../../database/database.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    DatabaseModule,
    JwtModule,
    BullModule.registerQueue({
      name: "orders",
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
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway, OrderProcessor],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
