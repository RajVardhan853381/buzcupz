import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
    provider: process.env.STORAGE_PROVIDER || 'local', // 'local' | 's3' | 'supabase'

    // Local storage config
    local: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        publicPath: '/uploads',
    },

    // AWS S3 config
    s3: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET,
        cdnUrl: process.env.AWS_CLOUDFRONT_URL,
    },

    // Supabase config
    supabase: {
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
        bucket: process.env.SUPABASE_STORAGE_BUCKET || 'menu-images',
    },

    // Upload limits
    limits: {
        maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
        ],
    },
}));
