import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import {
  isForeignKeyConstraintViolation,
  isRecordNotFound,
} from '../prisma/prisma-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  toProfileCulturalFits,
  toProfileSkills,
} from '../profiles/profile-response-mappers.js';
import type { TalentPoolEntryResponseDto } from './dto/talent-pool-entry-response.dto.js';

const entrySelect = {
  profileId: true,
  note: true,
  addedAt: true,
  updatedAt: true,
  addedBy: { select: { id: true, name: true } },
  profile: {
    select: {
      id: true,
      name: true,
      description: true,
      skills: { select: { requirement: { select: { id: true, name: true } } } },
      culturalFits: {
        select: { culturalFit: { select: { id: true, name: true } } },
      },
    },
  },
} satisfies Prisma.TalentPoolEntrySelect;

function toEntryResponse({
  profile,
  ...entry
}: Prisma.TalentPoolEntryGetPayload<{
  select: typeof entrySelect;
}>): TalentPoolEntryResponseDto {
  return {
    ...entry,
    profile: {
      ...profile,
      skills: toProfileSkills(profile.skills),
      culturalFits: toProfileCulturalFits(profile.culturalFits),
    },
  };
}

@Injectable()
export class TalentPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string): Promise<TalentPoolEntryResponseDto[]> {
    const entries = await this.prisma.talentPoolEntry.findMany({
      orderBy: { addedAt: 'desc' },
      select: entrySelect,
    });
    const term = search?.trim().toLowerCase();

    // SQLite's built-in LIKE only folds ASCII case.
    return (
      term
        ? entries.filter(({ note, profile }) =>
            [
              note,
              profile.name,
              ...profile.skills.map(({ requirement }) => requirement.name),
              ...profile.culturalFits.map(
                ({ culturalFit }) => culturalFit.name,
              ),
            ].some((value) => value?.toLowerCase().includes(term)),
          )
        : entries
    ).map(toEntryResponse);
  }

  async findOne(profileId: string): Promise<TalentPoolEntryResponseDto> {
    const entry = await this.prisma.talentPoolEntry.findUnique({
      where: { profileId },
      select: entrySelect,
    });
    if (!entry) {
      throw new NotFoundException(
        `Profile with id ${profileId} is not in the talent pool`,
      );
    }
    return toEntryResponse(entry);
  }

  async upsert(
    profileId: string,
    note: string | null,
    addedById: number,
  ): Promise<TalentPoolEntryResponseDto> {
    try {
      // Keep relation reads out of the upsert so Prisma can use SQLite's atomic upsert.
      const [, entry] = await this.prisma.$transaction([
        this.prisma.talentPoolEntry.upsert({
          where: { profileId },
          create: { profileId, note, addedById },
          update: { note },
          select: { profileId: true },
        }),
        this.prisma.talentPoolEntry.findUniqueOrThrow({
          where: { profileId },
          select: entrySelect,
        }),
      ]);
      return toEntryResponse(entry);
    } catch (error) {
      if (isForeignKeyConstraintViolation(error)) {
        const profile = await this.prisma.applicantProfile.findUnique({
          where: { id: profileId },
          select: { id: true },
        });
        if (!profile) {
          throw new NotFoundException(`Profile with id ${profileId} not found`);
        }
        throw new UnauthorizedException('The requesting user no longer exists');
      }
      throw error;
    }
  }

  async remove(profileId: string): Promise<void> {
    try {
      await this.prisma.talentPoolEntry.delete({
        where: { profileId },
        select: { profileId: true },
      });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new NotFoundException(
          `Profile with id ${profileId} is not in the talent pool`,
        );
      }
      throw error;
    }
  }
}
