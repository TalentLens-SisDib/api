import { BadGatewayException, BadRequestException, GatewayTimeoutException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { UploadLinkedinDto } from '../dto/upload-linkedin.dto.js';

@Injectable()
export class ScavioService {
  async getLinkedinPerson(input: UploadLinkedinDto): Promise<Record<string, unknown>> {
    if (Boolean(input.username) === Boolean(input.url)) {
      throw new BadRequestException('Provide exactly one of username or url');
    }
    const apiKey = process.env.SCAVIO_API_KEY?.trim();
    if (!apiKey) throw new ServiceUnavailableException('Configure SCAVIO_API_KEY to import LinkedIn profiles');

    const signal = AbortSignal.timeout(60000);
    try {
      const response = await fetch('https://api.scavio.dev/api/v1/linkedin/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(input.username ? { username: input.username } : { url: input.url }),
        signal,
      });
      if (!response.ok) throw new BadGatewayException(`Scavio returned HTTP ${response.status}`);
      const result: unknown = await response.json();
      if (!result || typeof result !== 'object' || Array.isArray(result)
        || !('data' in result) || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
        throw new BadGatewayException('Scavio returned an invalid LinkedIn profile');
      }
      return result.data as Record<string, unknown>;
    } catch (error) {
      if (signal.aborted) throw new GatewayTimeoutException('Scavio request timed out');
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException('Unable to read a response from Scavio');
    }
  }
}
