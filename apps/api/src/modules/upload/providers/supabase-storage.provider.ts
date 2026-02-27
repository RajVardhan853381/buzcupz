import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  StorageProvider,
  UploadUrlOptions,
  UploadUrlResult,
} from "./storage-provider.interface";

@Injectable()
export class SupabaseStorageProvider implements StorageProvider {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const supabaseConfig = this.configService.get("storage.supabase");

    this.supabase = createClient(
      supabaseConfig.url,
      supabaseConfig.serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    this.bucket = supabaseConfig.bucket;
    this.publicUrl = `${supabaseConfig.url}/storage/v1/object/public/${this.bucket}`;
  }

  async generateUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult> {
    const { key, contentType, expiresIn = 300 } = options;

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(key, {
        upsert: true,
      });

    if (error) {
      this.logger.error("Failed to generate upload URL:", error);
      throw error;
    }

    return {
      uploadUrl: data.signedUrl,
      publicUrl: this.getPublicUrl(key),
      key,
      expiresIn,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([key]);

    if (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw error;
    }

    this.logger.log(`Deleted file: ${key}`);
  }

  async fileExists(key: string): Promise<boolean> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(key.split("/").slice(0, -1).join("/"), {
        search: key.split("/").pop(),
      });

    if (error) {
      return false;
    }

    return data.length > 0;
  }

  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null> {
    // Supabase doesn't have a direct HEAD equivalent
    // We need to list and find the file
    const folder = key.split("/").slice(0, -1).join("/");
    const fileName = key.split("/").pop();

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(folder, {
        search: fileName,
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data.find((f) => f.name === fileName);
    if (!file) {
      return null;
    }

    return {
      size: file.metadata?.size || 0,
      contentType: file.metadata?.mimetype || "application/octet-stream",
      lastModified: new Date(file.updated_at || file.created_at),
    };
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
