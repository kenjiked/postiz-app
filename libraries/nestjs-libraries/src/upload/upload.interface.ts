export interface IUploadProvider {
  uploadSimple(path: string): Promise<string>;
  uploadFile(file: Express.Multer.File): Promise<any>;
  uploadBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string>;
  removeFile(filePath: string): Promise<void>;
}
