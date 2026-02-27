import {
    Injectable,
    Inject,
    BadRequestException,
    Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import {
    STORAGE_PROVIDER,
    StorageProvider
} from './providers/storage-provider.interface';
import {
    GenerateUploadUrlDto,
    UploadUrlResponseDto,
    ConfirmUploadDto,
    UploadFolder
} from './dto/upload.dto';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private readonly maxFileSizeMB: number;
    private readonly allowedMimeTypes: string[];

    constructor(
        @Inject(STORAGE_PROVIDER)
        private readonly storageProvider: StorageProvider,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const limits = this.configService.get('storage.limits');
        this.maxFileSizeMB = limits.maxFileSizeMB;
        this.allowedMimeTypes = limits.allowedMimeTypes;
    }

    async generateUploadUrl(dto: GenerateUploadUrlDto): Promise<UploadUrlResponseDto> {
        // Validate content type
        if (!this.allowedMimeTypes.includes(dto.contentType)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
            );
        }

        // Validate file size if provided
        if (dto.fileSize && dto.fileSize > this.maxFileSizeMB * 1024 * 1024) {
            throw new BadRequestException(
                `File size exceeds maximum allowed size of ${this.maxFileSizeMB}MB`
            );
        }

        // Generate unique key
        const key = this.generateStorageKey(dto.folder, dto.fileName);

        const result = await this.storageProvider.generateUploadUrl({
            key,
            contentType: dto.contentType,
            expiresIn: 300, // 5 minutes
            metadata: {
                originalName: dto.fileName,
                folder: dto.folder,
            },
        });

        this.logger.log(`Generated upload URL for key: ${key}`);

        return result;
    }

    async confirmUpload(dto: ConfirmUploadDto): Promise<{
        success: boolean;
        url: string;
        metadata?: any;
    }> {
        // Verify the file was actually uploaded
        const exists = await this.storageProvider.fileExists(dto.key);

        if (!exists) {
            throw new BadRequestException('File not found. Upload may have failed.');
        }

        const metadata = await this.storageProvider.getFileMetadata(dto.key);
        const publicUrl = this.storageProvider.getPublicUrl(dto.key);

        // If entity info provided, update the entity with the image URL
        if (dto.entityType && dto.entityId) {
            await this.updateEntityImage(dto.entityType, dto.entityId, publicUrl);
        }

        this.logger.log(`Upload confirmed for key: ${dto.key}`);

        return {
            success: true,
            url: publicUrl,
            metadata,
        };
    }

    async deleteImage(key: string): Promise<void> {
        // Check if file exists
        const exists = await this.storageProvider.fileExists(key);

        if (!exists) {
            this.logger.warn(`Attempted to delete non-existent file: ${key}`);
            return;
        }

        await this.storageProvider.deleteFile(key);
        this.logger.log(`Deleted image: ${key}`);
    }

    async processAndOptimizeImage(
        buffer: Buffer,
        options: {
            maxWidth?: number;
            maxHeight?: number;
            quality?: number;
            format?: 'jpeg' | 'png' | 'webp';
        } = {}
    ): Promise<Buffer> {
        const {
            maxWidth = 1200,
            maxHeight = 1200,
            quality = 80,
            format = 'webp',
        } = options;

        let pipeline = sharp(buffer);

        // Get image metadata
        const metadata = await pipeline.metadata();

        // Resize if needed
        if (
            (metadata.width && metadata.width > maxWidth) ||
            (metadata.height && metadata.height > maxHeight)
        ) {
            pipeline = pipeline.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Convert to desired format with quality
        switch (format) {
            case 'jpeg':
                pipeline = pipeline.jpeg({ quality, progressive: true });
                break;
            case 'png':
                pipeline = pipeline.png({ quality, compressionLevel: 9 });
                break;
            case 'webp':
            default:
                pipeline = pipeline.webp({ quality });
                break;
        }

        return pipeline.toBuffer();
    }

    async generateThumbnail(
        buffer: Buffer,
        size: number = 200
    ): Promise<Buffer> {
        return sharp(buffer)
            .resize(size, size, {
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: 70 })
            .toBuffer();
    }

    private generateStorageKey(folder: UploadFolder, fileName: string): string {
        const timestamp = Date.now();
        const uniqueId = uuidv4().split('-')[0];
        const sanitizedName = this.sanitizeFileName(fileName);
        const ext = this.getFileExtension(fileName);

        return `${folder}/${timestamp}-${uniqueId}-${sanitizedName}${ext}`;
    }

    private sanitizeFileName(fileName: string): string {
        // Remove extension first
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

        // Replace special characters and spaces
        return nameWithoutExt
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }

    private getFileExtension(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();

        // Always use webp for optimization (or keep original if needed)
        const extensionMap: Record<string, string> = {
            jpg: '.webp',
            jpeg: '.webp',
            png: '.webp',
            gif: '.gif', // Keep gif for animations
            webp: '.webp',
        };

        return extensionMap[ext || ''] || '.webp';
    }

    private async updateEntityImage(
        entityType: string,
        entityId: string,
        imageUrl: string
    ): Promise<void> {
        try {
            switch (entityType) {
                case 'menu-item':
                    await this.prisma.menuItem.update({
                        where: { id: entityId },
                        data: { image: imageUrl },
                    });
                    break;
                case 'category':
                    await this.prisma.category.update({
                        where: { id: entityId },
                        data: { image: imageUrl },
                    });
                    break;
                // Commenting out supplier for now as it might need model update
                // case 'supplier':
                //   await this.prisma.supplier.update({
                //     where: { id: entityId },
                //     data: { logoUrl: imageUrl },
                //   });
                //   break;
                default:
                    this.logger.warn(`Unknown entity type: ${entityType}`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to update ${entityType} ${entityId} with image URL:`,
                error
            );
            // Don't throw - the image upload was successful
        }
    }
}
