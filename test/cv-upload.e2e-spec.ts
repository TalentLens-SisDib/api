import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/common/password.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SkillsService } from '../src/profiles/services/skills.service.js';

describe('Authenticated CV upload and persistence', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  const databasePath = join(tmpdir(), `talentlens-cv-${randomUUID()}.db`);
  const fixture = join(process.cwd(), 'test/fixtures/curriculo-mock-ptbr.pdf');
  const fetchMock = vi.fn<typeof fetch>();
  const profile = {
    name: 'MARINA COSTA ALMEIDA', description: 'Desenvolvedora Full Stack',
    skills: ['TypeScript', 'React', 'TypeScript'],
    educationalBackground: [{ institution: 'Instituto Superior Fictício do Paraná', degree: 'Sistemas de Informação', startDate: '2019-02-01', endDate: '2022-12-15' }],
  };

  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL', `file:${databasePath}`);
    vi.stubEnv('JWT_SECRET', 'cv-upload-integration-test-secret');
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    vi.stubEnv('AI_MODEL', 'openrouter/free');
    vi.stubEnv('AI_API_KEY', 'test-only-key');
    vi.stubEnv('AI_API_URL', 'https://provider.example/v1');
    const db = new Database(databasePath);
    try {
      const migrations = join(process.cwd(), 'prisma/migrations');
      for (const entry of readdirSync(migrations, { withFileTypes: true }).filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
        db.exec(readFileSync(join(migrations, entry.name, 'migration.sql'), 'utf8'));
      }
    } finally { db.close(); }
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.create({ data: {
      email: 'cv-test@example.invalid', name: 'Test Recruiter', password: await hashPassword('test-password'),
      company: { create: { name: 'CV test company' } },
    } });
    const login = await request(app.getHttpServer()).post('/login')
      .send({ email: 'cv-test@example.invalid', password: 'test-password' }).expect(200);
    token = login.body.accessToken;
    vi.stubGlobal('fetch', fetchMock);
  });

  beforeEach(() => { fetchMock.mockReset(); });

  afterAll(async () => {
    await app?.close();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    rmSync(databasePath, { force: true });
  });

  it('extracts a real PDF, saves related records and returns the persisted profile', async () => {
    fetchMock.mockResolvedValue(Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(profile) } }] }));
    const upload = await request(app.getHttpServer()).post('/profiles/upload-cv')
      .auth(token, { type: 'bearer' }).attach('cv', fixture).expect(201);
    expect(upload.headers.location).toBe(`/profiles/${upload.body.id}`);
    expect(upload.body.name).toBe(profile.name);
    expect(upload.body.skills.map((s: { skillName: string }) => s.skillName).sort()).toEqual(['React', 'TypeScript']);
    expect(upload.body.educationalBackground[0]).toMatchObject({
      institution: profile.educationalBackground[0].institution,
      startDate: '2019-02-01T00:00:00.000Z', endDate: '2022-12-15T00:00:00.000Z',
    });
    const read = await request(app.getHttpServer()).get(upload.headers.location)
      .auth(token, { type: 'bearer' }).expect(200);
    expect(read.body).toEqual(upload.body);
    const saved = await prisma.applicantProfile.findUniqueOrThrow({
      where: { id: upload.body.id }, include: { skills: true, educationalBackground: true },
    });
    expect(saved.skills).toHaveLength(2);
    expect(saved.skills.every((skill) => skill.profileId === saved.id)).toBe(true);
    expect(saved.educationalBackground).toHaveLength(1);
    expect(saved.educationalBackground.every((education) => education.profileId === saved.id)).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[1].content).toContain(profile.name);
    expect(body.provider.require_parameters).toBe(true);
  });

  it('rolls back profile, education, and new skill writes when persistence fails mid-transaction', async () => {
    const counts = async () => Promise.all([prisma.applicantProfile.count(), prisma.skill.count(), prisma.education.count()]);
    const before = await counts();
    fetchMock.mockResolvedValue(Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
      ...profile, skills: ['Rollback-only skill'],
    }) } }] }));
    const skillsService = app.get(SkillsService);
    const createSkills = skillsService.upsertSkills.bind(skillsService);
    const upsert = vi.spyOn(skillsService, 'upsertSkills').mockImplementation(async (...args) => {
      await createSkills(...args);
      throw new Error('simulated persistence failure');
    });

    try {
      await request(app.getHttpServer()).post('/profiles/upload-cv')
        .auth(token, { type: 'bearer' }).attach('cv', fixture).expect(500);
    } finally {
      upsert.mockRestore();
    }

    expect(await counts()).toEqual(before);
  });

  it('rejects classification output without saving partial profile, skill or education records', async () => {
    const counts = async () => Promise.all([prisma.applicantProfile.count(), prisma.skill.count(), prisma.education.count()]);
    const before = await counts();
    fetchMock.mockResolvedValue(Response.json({ choices: [{ message: { content: 'User Safety: safe' } }] }));
    await request(app.getHttpServer()).post('/profiles/upload-cv')
      .auth(token, { type: 'bearer' }).attach('cv', fixture).expect(502);
    expect(await counts()).toEqual(before);
  });

  it('requires authentication before contacting the provider', async () => {
    await request(app.getHttpServer()).post('/profiles/upload-cv').expect(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
