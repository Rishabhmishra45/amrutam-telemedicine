# Amrutam Telemedicine Platform



Production-grade telemedicine backend (NestJS + PostgreSQL + Redis) with a lightweight React frontend.

Focus: ****scalability, reliability, security, observability****.



> Target: 100k consultations/day, p95 < 200 ms reads, < 500 ms writes, 99.95% availability.



**---**



## 1. Tech Stack



| Layer | Choice | Why |

|---|---|---|

| Backend | ****NestJS (TypeScript)**** | Built-in DI, modules, validation, Swagger |

| DB | ****PostgreSQL 16**** | Transactions, row locks, partitioning |

| ORM | ****Prisma**** (or TypeORM) | Fast migrations + type safety |

| Cache / locks / rate limit | ****Redis 7**** | Slot locks, search cache, throttling |

| Async jobs | ****BullMQ**** | Notifications, reminders, retries with backoff |

| Auth | JWT (access + refresh), ****TOTP MFA****, bcrypt/argon2 | |

| Validation | class-validator / Zod | |

| Logs | ****pino**** (structured JSON) | |

| Metrics | ****Prometheus + Grafana**** | |

| Tracing | ****OpenTelemetry + Jaeger**** | |

| Tests | Jest + Supertest | |

| CI/CD | GitHub Actions + Docker | |

| Frontend | ****React + Vite + TypeScript + Tailwind**** | Fastest to build |

| API docs | Swagger/OpenAPI at `/api/docs` | |



**---**



## 2. Repository Structure



```

amrutam/

├── README.md                  <- this file

├── docker-compose.yml         <- postgres, redis, backend, frontend, prometheus, grafana, jaeger

├── .github/workflows/ci.yml   <- lint, test, build, scan

├── infra/

│   ├── prometheus/prometheus.yml

│   ├── grafana/dashboards/

│   ├── k8s/                   <- optional manifests (deployment, service, hpa)

│   └── terraform/             <- optional (bonus)

├── docs/

│   ├── architecture.md        <- 2-4 pages

│   ├── threat-model.md

│   ├── security-checklist.md

│   ├── er-diagram.md

│   ├── booking-sequence.md

│   └── dr-backup.md

├── backend/

│   ├── src/

│   │   ├── main.ts

│   │   ├── app.module.ts

│   │   ├── common/            <- guards, interceptors, filters, decorators, idempotency

│   │   ├── config/            <- env validation

│   │   ├── prisma/            <- prisma service

│   │   ├── auth/              <- register, login, refresh, MFA, RBAC

│   │   ├── users/

│   │   ├── doctors/           <- profiles, specialties

│   │   ├── availability/      <- slots

│   │   ├── consultations/     <- booking + lifecycle state machine

│   │   ├── prescriptions/

│   │   ├── payments/          <- mock gateway + saga

│   │   ├── search/

│   │   ├── audit/

│   │   ├── analytics/         <- admin

│   │   ├── jobs/              <- BullMQ processors

│   │   └── observability/     <- metrics, tracing, health

│   ├── prisma/schema.prisma

│   ├── test/                  <- e2e tests

│   ├── Dockerfile

│   └── .env.example

└── frontend/

    ├── src/

    │   ├── pages/             <- Login, Register, Doctors, Booking, MyConsultations, Prescriptions, Admin

    │   ├── components/

    │   ├── api/               <- axios client + interceptors

    │   └── store/

    ├── Dockerfile

    └── .env.example

```



**---**



## 3. High-Level Architecture



```mermaid

flowchart LR

  FE[React Frontend] --> LB[Load Balancer / Nginx]

  LB --> API1[NestJS API #1]

  LB --> API2[NestJS API #2]

  API1 & API2 --> PG[(PostgreSQL primary)]

  PG --> RR[(Read replica)]

  API1 & API2 --> R[(Redis)]

  API1 & API2 --> Q[BullMQ queues]

  Q --> W[Worker: notifications, reminders, payments]

  API1 & API2 -.metrics.-> P[Prometheus] --> G[Grafana]

  API1 & API2 -.traces.-> J[Jaeger]

```



Design notes:

- API is ****stateless**** so it scales horizontally behind a load balancer.

- Reads (search, doctor list) go to ****Redis cache**** first, then read replica.

- Heavy work (emails, reminders, payment webhooks, analytics rollups) is ****async via BullMQ****.



**---**



## 4. Booking Flow (most important, spend the most time here)



