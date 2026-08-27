import fs from 'fs/promises';
import path from 'path';

// Ensure the uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

export interface StorageService {
  uploadFile(userId: string, offerId: string, fileBuffer: Buffer, mimeType: string): Promise<string>;
  getFileUrl(storagePath: string): Promise<string>;
  getFileBuffer(storagePath: string): Promise<Buffer>;
}

export class LocalDiskStorage implements StorageService {
  async uploadFile(userId: string, offerId: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    let extension = '.bin';
    if (mimeType.includes('pdf')) extension = '.pdf';
    else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) extension = '.docx';
    else if (mimeType.includes('jpeg')) extension = '.jpg';
    else if (mimeType.includes('png')) extension = '.png';

    const fileName = `${offerId}${extension}`;
    const userDir = path.join(UPLOAD_DIR, userId);
    
    await fs.mkdir(userDir, { recursive: true });
    
    const filePath = path.join(userDir, fileName);
    await fs.writeFile(filePath, fileBuffer);
    
    return `local://${userId}/${fileName}`;
  }

  async getFileUrl(storagePath: string): Promise<string> {
    // In production, this would return an S3 Signed URL.
    // For local dev, we could serve static files, but for the backend pipeline,
    // we usually just need the buffer. If frontend needs to download it, we return an API route.
    const relativePath = storagePath.replace('local://', '');
    return `http://localhost:3001/api/storage/download/${relativePath}`;
  }

  async getFileBuffer(storagePath: string): Promise<Buffer> {
    const relativePath = storagePath.replace('local://', '');
    const fullPath = path.join(UPLOAD_DIR, relativePath);
    return await fs.readFile(fullPath);
  }
}

// Export a singleton instance
export const storageService = new LocalDiskStorage();
