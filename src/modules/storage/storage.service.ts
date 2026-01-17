import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
    key: string;
    url: string;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucket: string;

    constructor(private configService: ConfigService) {
        const endpoint = this.configService.get<string>('aws.s3.endpoint');

        this.s3Client = new S3Client({
            region: this.configService.get<string>('aws.region') || 'us-east-1',
            credentials: {
                accessKeyId: this.configService.get<string>('aws.accessKeyId') || 'test',
                secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || 'test',
            },
            ...(endpoint && {
                endpoint,
                forcePathStyle: true,
            }),
        });

        this.bucket = this.configService.get<string>('aws.s3.bucket') || 'beauty-receipts';
    }

    async uploadReceipt(orderId: string, content: object): Promise<UploadResult> {
        const key = `receipts/${orderId}-${Date.now()}.json`;
        const body = JSON.stringify(content, null, 2);

        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: body,
                    ContentType: 'application/json',
                }),
            );

            // Generate presigned URL for reading (valid for 7 days)
            const url = await getSignedUrl(
                this.s3Client,
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
                { expiresIn: 3600 * 24 * 7 },
            );

            this.logger.log(`Receipt uploaded: ${key}`);

            return { key, url };
        } catch (error) {
            this.logger.error(`Failed to upload receipt: ${(error as Error).message}`);
            throw error;
        }
    }

    async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
        return getSignedUrl(
            this.s3Client,
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
            { expiresIn },
        );
    }
}
