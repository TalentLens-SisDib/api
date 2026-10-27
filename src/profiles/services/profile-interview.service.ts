import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthPayload } from '../../auth/auth-payload.js';
import { Prisma, ProfileInterview } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  isForeignKeyConstraintViolation,
  isUniqueConstraintViolation,
} from '../../prisma/prisma-error.js';
import { AddProfileInterviewDto } from '../dto/add-profile-interview.dto.js';
import { ProfileInterviewResponseDto } from '../dto/profile-interview-response.dto.js';
import { UpdateProfileInterviewDto } from '../dto/update-profile-interview.dto.js';

@Injectable()
export class ProfileInterviewService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(pi: ProfileInterview): ProfileInterviewResponseDto {
    return {
      id: pi.id,
      interviewId: pi.interviewId,
      profileId: pi.profileId,
      transcript: pi.transcript,
      keyTakeaways: pi.keyTakeaways,
      startDate: pi.startDate,
      createdAt: pi.createdAt,
      updatedAt: pi.updatedAt,
    };
  }

  private async assertProfileExists(profileId: string): Promise<void> {
    const profile = await this.prisma.applicantProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }
  }

  private assertInterviewOwner(interview: { userId: number }, requester: AuthPayload): void {
    if (interview.userId !== requester.sub) {
      throw new ForbiddenException('Only the owner of the interview can manage its candidate records');
    }
  }

  private async findOwnedRecord(
    requester: AuthPayload,
    profileId: string,
    profileInterviewId: string,
  ): Promise<ProfileInterview> {
    const profileInterview = await this.prisma.profileInterview.findUnique({
      where: { id: profileInterviewId },
      include: { interview: { select: { userId: true } } },
    });
    if (!profileInterview || profileInterview.profileId !== profileId) {
      throw new NotFoundException(`Profile interview with ID ${profileInterviewId} not found for profile ${profileId}`);
    }
    this.assertInterviewOwner(profileInterview.interview, requester);
    return profileInterview;
  }

  async addInterviewToProfile(
    requester: AuthPayload,
    profileId: string,
    dto: AddProfileInterviewDto,
  ): Promise<ProfileInterviewResponseDto> {
    await this.assertProfileExists(profileId);

    const interview = await this.prisma.interview.findUnique({
      where: { id: dto.interviewId },
      include: { step: { select: { jobOpeningId: true } } },
    });
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${dto.interviewId} not found`);
    }
    this.assertInterviewOwner(interview, requester);

    const application = await this.prisma.jobApplication.findUnique({
      where: {
        profileId_jobOpeningId: { profileId, jobOpeningId: interview.step.jobOpeningId },
      },
      select: { profileId: true },
    });
    if (!application) {
      throw new BadRequestException(
        'The profile has not applied to the job opening of this interview step',
      );
    }

    try {
      const profileInterview = await this.prisma.profileInterview.create({
        data: {
          interviewId: dto.interviewId,
          profileId,
          transcript: dto.transcript,
          keyTakeaways: JSON.stringify(dto.keyTakeaways ?? []),
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        },
      });
      return this.toResponse(profileInterview);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('This profile already has a record in this interview');
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new NotFoundException('The profile or interview no longer exists');
      }
      throw error;
    }
  }

  async findByProfile(profileId: string): Promise<ProfileInterviewResponseDto[]> {
    await this.assertProfileExists(profileId);

    const profileInterviews = await this.prisma.profileInterview.findMany({
      where: { profileId },
      orderBy: { startDate: 'desc' },
    });
    return profileInterviews.map((pi) => this.toResponse(pi));
  }

  async findOne(profileId: string, profileInterviewId: string): Promise<ProfileInterviewResponseDto> {
    const profileInterview = await this.prisma.profileInterview.findUnique({
      where: { id: profileInterviewId },
    });
    if (!profileInterview || profileInterview.profileId !== profileId) {
      throw new NotFoundException(`Profile interview with ID ${profileInterviewId} not found for profile ${profileId}`);
    }
    return this.toResponse(profileInterview);
  }

  async update(
    requester: AuthPayload,
    profileId: string,
    profileInterviewId: string,
    dto: UpdateProfileInterviewDto,
  ): Promise<ProfileInterviewResponseDto> {
    await this.findOwnedRecord(requester, profileId, profileInterviewId);

    const data: Prisma.ProfileInterviewUpdateInput = {};
    if (dto.transcript !== undefined) data.transcript = dto.transcript;
    if (dto.keyTakeaways !== undefined) data.keyTakeaways = JSON.stringify(dto.keyTakeaways);
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);

    const updated = await this.prisma.profileInterview.update({
      where: { id: profileInterviewId },
      data,
    });
    return this.toResponse(updated);
  }

  async remove(requester: AuthPayload, profileId: string, profileInterviewId: string): Promise<void> {
    await this.findOwnedRecord(requester, profileId, profileInterviewId);
    await this.prisma.profileInterview.delete({ where: { id: profileInterviewId } });
  }
}
