import {
  ApplicantProfile,
  Education,
  JobApplication,
  JobOpening,
  Skill,
} from '../generated/prisma/client.js';

export type ProfileWithRelations = ApplicantProfile & {
  skills: Array<{ requirement: Pick<Skill, 'id' | 'name' | 'description'> }>;
  educationalBackground: Education[];
  applications: Array<JobApplication & { jobOpening: JobOpening }>;
};
