import { Module, DynamicModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { STORAGE_PROVIDER } from "./providers/storage-provider.interface";
import { S3StorageProvider } from "./providers/s3-storage.provider";
import { SupabaseStorageProvider } from "./providers/supabase-storage.provider";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import storageConfig from "../../config/storage.config";
import { PrismaService } from "../../database/prisma.service";

@Module({})
export class UploadModule {
  static forRoot(): DynamicModule {
    return {
      module: UploadModule,
      imports: [
        ConfigModule.forFeature(storageConfig),
        MulterModule.register({
          storage: memoryStorage(),
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
          },
        }),
      ],
      controllers: [UploadController],
      providers: [
        UploadService,
        PrismaService,
        {
          provide: STORAGE_PROVIDER,
          useFactory: (configService: ConfigService) => {
            const provider = configService.get("storage.provider");

            switch (provider) {
              case "s3":
                return new S3StorageProvider(configService);
              case "supabase":
                return new SupabaseStorageProvider(configService);
              case "local":
              default:
                return new LocalStorageProvider(configService);
            }
          },
          inject: [ConfigService],
        },
      ],
      exports: [UploadService, STORAGE_PROVIDER],
    };
  }
}
