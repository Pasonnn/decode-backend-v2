# Decode Network Backend - Diagram Reference

This document lists all diagrams that should be created for the Decode Network Backend system. Each diagram serves a specific purpose in documenting the architecture, data flows, and system interactions.

---

## 1. System Context Diagram (C4 Level 1)

**Purpose**: High-level overview showing the Decode Backend system and its relationships with external actors and systems.

**Description**: Shows the Decode Backend as a single box with external actors (Web Clients, Mobile Apps, Admin Users) and external systems (SMTP, Blockchain Networks, Monitoring Tools).

---

## 2. Container Architecture Diagram (C4 Level 2)

**Purpose**: Illustrates the high-level technical building blocks (containers) and how they interact.

**Description**: Shows all 8 microservices (API Gateway, Auth, User, Email Worker, Relationship, Wallet, Notification, Neo4j Sync), 4 infrastructure services (MongoDB, Redis, Neo4j, RabbitMQ), and their communication patterns.

---

## 3. API Gateway Component Diagram (C4 Level 3)

**Purpose**: Detailed view of API Gateway internal components and their interactions.

**Description**: Shows controllers (Auth, Users, Wallet, Relationship, Notification, Health), services, external service clients, guards, interceptors, middleware, cache services, and how they orchestrate requests to downstream services.

---

## 4. Auth Service Component Diagram (C4 Level 3)

**Purpose**: Detailed view of Auth Service internal architecture.

**Description**: Shows controllers, services (Register, Login, Session, Password, Info, Device Fingerprint, SSO, Two-Factor Auth), JWT strategies, guards, DTOs, schemas, and integrations with MongoDB, Redis, and RabbitMQ.

---

## 5. User Service Component Diagram (C4 Level 3)

**Purpose**: Detailed view of User Service internal architecture.

**Description**: Shows UserController, domain services (Profile, Email, Username, Deactivate, Search, Services Response), schemas, DTOs, guards, and dependencies on MongoDB, Redis, and Auth Service.

---

## 6. Relationship Service Component Diagram (C4 Level 3)

**Purpose**: Detailed view of Relationship Service internal architecture.

**Description**: Shows RelationshipController, domain services (Follow, Block, User, Interest, Mutual, Suggest, Search, Follower Snapshot), Neo4j infrastructure, Redis cache, and integrations with MongoDB, Neo4j, RabbitMQ.

---

## 7. Wallet Service Component Diagram (C4 Level 3)

**Purpose**: Detailed view of Wallet Service internal architecture.

**Description**: Shows WalletController, services (Auth, Link, Primary), crypto utilities, external service clients, guards, schemas, and dependencies on MongoDB, Redis, and Auth Service.

---

## 8. Notification Service Component Diagram (C4 Level 3)

**Purpose**: Detailed view of Notification Service internal architecture.

**Description**: Shows NotificationController, NotificationGateway (WebSocket), NotificationService, NotificationPushService, RabbitMQ controller, infrastructure components, and integrations with MongoDB, Redis, RabbitMQ, and WebSocket clients.

---

## 9. Email Worker Component Diagram (C4 Level 3)

**Purpose**: Detailed view of Email Worker internal architecture.

**Description**: Shows EmailWorkerController, RabbitMQService, EmailWorkerService, email templates, SMTP integration, and message consumption patterns.

---

## 10. Neo4j DB Sync Component Diagram (C4 Level 3)

**Purpose**: Detailed view of Neo4j DB Sync Service internal architecture.

**Description**: Shows Neo4jdbSyncController, UserSyncService, infrastructure components (Neo4j, RabbitMQ), DTOs, and data synchronization flow from MongoDB to Neo4j.

---

## 11. Authentication Flow Diagram

**Purpose**: Illustrates the complete user authentication flow from login to token issuance.

**Description**: Shows user login request → API Gateway → Auth Service → validation → JWT token generation → session creation → response flow, including device fingerprinting and session management.

---

## 12. Registration Flow Diagram

**Purpose**: Illustrates the user registration process and email verification workflow.

**Description**: Shows registration request → validation → user creation → email job publishing → email worker → SMTP → verification flow, including OTP generation and validation.

---

## 13. Service-to-Service Authentication Flow

**Purpose**: Shows how microservices authenticate with each other using service JWT tokens.

**Description**: Illustrates service token generation, validation, service guards, and inter-service communication patterns with service JWT tokens.

---

## 14. Request Routing Flow Diagram

**Purpose**: Shows how API Gateway routes requests to appropriate microservices.

**Description**: Illustrates client request → API Gateway → authentication check → route determination → service call → response aggregation → client response, including error handling and caching.

---

## 15. User Profile Update Flow

**Purpose**: Illustrates the complete flow when a user updates their profile.

**Description**: Shows profile update request → API Gateway → User Service → validation → MongoDB update → cache invalidation → response, including event publishing to RabbitMQ.

---

## 16. Follow User Flow Diagram

**Purpose**: Illustrates the social relationship creation flow (follow/unfollow).

