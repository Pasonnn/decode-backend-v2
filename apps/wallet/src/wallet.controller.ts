import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getHello(): string {
    return this.walletService.getHello();
  }
}
