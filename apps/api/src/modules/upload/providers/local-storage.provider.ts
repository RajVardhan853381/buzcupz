import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import {
  StorageProvider,
  UploadUrlOptions,
  UploadUrlResult,
} from "./storage-provider.interface";

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly publicPath: string;
  private readonly baseUrl: string;
  private readonly pendingUploads = new Map<
    string,
    {
      key: string;
      contentType: string;
      expiresAt: Date;
    }
  >();

  constructor(private configService: ConfigService) {
    const localConfig = this.configService.get("storage.local");
    this.uploadDir = localConfig.uploadDir;
    this.publicPath = localConfig.publicPath;
    this.baseUrl =
      this.configService.get("app.baseUrl") || "http://localhost:3000";

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error("Failed to create upload directory:", error);
    }
  }

  async generateUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult> {
    const { key, contentType, expiresIn = 300 } = options;

    // Generate a unique token for this upload
    const token = crypto.randomBytes(32).toString("hex");

    // Store pending upload info
    this.pendingUploads.set(token, {
      key,
      contentType,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    });

    // Clean up expired tokens periodically
    setTimeout(() => this.pendingUploads.delete(token), expiresIn * 1000);

    // For local storage, we return an endpoint that accepts the file
    const uploadUrl = `${this.baseUrl}/api/upload/local/${token}`;

    return {
      uploadUrl,
      publicUrl: this.getPublicUrl(key),
      key,
      expiresIn,
    };
  }

  // This method handles the actual file save for local uploads
  async saveFile(token: string, fileBuffer: Buffer): Promise<string> {
    const pending = this.pendingUploads.get(token);

    if (!pending) {
      throw new Error("Invalid or expired upload token");
    }

    if (new Date() > pending.expiresAt) {
      this.pendingUploads.delete(token);
      throw new Error("Upload token expired");
    }

    const filePath = path.join(this.uploadDir, pending.key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);

    this.pendingUploads.delete(token);

    return this.getPublicUrl(pending.key);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      // Prevent directory traversal attacks
      const filePath = path.join(this.uploadDir, key);
      if (!filePath.startsWith(path.resolve(this.uploadDir))) {
        throw new Error("Invalid path");
      }

      await fs.unlink(filePath);
      this.logger.log(`Deleted file: ${key}`);
    } catch (error) {
      if ((error as any).code !== "ENOENT") {
        this.logger.error(`Failed to delete file ${key}:`, error);
        throw error;
      }
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      // Prevent directory traversal attacks
      const filePath = path.join(this.uploadDir, key);
      if (!filePath.startsWith(path.resolve(this.uploadDir))) {
        return false;
      }

      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null> {
    try {
      // Prevent directory traversal attacks
      const filePath = path.join(this.uploadDir, key);
      if (!filePath.startsWith(path.resolve(this.uploadDir))) {
        return null;
      }

      const stats = await fs.stat(filePath);

      // Guess content type from extension
      const ext = path.extname(key).toLowerCase();
      const contentTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      };

      return {
        size: stats.size,
        contentType: contentTypes[ext] || "application/octet-stream",
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}${this.publicPath}/${key}`;
  }
}
