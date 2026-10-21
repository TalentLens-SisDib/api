import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
} from '@nestjs/common';
export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class CvFilePipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
  transform(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('A CV PDF file is required in the "cv" field');
    }

    if (file.size > MAX_CV_SIZE_BYTES) {
      throw new PayloadTooLargeException(`CV file must be ${MAX_CV_SIZE_BYTES / (1024 * 1024)} MB or smaller`);
    }

    if (
      file.mimetype !== 'application/pdf' ||
      !file.buffer?.subarray(0, 1024).includes(Buffer.from('%PDF-'))
    ) {
      throw new BadRequestException('Only valid PDF files are allowed');
    }

    return file;
  }
}
