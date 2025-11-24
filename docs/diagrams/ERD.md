## Neo4j Graph Database Schema Diagram

```mermaid
classDiagram
    direction LR
    class UserNode {
        <<Label: User>>
        +String user_id "Indexed, Matches MongoDB"
        +String username
        +String email
        +String display_name
        +String bio
        +String avatar_ipfs_hash
        +String role
        +Boolean is_active
        +Number followers_number
        +Number following_number
        +Number created_at
        +Number updated_at
    }

    class InterestNode {
        <<Label: Interest>>
        +String key "Interest enum value (e.g., 'networking', 'defi')"
    }

    class FOLLOWING {
        <<Relationship>>
        +Number created_at
    }

    class BLOCKED {
        <<Relationship>>
        +Number created_at
    }

    class INTERESTS {
        <<Relationship>>
        +Number timestamp
    }

    %% User to User Relationships
    UserNode "User A" --> "User B" UserNode : [:FOLLOWING]
    UserNode "User A" --> "User B" UserNode : [:BLOCKED]

    %% User to Interest Relationships
    UserNode --> InterestNode : [:INTERESTS]

    note for FOLLOWING "Directional: A follows B"
    note for BLOCKED "Directional: A blocks B"
    note for INTERESTS "User has interest in topic"
```

---

## Database Schema Details

This section provides detailed documentation of all database schemas used in the Decode Network Backend system, including MongoDB collections and Neo4j graph structures.

### MongoDB Schemas

#### 1. User Schema (`users` collection)

**Purpose**: Core user account entity storing authentication credentials, profile information, and account management data.

**Fields**:
- `username` (String, Required, Unique, Indexed): Unique username for the user account (3-30 characters)
- `email` (String, Required, Unique, Indexed): User's email address (validated email format)
- `display_name` (String, Optional): Display name shown to other users (can differ from username)
- `password_hashed` (String, Required): Bcrypt hashed password (never stored in plain text)
- `bio` (String, Optional, Default: "Hi, i am a new Decode User"): User's bio/description
- `avatar_ipfs_hash` (String, Optional, Default: default IPFS hash): IPFS hash for user's avatar image
- `role` (String, Optional, Default: "user", Enum: ["user", "admin", "moderator"]): User role for access control
- `last_login` (Date, Optional, Default: current date): Timestamp of user's last login
- `last_username_change` (Date, Optional): Timestamp of last username change
- `last_email_change` (Date, Optional): Timestamp of last email change
- `is_active` (Boolean, Optional, Default: true): Whether the user account is active
- `last_account_deactivation` (Date, Optional): Timestamp of last account deactivation
- `createdAt` (Date, Auto-generated): Document creation timestamp
- `updatedAt` (Date, Auto-generated): Document last update timestamp

**Indexes**:
- Unique index on `email`
- Unique index on `username`
- Index on `createdAt`

**Relationships**:
- Referenced by: Session, DeviceFingerprint, OTP, Wallet, Notification, FollowerSnapshot

---

#### 2. Session Schema (`sessions` collection)

**Purpose**: Manages active user sessions with device fingerprinting and token lifecycle.

**Fields**:
- `user_id` (ObjectId, Required, Indexed, Ref: "User"): Reference to the user who owns this session
- `device_fingerprint_id` (ObjectId, Required, Indexed, Ref: "DeviceFingerprint"): Reference to the device fingerprint
- `session_token` (String, Required): JWT session token for authentication and refresh
- `app` (String, Default: "Decode"): Application identifier
- `expires_at` (Date, Required, Default: 30 days from creation): Session expiration timestamp
- `is_active` (Boolean, Required, Default: true): Whether the session is currently active
- `revoked_at` (Date, Optional): Timestamp when the session was revoked (null if still active)
- `last_used_at` (Date, Optional, Default: current date): Timestamp of last session activity
- `createdAt` (Date, Auto-generated): Document creation timestamp
- `updatedAt` (Date, Auto-generated): Document last update timestamp

**Indexes**:
- Index on `user_id`
- Unique index on `session_token`
- TTL index on `expires_at` (auto-delete expired sessions)

**Relationships**:
- References: User, DeviceFingerprint

---

#### 3. Device Fingerprint Schema (`device_fingerprints` collection)

**Purpose**: Tracks unique device identifiers for enhanced security and device trust management.

**Fields**:
- `user_id` (ObjectId, Required, Indexed, Ref: "User"): Reference to the user who owns this device
- `device` (String, Optional): Device information (e.g., "iPhone 12", "MacBook Pro")
- `browser` (String, Optional): Browser information (e.g., "Chrome 91", "Safari 14")
- `fingerprint_hashed` (String, Required, Indexed): Hashed device fingerprint for unique device identification
- `is_trusted` (Boolean, Required, Default: true): Whether this device is trusted by the user
- `createdAt` (Date, Auto-generated): Document creation timestamp
- `updatedAt` (Date, Auto-generated): Document last update timestamp

