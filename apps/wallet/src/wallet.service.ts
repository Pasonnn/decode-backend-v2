import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
  getHello(): string {
    return 'Hello World!';
  }
}
