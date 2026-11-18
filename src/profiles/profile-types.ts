import {
  ApplicantProfile,
  CompetencyEvidence,
  CulturalFit,
  Education,
  JobApplication,
  JobOpening,
  ProfileInterview,
  Skill,
  User,
} from '../generated/prisma/client.js';

export type ProfileWithRelations = ApplicantProfile & {
  skills: Array<{ requirement: Pick<Skill, 'id' | 'name' | 'description'> }>;
  culturalFits: Array<{ culturalFit: Pick<CulturalFit, 'id' | 'name' | 'description'> }>;
  educationalBackground: Education[];
  profileInterviews: ProfileInterview[];
  competencyEvidence?: CompetencyEvidence[];
  applications: Array<JobApplication & { jobOpening: JobOpening; closedBy?: Pick<User, 'id' | 'name'> | null }>;
};
