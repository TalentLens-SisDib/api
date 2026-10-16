import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

const DEFAULT_ORIGINS = ['http://localhost:5173'];

export function getAllowedOrigins(): string[] {
  const origins = process.env['CORS_ORIGINS'];

  if (origins === undefined || origins.trim() === '') {
    return DEFAULT_ORIGINS;
  }

  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  };
}
