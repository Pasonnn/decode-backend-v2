import { Test, TestingModule } from '@nestjs/testing';
import { LinkService } from '../link.service';
import { getModelToken } from '@nestjs/mongoose';
import { Wallet } from '../../schemas/wallet.schema';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
import { WALLET_CONSTANTS } from '../../constants/wallet.constants';
import { WalletDoc } from '../../interfaces/wallet-doc.interface';
import { Types } from 'mongoose';
import { CryptoUtils } from '../../utils/crypto.utils';
import { MetricsService } from '../../common/datadog/metrics.service';

const VALID_USER_ID = '656a35d3b7e7b4a9a9b6b6b6'; // Valid ObjectId string
const VALID_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

const createWallet = (overrides?: Partial<WalletDoc>): WalletDoc => ({
  _id: '507f1f77bcf86cd799439011',
  user_id: new Types.ObjectId(VALID_USER_ID),
  address: VALID_WALLET_ADDRESS.toLowerCase(),
  name_service: 'ethereum',
  is_primary: false,
  ...overrides,
});

describe('LinkService', () => {
  let service: LinkService;
  let walletModel: any;
  let cryptoUtils: jest.Mocked<CryptoUtils>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    walletModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    cryptoUtils = {
      generateNonceMessage: jest.fn(),
      validateNonceMessage: jest.fn(),
    } as unknown as jest.Mocked<CryptoUtils>;

    metricsService = {
      increment: jest.fn(),
      timing: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkService,
        { provide: getModelToken(Wallet.name), useValue: walletModel },
        { provide: CryptoUtils, useValue: cryptoUtils },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<LinkService>(LinkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateLinkChallenge', () => {
    it('generates link challenge successfully', async () => {
      walletModel.findOne.mockResolvedValue(null); // Wallet doesn't exist
      cryptoUtils.generateNonceMessage.mockResolvedValue('nonce-message');

      const result = await service.generateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.CHALLENGE_GENERATED);
      expect(result.data?.nonceMessage).toBe('nonce-message');
      expect(cryptoUtils.generateNonceMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          address: VALID_WALLET_ADDRESS.toLowerCase(),
        }),
      );
    });

    it('returns error when wallet already linked', async () => {
      const wallet = createWallet();
      walletModel.findOne.mockResolvedValue(wallet);

      const result = await service.generateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.WALLET_LINK.WALLET_ALREADY_LINKED);
    });

    it('returns error when nonce message generation fails', async () => {
      walletModel.findOne.mockResolvedValue(null);
      cryptoUtils.generateNonceMessage.mockResolvedValue(null);

      const result = await service.generateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.CHALLENGE_GENERATION_FAILED,
      );
    });

    it('handles errors during challenge generation', async () => {
      walletModel.findOne.mockRejectedValue(new Error('database error'));

      const result = await service.generateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.CHALLENGE_GENERATION_FAILED,
      );
    });
  });

  describe('validateLinkChallenge', () => {
    it('validates link challenge and links wallet successfully', async () => {
      const newWallet = createWallet();
      walletModel.countDocuments.mockResolvedValue(5); // Below limit
      walletModel.findOne
        .mockResolvedValueOnce(null) // Wallet doesn't exist check
        .mockResolvedValueOnce(null); // Second check in linkWallet
      cryptoUtils.validateNonceMessage.mockResolvedValue(true);
      walletModel.create.mockResolvedValue(newWallet);

      const result = await service.validateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.LINK_CHALLENGE_VALIDATED);
      expect(result.data).toEqual(newWallet);
      expect(cryptoUtils.validateNonceMessage).toHaveBeenCalledWith({
        address: VALID_WALLET_ADDRESS.toLowerCase(),
        signature: '0xsignature',
      });
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.linked',
        1,
        {
          operation: 'validateLinkChallenge',
          status: 'success',
        },
      );
    });

    it('returns error when max wallets exceeded', async () => {
      walletModel.countDocuments.mockResolvedValue(
        WALLET_CONSTANTS.LIMITS.MAX_WALLETS_PER_USER,
      );

      const result = await service.validateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.WALLET_LINK.MAX_WALLETS_EXCEEDED);
    });

    it('returns error when wallet already linked', async () => {
      const wallet = createWallet();
      walletModel.countDocuments.mockResolvedValue(5);
      walletModel.findOne.mockResolvedValue(wallet);

      const result = await service.validateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.WALLET_LINK.WALLET_ALREADY_LINKED);
    });

    it('returns error when signature is invalid', async () => {
      walletModel.countDocuments.mockResolvedValue(5);
      walletModel.findOne.mockResolvedValue(null);
      cryptoUtils.validateNonceMessage.mockResolvedValue(false);

      const result = await service.validateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: 'invalid-signature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
      );
      // Metrics are not recorded when signature validation fails early
      expect(metricsService.increment).not.toHaveBeenCalled();
    });

    it('handles errors during challenge validation', async () => {
      walletModel.countDocuments.mockResolvedValue(5);
      walletModel.findOne.mockResolvedValue(null);
      cryptoUtils.validateNonceMessage.mockRejectedValue(
        new Error('crypto error'),
      );

      const result = await service.validateLinkChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
      );
      // Metrics are recorded in catch block
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.linked',
        1,
        {
          operation: 'validateLinkChallenge',
          status: 'failed',
        },
      );
    });
  });

  describe('unlinkWallet', () => {
    it('unlinks wallet successfully', async () => {
      const wallet = createWallet({ is_primary: false });
      walletModel.findOne.mockResolvedValue(wallet);
      walletModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.unlinkWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.WALLET_UNLINKED);
      expect(walletModel.deleteOne).toHaveBeenCalledWith({
        address: VALID_WALLET_ADDRESS.toLowerCase(),
        user_id: new Types.ObjectId(VALID_USER_ID),
      });
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.unlinked',
        1,
        {
          operation: 'unlinkWallet',
          status: 'success',
        },
      );
    });

    it('returns error when wallet not found', async () => {
      walletModel.findOne.mockResolvedValue(null);

      const result = await service.unlinkWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.WALLET_LINK.WALLET_NOT_LINKED);
    });

    it('returns error when wallet is primary', async () => {
      const wallet = createWallet({ is_primary: true });
      walletModel.findOne.mockResolvedValue(wallet);

      const result = await service.unlinkWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_CANNOT_UNLINK,
      );
    });

    it('returns error when wallet does not belong to user', async () => {
      const wallet = createWallet({
        user_id: new Types.ObjectId('656a35d3b7e7b4a9a9b6b6b7'),
        is_primary: false,
      });
      walletModel.findOne.mockResolvedValue(wallet);

      const result = await service.unlinkWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.WALLET_LINK.WALLET_NOT_LINKED);
    });

    it('returns error when deletion fails', async () => {
      const wallet = createWallet({ is_primary: false });
      walletModel.findOne.mockResolvedValue(wallet);
      walletModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await service.unlinkWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.WALLET_LINK.WALLET_UNLINKING_FAILED);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.unlinked',
        1,
        {
          operation: 'unlinkWallet',
          status: 'failed',
        },
      );
    });

    it('handles errors during unlinking', async () => {
      walletModel.findOne.mockRejectedValue(new Error('database error'));

      const result = await service.unlinkWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(MESSAGES.WALLET_LINK.WALLET_UNLINKING_FAILED);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.unlinked',
        1,
        {
          operation: 'unlinkWallet',
          status: 'failed',
        },
      );
    });
  });

  describe('getWallets', () => {
    it('returns wallets successfully', async () => {
      const wallets = [
        createWallet(),
        createWallet({
          _id: '507f1f77bcf86cd799439012',
          address: '0xAnotherAddress',
        }),
      ];
      walletModel.find.mockResolvedValue(wallets);

      const result = await service.getWallets({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.WALLETS_FETCHED);
      expect(result.data).toEqual(wallets);
      expect(walletModel.find).toHaveBeenCalledWith({
        user_id: new Types.ObjectId(VALID_USER_ID),
      });
    });

    it('returns error when wallets not found', async () => {
      walletModel.find.mockResolvedValue(null);

      const result = await service.getWallets({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.DATABASE.WALLET_NOT_FOUND);
    });

    it('returns empty array when no wallets found', async () => {
      walletModel.find.mockResolvedValue([]);

      const result = await service.getWallets({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual([]);
    });

    it('handles errors during wallet fetch', async () => {
      walletModel.find.mockRejectedValue(new Error('database error'));

      const result = await service.getWallets({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(MESSAGES.DATABASE.QUERY_FAILED);
    });
  });
});
