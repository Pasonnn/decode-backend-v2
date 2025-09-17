import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

// Interface Import
import type { UserDoc } from './interfaces/user-doc.interface';
import { UserNeo4jDoc } from './interfaces/user-neo4j-doc.interface';
import type { Response } from './interfaces/response.interface';

// Service Import
import { UserService } from './services/user.service';

@Controller()
export class RelationshipController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('relationship/sync/create-user')
  async createUser(user: UserDoc): Promise<Response<UserNeo4jDoc>> {
    const create_user_response = await this.userService.createUser(user);
    return create_user_response;
  }

  @MessagePattern('relationship/sync/update-user')
  async updateUser(user: UserDoc): Promise<Response<UserNeo4jDoc>> {
    const update_user_response = await this.userService.updateUser(user);
    return update_user_response;
  }
}
