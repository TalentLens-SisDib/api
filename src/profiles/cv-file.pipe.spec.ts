import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CvFilePipe, MAX_CV_SIZE_BYTES } from './cv-file.pipe.js';

describe('CvFilePipe', () => {
  const pipe = new CvFilePipe();
  const validFile = {
    mimetype: 'application/pdf',
    size: 8,
    buffer: Buffer.from('%PDF-1.7'),
  } as Express.Multer.File;

  it('accepts a PDF with a PDF signature', () => {
    expect(pipe.transform(validFile)).toBe(validFile);
  });

  it('rejects a missing file, incorrect MIME type, and invalid PDF signature', () => {
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
    expect(() => pipe.transform({ ...validFile, mimetype: 'text/plain' })).toThrow(BadRequestException);
    expect(() => pipe.transform({ ...validFile, buffer: Buffer.from('not a PDF') })).toThrow(BadRequestException);
  });

  it('rejects PDFs larger than the parser limit', () => {
    expect(() => pipe.transform({ ...validFile, size: MAX_CV_SIZE_BYTES + 1 })).toThrow(PayloadTooLargeException);
  });
});
