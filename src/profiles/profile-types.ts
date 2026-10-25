import {
  ApplicantProfile,
  CulturalFit,
  Education,
  JobApplication,
  JobOpening,
  ProfileInterview,
  Skill,
} from '../generated/prisma/client.js';

export type ProfileWithRelations = ApplicantProfile & {
  skills: Array<{ requirement: Pick<Skill, 'id' | 'name' | 'description'> }>;
  culturalFits: Array<{ culturalFit: Pick<CulturalFit, 'id' | 'name' | 'description'> }>;
  educationalBackground: Education[];
  profileInterviews: ProfileInterview[];
  applications: Array<JobApplication & { jobOpening: JobOpening }>;
};