```mermaid
sequenceDiagram
    participant P as Patient
    participant API as Booking API
    participant R as Redis
    participant DB as PostgreSQL
    participant PAY as Mock Payment
    participant Q as Queue

    P->>API: POST /consultations with Idempotency-Key
    API->>R: Check idempotency key

    alt Key already used
        R-->>API: Return stored response
        API-->>P: Return same response without duplicate booking
    else New key
        API->>R: Acquire slot lock with NX and expiry
        API->>DB: Begin transaction
        API->>DB: Select slot for update
        API->>DB: Mark slot as HELD
        API->>DB: Insert consultation with PENDING_PAYMENT status
        API->>DB: Commit transaction
        API->>PAY: Create payment
        PAY-->>API: Payment result

        alt Payment succeeds
            API->>DB: Mark consultation CONFIRMED and slot BOOKED
            API->>Q: Enqueue notification and audit event
            API->>R: Store response for idempotency key
            API-->>P: Return 201 Created
        else Payment fails
            API->>DB: Release slot and mark consultation CANCELLED
            API-->>P: Return payment failure response
        end
    end

    Note over API,DB: A cleanup job releases slot holds that expire
```



### Must-have rules

1. ****Idempotency****: every POST that writes (book, pay, prescribe) requires an `Idempotency-Key` header. Store `key + request hash + response` in Redis (24h) and in a DB table for durability. Same key + same body returns the same response. Same key + different body returns `422`.

2. ****No double booking****: three layers

   - DB ****unique constraint**** on `(slot_id)` for active consultations

   - `SELECT ... FOR UPDATE` row lock inside a transaction

   - Optional Redis lock for fast rejection

3. ****Saga**** (orchestrated): `HOLD_SLOT -> CREATE_PAYMENT -> CONFIRM` and compensations `RELEASE_SLOT -> CANCEL`. Run a ****cron job**** to release slots stuck in `HELD` > 10 minutes.

4. ****Retry + backoff****: BullMQ jobs use exponential backoff (`attempts: 5, backoff: {type:'exponential', delay: 1000}`) plus jitter; dead-letter queue after max attempts.



### Consultation state machine



```

PENDING_PAYMENT -> CONFIRMED -> IN_PROGRESS -> COMPLETED

        |              |

        v              v

    CANCELLED      CANCELLED / NO_SHOW

```

Reject illegal transitions in one `canTransition(from, to)` function.



**---**



## 5. Data Model (ER)



```mermaid

erDiagram

  users ||--|| profiles : has

  users ||--o| doctors : "is a"

  doctors ||--o{ availability_slots : offers

  availability_slots ||--o| consultations : booked_by

  users ||--o{ consultations : "patient"

  doctors ||--o{ consultations : attends

  consultations ||--o{ prescriptions : has

  consultations ||--o| payments : paid_by

  users ||--o{ audit_logs : acts

```



| Table | Key columns |

|---|---|

| users | id (uuid), email (unique), password_hash, role (PATIENT/DOCTOR/ADMIN), mfa_secret (encrypted), mfa_enabled, status, created_at |

| profiles | user_id, full_name, phone (encrypted), dob, gender, address |

| doctors | user_id, specialty, experience_years, rating, consultation_fee, bio, verified |

| availability_slots | id, doctor_id, start_time, end_time, status (OPEN/HELD/BOOKED), version, unique(doctor_id, start_time) |

| consultations | id, patient_id, doctor_id, slot_id (unique where active), status, reason, started_at, ended_at, created_at, ****partition by month**** |

| prescriptions | id, consultation_id, doctor_id, medicines (encrypted JSON), notes, created_at |

| payments | id, consultation_id, amount, status, provider_ref, idempotency_key (unique), created_at |

| audit_logs | id, actor_id, action, entity, entity_id, ip, user_agent, metadata, created_at (append-only) |

| idempotency_keys | key, request_hash, response, expires_at |



Indexes to add: `doctors(specialty, rating)`, `availability_slots(doctor_id, start_time, status)`, `consultations(patient_id, created_at)`, `consultations(doctor_id, status)`, GIN/trigram index on doctor name for search.



**---**



## 6. API Endpoints (REST, versioned `/api/v1`)



****Auth****

- `POST /auth/register` | `POST /auth/login` | `POST /auth/refresh` | `POST /auth/logout`

- `POST /auth/mfa/setup` | `POST /auth/mfa/verify`



****Doctors and slots****

- `GET /doctors?specialty=&minRating=&date=&q=&page=&limit=` (cached)

- `GET /doctors/:id`

- `POST /doctors/me/slots` (DOCTOR) | `GET /doctors/:id/slots?date=`



