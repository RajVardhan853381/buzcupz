import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { TicketService } from "./services/ticket.service";
import { KnowledgeBaseService } from "./services/knowledge-base.service";
import { NotificationsModule } from "@/modules/notifications/notifications.module";

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [TicketService, KnowledgeBaseService],
  exports: [TicketService, KnowledgeBaseService],
})
export class SupportModule {}
