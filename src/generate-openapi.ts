import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { createOpenApiDocument } from './openapi.js';

const outputPath = new URL('../openapi.json', import.meta.url);

const app = await NestFactory.create(AppModule, { logger: false });

try {
  const document = createOpenApiDocument(app);
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`OpenAPI document written to ${outputPath.pathname}`);
} finally {
  await app.close();
}
