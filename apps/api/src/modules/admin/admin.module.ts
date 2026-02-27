import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "@/database/database.module";
import { AdminDashboardService } from "./services/admin-dashboard.service";
import { AdminController } from "./controllers/admin.controller";
import { AdminGuard } from "./guards/admin.guard";

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      signOptions: { expiresIn: "8h" },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminDashboardService, AdminGuard],
  exports: [AdminDashboardService, AdminGuard],
})
export class AdminModule {}
