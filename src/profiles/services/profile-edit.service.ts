import { Injectable } from '@nestjs/common';
import { Prisma, ApplicantProfile } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
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
  ): Promise<ApplicantProfile & { skills: Array<{ requirement: { id: string; name: string; description: string | null } }> }> {
    await this.profileFindService.findById(id);

    const { skills, ...updateData } = dto;

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
      },
    });
  }
}