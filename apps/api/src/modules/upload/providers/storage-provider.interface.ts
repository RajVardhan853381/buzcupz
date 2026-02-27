export interface UploadUrlOptions {
    key: string;
    contentType: string;
    expiresIn?: number;
    metadata?: Record<string, string>;
}

export interface UploadUrlResult {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
}

export interface StorageProvider {
    generateUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult>;
    deleteFile(key: string): Promise<void>;
    fileExists(key: string): Promise<boolean>;
    getFileMetadata(key: string): Promise<{
        size: number;
        contentType: string;
        lastModified: Date;
    } | null>;
    getPublicUrl(key: string): string;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
