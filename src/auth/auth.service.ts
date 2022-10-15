import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Activity, Prisma } from '@prisma/client';
import { compareSync, hashSync } from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { RegisterInput } from './dto/register.input';
import { SignInInput } from './dto/sign-in.input';
import { Token } from './entities/token.entity';
import { SendgridService } from './sendgrid.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly sendgridService: SendgridService,
    private readonly configService: ConfigService,
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

  async forgotPassword(input: ForgotPasswordInput): Promise<string> {
    const { email } = input;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { token, expiration } = await this.tokenService.generateTokenDto(
      user.id,
      Activity.RESET_PASSWORD,
    );

    const mail = {
      to: email,
      subject: 'Reset password',
      from: this.configService.get<string>('SENDGRID_EMAIL') as string,
      text: `Token\n${token}\nExpiration\n${expiration}`,
      html: `<p>Token<br>${token}<br>Expiration<br>${expiration}</p>`,
    };

    return await this.sendgridService.send(mail);
  }

  async resetPassword(token: string, password: string): Promise<string> {
    try {
      const { sub } = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET as string,
      });

      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient): Promise<string> => {
          const tokenRecord = await tx.token.delete({
            where: {
              sub: sub as string,
            },
            select: {
              userId: true,
            },
          });

          await this.prisma.user.update({
            where: {
              id: tokenRecord.userId,
            },
            data: {
              password: hashSync(password),
            },
          });
          return 'Password changed';
        },
      );
    } catch (error) {
      throw new PreconditionFailedException('Wrong token');
    }
  }
}
