import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hashSync } from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/request/register.dto';
import { SignOutDto } from './dto/request/sign-out.dto';
import { SignInDto } from './dto/request/signIn.dto';
import { RetrieveTokenDto } from './dto/response/retrieve-token.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  async register({
    password,
    ...input
  }: RegisterDto): Promise<RetrieveTokenDto> {
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

  async signIn({ email, password }: SignInDto): Promise<RetrieveTokenDto> {
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

  async signOut(signOutDto: SignOutDto): Promise<void> {
    try {
      const { sub } = this.jwtService.verify(signOutDto.token, {
        secret: process.env.JWT_SECRET as string,
      });

      await this.prisma.token.delete({
        where: {
          sub: sub as string,
        },
      });
    } catch (error) {
      throw new PreconditionFailedException('Wrong token');
    }
  }
}
