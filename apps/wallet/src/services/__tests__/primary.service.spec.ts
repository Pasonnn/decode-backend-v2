import { Test, TestingModule } from '@nestjs/testing';
import { PrimaryService } from '../primary.service';
import { getModelToken } from '@nestjs/mongoose';
import { Wallet } from '../../schemas/wallet.schema';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
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

describe('PrimaryService', () => {
  let service: PrimaryService;
  let walletModel: any;
  let cryptoUtils: jest.Mocked<CryptoUtils>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    walletModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    cryptoUtils = {
      generateNonceMessage: jest.fn(),
      validateNonceMessage: jest.fn(),
    } as unknown as jest.Mocked<CryptoUtils>;

    metricsService = {
      increment: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrimaryService,
        { provide: getModelToken(Wallet.name), useValue: walletModel },
        { provide: CryptoUtils, useValue: cryptoUtils },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<PrimaryService>(PrimaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePrimaryWalletChallenge', () => {
    it('generates primary wallet challenge successfully', async () => {
      // Mock checkValidPrimaryWallet to return failure (wallet is not primary yet)
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      });
      cryptoUtils.generateNonceMessage.mockResolvedValue('nonce-message');

      const result = await service.generatePrimaryWalletChallenge({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PRIMARY_CHALLENGE_GENERATED);
      expect(result.data?.nonceMessage).toBe('nonce-message');
    });

    it('returns error when wallet is already primary', async () => {
      const wallet = createWallet({ is_primary: true });
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_VALID,
        data: wallet,
      });

      const result = await service.generatePrimaryWalletChallenge({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.SUCCESS.PRIMARY_WALLET_VALID);
    });

    it('returns error when nonce message generation fails', async () => {
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      });
      cryptoUtils.generateNonceMessage.mockResolvedValue(null);

      const result = await service.generatePrimaryWalletChallenge({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_GENERATION_FAILED,
      );
    });

    it('handles errors during challenge generation', async () => {
      jest
        .spyOn(service as any, 'checkValidPrimaryWallet')
        .mockRejectedValue(new Error('database error'));

      const result = await service.generatePrimaryWalletChallenge({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_GENERATION_FAILED,
      );
    });
  });

  describe('validatePrimaryWalletChallenge', () => {
    it('validates primary wallet challenge and sets primary successfully', async () => {
      const wallet = createWallet({ is_primary: false });
      const updatedWallet = { ...wallet, is_primary: true };
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      });
      cryptoUtils.validateNonceMessage.mockResolvedValue(true);
      jest.spyOn(service as any, 'setPrimaryWallet').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_SET,
        data: updatedWallet,
      });

      const result = await service.validatePrimaryWalletChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PRIMARY_CHALLENGE_VALIDATED);
      expect(result.data).toEqual(updatedWallet);
      expect(cryptoUtils.validateNonceMessage).toHaveBeenCalledWith({
        address: VALID_WALLET_ADDRESS.toLowerCase(),
        signature: '0xsignature',
      });
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.primary.set',
        1,
        {
          operation: 'validatePrimaryWalletChallenge',
          status: 'success',
        },
      );
    });

    it('returns error when wallet is already primary', async () => {
      const wallet = createWallet({ is_primary: true });
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_VALID,
        data: wallet,
      });

      const result = await service.validatePrimaryWalletChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.SUCCESS.PRIMARY_WALLET_VALID);
    });

    it('returns error when signature is invalid', async () => {
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      });
      cryptoUtils.validateNonceMessage.mockResolvedValue(false);

      const result = await service.validatePrimaryWalletChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: 'invalid-signature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_VALIDATION_FAILED,
      );
      // Metrics are not recorded when signature validation fails early
      expect(metricsService.increment).not.toHaveBeenCalled();
    });

    it('returns error when setting primary wallet fails', async () => {
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      });
      cryptoUtils.validateNonceMessage.mockResolvedValue(true);
      jest.spyOn(service as any, 'setPrimaryWallet').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_SET_FAILED,
      });

      const result = await service.validatePrimaryWalletChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_SET_FAILED,
      );
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.primary.set',
        1,
        {
          operation: 'validatePrimaryWalletChallenge',
          status: 'failed',
        },
      );
    });

    it('handles errors during challenge validation', async () => {
      jest
        .spyOn(service as any, 'checkValidPrimaryWallet')
        .mockRejectedValue(new Error('database error'));

      const result = await service.validatePrimaryWalletChallenge({
        address: VALID_WALLET_ADDRESS,
        signature: '0xsignature',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_VALIDATION_FAILED,
      );
      expect(metricsService.increment).toHaveBeenCalledWith(
        'wallet.primary.set',
        1,
        {
          operation: 'validatePrimaryWalletChallenge',
          status: 'failed',
        },
      );
    });
  });

  describe('unsetPrimaryWallet', () => {
    it('unsets primary wallet successfully', async () => {
      const wallet = createWallet({ is_primary: true });
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_VALID,
        data: wallet,
      });
      const unsetWallet = { ...wallet, is_primary: false };
      walletModel.findOneAndUpdate.mockResolvedValue(unsetWallet);

      const result = await service.unsetPrimaryWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PRIMARY_WALLET_UNSET);
      expect(result.data).toEqual(unsetWallet);
      expect(walletModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          user_id: new Types.ObjectId(VALID_USER_ID),
          address: VALID_WALLET_ADDRESS.toLowerCase(),
        },
        { is_primary: false },
      );
    });

    it('returns error when wallet is not primary', async () => {
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      });

      const result = await service.unsetPrimaryWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      );
    });

    it('returns error when update fails', async () => {
      const wallet = createWallet({ is_primary: true });
      jest.spyOn(service as any, 'checkValidPrimaryWallet').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_VALID,
        data: wallet,
      });
      walletModel.findOneAndUpdate.mockResolvedValue(null);

      const result = await service.unsetPrimaryWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_UNSET_FAILED,
      );
    });

    it('handles errors during unset', async () => {
      jest
        .spyOn(service as any, 'checkValidPrimaryWallet')
        .mockRejectedValue(new Error('database error'));

      const result = await service.unsetPrimaryWallet({
        user_id: VALID_USER_ID,
        address: VALID_WALLET_ADDRESS,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_UNSET_FAILED,
      );
    });
  });

  describe('getPrimaryWallet', () => {
    it('returns primary wallet successfully', async () => {
      const wallet = createWallet({ is_primary: true });
      walletModel.findOne.mockResolvedValue(wallet);

      const result = await service.getPrimaryWallet({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PRIMARY_WALLET_FETCHED);
      expect(result.data).toEqual(wallet);
      expect(walletModel.findOne).toHaveBeenCalledWith({
        user_id: new Types.ObjectId(VALID_USER_ID),
        is_primary: true,
      });
    });

    it('returns error when primary wallet not found', async () => {
      walletModel.findOne.mockResolvedValue(null);

      const result = await service.getPrimaryWallet({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_FOUND,
      );
    });

    it('handles errors during wallet fetch', async () => {
      walletModel.findOne.mockRejectedValue(new Error('database error'));

      const result = await service.getPrimaryWallet({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_FOUND,
      );
    });
  });
});
