import { Controller, Get } from '@nestjs/common';
import { RelationshipService } from './relationship.service';

@Controller()
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Get()
  getHello(): string {
    return this.relationshipService.getHello();
  }
}
