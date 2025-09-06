import { Controller } from '@nestjs/common';

// Services Import
import { LinkService } from './services/link.service';
import { AuthService } from './services/auth.service';
import { PrimaryService } from './services/primary.service';

@Controller()
export class WalletController {
  constructor(
    private readonly linkService: LinkService,
    private readonly authService: AuthService,
    private readonly primaryService: PrimaryService,
  ) {}
}
