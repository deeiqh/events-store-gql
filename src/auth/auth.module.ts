import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';
import { AuthResolver } from './auth.resolver';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
      signOptions: {
        expiresIn:
          parseInt(process.env.JWT_EXPIRATION_TIME_MINUTES as string) *
          60 *
          1000,
      },
    }),
  ],
  providers: [
    TokenService,
    JwtStrategy,
    PrismaService,
    AuthService,
    AuthResolver,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
