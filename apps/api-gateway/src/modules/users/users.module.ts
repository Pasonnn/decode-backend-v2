import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UserServiceClient } from '../../infrastructure/external-services/user-service.client';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [UsersController],
  providers: [UserServiceClient, UsersService],
  exports: [UserServiceClient, UsersService],
})
export class UsersModule {}
