// MongoDB initialization script for Docker
// This script sets up the initial database and collections

// Switch to the decode database
db = db.getSiblingDB('decode');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'username', 'password', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address',
        },
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: 'Username must be between 3 and 30 characters',
        },
        password: {
          bsonType: 'string',
          minLength: 8,
          description: 'Password must be at least 8 characters',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required',
        },
      },
    },
  },
});

db.createCollection('sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'token', 'createdAt', 'expiresAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID must be a valid ObjectId',
        },
        token: {
          bsonType: 'string',
          description: 'Session token is required',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required',
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Expiration date is required',
        },
      },
    },
  },
});

db.createCollection('device_fingerprints', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'fingerprint', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID must be a valid ObjectId',
        },
        fingerprint: {
          bsonType: 'string',
          description: 'Device fingerprint is required',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required',
        },
      },
    },
  },
});

db.createCollection('otp_codes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'code', 'type', 'createdAt', 'expiresAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID must be a valid ObjectId',
        },
        code: {
          bsonType: 'string',
          description: 'OTP code is required',
        },
        type: {
          bsonType: 'string',
          enum: ['email_verification', 'password_reset', 'two_factor_auth'],
          description: 'OTP type must be one of the allowed values',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required',
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Expiration date is required',
        },
      },
    },
  },
});

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'title', 'message', 'type', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID must be a valid ObjectId',
        },
        title: {
          bsonType: 'string',
          description: 'Notification title is required',
        },
        message: {
          bsonType: 'string',
          description: 'Notification message is required',
        },
        type: {
          bsonType: 'string',
          enum: ['info', 'warning', 'error', 'success'],
          description: 'Notification type must be one of the allowed values',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required',
        },
      },
    },
  },
});

db.createCollection('follower_snapshots', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'followerCount', 'snapshotDate'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID is required',
        },
        followerCount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Follower count must be a non-negative number',
        },
        snapshotDate: {
          bsonType: 'date',
          description: 'Snapshot date is required',
        },
      },
    },
  },
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ token: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

db.device_fingerprints.createIndex({ userId: 1 });
db.device_fingerprints.createIndex({ fingerprint: 1 });

db.otp_codes.createIndex({ userId: 1 });
db.otp_codes.createIndex({ code: 1 });
db.otp_codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ createdAt: 1 });
db.notifications.createIndex({ type: 1 });

db.follower_snapshots.createIndex({ userId: 1 });
db.follower_snapshots.createIndex({ snapshotDate: 1 });

// Create a default admin user (optional)
// Note: This is just an example - you should change the password in production
db.users.insertOne({
  email: 'admin@decodenetwork.app',
  username: 'admin',
  password:
    '$2b$10$rQZ8K9vL2mN3pQ4rS5tU6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5',
  role: 'admin',
  isActive: true,
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

print('MongoDB initialization completed successfully!');
print('Database: decode');
print(
  'Collections created: users, sessions, device_fingerprints, otp_codes, notifications, follower_snapshots',
);
print('Indexes created for optimal performance');
print('Default admin user created: admin@decodenetwork.app');
