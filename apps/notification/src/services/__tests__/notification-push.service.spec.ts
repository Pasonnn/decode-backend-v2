import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { NotificationPushService } from '../notification-push.service';
import { NotificationService } from '../notification.service';
import { NotificationGateway } from '../../gateways/notification.gateway';
import { Notification } from '../../schema/notification.schema';
import { Types } from 'mongoose';

const VALID_USER_ID = '656a35d3b7e7b4a9a9b6b6b6'; // Valid ObjectId string
const VALID_NOTIFICATION_ID = '656a35d3b7e7b4a9a9b6b6b7'; // Valid ObjectId string

const createNotification = (
  overrides?: Partial<Notification>,
): Notification => {
  const notification = {
    _id: new Types.ObjectId(VALID_NOTIFICATION_ID),
    user_id: new Types.ObjectId(VALID_USER_ID),
    type: 'message',
    title: 'Test Notification',
    message: 'This is a test notification',
    delivered: false,
    delivered_at: null,
    read: false,
    read_at: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Notification;
  return notification;
};

describe('NotificationPushService', () => {
  let service: NotificationPushService;
  let notificationService: jest.Mocked<NotificationService>;
  let notificationGateway: jest.Mocked<NotificationGateway>;

  beforeEach(async () => {
    notificationService = {
      findUndeliveredNotifications: jest.fn(),
      markAsDelivered: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    notificationGateway = {
      sendNotificationToUser: jest.fn(),
    } as unknown as jest.Mocked<NotificationGateway>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPushService,
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        {
          provide: NotificationGateway,
          useValue: notificationGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationPushService>(NotificationPushService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pushUndeliveredNotifications', () => {
    it('returns success when no undelivered notifications found', async () => {
      notificationService.findUndeliveredNotifications.mockResolvedValue([]);

      const result = await service.pushUndeliveredNotifications({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toContain('No undelivered notifications found');
      expect(notificationGateway.sendNotificationToUser).not.toHaveBeenCalled();
    });

    it('pushes undelivered notifications successfully', async () => {
      const notifications = [
        createNotification({
          _id: new Types.ObjectId(VALID_NOTIFICATION_ID),
          delivered: false,
        }),
        createNotification({
          _id: new Types.ObjectId('656a35d3b7e7b4a9a9b6b6b8'),
          delivered: false,
        }),
      ];

      notificationService.findUndeliveredNotifications.mockResolvedValue(
        notifications,
      );
      notificationGateway.sendNotificationToUser
        .mockResolvedValueOnce(true) // First notification delivered
        .mockResolvedValueOnce(true); // Second notification delivered
      notificationService.markAsDelivered
        .mockResolvedValueOnce(notifications[0])
        .mockResolvedValueOnce(notifications[1]);

      const result = await service.pushUndeliveredNotifications({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toContain('Undelivered notifications pushed');
      expect(result.data?.notifications).toHaveLength(2);
      expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledTimes(
        2,
      );
      expect(notificationService.markAsDelivered).toHaveBeenCalledTimes(2);
    });

    it('handles partial delivery of notifications', async () => {
      const notification1 = createNotification({
        _id: new Types.ObjectId(VALID_NOTIFICATION_ID),
        delivered: false,
      });
      const notification2 = createNotification({
        _id: new Types.ObjectId('656a35d3b7e7b4a9a9b6b6b8'),
        delivered: false,
      });
      const notifications = [notification1, notification2];

      notificationService.findUndeliveredNotifications.mockResolvedValue(
        notifications,
      );
      notificationGateway.sendNotificationToUser
        .mockResolvedValueOnce(true) // First notification delivered
        .mockResolvedValueOnce(false); // Second notification not delivered
      notificationService.markAsDelivered.mockResolvedValueOnce(
        notifications[0],
      );

      const result = await service.pushUndeliveredNotifications({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledTimes(
        2,
      );
      // Only first notification should be marked as delivered
      expect(notificationService.markAsDelivered).toHaveBeenCalledTimes(1);
      // The service uses 'as string' which is a type assertion, not a conversion
      // At runtime, ObjectId might be passed, but Jest will serialize it
      const calls = (notificationService.markAsDelivered as jest.Mock).mock
        .calls;
      expect(calls[0][0]).toBeDefined();
      expect(
        typeof calls[0][0] === 'string' ||
          calls[0][0] instanceof Types.ObjectId,
      ).toBe(true);
    });

    it('handles errors when finding undelivered notifications', async () => {
      notificationService.findUndeliveredNotifications.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.pushUndeliveredNotifications({ user_id: VALID_USER_ID }),
      ).rejects.toThrow('Database error');

      expect(notificationGateway.sendNotificationToUser).not.toHaveBeenCalled();
    });

    it('handles errors when sending notification fails', async () => {
      const notifications = [
        createNotification({
          _id: new Types.ObjectId(VALID_NOTIFICATION_ID),
          delivered: false,
        }),
      ];

      notificationService.findUndeliveredNotifications.mockResolvedValue(
        notifications,
      );
      notificationGateway.sendNotificationToUser.mockRejectedValue(
        new Error('WebSocket error'),
      );

      await expect(
        service.pushUndeliveredNotifications({ user_id: VALID_USER_ID }),
      ).rejects.toThrow('WebSocket error');

      expect(notificationService.markAsDelivered).not.toHaveBeenCalled();
    });

    it('handles errors when marking as delivered fails', async () => {
      const notifications = [
        createNotification({
          _id: new Types.ObjectId(VALID_NOTIFICATION_ID),
          delivered: false,
        }),
      ];

      notificationService.findUndeliveredNotifications.mockResolvedValue(
        notifications,
      );
      notificationGateway.sendNotificationToUser.mockResolvedValue(true);
      notificationService.markAsDelivered.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.pushUndeliveredNotifications({ user_id: VALID_USER_ID }),
      ).rejects.toThrow('Database error');
    });
  });
});
