# Testing & QA Strategy

The Decode Network backend uses a layered QA approach that mirrors a production-grade pipeline. This document captures the scope, tooling, and execution model so every contributor understands how to add, run, and extend tests consistently.

---

## 1. Test Pyramid Overview

| Layer | Goal | Typical Scope | Tooling |
|-------|------|---------------|---------|
| Unit | Verify isolated business logic with fast feedback | Pure services, guards, filters, pipes | Jest + ts-jest, dependency mocks |
| Integration | Validate module wiring and external boundary contracts | REST controllers with mocked infra (Mongo, Redis) | @nestjs/testing, Supertest, in-memory doubles |
| End-to-End (E2E) | Exercise user flows through HTTP entry points | Critical scenarios: registration, login, wallet link | Nest testing module + Supertest + seed fixtures |
| Contract | Guarantee inter-service compatibility | API Gateway ↔ Auth/User service contracts | Pact (recommended), OpenAPI schemas |
| Performance & Resilience | Guard against regressions in latency and throughput | Hot paths (login, profile aggregation), queue consumers | k6, artillery, custom RabbitMQ load scripts |
| Static Analysis | Enforce style and common bug patterns | All TS sources | ESLint, Prettier |

---

## 2. Tooling & Frameworks

- **Jest / ts-jest**: Primary runner for unit/integration specs.
- **@nestjs/testing + Supertest**: Spin up Nest applications or isolated modules for controller/e2e tests.
- **Pact** *(planned)*: Consumer/provider contract testing to keep API Gateway and downstream services in sync.
- **k6** *(planned)*: Load generation for HTTP APIs; scripts will live under `tests/perf/`.
- **ESLint + Prettier**: Static analysis and formatting gates in CI.

---

## 3. Environments

| Environment | Purpose | Notes |
|-------------|---------|-------|
| Local (dev) | Developer machines running `npm run test:unit` etc. | Uses mocked dependencies and ephemeral data. |
| Local Integration | Docker Compose stack (`docker-compose.dev.yml`) | Required when tests need real Mongo/Redis/RabbitMQ. |
| CI | GitHub Actions workflows (build + test stages) | Executes unit/integration suites, lint, and (future) Pact/k6 smoke. |
| Staging | Optional manual verification | E2E regression before production deploy; data seeded via scripts. |

---

## 4. Test Data & Fixtures

- **Unit tests** rely exclusively on Jest mocks (no network or DB I/O).
- **Integration/E2E tests** should seed data via repositories or HTTP setup endpoints and clean up after execution.
- **Shared fixtures** live in `tests/fixtures/` (future). For now, each suite documents its own mocks to avoid bleed-through.

---

## 5. Execution Workflow

1. **Local Development**
   - `npm run lint` → `npm run test:unit` (targeted) → optional `npm run test:e2e:new` when touching controller flows.
   - Use `npm run test -- --runTestsByPath <path>` for focused debugging.
2. **Pull Request**
   - CI pipeline runs lint + unit + integration steps automatically.
   - Performance and contract tests run on nightly or dedicated workflows.
3. **Pre-Release**
   - Manual execution of expanded smoke: `npm run test:cov`, k6 smoke, RabbitMQ consumer replay.

---

## 6. Coverage Goals

| Service | Unit Coverage | Integration Coverage |
|---------|---------------|----------------------|
| Auth | ≥ 70% critical paths (login, session, device) | Login + register flows |
| API Gateway | ≥ 60% guards/interceptors | Key orchestration endpoints |
| Relationship & User | ≥ 60% service logic | Follow/search happy-path |
| Remaining services | ≥ 50% initially | Grow as features stabilize |

Performance SLA verification (<500 ms median, <1 s p95) is enforced via k6 smoke jobs on CI once scripts are added.

---

## 7. Next Steps

1. Expand unit coverage across Auth and User services (device fingerprint, session lifecycle).
2. Add integration suites for API Gateway controllers with mocked downstream clients.
3. Introduce Pact contract tests between Auth ↔ User services.
4. Add k6 smoke scripts targeting `/auth/login`, `/users/profile`, `/relationship/suggestions`.
5. Wire the above into GitHub Actions so every PR receives deterministic QA signals.

Contributors should treat this document as living guidance—update it whenever new tooling or policies are adopted.

---