**Description**: Shows follow request → API Gateway → Relationship Service → Neo4j graph update → MongoDB snapshot → RabbitMQ event → Notification Service → WebSocket push, including mutual connection discovery.

---

## 17. Wallet Linking Flow Diagram

**Purpose**: Illustrates the process of linking a Web3 wallet to a user account.

**Description**: Shows wallet link request → API Gateway → Wallet Service → address validation → signature verification → Auth Service (wallet session) → MongoDB storage → primary wallet designation.

---

## 18. Notification Delivery Flow

**Purpose**: Shows how notifications are created, queued, and delivered to users.

**Description**: Illustrates event generation → RabbitMQ queue → Notification Service consumption → MongoDB storage → WebSocket push to active clients → REST API fallback, including read/unread status tracking.

---

## 19. Email Processing Flow

**Purpose**: Illustrates the asynchronous email processing workflow.

**Description**: Shows email job creation → RabbitMQ queue → Email Worker consumption → template selection → rendering → SMTP delivery → retry logic → DLQ handling, including different email types (verification, password reset, device trust).

---

## 20. MongoDB to Neo4j Synchronization Flow

**Purpose**: Shows how user data is synchronized from MongoDB to Neo4j graph database.

**Description**: Illustrates user lifecycle events → RabbitMQ → Neo4j Sync Service → MongoDB read → Cypher query generation → Neo4j upsert → consistency validation, including retry mechanisms.

---

## 21. Database Architecture Diagram

**Purpose**: Shows the data storage architecture and data models.

**Description**: Illustrates MongoDB collections (users, wallets, notifications, sessions, device_fingerprints, follower_snapshots), Neo4j graph structure (nodes, relationships), Redis namespaces (sessions, cache, rate limits), and data relationships.

---

## 22. Message Queue Architecture Diagram

**Purpose**: Shows RabbitMQ exchanges, queues, and message routing.

**Description**: Illustrates RabbitMQ exchanges (email.events, notification.events, user.sync.events, relationship.events), queue bindings, consumers (Email Worker, Notification Service, Neo4j Sync), and message flow patterns.

---

## 23. Caching Strategy Diagram

**Purpose**: Illustrates Redis caching patterns and cache invalidation strategies.

**Description**: Shows cache layers (session cache, profile cache, recommendation cache, rate limit buckets), cache keys, TTL strategies, invalidation triggers, and cache warming patterns.

---

## 24. WebSocket Architecture Diagram

**Purpose**: Shows real-time communication architecture using WebSocket.

**Description**: Illustrates client connections → Notification Gateway → Socket.IO → Redis adapter (for scaling) → room management → event broadcasting → authentication flow, including connection lifecycle.

---

## 25. Security Architecture Diagram

**Purpose**: Illustrates security layers, authentication mechanisms, and authorization patterns.

**Description**: Shows JWT token types (access, session, service), guards (Auth, Service, Role-based), encryption layers, rate limiting, device fingerprinting, CORS policies, and security headers.

---

## 26. Deployment Architecture Diagram

**Purpose**: Shows the production deployment structure using Docker and Docker Compose.

**Description**: Illustrates Docker containers, Docker networks (decode-network), service dependencies, health checks, volume mounts, port mappings, and service scaling strategies.

---

## 27. CI/CD Pipeline Diagram

**Purpose**: Shows the continuous integration and deployment workflow.

**Description**: Illustrates GitHub Actions workflow → build → test → Docker image creation → registry push → deployment → health checks → rollback mechanisms, including staging and production environments.

---

## 28. Monitoring and Observability Diagram

**Purpose**: Shows monitoring, logging, and observability infrastructure.

**Description**: Illustrates Datadog APM integration, health check endpoints, structured logging, metrics collection, distributed tracing, alerting, and dashboard visualization.

---

## 29. Error Handling and Resilience Diagram

**Purpose**: Shows error handling patterns, retry mechanisms, and circuit breakers.

**Description**: Illustrates error propagation paths, exception filters, retry strategies, circuit breaker patterns, fallback mechanisms, and error logging/monitoring.

---

## 30. Data Flow Diagram - User Registration to Profile Completion

**Purpose**: End-to-end flow from user registration through profile setup.

**Description**: Shows registration → email verification → login → profile creation → wallet linking → initial follow actions, including all service interactions and data persistence.

---

## 31. Social Graph Query Flow

**Purpose**: Shows how relationship queries are executed across Neo4j and MongoDB.

**Description**: Illustrates query request → Relationship Service → Neo4j Cypher query → graph traversal → MongoDB snapshot lookup → result aggregation → caching → response, including mutual connections and recommendations.

---

## 32. Session Management Flow

**Purpose**: Shows how user sessions are created, validated, and managed across services.

**Description**: Illustrates session creation → MongoDB storage → Redis caching → session validation → token refresh → session termination → active session tracking, including device management.

---

## 33. Rate Limiting Architecture

**Purpose**: Shows rate limiting implementation across services.

**Description**: Illustrates rate limit strategies (Redis-based, token bucket, sliding window), rate limit keys, threshold configuration, and rate limit response handling.

---

## 34. Service Discovery and Health Checks

