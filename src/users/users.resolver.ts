import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Order } from 'src/events/entities/order.entity';
import { GetUser } from 'src/utils/decorators/get-user.decorator';
import { GqlAuthGuard } from 'src/utils/guards/gql.guard';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async getUser(@GetUser() userId: string): Promise<User> {
    return await this.usersService.getUser(userId);
  }

  @Mutation(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @GetUser() userId: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return await this.usersService.updateUser(userId, updateUserInput);
  }

  @Query(() => Order, { name: 'cart' })
  @UseGuards(GqlAuthGuard)
  async getCart(@GetUser() userId: string): Promise<Order> {
    return await this.usersService.getCart(userId);
  }
}