****Consultations****

- `POST /consultations` (PATIENT, Idempotency-Key)

- `GET /consultations/me`

- `PATCH /consultations/:id/status` (start, complete, cancel)



****Prescriptions****

- `POST /consultations/:id/prescriptions` (DOCTOR, Idempotency-Key)

- `GET /prescriptions/me`



****Payments****

- `POST /payments/webhook` (mock gateway callback, signature verified)



****Admin****

- `GET /admin/analytics/summary` (consultations/day, revenue, top doctors, cancellation rate)

- `GET /admin/audit-logs?actor=&action=&from=&to=`



****Ops****

- `GET /health` | `GET /ready` | `GET /metrics`



**---**



## 7. Security Checklist (do NOT skip, this is the auto-fail area)



- [ ] Passwords hashed with argon2/bcrypt (cost >= 12)

- [ ] JWT access (15 min) + refresh token rotation (stored hashed)

- [ ] ****TOTP MFA**** (mandatory for DOCTOR and ADMIN)

- [ ] ****RBAC**** guard on every route + ownership checks (patient sees only own data)

- [ ] Input validation on all DTOs, `whitelist: true`, `forbidNonWhitelisted: true`

- [ ] ****Rate limiting**** (global + stricter on `/auth/*`) using Redis throttler

- [ ] `helmet`, strict CORS, body size limits

- [ ] Field-level ****encryption**** (AES-256-GCM) for phone, medicines, MFA secret; key from env, support `key_version` for ****rotation****

- [ ] TLS in transit (document Nginx/ingress TLS); DB encryption at rest (document)

- [ ] ****Audit log**** on login, failed login, booking, status change, prescription view/create, admin actions

- [ ] Parameterized queries only (ORM) to prevent SQL injection

- [ ] No secrets in repo; `.env.example` only

- [ ] Dependency scanning in CI (`npm audit`, Trivy on image)

- [ ] Account lockout after repeated failed logins

- [ ] Generic error messages (no stack traces to client)



OWASP Top 10 mapping goes into `docs/threat-model.md` (STRIDE table + attack surface + data classification: PII, PHI, credentials, public).



**---**



## 8. Caching and Scalability



- Cache `GET /doctors` and slot lists in Redis (TTL 30-60 s), invalidate on slot create/book.

- Cursor or keyset pagination for large lists.

- ****Partition**** `consultations` and `audit_logs` by month (range partitioning).

- Read replica for search and analytics (document it; compose can run a single DB).

- Connection pooling (PgBouncer, document).

- HPA/replicas in k8s manifests (optional bonus).

- Back-of-envelope: 100k/day is about 1.2 req/s average, plan for about 50 req/s peak. Include this math in the architecture doc.



**---**



## 9. Observability



- ****Logs****: pino JSON with `requestId`, `userId`, `route`, `latency`. Never log passwords, tokens, PHI.

- ****Metrics**** (`/metrics`): HTTP request duration histogram, request count by status, booking success/fail counter, queue depth, DB pool usage.

- ****Tracing****: OpenTelemetry auto-instrumentation to Jaeger (HTTP, pg, redis).

- ****Grafana dashboard****: p95 latency, error rate, bookings/min, queue backlog. Commit the JSON in `infra/grafana/dashboards/`.

- ****Alerts**** (documented): p95 > 500 ms, 5xx > 1%, queue backlog growing.



**---**



## 10. Backup and DR (document in `docs/dr-backup.md`)



- PostgreSQL WAL archiving + daily base backup, PITR

- ****RPO <= 5 min, RTO <= 30 min****

- Multi-AZ deployment, standby replica promotion

- Redis is cache only, rebuildable; BullMQ jobs persisted with AOF

- Quarterly restore drill



**---**



## 11. Testing and CI



****Tests (minimum)****

- Unit: state machine, idempotency service, encryption util, auth service

- E2E (Supertest): register -> login -> MFA -> book slot -> pay -> consult -> prescribe

- ****Concurrency test****: 20 parallel booking requests on one slot, exactly 1 succeeds

- ****Idempotency test****: same key twice, one booking only



**`.github/workflows/ci.yml`**

1. Checkout, Node setup, `npm ci`

2. Lint + typecheck

3. Tests (with postgres and redis service containers)

4. `npm audit --audit-level=high`

5. Docker build + Trivy scan

6. (Optional) push image to GHCR



**---**



## 12. Local Setup



****Prerequisites:**** Node 20+, Docker Desktop, Git.



