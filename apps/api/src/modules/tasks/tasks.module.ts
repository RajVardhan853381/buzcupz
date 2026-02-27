
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { ReservationTasksService } from './reservation-tasks.service';
import { ReportTasksService } from './report-tasks.service';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { PrismaService } from '@/database/prisma.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        NotificationsModule,
    ],
    providers: [
        TasksService,
        ReservationTasksService,
        ReportTasksService,
        PrismaService,
    ],
    exports: [TasksService],
})
export class TasksModule { }
