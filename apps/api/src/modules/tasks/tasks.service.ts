import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    this.logger.log("Task scheduler initialized");
    // We can list jobs here to verify
    setTimeout(() => {
      try {
        const jobs = this.schedulerRegistry.getCronJobs();
        if (jobs.size > 0) {
          this.logger.log(
            `Active Cron Jobs: ${Array.from(jobs.keys()).join(", ")}`,
          );
        } else {
          this.logger.log("No Cron Jobs scheduled yet");
        }
      } catch (e) {
        this.logger.warn("Could not list cron jobs on init");
      }
    }, 1000);
  }
}
