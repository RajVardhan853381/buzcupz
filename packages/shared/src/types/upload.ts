export enum UploadFolder {
    MENU_ITEMS = 'menu-items',
    CATEGORIES = 'categories',
    SUPPLIERS = 'suppliers',
    PROFILE = 'profile',
    GENERAL = 'general',
}

export interface GenerateUploadUrlRequest {
    fileName: string;
    contentType: string;
    folder: UploadFolder;
    fileSize?: number;
}

export interface UploadUrlResponse {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
}

export interface ConfirmUploadRequest {
    key: string;
    entityType?: string;
    entityId?: string;
}

export interface ConfirmUploadResponse {
    success: boolean;
    url: string;
    metadata?: {
        size: number;
        contentType: string;
        lastModified: Date;
    };
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'confirming' | 'success' | 'error';

export interface UploadState {
    status: UploadStatus;
    progress: UploadProgress;
    url?: string;
    error?: string;
}
