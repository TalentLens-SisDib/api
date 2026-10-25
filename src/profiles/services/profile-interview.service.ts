import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AddProfileInterviewDto } from '../dto/add-profile-interview.dto.js';
import { ProfileInterviewResponseDto } from '../dto/profile-interview-response.dto.js';

@Injectable()
export class ProfileInterviewService {
  constructor(private readonly prisma: PrismaService) {}

  async addInterviewToProfile(profileId: string, dto: AddProfileInterviewDto): Promise<ProfileInterviewResponseDto> {
    const profile = await this.prisma.applicantProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    const interview = await this.prisma.interview.findUnique({
      where: { id: dto.interviewId },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID ${dto.interviewId} not found`);
    }

    const existing = await this.prisma.profileInterview.findUnique({
      where: {
        interviewId_profileId: {
          interviewId: dto.interviewId,
          profileId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('This interview is already associated with this profile');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();

    const profileInterview = await this.prisma.profileInterview.create({
      data: {
        interviewId: dto.interviewId,
        profileId,
        transcript: dto.transcript,
        keyTakeaways: JSON.stringify(dto.keyTakeaways || []),
        startDate,
      },
    });

    return {
      id: profileInterview.id,
      interviewId: profileInterview.interviewId,
      profileId: profileInterview.profileId,
      transcript: profileInterview.transcript,
      keyTakeaways: profileInterview.keyTakeaways,
      startDate: profileInterview.startDate,
      createdAt: profileInterview.createdAt,
      updatedAt: profileInterview.updatedAt,
    };
  }

  async findByProfile(profileId: string): Promise<ProfileInterviewResponseDto[]> {
    const profile = await this.prisma.applicantProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    const profileInterviews = await this.prisma.profileInterview.findMany({
      where: { profileId },
      orderBy: { startDate: 'desc' },
    });

    return profileInterviews.map((pi) => ({
      id: pi.id,
      interviewId: pi.interviewId,
      profileId: pi.profileId,
      transcript: pi.transcript,
      keyTakeaways: pi.keyTakeaways,
      startDate: pi.startDate,
      createdAt: pi.createdAt,
      updatedAt: pi.updatedAt,
    }));
  }

  async findById(id: string): Promise<ProfileInterviewResponseDto> {
    const profileInterview = await this.prisma.profileInterview.findUnique({
      where: { id },
    });

    if (!profileInterview) {
      throw new NotFoundException(`Profile interview with ID ${id} not found`);
    }

    return {
      id: profileInterview.id,
      interviewId: profileInterview.interviewId,
      profileId: profileInterview.profileId,
      transcript: profileInterview.transcript,
      keyTakeaways: profileInterview.keyTakeaways,
      startDate: profileInterview.startDate,
      createdAt: profileInterview.createdAt,
      updatedAt: profileInterview.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    const profileInterview = await this.prisma.profileInterview.findUnique({
      where: { id },
    });

    if (!profileInterview) {
      throw new NotFoundException(`Profile interview with ID ${id} not found`);
    }

    await this.prisma.profileInterview.delete({
      where: { id },
    });
  }
}