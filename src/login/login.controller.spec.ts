import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { LoginController } from './login.controller.js';
import { LoginService } from './login.service.js';

describe('LoginController refresh endpoint', () => {
  let app: INestApplication;
  const loginService = {
    login: vi.fn(),
    refresh: vi.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [{ provide: LoginService, useValue: loginService }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    loginService.refresh.mockClear();
  });

  afterEach(async () => {
    await app.close();
  });

  it('uses the bearer header and accepts no request body', async () => {
    await request(app.getHttpServer())
      .post('/login/refresh')
      .set('Authorization', 'Bearer refresh-token')
      .expect(200)
      .expect({
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });

    expect(loginService.refresh).toHaveBeenCalledWith('refresh-token');
  });

  it('rejects requests without a bearer refresh token', async () => {
    await request(app.getHttpServer()).post('/login/refresh').expect(401);
    expect(loginService.refresh).not.toHaveBeenCalled();
  });
});
