import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(id: string) {
    const user = new User();
    user.id = id;
    return user;
  }

  async updateUser(id: string, updateUserInput: UpdateUserInput) {
    const user = new User();
    user.id = id;
    user.firstName = updateUserInput.firstName as string;
    return user;
  }
}
