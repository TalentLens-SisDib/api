import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TalentPoolService } from './talent-pool.service.js';

describe('TalentPoolService company scoping', () => {
  const prisma = {
    applicantProfile: { findFirst: vi.fn() },
    talentPoolEntry: { findMany: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), findUniqueOrThrow: vi.fn() },
    $transaction: vi.fn(),
  };
  let service: TalentPoolService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TalentPoolService(prisma as unknown as PrismaService);
  });

  it('lists only entries whose profile belongs to the company', async () => {
    prisma.talentPoolEntry.findMany.mockResolvedValue([]);
    await expect(service.findAll(3)).resolves.toEqual([]);
    expect(prisma.talentPoolEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profile: { companyId: 3 } } }),
    );
  });

  it('does not add a profile owned by another company', async () => {
    prisma.applicantProfile.findFirst.mockResolvedValue(null);
    await expect(service.upsert(3, 'p1', null, 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('answers 404 when removing an entry of another company', async () => {
    prisma.talentPoolEntry.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.remove(3, 'p1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.talentPoolEntry.deleteMany).toHaveBeenCalledWith({
      where: { profileId: 'p1', profile: { companyId: 3 } },
    });
  });
});
