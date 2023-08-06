import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Util {
  private readonly s3Client: S3Client;
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
    });
  }
  async uploadFile(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
    contentEncoding?: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentEncoding: contentEncoding,
    });
    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      console.log(error);
      throw new Error('Error uploading file');
    }
  }
  async removeFile(bucket: string, key: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      console.log(error);
      throw new Error('Error removing file');
    }
  }
}
