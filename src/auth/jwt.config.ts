const DEFAULT_TTL_SECONDS = 3600;
const DEFAULT_REFRESH_TTL_SECONDS = 604800;

export const JWT_TTL_SECONDS = Number(
  process.env['JWT_TTL_SECONDS'] ?? DEFAULT_TTL_SECONDS,
);
export const JWT_REFRESH_TTL_SECONDS = Number(
  process.env['JWT_REFRESH_TTL_SECONDS'] ?? DEFAULT_REFRESH_TTL_SECONDS,
);

export function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];

  if (secret === undefined || secret === '') {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return secret;
}