## 8. Service-by-Service Coverage Charter

| Service | Critical Components | Unit Focus | Integration / E2E Focus |
|---------|--------------------|------------|--------------------------|
| **API Gateway** | Guards, interceptors, request enrichment | Auth guard role matrix, rate limiter edge cases | Proxy flows to Auth/User/Wallet with downstream mocks; error mapping fidelity |
| **Auth** | Login, MFA, session lifecycle, device trust | Hashing helpers, token issuance, session store adapters | `/auth/login`, `/auth/register`, `/auth/device/verify` happy + failure paths against Mongo/Redis via docker-compose |
| **User** | Profile aggregation, privacy settings, search | DTO validation, service-level caching, privacy policy enforcement | `/users/profile`, `/users/search`, `/users/{id}/settings` with mocked external relationship service |
| **Relationship** | Follow/unfollow, suggestions, blocking | Graph query builders, notifications fan-out | `/relationship/follow`, `/relationship/suggestions`, `/relationship/block` with Neo4j test container or test double |
| **Wallet** | Custody integrations, balance queries | Fiat ↔ crypto conversion helpers, provider client mocks | `/wallet/link`, `/wallet/balance`, withdrawal flow using sandbox provider credentials |
| **Notification** | WebSocket gateway, push/email dispatch | Template rendering, channel fan-out strategies | WebSocket handshake, event-to-delivery latency using in-memory Redis + RabbitMQ doubles |
| **Email Worker** | Template engine, provider retries | Handlebars helpers, retry scheduler | End-to-end “device verification email” flow triggered via queue payload |
| **Neo4j Sync** | Change capture, reconciliation jobs | Mapping utilities, batch sizing logic | Full sync job against disposable Neo4j instance verifying idempotency |

Each service owner keeps a `tests/<service>/README.md` describing command entry points, fixtures, and coverage checkpoints. These charters are reviewed quarterly to ensure the “all systems” remit remains current.

---

## 9. Cross-Service Scenario Catalog

- **Authentication Funnel**: API Gateway → Auth → User (profile fetch). Validates JWT issuance, gateway propagation of claims, and profile hydration.
- **Social Graph Mutation**: User updates → Relationship service writes → Notification push. Covers transactional messaging and idempotent retries.
- **Wallet Onboarding**: Authenticated user links wallet, triggers KYC, receives notification. Exercises wallet service + email worker + notification sockets.
- **Data Consistency / Sync**: User edits profile, sync propagates to Neo4j, Relationship queries reflect change. Ensures eventual consistency SLAs.
- **Failure Regression Pack**: Simulate downstream 5xx/timeout per service, verify gateway fallbacks, alerting hooks, and retry policies.

Each scenario receives:
1. A Supertest-based E2E spec under `tests/e2e/<scenario>.spec.ts`.
2. Required fixtures (Mongo collections, Redis keys, queue payloads) under `tests/fixtures/<scenario>/`.
3. Post-run assertions on logs/metrics to guarantee observability contracts (e.g., Datadog spans emitted).

---

## 10. Automation & Governance Enhancements

1. **Coverage Gates**: Enforce per-service thresholds via `jest --coverage --selectProjects <service>` once Jest projects are split. Fail CI when deltas decrease.
2. **Contract Testing**: Introduce Pact broker in CI. API Gateway acts as consumer; Auth/User/Wallet as providers. Contracts versioned under `contracts/`.
3. **Performance Regression**: Add `tests/perf/*.js` k6 scripts with smoke (CI) and load (nightly) profiles. Results uploaded to Grafana Loki/S3 for trend analysis.
4. **Resilience Harness**: Nightly chaos suite leveraging docker-compose + `toxiproxy` to inject latency/packet loss, ensuring retry logic behaves across all services.
5. **Test Data Management**: Create `tests/fixtures/seed.ts` central seeder. E2E suites call `npm run test:seed` before execution to guarantee deterministic state.
6. **CI Workflow**: Multi-stage pipeline—Lint → Unit (parallel per service) → Integration (dockerized) → Contract → Perf smoke. Artifacts (coverage reports, Pact files, k6 summaries) attached to PR for reviewer visibility.
7. **Documentation**: Every new suite updates this strategy plus service-specific READMEs. ADRs capture major tooling shifts (e.g., new contract framework).
