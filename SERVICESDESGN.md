# Decode Backend Services

## 1. Auth Service

**What it does:** Handles user authentication and security

- User registration and login
- Password management (change, reset, forgot)
- Session management with JWT tokens
- Device fingerprinting for security
- Email verification for account creation
- User logout and session refresh

## 2. User Service

**What it does:** Manages user profiles and account settings

- User profile management (display name, bio, avatar)
- Username changes with verification
- Email address changes with verification
- User search functionality
- Account role management

## 3. Relationship Service

**What it does:** Handles social relationships and friend suggestions

- Follow/unfollow users
- Block/unblock users
- Get followers and following lists
- Find mutual connections
- Smart friend suggestions with AI
- Search within social connections

## 4. Wallet Service

**What it does:** Manages cryptocurrency wallet connections

- Wallet-based authentication
- Link multiple wallets to account
- Set primary wallet
- Wallet signature verification
- Cryptocurrency wallet login

## 5. Email Worker Service

**What it does:** Sends emails and handles email notifications

- Account creation verification emails
- Password reset emails
- Username/email change verification
- Welcome messages
- Device login verification emails
- Email templates and queue management

## 6. Neo4j DB Sync Service

**What it does:** Keeps the graph database in sync with user data

- Syncs new users to Neo4j graph database
- Updates user information in the graph
- Maintains data consistency between MongoDB and Neo4j
- Handles user-related events and updates
