import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';
import { RelationshipServiceClient } from '../../infrastructure/external-services/relationship-service.client';

@Module({
  imports: [HttpModule],
  controllers: [RelationshipController],
  providers: [RelationshipService, RelationshipServiceClient],
  exports: [RelationshipService],
})
export class RelationshipModule {}
