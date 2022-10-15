import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenFactory } from 'src/utils/factories/token.factory';
import { UserFactory } from 'src/utils/factories/user.factory';
import { clearDatabase } from 'src/utils/prisma/prisma.util';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { RegisterInput } from './dto/register.input';
import { SignInInput } from './dto/sign-in.input';
import { Activity } from '@prisma/client';

describe('AuthService', () => {
  let prisma: PrismaService;
  let service: AuthService;
  let userFactory: UserFactory;
  let tokenFactory: TokenFactory;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, TokenService, PrismaService, JwtService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    userFactory = new UserFactory(prisma);
    tokenFactory = new TokenFactory(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    let data: RegisterInput;

    beforeEach(() => {
      data = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      } as RegisterInput;
    });

    it('should throw error if email already registered', async () => {
      const data = await userFactory.make();
      await expect(
        service.register(plainToInstance(RegisterInput, data)),
      ).rejects.toThrowError(
        new BadRequestException('Email already registered'),
      );
    });

    it('should return tokenDto if input data is ok', async () => {
      const result = await service.register(data);
      expect(result).toHaveProperty('token');
    });
  });

  describe('signIn', () => {
    let dataSignIn: SignInInput;

    beforeEach(() => {
      dataSignIn = plainToInstance(SignInInput, {
        email: faker.internet.email(),
        password: faker.internet.password(),
      });
    });

    it('should throw an error if user not found', async () => {
      await expect(service.signIn(dataSignIn)).rejects.toThrowError(
        new UnauthorizedException('User not found'),
      );
    });

    it('should throw an error if incorrect password', async () => {
      const { email } = await userFactory.make();
      dataSignIn = { ...dataSignIn, email } as SignInInput;

      await expect(service.signIn(dataSignIn)).rejects.toThrowError(
        new UnauthorizedException('Invalid password'),
      );
    });

    it('should create authorization token', async () => {
      const password = faker.internet.password();
      const { email } = await userFactory.make({ password });
      dataSignIn = plainToInstance(SignInInput, {
        password,
        email,
      });

      await expect(service.signIn(dataSignIn)).resolves.toHaveProperty('token');
    });
  });

  describe('signOut', () => {
    it('should throw error if invalid token', async () => {
      const token = faker.datatype.string();
      await expect(service.signOut(token)).rejects.toThrowError(
        new PreconditionFailedException('Wrong token'),
      );
    });

    it('should delete the token', async () => {
      const token = await tokenFactory.make({
        sub: faker.datatype.string(),
        activity: Activity.AUTHENTICATE,
        user: { connect: { id: (await userFactory.make()).id } },
      });

      jest
        .spyOn(jwtService, 'verify')
        .mockImplementation(jest.fn(() => ({ sub: token.sub })));

      const result = await service.signOut(faker.datatype.string());

      expect(result).toBe('SignedOut');
    });
  });
});
