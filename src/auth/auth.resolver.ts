import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { RegisterInput } from './dto/register.input';
import { SignInInput } from './dto/sign-in.input';
import { Token } from './entities/token.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => Token)
  async register(@Args('input') registerInput: RegisterInput): Promise<Token> {
    return this.authService.register(registerInput);
  }

  @Mutation(() => Token)
  async signIn(@Args('input') signInInput: SignInInput): Promise<Token> {
    return await this.authService.signIn(signInInput);
  }

  @Mutation(() => String)
  async signOut(@Args('token') token: string): Promise<string> {
    return await this.authService.signOut(token);
  }

  @Mutation(() => String)
  async forgotPassword(
    @Args('input') input: ForgotPasswordInput,
  ): Promise<string> {
    return await this.authService.forgotPassword(input);
  }

  @Mutation(() => String)
  async resetPassword(
    @Args('token') token: string,
    @Args('password') password: string,
  ): Promise<string> {
    return await this.authService.resetPassword(token, password);
  }
}
