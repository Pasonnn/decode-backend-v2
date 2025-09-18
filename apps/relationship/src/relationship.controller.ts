import { Controller, Param } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

// Interface Import
import type { UserDoc } from './interfaces/user-doc.interface';
import { UserNeo4jDoc } from './interfaces/user-neo4j-doc.interface';
import type { Response } from './interfaces/response.interface';

// Service Import
import { UserService } from './services/user.service';
import { FollowService } from './services/follow.service';
import { BlockService } from './services/block.service';
import { MutualsService } from './services/mutuals.service';
import { SearchService } from './services/search.service';
import { SuggestService } from './services/suggest.service';

@Controller('relationship')
export class RelationshipController {
  constructor(private readonly userService: UserService) {}

  @
}
