import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * StorageModule - Global module for file storage
 * 
 * This module is marked as @Global() so StorageService is available
 * throughout the application without needing to import this module
 * in every feature module.
 * 
 * Features:
 * - AWS S3 integration for production
 * - Local filesystem fallback for development
 * - Automatic credential detection
 * - Presigned URL generation
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
