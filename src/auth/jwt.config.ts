const DEFAULT_TTL_SECONDS = 3600;

export const JWT_TTL_SECONDS = Number(
  process.env['JWT_TTL_SECONDS'] ?? DEFAULT_TTL_SECONDS,
);

export function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];

  if (secret === undefined || secret === '') {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return secret;
}
