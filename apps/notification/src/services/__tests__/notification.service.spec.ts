import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { NotificationService } from '../notification.service';
import { Notification } from '../../schema/notification.schema';
import { CreateNotificationDto } from '../../dto/create-notification.dto';
import { MetricsService } from '../../common/datadog/metrics.service';
import { HttpStatus } from '@nestjs/common';

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

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationModel: jest.Mocked<Model<Notification>>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    notificationModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      countDocuments: jest.fn(),
    } as unknown as jest.Mocked<Model<Notification>>;

    // Mock the constructor for new notificationModel()
    const MockedNotificationModel = jest.fn().mockImplementation(function (
      data: any,
    ) {
      const instance = {
        ...data,
        save: jest.fn().mockResolvedValue(data),
        toObject: () => data,
      };
      return instance;
    });
    MockedNotificationModel.find = notificationModel.find;
    MockedNotificationModel.findOne = notificationModel.findOne;
    MockedNotificationModel.findOneAndUpdate =
      notificationModel.findOneAndUpdate;
    MockedNotificationModel.findOneAndDelete =
      notificationModel.findOneAndDelete;
    MockedNotificationModel.findById = notificationModel.findById;
    MockedNotificationModel.findByIdAndUpdate =
      notificationModel.findByIdAndUpdate;
    MockedNotificationModel.updateMany = notificationModel.updateMany;
    MockedNotificationModel.countDocuments = notificationModel.countDocuments;
    notificationModel = MockedNotificationModel as unknown as jest.Mocked<
      Model<Notification>
    >;

    metricsService = {
      increment: jest.fn(),
      decrement: jest.fn(),
      gauge: jest.fn(),
      histogram: jest.fn(),
      timing: jest.fn(),
      distribution: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: notificationModel,
        },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates notification successfully', async () => {
      const dto: CreateNotificationDto = {
        user_id: VALID_USER_ID,
        type: 'message',
        title: 'New Message',
        message: 'You have a new message',
        delivered: false,
        delivered_at: new Date(),
        read: false,
        read_at: new Date(),
      };

      const savedNotification = createNotification({
        title: dto.title,
        message: dto.message,
        type: dto.type,
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(metricsService.increment).toHaveBeenCalledWith(
        'notification.created',
        1,
        {
          notification_type: dto.type,
          status: 'success',
        },
      );
    });

    it('records failure metric when creation fails', async () => {
      const dto: CreateNotificationDto = {
        user_id: VALID_USER_ID,
        type: 'message',
        title: 'New Message',
        message: 'You have a new message',
        delivered: false,
        delivered_at: new Date(),
        read: false,
        read_at: new Date(),
      };

      const mockInstance = {
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      (notificationModel as any).mockImplementation(() => mockInstance);

      await expect(service.create(dto)).rejects.toThrow('Database error');

      expect(metricsService.increment).toHaveBeenCalledWith(
        'notification.created',
        1,
        {
          notification_type: dto.type,
          status: 'failed',
        },
      );
    });
  });

  describe('getUserNotifications', () => {
    it('returns paginated notifications', async () => {
      const notifications = [
        createNotification({ _id: new Types.ObjectId() }),
        createNotification({ _id: new Types.ObjectId() }),
      ];

      const queryBuilder = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(notifications),
      };

      (notificationModel.find as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.getUserNotifications(VALID_USER_ID, 0, 10);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data?.notifications).toHaveLength(2);
      expect(result.data?.meta.page).toBe(0);
      expect(result.data?.meta.limit).toBe(10);
    });

    it('handles errors when fetching notifications', async () => {
      const queryBuilder = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.find as jest.Mock).mockReturnValue(queryBuilder);

      await expect(
        service.getUserNotifications(VALID_USER_ID, 0, 10),
      ).rejects.toThrow('Database error');
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read successfully', async () => {
      const notification = createNotification({ read: true });
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(notification),
      };

      (notificationModel.findOneAndUpdate as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.markAsRead(
        VALID_NOTIFICATION_ID,
        VALID_USER_ID,
      );

      expect(result.read).toBe(true);
      expect(result.read_at).toBeDefined();
      expect(metricsService.increment).toHaveBeenCalledWith(
        'notification.read',
        1,
        {
          notification_type: notification.type,
          status: 'success',
        },
      );
    });

    it('throws NotFoundException when notification not found', async () => {
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (notificationModel.findOneAndUpdate as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      await expect(
        service.markAsRead(VALID_NOTIFICATION_ID, VALID_USER_ID),
      ).rejects.toThrow(NotFoundException);

      expect(metricsService.increment).toHaveBeenCalledWith(
        'notification.read',
        1,
        {
          status: 'failed',
        },
      );
    });

    it('handles errors when marking as read', async () => {
      const queryBuilder = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.findOneAndUpdate as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      await expect(
        service.markAsRead(VALID_NOTIFICATION_ID, VALID_USER_ID),
      ).rejects.toThrow('Database error');
    });
  });

  describe('markAsReadAll', () => {
    it('marks all notifications as read successfully', async () => {
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue({ modifiedCount: 5 }),
      };

      (notificationModel.updateMany as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.markAsReadAll(VALID_USER_ID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('All notifications marked as read');
    });

    it('handles errors when marking all as read', async () => {
      const queryBuilder = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.updateMany as jest.Mock).mockReturnValue(queryBuilder);

      await expect(service.markAsReadAll(VALID_USER_ID)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('markAsDelivered', () => {
    it('marks notification as delivered successfully', async () => {
      const notification = createNotification({ delivered: true });
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(notification),
      };

      (notificationModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.markAsDelivered(VALID_NOTIFICATION_ID);

      expect(result.delivered).toBe(true);
      expect(result.delivered_at).toBeDefined();
    });

    it('throws NotFoundException when notification not found', async () => {
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (notificationModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      await expect(
        service.markAsDelivered(VALID_NOTIFICATION_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('handles errors when marking as delivered', async () => {
      const queryBuilder = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      await expect(
        service.markAsDelivered(VALID_NOTIFICATION_ID),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count successfully', async () => {
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(5),
      };

      (notificationModel.countDocuments as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.getUnreadCount(VALID_USER_ID);

      expect(result).toBe(5);
    });

    it('handles errors when getting unread count', async () => {
      const queryBuilder = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.countDocuments as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      await expect(service.getUnreadCount(VALID_USER_ID)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('finds notification by id successfully', async () => {
      const notification = createNotification();
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(notification),
      };

      (notificationModel.findById as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.findById(VALID_NOTIFICATION_ID);

      expect(result).toEqual(notification);
    });

    it('returns null when notification not found', async () => {
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (notificationModel.findById as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.findById(VALID_NOTIFICATION_ID);

      expect(result).toBeNull();
    });

    it('handles errors when finding by id', async () => {
      const queryBuilder = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.findById as jest.Mock).mockReturnValue(queryBuilder);

      await expect(service.findById(VALID_NOTIFICATION_ID)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('delete', () => {
    it('deletes notification successfully', async () => {
      const notification = createNotification();
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(notification),
      };

      (notificationModel.findOneAndDelete as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.delete(VALID_NOTIFICATION_ID, VALID_USER_ID);

      expect(result).toEqual(notification);
    });

    it('throws NotFoundException when notification not found', async () => {
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (notificationModel.findOneAndDelete as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      await expect(
        service.delete(VALID_NOTIFICATION_ID, VALID_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('handles errors when deleting', async () => {
      const queryBuilder = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.findOneAndDelete as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      await expect(
        service.delete(VALID_NOTIFICATION_ID, VALID_USER_ID),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findUndeliveredNotifications', () => {
    it('finds undelivered notifications successfully', async () => {
      const notifications = [
        createNotification({ delivered: false }),
        createNotification({ delivered: false }),
      ];

      const queryBuilder = {
        exec: jest.fn().mockResolvedValue(notifications),
      };

      (notificationModel.find as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.findUndeliveredNotifications({
        user_id: VALID_USER_ID,
      });

      expect(result).toHaveLength(2);
      expect(result.every((n) => n.delivered === false)).toBe(true);
    });

    it('returns empty array when no undelivered notifications found', async () => {
      const queryBuilder = {
        exec: jest.fn().mockResolvedValue([]),
      };

      (notificationModel.find as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.findUndeliveredNotifications({
        user_id: VALID_USER_ID,
      });

      expect(result).toHaveLength(0);
    });

    it('handles errors when finding undelivered notifications', async () => {
      const queryBuilder = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (notificationModel.find as jest.Mock).mockReturnValue(queryBuilder);

      await expect(
        service.findUndeliveredNotifications({ user_id: VALID_USER_ID }),
      ).rejects.toThrow('Database error');
    });
  });
});
