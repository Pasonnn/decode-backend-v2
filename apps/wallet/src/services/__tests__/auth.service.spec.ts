import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { Wallet } from '../../schemas/wallet.schema';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
import { WalletDoc } from '../../interfaces/wallet-doc.interface';
import { Types } from 'mongoose';
import { CryptoUtils } from '../../utils/crypto.utils';
import { AuthServiceClient } from '../../infrastructure/external-services/auth-service.client';

const VALID_USER_ID = '656a35d3b7e7b4a9a9b6b6b6'; // Valid ObjectId string
const VALID_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

const createWallet = (overrides?: Partial<WalletDoc>): WalletDoc => ({
  _id: '507f1f77bcf86cd799439011',
  user_id: new Types.ObjectId(VALID_USER_ID),
  address: VALID_WALLET_ADDRESS.toLowerCase(),
  name_service: 'ethereum',
  is_primary: true,
  ...overrides,
});

const successResponse = (data: any) => ({
  success: true,
  statusCode: HttpStatus.OK,
  message: 'Success',
  data,
});

const failureResponse = (message: string) => ({
  success: false,
  statusCode: HttpStatus.BAD_REQUEST,
  message,
});

describe('AuthService', () => {
  let service: AuthService;
  let walletModel: any;
  let cryptoUtils: jest.Mocked<CryptoUtils>;
  let authServiceClient: jest.Mocked<AuthServiceClient>;

  beforeEach(async () => {
    walletModel = {
      findOne: jest.fn(),
    };

    cryptoUtils = {
      generateNonceMessage: jest.fn(),
      validateNonceMessage: jest.fn(),
    } as unknown as jest.Mocked<CryptoUtils>;

    authServiceClient = {
      createWalletSession: jest.fn(),
    } as unknown as jest.Mocked<AuthServiceClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(Wallet.name), useValue: walletModel },
        { provide: CryptoUtils, useValue: cryptoUtils },
        { provide: AuthServiceClient, useValue: authServiceClient },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateLoginChallenge', () => {
    it('generates login challenge successfully for primary wallet', async () => {
      const wallet = createWallet({ is_primary: true });
      walletModel.findOne.mockResolvedValue(wallet);
      cryptoUtils.generateNonceMessage.mockResolvedValue('nonce-message');

      const result = await service.generateLoginChallenge({
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

    it('returns error when wallet not found', async () => {
      walletModel.findOne.mockResolvedValue(null);

      const result = await service.generateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.AUTH.WALLET_NOT_FOUND);
    });

    it('returns error when wallet is not primary', async () => {
      const wallet = createWallet({ is_primary: false });
      walletModel.findOne.mockResolvedValue(wallet);

      const result = await service.generateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.AUTH.ONLY_PRIMARY_WALLET_ALLOWED);
    });

    it('returns error when nonce message generation fails', async () => {
      const wallet = createWallet({ is_primary: true });
      walletModel.findOne.mockResolvedValue(wallet);
      cryptoUtils.generateNonceMessage.mockResolvedValue(null);

      const result = await service.generateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.NONCE_MESSAGE_GENERATION_FAILED,
      );
    });

    it('handles errors during challenge generation', async () => {
      walletModel.findOne.mockRejectedValue(new Error('database error'));

      const result = await service.generateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.NONCE_MESSAGE_GENERATION_FAILED,
      );
    });
  });

  describe('validateLoginChallenge', () => {
    it('validates login challenge and creates session successfully', async () => {
      const wallet = createWallet({ is_primary: true });
      const sessionData = {
        session_token: 'session-token',
        access_token: 'access-token',
      };
      walletModel.findOne.mockResolvedValue(wallet);
      cryptoUtils.validateNonceMessage.mockResolvedValue(true);
      authServiceClient.createWalletSession.mockResolvedValue(
        successResponse(sessionData),
      );

      const result = await service.validateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        fingerprint_hashed: 'fingerprint-hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.CHALLENGE_VALIDATED);
      expect(result.data).toEqual(sessionData);
      expect(cryptoUtils.validateNonceMessage).toHaveBeenCalledWith({
        address: VALID_WALLET_ADDRESS.toLowerCase(),
        signature: '0xsignature',
      });
      expect(authServiceClient.createWalletSession).toHaveBeenCalledWith({
        user_id: VALID_USER_ID,
        device_fingerprint_hashed: 'fingerprint-hash',
        browser: 'Chrome',
        device: 'Mac',
      });
    });

    it('returns error when signature is invalid', async () => {
      cryptoUtils.validateNonceMessage.mockResolvedValue(false);

      const result = await service.validateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: 'invalid-signature',
        fingerprint_hashed: 'fingerprint-hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
      );
    });

    it('returns error when wallet not found', async () => {
      cryptoUtils.validateNonceMessage.mockResolvedValue(true);
      walletModel.findOne.mockResolvedValue(null);

      const result = await service.validateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        fingerprint_hashed: 'fingerprint-hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.AUTH.WALLET_NOT_FOUND);
    });

    it('returns error when wallet is not primary', async () => {
      const wallet = createWallet({ is_primary: false });
      cryptoUtils.validateNonceMessage.mockResolvedValue(true);
      walletModel.findOne.mockResolvedValue(wallet);

      const result = await service.validateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        fingerprint_hashed: 'fingerprint-hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.AUTH.ONLY_PRIMARY_WALLET_ALLOWED);
    });

    it('returns error when session creation fails', async () => {
      const wallet = createWallet({ is_primary: true });
      cryptoUtils.validateNonceMessage.mockResolvedValue(true);
      walletModel.findOne.mockResolvedValue(wallet);
      authServiceClient.createWalletSession.mockResolvedValue(
        failureResponse('Session creation failed'),
      );

      const result = await service.validateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        fingerprint_hashed: 'fingerprint-hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Session creation failed');
    });

    it('handles errors during challenge validation', async () => {
      cryptoUtils.validateNonceMessage.mockRejectedValue(
        new Error('crypto error'),
      );

      const result = await service.validateLoginChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        fingerprint_hashed: 'fingerprint-hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
      );
    });
  });
});
