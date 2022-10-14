import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Activity, Prisma, Token } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrors } from 'src/utils/enums/prisma-errors.enum';
import { Token as TokenDto } from './entities/token.entity';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async generateTokenDto(
    userId: string,
    activity = Activity.AUTHENTICATE,
  ): Promise<TokenDto> {
    const iat = new Date().getTime();
    const sub = (await this.createTokenRecord(userId, activity)).sub;
    const token = this.jwtService.sign({ sub, iat });

    const exp =
      iat +
      parseInt(process.env.JWT_EXPIRATION_TIME_MINUTES as string) * 60 * 1000;
    return plainToInstance(TokenDto, {
      token,
      expiration: new Date(exp).toUTCString(),
    });
  }

  async createTokenRecord(userId: string, activity: Activity): Promise<Token> {
    try {
      const tokenRecord = await this.prisma.token.create({
        data: {
          userId,
          activity,
        },
      });
      return tokenRecord;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case PrismaErrors.FOREIGN_KEY_CONSTRAINT:
            throw new NotFoundException('User not found');
          case PrismaErrors.DUPLICATED: {
            if (activity === Activity.AUTHENTICATE) {
              await this.prisma.token.delete({
                where: {
                  userId_activity: {
                    userId,
                    activity,
                  },
                },
              });
              throw new ForbiddenException(
                'Forbidden signing in again. Now you are signed out.',
              );
            }
            throw new ForbiddenException(
              'Frobidden. Has previous token to confirm the email',
            );
          }
          default:
            throw error;
        }
      }
      throw error;
    }
  }
}