**Indexes**:
- Index on `user_id`
- Index on `fingerprint_hashed`

**Relationships**:
- References: User
- Referenced by: Session

---

#### 4. OTP Schema (`otps` collection)

**Purpose**: Manages user-specific OTP (One-Time Password) configurations for two-factor authentication.

**Fields**:
- `user_id` (ObjectId, Required, Indexed, Ref: "User"): Reference to the user who owns this OTP configuration
- `otp_secret` (String, Required): Secret key used for generating time-based one-time passwords (TOTP)
- `otp_enable` (Boolean, Required, Default: true): Flag indicating whether OTP is enabled for this user
- `createdAt` (Date, Auto-generated): Document creation timestamp
- `updatedAt` (Date, Auto-generated): Document last update timestamp

**Indexes**:
- Index on `user_id`

**Relationships**:
- References: User

---

#### 5. OTP Codes Collection (`otp_codes` collection)

**Purpose**: Temporary storage for OTP codes used in email verification, password reset, and two-factor authentication.

**Fields**:
- `userId` (ObjectId, Required, Indexed): Reference to the user
- `code` (String, Required, Indexed): The OTP code
- `type` (String, Required, Enum: ["email_verification", "password_reset", "two_factor_auth"]): Type of OTP code
- `createdAt` (Date, Required): Code creation timestamp
- `expiresAt` (Date, Required): Code expiration timestamp

**Indexes**:
- Index on `userId`
- Index on `code`
- TTL index on `expiresAt` (auto-delete expired codes)

**Note**: This collection uses MongoDB validation schema but is not defined as a Mongoose schema class. It's managed directly through MongoDB operations.

---

#### 6. Wallet Schema (`wallets` collection)

**Purpose**: Stores Web3 wallet addresses linked to user accounts.

**Fields**:
- `address` (String, Required, Unique, Indexed): Ethereum wallet address (unique across system)
- `user_id` (ObjectId, Required, Indexed, Ref: "User"): Reference to the user who owns this wallet
- `name_service` (String, Optional, Default: null): Name service identifier (e.g., ENS name)
- `is_primary` (Boolean, Optional, Default: false): Whether this is the user's primary wallet
- `createdAt` (Date, Auto-generated): Document creation timestamp
- `updatedAt` (Date, Auto-generated): Document last update timestamp

**Indexes**:
- Unique index on `address`
- Index on `user_id`

**Relationships**:
- References: User

---

#### 7. Notification Schema (`notifications` collection)

**Purpose**: Stores user notifications with delivery and read status tracking.

**Fields**:
- `user_id` (ObjectId, Required, Ref: "User"): Reference to the user who receives this notification
- `type` (String, Required): Notification type (e.g., "follow", "message", "alert", "update")
- `title` (String, Required): Notification title
- `message` (String, Required): Notification message content
- `delivered` (Boolean, Optional, Default: false): Whether the notification has been delivered
- `delivered_at` (Date, Optional): Timestamp when notification was delivered
- `read` (Boolean, Optional, Default: false): Whether the notification has been read
- `read_at` (Date, Optional): Timestamp when notification was read
- `createdAt` (Date, Auto-generated): Document creation timestamp
- `updatedAt` (Date, Auto-generated): Document last update timestamp

**Indexes**:
- Index on `user_id`
- Index on `createdAt`
- Index on `type`

**Relationships**:
- References: User

---

#### 8. Follower Snapshot Schema (`follower_snapshots` collection)

**Purpose**: Stores periodic snapshots of user follower lists for analytics and historical tracking.

**Fields**:
- `user_id` (ObjectId, Required, Ref: "User"): Reference to the user whose followers are being snapshotted
- `followers` (Array of ObjectId, Required, Ref: "User"): Array of user IDs who follow this user
- `followers_number` (Number, Required): Total count of followers at snapshot time
- `snapshot_at` (Date, Required, Default: current date): Timestamp when the snapshot was taken
- `createdAt` (Date, Auto-generated): Document creation timestamp
- `updatedAt` (Date, Auto-generated): Document last update timestamp

**Indexes**:
- Index on `user_id`
- Index on `snapshot_at`

**Relationships**:
- References: User (multiple)

---

### Neo4j Graph Schema

#### Node Types

##### User Node

**Label**: `User`

**Purpose**: Represents a user in the social graph for relationship queries and graph-based operations.

**Properties**:
- `user_id` (String, Required, Indexed): Unique user identifier (matches MongoDB User._id)
- `username` (String, Required): User's username
- `email` (String, Optional): User's email address
- `display_name` (String, Optional): User's display name
- `bio` (String, Optional): User's bio
- `avatar_ipfs_hash` (String, Optional): IPFS hash for avatar
- `role` (String, Optional): User role (user, admin, moderator)
- `is_active` (Boolean, Optional): Whether user is active
- `followers_number` (Number, Optional): Cached follower count
- `following_number` (Number, Optional): Cached following count
- `created_at` (Number, Optional): Unix timestamp of creation
- `updated_at` (Number, Optional): Unix timestamp of last update

