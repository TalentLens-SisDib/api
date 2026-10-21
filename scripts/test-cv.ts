import 'dotenv/config';
import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { HttpException } from '@nestjs/common';
import { AiService, MAX_CV_BYTES } from '../src/profiles/services/ai.service.js';

// Exercise the real PDF/provider pipeline without creating database records.
async function main() {
  const path = process.argv[2];
  if (!path) {
    throw new Error('Usage: npm run test:cv -- "path/to/cv.pdf"');
  }
  const fileStat = await stat(path);
  if (!fileStat.isFile() || fileStat.size > MAX_CV_BYTES) {
    throw new Error('Provide a PDF file of at most 5 MB');
  }
  const file = {
    buffer: await readFile(path),
    originalname: basename(path),
    mimetype: 'application/pdf',
    size: fileStat.size,
  } as Express.Multer.File;
  const profile = await new AiService().parsePdf(file);
  console.log(JSON.stringify(profile, null, 2));
}

try {
  await main();
} catch (error) {
  if (error instanceof HttpException) {
    console.error(`CV test failed (HTTP ${error.getStatus()}): ${error.message}`);
  } else {
    console.error(error instanceof Error ? error.message : 'CV test failed');
  }
  process.exitCode = 1;
}
