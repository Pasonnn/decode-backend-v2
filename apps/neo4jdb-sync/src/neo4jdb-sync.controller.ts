import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { UserNeo4jDoc } from './interfaces/user-neo4j-doc.interface';
import type { Response } from './interfaces/response.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RabbitMQInfrastructure } from './infrastructure/rabbitmq.infrastructure';

@Controller('neo4jdb-sync')
export class Neo4jdbSyncController {
  constructor(
    private readonly rabbitMQInfrastructure: RabbitMQInfrastructure,
  ) {}

  @MessagePattern('create_user_request')
  async createUser(user: CreateUserDto): Promise<Response<UserNeo4jDoc>> {
    await this.rabbitMQInfrastructure.processCreateUserRequest(user);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User created successfully',
    };
  }

  @MessagePattern('update_user_request')
  async updateUser(user: UpdateUserDto): Promise<Response<UserNeo4jDoc>> {
    console.log('updateUser', user);
    await this.rabbitMQInfrastructure.processUpdateUserRequest(user);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
    };
  }
}
