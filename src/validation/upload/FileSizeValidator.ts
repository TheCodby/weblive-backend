import { Injectable, FileValidator } from '@nestjs/common';
export type MaxFileSizeValidatorOptions = {
  maxSize: number;
  message?: string | ((maxSize: number) => string);
};
@Injectable()
export class FileSizeValidator extends FileValidator<MaxFileSizeValidatorOptions> {
  isValid(file?: any): boolean | Promise<boolean> {
    return file.size < this.validationOptions.maxSize;
  }
  buildErrorMessage(file: any): string {
    return 'the maximum file size for uploads or message attachments is 5 MB.';
  }
}
