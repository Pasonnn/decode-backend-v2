import { Injectable } from '@nestjs/common';

@Injectable()
export class RelationshipService {
  getHello(): string {
    return 'Hello World!';
  }
}
