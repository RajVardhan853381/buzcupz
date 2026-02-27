import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

/**
 * StorageService - Handles file uploads with S3 and local fallback
 * 
 * Features:
 * - AWS S3 integration for production
 * - Local filesystem fallback for development
 * - Presigned URL generation
 * - File deletion
 * - Automatic directory creation
 * 
 * Environment Variables Required:
 * - AWS_REGION (optional, defaults to us-east-1)
 * - AWS_ACCESS_KEY_ID (optional, uses local storage if not set)
 * - AWS_SECRET_ACCESS_KEY (optional, uses local storage if not set)
 * - AWS_S3_BUCKET (optional, defaults to cafeelevate-storage)
 * - APP_URL (required for local storage URLs)
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null;
  private readonly bucket: string;
  private readonly localStoragePath: string;
  private readonly useS3: boolean;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get('AWS_S3_BUCKET', 'cafeelevate-storage');
    this.localStoragePath = path.join(process.cwd(), 'uploads');

    const region = this.config.get('AWS_REGION', 'us-east-1');
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');

    // Initialize S3 if credentials are available
    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.useS3 = true;
      this.logger.log(`✅ S3 storage initialized (bucket: ${this.bucket}, region: ${region})`);
    } else {
      this.s3Client = null;
      this.useS3 = false;
      this.logger.warn('⚠️ AWS credentials not configured - using local filesystem storage');
      this.ensureLocalStorageExists();
    }
  }

  /**
   * Upload a file to storage (S3 or local)
   * @param key - File path/key (e.g., 'exports/user-123/data.zip')
   * @param body - File content as Buffer
   * @param contentType - MIME type (e.g., 'application/zip')
   * @param options - Additional options
   * @returns Download URL (presigned for S3, direct for local)
   */
  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
    options?: {
      expiresIn?: number; // Seconds until presigned URL expires
      metadata?: Record<string, string>;
    },
  ): Promise<string> {
    const expiresIn = options?.expiresIn || 7 * 24 * 60 * 60; // 7 days default

    if (this.useS3 && this.s3Client) {
      return this.uploadToS3(key, body, contentType, expiresIn, options?.metadata);
    } else {
      return this.uploadToLocal(key, body);
    }
  }

  /**
   * Upload to AWS S3
   */
  private async uploadToS3(
    key: string,
    body: Buffer,
    contentType: string,
    expiresIn: number,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      // Upload file
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          Metadata: metadata,
        }),
      );

      this.logger.log(`✅ Uploaded to S3: ${key} (${(body.length / 1024).toFixed(2)} KB)`);

      // Generate presigned URL
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client!, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`❌ S3 upload failed for ${key}:`, error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Upload to local filesystem (development fallback)
   */
  private async uploadToLocal(key: string, body: Buffer): Promise<string> {
    try {
      const filePath = path.join(this.localStoragePath, key);
      const dir = path.dirname(filePath);

      // Ensure directory exists
      await fs.promises.mkdir(dir, { recursive: true });

      // Write file
      await fs.promises.writeFile(filePath, body);

      this.logger.log(`✅ Saved locally: ${key} (${(body.length / 1024).toFixed(2)} KB)`);

      // Return public URL
      const appUrl = this.config.get('APP_URL', 'http://localhost:3000');
      return `${appUrl}/uploads/${key}`;
    } catch (error) {
      this.logger.error(`❌ Local storage failed for ${key}:`, error);
      throw new Error(`Failed to save file locally: ${error.message}`);
    }
  }

  /**
   * Generate a new presigned URL for an existing S3 object
   * @param key - S3 object key
   * @param expiresIn - Seconds until URL expires (default: 1 hour)
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.useS3 || !this.s3Client) {
      // For local storage, just return direct URL
      const appUrl = this.config.get('APP_URL', 'http://localhost:3000');
      return `${appUrl}/uploads/${key}`;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`❌ Failed to generate signed URL for ${key}:`, error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete a file from storage
   * @param key - File path/key
   */
  async deleteFile(key: string): Promise<void> {
    if (this.useS3 && this.s3Client) {
      await this.deleteFromS3(key);
    } else {
      await this.deleteFromLocal(key);
    }
  }

  /**
   * Delete from S3
   */
  private async deleteFromS3(key: string): Promise<void> {
    try {
      await this.s3Client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`✅ Deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`❌ S3 deletion failed for ${key}:`, error);
      // Don't throw - file might not exist
    }
  }

  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(key: string): Promise<void> {
    try {
      const filePath = path.join(this.localStoragePath, key);
      await fs.promises.unlink(filePath);
      this.logger.log(`✅ Deleted locally: ${key}`);
    } catch (error) {
      // File might not exist - that's okay
      this.logger.debug(`Local file not found (already deleted?): ${key}`);
    }
  }

  /**
   * Ensure local storage directory exists
   */
  private ensureLocalStorageExists(): void {
    try {
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
        this.logger.log(`✅ Created local storage directory: ${this.localStoragePath}`);
      }
    } catch (error) {
      this.logger.error('❌ Failed to create local storage directory:', error);
    }
  }

  /**
   * Get storage type (for debugging/monitoring)
   */
  getStorageType(): 'S3' | 'LOCAL' {
    return this.useS3 ? 'S3' : 'LOCAL';
  }

  /**
   * Get storage stats (for monitoring)
   */
  getStorageInfo(): {
    type: 'S3' | 'LOCAL';
    bucket?: string;
    region?: string;
    localPath?: string;
  } {
    if (this.useS3) {
      return {
        type: 'S3',
        bucket: this.bucket,
        region: this.config.get('AWS_REGION', 'us-east-1'),
      };
    } else {
      return {
        type: 'LOCAL',
        localPath: this.localStoragePath,
      };
    }
  }
}
