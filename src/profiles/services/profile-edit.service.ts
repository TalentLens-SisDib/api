import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { ProfileWithRelations } from '../profile-types.js';
import { ProfileFindService } from './profile-find.service.js';
import { SkillsService } from './skills.service.js';

@Injectable()
export class ProfileEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileFindService: ProfileFindService,
    private readonly skillsService: SkillsService,
  ) {}

  async update(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileWithRelations> {
    await this.profileFindService.findById(id);

    const { skills, educationalBackground, ...updateData } = dto;

    return await this.prisma.$transaction(async (tx) => {
      await tx.applicantProfile.update({
        where: { id },
        data: updateData,
      });

      if (skills !== undefined) {
        await tx.profileSkill.deleteMany({
          where: { profileId: id },
        });

        if (skills.length > 0) {
          const skillRecords = await this.skillsService.upsertSkills(tx, skills);
          await tx.profileSkill.createMany({
            data: skillRecords.map((skill) => ({
              profileId: id,
              requirementId: skill.id,
            })),
          });
        }
      }

      if (educationalBackground !== undefined) {
        await tx.education.deleteMany({ where: { profileId: id } });

        if (educationalBackground.length > 0) {
          await tx.education.createMany({
            data: educationalBackground.map(({ startDate, endDate, ...education }) => ({
              ...education,
              startDate: new Date(startDate),
              endDate: endDate ? new Date(endDate) : null,
              profileId: id,
            })),
          });
        }
      }

      return this.findByIdWithSkills(tx, id);
    });
  }

  private async findByIdWithSkills(tx: Prisma.TransactionClient, id: string) {
    return tx.applicantProfile.findUniqueOrThrow({
      where: { id },
      include: {
        skills: {
          include: {
            requirement: true,
          },
        },
        educationalBackground: true,
        applications: {
          include: {
            jobOpening: true,
          },
        },
        profileInterviews: {
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }
}