**Indexes**:
- Index on `user_id` (for fast lookups)

**Note**: User nodes in Neo4j are synchronized from MongoDB via the Neo4j DB Sync service to maintain consistency.

---

#### Relationship Types

##### FOLLOWING Relationship

**Type**: `FOLLOWING`

**Purpose**: Represents a one-way follow relationship between users in the social graph.

**Direction**: Directed (User A → FOLLOWING → User B means A follows B)

**Properties**:
- `created_at` (Number, Optional): Unix timestamp when the follow relationship was created

**Usage**:
- Used for follower/following queries
- Powers mutual connection discovery
- Enables recommendation algorithms (friends of friends)
- Supports social graph analytics

**Example Cypher Query**:
```cypher
MATCH (a:User {user_id: "user1"})-[:FOLLOWING]->(b:User {user_id: "user2"})
RETURN a, b
```

---

##### BLOCKED Relationship

**Type**: `BLOCKED`

**Purpose**: Represents a blocking relationship where one user blocks another.

**Direction**: Directed (User A → BLOCKED → User B means A blocks B)

**Properties**:
- `created_at` (Number, Optional): Unix timestamp when the block relationship was created

**Usage**:
- Prevents blocked users from seeing each other's content
- Used in relationship queries to filter out blocked users
- Automatically removes FOLLOWING relationships when blocking occurs

**Example Cypher Query**:
```cypher
MATCH (a:User {user_id: "user1"})-[:BLOCKED]->(b:User {user_id: "user2"})
RETURN a, b
```

---

##### Interest Node

**Label**: `Interest`

**Purpose**: Represents interest topics that users can have. Used for recommendation algorithms and user discovery based on shared interests.

**Properties**:
- `key` (String, Required, Unique): Interest enum value (e.g., "networking", "defi", "coding_development", "music")
  - Values are from the `Interest` enum defined in the codebase
  - Categories include: Social & Community, Career & Growth, Lifestyle & Hobbies, Finance & Future

**Indexes**:
- Index on `key` (for fast lookups)

**Note**: Interest nodes are created automatically when users add interests. Multiple users can share the same interest node.

---

##### INTERESTS Relationship

**Type**: `INTERESTS`

**Purpose**: Represents a user's interest in a specific topic. Used for recommendation algorithms, user discovery, and finding users with shared interests.

**Direction**: Directed (User → INTERESTS → Interest means user has this interest)

**Properties**:
- `timestamp` (Number, Required): Unix timestamp when the interest relationship was created

**Usage**:
- Powers interest-based user recommendations
- Enables discovery of users with shared interests
- Supports filtering and search by interests
- Used in suggestion algorithms to find users with common interests

**Example Cypher Query**:
```cypher
// Get all interests for a user
MATCH (u:User {user_id: "user1"})-[:INTERESTS]->(i:Interest)
RETURN i.key

// Find users with shared interests
MATCH (u:User {user_id: "user1"})-[:INTERESTS]->(i:Interest)<-[:INTERESTS]-(suggested:User)
RETURN suggested, count(i) as shared_interests_count
ORDER BY shared_interests_count DESC
```

**Interest Categories** (from Interest enum):
- **Social & Community**: networking, creator_economy, social_tokens, community_building, online_gaming, digital_collectibles, metaverse, memes, defi, dao, security
- **Career & Growth**: startups, tech_innovation, entrepreneurship, freelancing, open_source, research_learning, coding_development
- **Lifestyle & Hobbies**: music, anime_manga, esports, fitness, sport, movies, travel, food_cooking, fashion_style
- **Finance & Future**: investing, trading, crypto_arbitrage, personal_finance, global_economy, ai, sustainability
- **Other**: other

---

### Schema Relationships Summary

**MongoDB Collections**:
1. `users` - Core user data (source of truth)
2. `sessions` - Active user sessions
3. `device_fingerprints` - Device tracking
4. `otps` - OTP configuration
5. `otp_codes` - Temporary OTP codes
6. `wallets` - Web3 wallet addresses
7. `notifications` - User notifications
8. `follower_snapshots` - Historical follower data

**Neo4j Graph**:
- **Nodes**:
  - User nodes (synced from MongoDB)
  - Interest nodes (created when users add interests)
- **Relationships**:
  - FOLLOWING (User → User)
  - BLOCKED (User → User)
  - INTERESTS (User → Interest)

**Data Flow**:
- MongoDB is the source of truth for user data
- Neo4j syncs user nodes from MongoDB via Neo4j DB Sync service
- Relationship data (FOLLOWING, BLOCKED) is written directly to Neo4j
- Follower snapshots are stored in MongoDB for analytics

---
