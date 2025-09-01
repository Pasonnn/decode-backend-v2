import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';
import { ProfileService } from './services/profile.service';
import { UsernameService } from './services/username.service';
import { SearchService } from './services/search.service';
import { EmailService } from './services/email.service';
import { User, UserSchema } from './schemas/user.schema';
import { RedisInfrastructure } from 'apps/auth/src/infrastructure/redis.infrastructure';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ClientsModule.register([
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'email_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [
    ProfileService,
    UsernameService,
    SearchService,
    EmailService,
    RedisInfrastructure,
  ],
  exports: [ProfileService, UsernameService, SearchService, EmailService],
})
export class UserModule {}
