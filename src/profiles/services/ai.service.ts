import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from '../dto/create-profile.dto.js';

@Injectable()
export class AiService {
  async parsePdf(file: Express.Multer.File): Promise<CreateProfileDto> {
    // TODO: Integrate with AI service to parse PDF and extract profile data
    // - Send PDF to AI parsing service (e.g., another microservice or external API)
    // - Extract name, description, skills, education, experience from CV
    // - Map extracted data to CreateProfileDto
    // For now, return a mock profile
    return {
      name: file.originalname.replace('.pdf', ''),
      description: `Profile created from CV: ${file.originalname}`,
      skills: ['TypeScript', 'React', 'Node.js'],
    };
  }
}