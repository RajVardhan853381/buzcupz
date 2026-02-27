import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsInt,
    Min,
    Max,
    Matches
} from 'class-validator';

export enum UploadFolder {
    MENU_ITEMS = 'menu-items',
    CATEGORIES = 'categories',
    SUPPLIERS = 'suppliers',
    PROFILE = 'profile',
    GENERAL = 'general',
}

export class GenerateUploadUrlDto {
    @ApiProperty({
        example: 'burger.jpg',
        description: 'Original filename'
    })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({
        example: 'image/jpeg',
        description: 'MIME type of the file'
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^image\/(jpeg|png|webp|gif)$/, {
        message: 'Only image files (jpeg, png, webp, gif) are allowed',
    })
    contentType: string;

    @ApiProperty({
        enum: UploadFolder,
        example: UploadFolder.MENU_ITEMS
    })
    @IsEnum(UploadFolder)
    folder: UploadFolder;

    @ApiPropertyOptional({
        example: 1048576,
        description: 'File size in bytes'
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10 * 1024 * 1024) // 10MB max
    fileSize?: number;
}

export class UploadUrlResponseDto {
    @ApiProperty({
        example: 'https://s3.amazonaws.com/bucket/menu-items/abc123.jpg?signature=...',
        description: 'Pre-signed URL for uploading'
    })
    uploadUrl: string;

    @ApiProperty({
        example: 'https://cdn.cafeelevate.com/menu-items/abc123.jpg',
        description: 'Public URL after upload completes'
    })
    publicUrl: string;

    @ApiProperty({
        example: 'menu-items/1699876543210-burger.jpg',
        description: 'Storage key/path'
    })
    key: string;

    @ApiProperty({
        example: 300,
        description: 'URL expiration time in seconds'
    })
    expiresIn: number;
}

export class ConfirmUploadDto {
    @ApiProperty({
        example: 'menu-items/1699876543210-burger.jpg',
        description: 'Storage key from generateUploadUrl response'
    })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiPropertyOptional({
        example: 'menu-item',
        description: 'Entity type this image belongs to'
    })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        example: 'clh1234567890',
        description: 'Entity ID this image belongs to'
    })
    @IsOptional()
    @IsString()
    entityId?: string;
}

export class DeleteImageDto {
    @ApiProperty({
        example: 'menu-items/1699876543210-burger.jpg',
        description: 'Storage key of image to delete'
    })
    @IsString()
    @IsNotEmpty()
    key: string;
}

export class ImageMetadataDto {
    @ApiProperty()
    key: string;

    @ApiProperty()
    url: string;

    @ApiProperty()
    contentType: string;

    @ApiProperty()
    size: number;

    @ApiProperty()
    uploadedAt: Date;

    @ApiPropertyOptional()
    width?: number;

    @ApiPropertyOptional()
    height?: number;
}
