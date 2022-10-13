import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GetUser } from 'src/utils/decorators/get-user.decorator';
import { GqlGuard } from 'src/utils/guards/gql.guard';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // @Query(() => User, { name: 'user' })
  // async getUser(@Args('id', { type: () => ID }) id: string) {
  //   return await this.usersService.getUser(id);
  // }

  // @Mutation(() => User, { name: 'updateUser' })
  // async update(
  //   @Args('id', { type: () => ID }) id: string,
  //   @Args('updateUserInput') updateUserInput: UpdateUserInput,
  // ) {
  //   return await this.usersService.updateUser(id, updateUserInput);
  // }

  @Query(() => User, { name: 'me' })
  @UseGuards(GqlGuard)
  async getUser(@GetUser() userId: string): Promise<User> {
    return await this.usersService.getUser(userId);
  }

  @Mutation(() => User, { name: 'me' })
  @UseGuards(GqlGuard)
  async updateUser(
    @GetUser() userId: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return await this.usersService.updateUser(userId, updateUserInput);
  }
}
