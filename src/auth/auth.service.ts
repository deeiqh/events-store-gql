import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hashSync } from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterInput } from './dto/register.input';
import { SignInInput } from './dto/sign-in.input';
import { Token } from './entities/token.entity';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  async register({ password, ...input }: RegisterInput): Promise<Token> {
    const userFound = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (userFound) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        password: hashSync(password),
        ...input,
      },
    });

    const tokenDto = await this.tokenService.generateTokenDto(user.id);

    return tokenDto;
  }

  async signIn({ email, password }: SignInInput): Promise<Token> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordOk = compareSync(password, user.password);

    if (!isPasswordOk) {
      throw new BadRequestException('Invalid password');
    }

    const tokenDto = await this.tokenService.generateTokenDto(user.id);
    return tokenDto;
  }

  async signOut(token: string): Promise<string> {
    try {
      const { sub } = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET as string,
      });

      await this.prisma.token.delete({
        where: {
          sub: sub as string,
        },
      });
      return 'SignedOut';
    } catch (error) {
      throw new PreconditionFailedException('Wrong token');
    }
  }
}
