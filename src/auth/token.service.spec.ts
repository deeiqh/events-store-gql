import { faker } from '@faker-js/faker';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserFactory } from 'src/utils/factories/user.factory';
import { clearDatabase } from 'src/utils/prisma/prisma.util';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { Activity } from '@prisma/client';
import { SignInInput } from './dto/sign-in.input';
import { SendgridService } from './sendgrid.service';
import { ConfigService } from '@nestjs/config';

describe('TokenService', () => {
  let prisma: PrismaService;
  let service: AuthService;
  let tokenService: TokenService;
  let userFactory: UserFactory;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        PrismaService,
        JwtService,
        SendgridService,
        ConfigService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    userFactory = new UserFactory(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('createTokenRecord', () => {
    it("should thrown an error if the user doesn't exist", async () => {
      await expect(
        tokenService.createTokenRecord(
          faker.datatype.string(),
          Activity.AUTHENTICATE,
        ),
      ).rejects.toThrowError(new NotFoundException('User not found'));
    });

    it('should thrown an error if user is already signed in', async () => {
      const data = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const user = await userFactory.make(data);
      await service.signIn(data as SignInInput);

      await expect(
        tokenService.createTokenRecord(user.id, Activity.AUTHENTICATE),
      ).rejects.toThrowError(
        new ForbiddenException(
          'Forbidden signing in again. Now you are signed out.',
        ),
      );
    });
  });

  describe('generateTokenDto', () => {
    it('should generate confirm email token', async () => {
      const { id } = await userFactory.make();
      const activity = Activity.RESET_PASSWORD;

      jest.spyOn(jwtService, 'sign').mockImplementation(jest.fn(() => 'abcde'));

      const result = await tokenService.generateTokenDto(id, activity);

      expect(result).toHaveProperty('token', 'abcde');
    });
  });
});
