import {
  ApplicantProfile,
  Education,
  JobApplication,
  JobOpening,
  ProfileInterview,
  Skill,
} from '../generated/prisma/client.js';

export type ProfileWithRelations = ApplicantProfile & {
  skills: Array<{ requirement: Pick<Skill, 'id' | 'name' | 'description'> }>;
  educationalBackground: Education[];
  profileInterviews: ProfileInterview[];
  applications: Array<JobApplication & { jobOpening: JobOpening }>;
};
