import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationServiceClient } from '../../infrastructure/external-services/notification-service.client';

@Module({
  imports: [HttpModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationServiceClient],
  exports: [NotificationService],
})
export class NotificationModule {}