**Purpose**: Shows how services discover each other and maintain health status.

**Description**: Illustrates health check endpoints, service health status, dependency health validation, service discovery patterns, and failure detection.

---

## 35. Data Consistency Model

**Purpose**: Shows how data consistency is maintained across MongoDB and Neo4j.

**Description**: Illustrates eventual consistency model, sync triggers, conflict resolution, data validation, and consistency guarantees.

---

## 36. API Gateway Request Transformation

**Purpose**: Shows how API Gateway transforms requests and responses.

**Description**: Illustrates request validation → DTO transformation → service call → response mapping → error translation → response standardization, including Swagger documentation generation.

---

## 37. Multi-Factor Authentication Flow

**Purpose**: Shows the 2FA/OTP authentication process.

**Description**: Illustrates OTP generation → email/SMS delivery → OTP validation → device trust → session creation, including OTP expiration and retry logic.

---

## 38. Password Reset Flow

**Purpose**: Shows the complete password reset workflow.

**Description**: Illustrates password reset request → token generation → email delivery → token validation → password update → session invalidation → notification, including security measures.

---

## 39. Account Deactivation Flow

**Purpose**: Shows the process of deactivating a user account.

**Description**: Illustrates deactivation request → validation → data retention → session termination → relationship cleanup → notification, including reactivation process.

---

## 40. Wallet Session Creation Flow

**Purpose**: Shows how wallet-specific sessions are created for Web3 operations.

**Description**: Illustrates wallet linking → signature verification → Auth Service call → wallet session token generation → session storage → wallet operation authorization.

---

## 41. Follower Snapshot Process

**Purpose**: Shows the scheduled process for creating follower snapshots.

**Description**: Illustrates scheduled job → Relationship Service → Neo4j query → follower count → MongoDB snapshot creation → analytics data, including snapshot retention.

---

## 42. Notification Types and Routing

**Purpose**: Shows different notification types and their routing logic.

**Description**: Illustrates notification type classification (follow, message, alert, update) → routing rules → queue selection → priority handling → delivery channels (WebSocket, REST, Email).

---

## 43. Email Template System

**Purpose**: Shows the email template rendering and management system.

**Description**: Illustrates template selection → variable substitution → Handlebars rendering → HTML/text generation → SMTP formatting → delivery, including template versioning.

---

## 44. Graph Database Schema

**Purpose**: Shows the Neo4j graph schema and relationship types.

**Description**: Illustrates node types (User), relationship types (FOLLOWS, BLOCKS, INTERESTED_IN), properties, indexes, and query patterns.

---

## 45. MongoDB Schema Relationships

**Purpose**: Shows MongoDB document schemas and their relationships.

**Description**: Illustrates collection schemas (User, Wallet, Notification, Session, DeviceFingerprint, FollowerSnapshot), embedded documents, references, indexes, and validation rules.

---

## 46. Redis Data Structures

**Purpose**: Shows how different Redis data structures are used.

**Description**: Illustrates Redis usage patterns (strings for cache, sets for sessions, sorted sets for rate limits, hashes for user data), key naming conventions, and expiration strategies.

---

## 47. Inter-Service Communication Patterns

**Purpose**: Shows different communication patterns between services.

**Description**: Illustrates synchronous HTTP calls, asynchronous RabbitMQ messaging, WebSocket real-time communication, service-to-service JWT authentication, and request/response patterns.

---

## 48. Load Balancing and Scaling Strategy

**Purpose**: Shows how services can be scaled horizontally.

**Description**: Illustrates load balancer configuration, service replication, session affinity, WebSocket scaling with Redis adapter, and database connection pooling.

---

## 49. Backup and Recovery Strategy

**Purpose**: Shows data backup and disaster recovery procedures.

**Description**: Illustrates MongoDB backup strategy, Neo4j backup, Redis persistence, volume snapshots, and recovery procedures.

---

## 50. Network Security and Isolation

**Purpose**: Shows network security architecture and service isolation.

**Description**: Illustrates Docker network isolation, service-to-service communication restrictions, external access points, firewall rules, and network segmentation.

---

## Diagram Creation Guidelines

### Recommended Tools
- **C4 Model Diagrams**: Structurizr, PlantUML, Mermaid, Draw.io
- **Architecture Diagrams**: Lucidchart, Miro, Excalidraw
- **Sequence Diagrams**: PlantUML, Mermaid, Sequence Diagram tools
- **Database Diagrams**: dbdiagram.io, ERD tools, Neo4j Browser

### Diagram Standards
- Use consistent color coding for services, databases, and external systems
- Include port numbers and protocol information
- Show data flow direction with arrows
- Include legend/key for symbols and colors
- Maintain consistent naming conventions
- Update diagrams when architecture changes

### Priority Order
1. **High Priority**: Diagrams 1-10 (System Context, Container, Component views)
2. **Medium Priority**: Diagrams 11-25 (Flows, Architecture patterns)
3. **Lower Priority**: Diagrams 26-50 (Detailed implementation, operational)

---

**Last Updated**: 2024
**Maintained By**: Decode Development Team
