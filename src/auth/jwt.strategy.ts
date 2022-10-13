import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Activity } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      secretOrKey: process.env.JWT_SECRET as string,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any): Promise<string> {
    const tokenRecord = await this.prisma.token.findUnique({
      where: {
        sub: payload.sub,
      },
      select: {
        userId: true,
        activity: true,
      },
    });

    if (!tokenRecord || tokenRecord.activity !== Activity.AUTHENTICATE) {
      throw new UnauthorizedException('Invalid token');
    }

    if (payload.exp < new Date().getTime()) {
      await this.prisma.token.delete({
        where: {
          sub: payload.sub as string,
        },
      });
      throw new UnauthorizedException('Expired token. Now you are signed out');
    }

    return tokenRecord.userId;
  }
}
