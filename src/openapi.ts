import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function buildOpenApiConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('TalentLens API')
    .setDescription('REST API for the TalentLens recruiting platform')
    .setVersion('1.0')
    .addTag('login', 'Authentication')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access token returned by POST /login or /login/refresh; refresh token is used only by /login/refresh',
      },
      'bearer',
    )
    .addTag('users', 'Company user accounts')
    .build();
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, buildOpenApiConfig());
}
