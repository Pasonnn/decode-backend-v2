import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

describe('WalletController', () => {
  let walletController: WalletController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [WalletService],
    }).compile();

    walletController = app.get<WalletController>(WalletController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(walletController.getHello()).toBe('Hello World!');
    });
  });
});