```bash

# 1. clone and enter

git clone \<your-repo-url> amrutam && cd amrutam



# 2. env files

cp backend/.env.example backend/.env

cp frontend/.env.example frontend/.env



# 3. start infra (postgres, redis, jaeger, prometheus, grafana)

docker compose up -d postgres redis jaeger prometheus grafana



# 4. backend

cd backend

npm install

npx prisma migrate dev

npx prisma db seed        # sample doctors, slots, admin user

npm run start:dev         # http\://localhost:3000, docs at /api/docs



# 5. frontend (new terminal)

cd frontend

npm install

npm run dev               # http\://localhost:5173

```



****One command (everything in containers):**** `docker compose up --build`



### `backend/.env.example`

```

NODE_ENV=development

PORT=3000

DATABASE_URL=postgresql://amrutam:amrutam\@localhost:5432/amrutam

REDIS_URL=redis\://localhost:6379

JWT_ACCESS_SECRET=change_me

JWT_REFRESH_SECRET=change_me_too

JWT_ACCESS_TTL=900

JWT_REFRESH_TTL=604800

ENCRYPTION_KEY=32_byte_base64_key

ENCRYPTION_KEY_VERSION=1

MFA_ISSUER=Amrutam

OTEL_EXPORTER_OTLP_ENDPOINT=http\://localhost:4318

PAYMENT_WEBHOOK_SECRET=change_me

```



### `frontend/.env.example`

```

VITE_API_URL=http\://localhost:3000/api/v1

```



**---**



## 13. Frontend Scope (keep it small, 1 day max)



React + Vite + Tailwind. Pages:



1. ****Login / Register**** (with MFA code step)

2. ****Doctor list**** with search and filters (specialty, rating, date)

3. ****Doctor detail + slot picker + Book**** (sends Idempotency-Key via `crypto.randomUUID()`)

4. ****My Consultations**** (status, cancel)

5. ****Prescriptions**** list

6. ****Doctor dashboard****: create slots, start/complete consultation, write prescription

7. ****Admin dashboard****: analytics cards + audit log table



The frontend is for the demo video. Backend quality carries the marks, so don't over-polish it.



**---**



## 14. Build Order (4-5 days)



### Day 1: Foundation

- [ ] Init NestJS in `backend/`, Vite React in `frontend/`

- [ ] docker-compose with Postgres + Redis

- [ ] Prisma schema (all tables) + migration + seed

- [ ] Config validation, pino logger, global validation pipe, error filter

- [ ] Auth: register, login, refresh, RBAC guards, MFA (TOTP)



### Day 2: Core flows

- [ ] Doctors, profiles, availability slots

- [ ] Idempotency interceptor

- [ ] Booking flow with locks + transaction

- [ ] Consultation state machine



### Day 3: Remaining features

- [ ] Payments (mock) + saga + compensation + stuck-slot cron

- [ ] Prescriptions (encrypted)

- [ ] Search + filters + Redis cache

- [ ] Audit logs + admin analytics

- [ ] BullMQ notification/reminder jobs



### Day 4: Non-functionals + frontend

- [ ] Rate limiting, helmet, CORS

- [ ] Prometheus metrics, OpenTelemetry, Grafana dashboard

- [ ] Tests (unit, e2e, concurrency, idempotency)

- [ ] GitHub Actions CI

- [ ] Frontend pages



### Day 5: Docs and demo

- [ ] `docs/architecture.md` (2-4 pages: architecture, data flow, sequence, ER, retries, partitioning, caching, saga, DR)

- [ ] `docs/threat-model.md` + `docs/security-checklist.md`

- [ ] OpenAPI export (`openapi.json`)

- [ ] Final README polish

- [ ] ****5-minute demo video****



**---**






## 15. Submission Checklist



- [ ] Git repo with code + infra

- [ ] README with setup

- [ ] OpenAPI schema

- [ ] Architecture doc (2-4 pages)

- [ ] Tests + CI green

- [ ] Observability setup (Prometheus, Grafana, Jaeger)

- [ ] Security checklist + threat model

- [ ] 5-minute demo video



****Rubric:**** Architecture 20, Core Flows 20, Code Quality 15, Security 10, Observability 10, Scalability 10, Infra/CI 10, Bonus +10.

****Auto-fail:**** missing critical security or missing idempotency.



**---**



## 16. Bonus Ideas (+10)



- Terraform or k8s manifests with HPA

- Outbox pattern for reliable event publishing

- Circuit breaker on the payment gateway

- Load test report (k6) showing p95 numbers

- Feature flags, soft deletes, GDPR-style data export