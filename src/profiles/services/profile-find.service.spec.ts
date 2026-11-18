import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProfileFindService } from './profile-find.service.js';

describe('ProfileFindService company scoping', () => {
  const prisma = { applicantProfile: { findMany: vi.fn(), findFirst: vi.fn() } };
  let service: ProfileFindService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProfileFindService(prisma as unknown as PrismaService);
  });

  it('lists only the profiles of the given company', async () => {
    prisma.applicantProfile.findMany.mockResolvedValue([]);
    await service.findAll(3);
    expect(prisma.applicantProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 3 },
        include: expect.objectContaining({ createdBy: { select: { id: true, name: true } } }),
      }),
    );
  });

  it('answers 404 for a profile owned by another company', async () => {
    prisma.applicantProfile.findFirst.mockResolvedValue(null);
    await expect(service.findById('p1', 3)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.applicantProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', companyId: 3 } }),
    );
  });
});
