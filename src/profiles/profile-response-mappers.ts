import type { ProfileSkillResponseDto } from './dto/profile-skill-response.dto.js';
import type { ProfileCulturalFitResponseDto } from './dto/profile-cultural-fit-response.dto.js';

export function toProfileSkills(
  skills: Array<{ requirement: { id: string; name: string } }>,
): ProfileSkillResponseDto[] {
  return skills.map(({ requirement }) => ({
    skillId: requirement.id,
    skillName: requirement.name,
  }));
}

export function toProfileCulturalFits(
  culturalFits: Array<{ culturalFit: { id: string; name: string } }>,
): ProfileCulturalFitResponseDto[] {
  return culturalFits.map(({ culturalFit }) => ({
    culturalFitId: culturalFit.id,
    culturalFitName: culturalFit.name,
  }));
}
