import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { GdprService } from './services/gdpr.service';
import { ConsentService } from './services/consent.service';
import { AuditService } from './services/audit.service';
import { LegalController } from './controllers/legal.controller';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { StorageModule } from '@/modules/storage/storage.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, StorageModule],
  controllers: [LegalController],
  providers: [GdprService, ConsentService, AuditService],
  exports: [GdprService, ConsentService, AuditService],
})
export class ComplianceModule {}
