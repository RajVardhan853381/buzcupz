import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class BillingModule {}
