import { Controller } from '@nestjs/common';
import { UserSyncService } from './services/user-sync.service';
import { MessagePattern } from '@nestjs/microservices';
import type { UserNeo4jDoc } from './interfaces/user-neo4j-doc.interface';
import type { Response } from './interfaces/response.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('neo4jdb-sync')
export class Neo4jdbSyncController {
  constructor(private readonly userSyncService: UserSyncService) {}

  @MessagePattern('create-user')
  async createUser(user: CreateUserDto): Promise<Response<UserNeo4jDoc>> {
    const create_user_response = await this.userSyncService.createUser(user);
    return create_user_response;
  }

  @MessagePattern('update-user')
  async updateUser(user: UpdateUserDto): Promise<Response<UserNeo4jDoc>> {
    const update_user_response = await this.userSyncService.updateUser(user);
    return update_user_response;
  }
}
