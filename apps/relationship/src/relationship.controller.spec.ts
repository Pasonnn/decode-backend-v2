import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';

describe('RelationshipController', () => {
  let relationshipController: RelationshipController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RelationshipController],
      providers: [RelationshipService],
    }).compile();

    relationshipController = app.get<RelationshipController>(RelationshipController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(relationshipController.getHello()).toBe('Hello World!');
    });
  });
});
