import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/request/register.dto';
import { SignOutDto } from './dto/request/sign-out.dto';
import { SignInDto } from './dto/request/signIn.dto';
import { RetrieveTokenDto } from './dto/response/retrieve-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 201, type: RetrieveTokenDto })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RetrieveTokenDto> {
    return await this.authService.register(registerDto);
  }

  @ApiResponse({ status: 201, type: RetrieveTokenDto })
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto): Promise<RetrieveTokenDto> {
    return await this.authService.signIn(signInDto);
  }

  @ApiResponse({ status: 201 })
  @Post('sign-out')
  async signOut(@Body() signOutDto: SignOutDto): Promise<void> {
    return await this.authService.signOut(signOutDto);
  }
}
