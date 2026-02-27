import { Module } from "@nestjs/common";
import { CustomerCounterController } from "./customer-counter.controller";
import { CustomerCounterService } from "./customer-counter.service";

@Module({
  controllers: [CustomerCounterController],
  providers: [CustomerCounterService],
  exports: [CustomerCounterService],
})
export class CustomerCounterModule {}
