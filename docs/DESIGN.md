# Software Design Document (SDD)

## BloodBank Finder

Version 1.0

---

## 1. Introduction

This document describes the technical design of **BloodBank Finder**: its architecture, data model, API contract, key workflows, and cross-cutting concerns (security, error handling, real-time delivery). It complements `docs/SRS.md`, which states *what* the system must do; this document explains *how* it is built.

---

## 2. System Architecture

### 2.1 High-Level Overview

BloodBank Finder follows a three-tier architecture with one shared backend serving two independent front-ends:

```
                 ┌────────────────────┐
                 │   PostgreSQL DB    │
                 └─────────▲──────────┘
                            │ Prisma Client
                 ┌──────────┴──────────┐
                 │   server (Express)  │
                 │  REST API + Socket.IO│
                 └──────▲───────▲──────┘
            REST/WS via │       │ REST/WS via
            HTTPS       │       │ HTTPS
       ┌─────────────────┘       └─────────────────┐
       │                                            │
┌──────┴───────┐                           ┌────────┴────────┐
│ web (Next.js)│                           │ mobile (Expo/RN)│
│  PWA, browser│                           │ Android / iOS   │
└──────────────┘                           └─────────────────┘
```

- **server** is the single source of truth for business logic, validation, and persistence. Neither client embeds business rules beyond basic form UX.
- **web** and **mobile** are presentation-layer peers: they consume the same REST/WebSocket contract and keep parallel TypeScript type definitions (`lib/types.ts`) and API client wrappers (`lib/api.ts`).

### 2.2 Server Internal Layering

```
routes/        → URL → middleware chain → controller (per resource)
  middleware/  → requireAuth, requireRole, validate(schema), rateLimit
controllers/   → parse req, call service, shape HTTP response
services/      → business logic, Prisma queries, notification triggers
schemas/       → Zod schemas (validation + inferred TS types)
utils/         → pure helpers: distance (Haversine), blood compatibility, eligibility, AppError
sockets/       → Socket.IO auth + room management + emit helpers
```

Request flow for a typical mutating endpoint:

```
HTTP request
  → rate limiter (if applicable)
  → requireAuth (verifies JWT, sets req.userId/userRole)
  → requireRole(...) (if endpoint is role-restricted)
  → validate(schema) (parses/validates body or query with Zod)
  → controller (thin: delegates to service, maps result to response)
  → service (Prisma reads/writes, triggers notifications/sockets)
  → errorHandler (catches AppError / ZodError / Prisma errors → structured response)
```

### 2.3 Client Architecture

Both clients follow the same shape:

- An **AuthContext** holds the current user/donor/organization and exposes `login`, `registerDonor`, `registerOrganization`, `logout`, `refresh`.
- A typed **API client module** (`lib/api.ts`) wraps `fetch`, attaches the bearer token, and throws a typed `ApiError` on non-2xx responses.
- **Socket.IO client** connects with the same JWT to receive real-time events and feed local notification state.
- Screens/pages are organized per role (donor vs. organization vs. admin) and per feature (requests, search, inventory, ambulances, notifications, profile).

---

## 3. Data Design

### 3.1 Entity-Relationship Summary

```
User 1───1 DonorProfile
User 1───1 Organization
Organization 1───N InventoryItem
Organization 1───N EmergencyRequest
Organization 1───N Ambulance
Organization 1───N AmbulanceRequest
EmergencyRequest 1───N RequestResponse
EmergencyRequest 1───N AmbulanceRequest
RequestResponse 1───N AmbulanceRequest   (optional link)
Ambulance 1───N AmbulanceRequest          (optional link)
User 1───N RequestResponse  (as donor)
User 1───N Notification
User 1───N AmbulanceRequest  (as requestedBy)
```

### 3.2 Core Models

**User** — account record shared by all roles.
- `id, email (unique), passwordHash, phone, role[DONOR|HOSPITAL|BLOOD_BANK|ADMIN], isActive, createdAt, updatedAt`

**DonorProfile** — one-to-one with a DONOR user.
- Identity/medical: `fullName, gender, dateOfBirth, weightKg, bloodGroup`
- Location: `lat, lng, address, city, state, pincode`
- Status: `isAvailable, lastDonationDate, totalDonations`
- Health/lifestyle: `medicalNotes, isSmoker, isAlcoholic, usesDrugs, hasChronicIllness, chronicIllnessDetails, hasGeneticDisorder, geneticDisorderDetails`
- Indexes: `[bloodGroup, isAvailable]`, `[city]` — support the donor-matching and search query paths.

**Organization** — one-to-one with a HOSPITAL/BLOOD_BANK user.
- `name, type[HOSPITAL|BLOOD_BANK], regNumber, contactPerson, lat, lng, address, city, state, pincode, isVerified`
- Index: `[type, city]`.

**InventoryItem** — per-blood-group stock count, unique per `(organizationId, bloodGroup)`.

**EmergencyRequest**
- `organizationId, bloodGroup, unitsNeeded, unitsFulfilled, urgency[CRITICAL|HIGH|MODERATE], status[OPEN|PARTIALLY_FULFILLED|FULFILLED|CANCELLED|EXPIRED], patientInfo?, notes?, lat, lng, address, expiresAt`
- Indexes: `[status, bloodGroup]`, `[organizationId]`.

**RequestResponse** — a donor's offer against a request, unique per `(requestId, donorUserId)`.
- `status[OFFERED|CONFIRMED|COMPLETED|DECLINED|CANCELLED], distanceKm, respondedAt`

**Ambulance** — unique per `(organizationId, vehicleNumber)`.
- `vehicleNumber, driverName, driverPhone, status[AVAILABLE|ON_TRIP|OFFLINE], lat, lng`

**AmbulanceRequest**
- Links `emergencyRequestId`, optional `responseId`, `organizationId`, optional `ambulanceId`, `requestedByUserId`.
- `status[REQUESTED|ASSIGNED|EN_ROUTE|ARRIVED|COMPLETED|CANCELLED]`, pickup (`pickupAddress, pickupLat, pickupLng`), optional dropoff, `notes?`.

**Notification**
- `userId, type, title, body, data(JSON)?, isRead, createdAt`
- Index: `[userId, isRead]`.

Full field-level definitions live in `server/prisma/schema.prisma`, which is the canonical schema; this document summarizes it for design purposes only.

### 3.3 Referential Integrity

- `User → DonorProfile/Organization`: cascade delete (deleting a user removes its profile).
- `Organization → InventoryItem/EmergencyRequest/Ambulance/AmbulanceRequest`: cascade delete.
- `EmergencyRequest → RequestResponse/AmbulanceRequest`: cascade delete.
- `AmbulanceRequest.responseId` / `.ambulanceId`: `SET NULL` on delete of the referenced response/ambulance, since an ambulance request can outlive a specific donor offer or vehicle reassignment.

---

## 4. API Design

Base path: `/api`. Authentication via `Authorization: Bearer <jwt>` (web also mirrors the token into an httpOnly cookie). Roles in brackets indicate `requireRole` restrictions; "public" means no auth required; "optional auth" means the endpoint behaves the same for anonymous and authenticated callers but personalizes when a token is present.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register/donor` | public, rate-limited | Register a donor account |
| POST | `/auth/register/organization` | public, rate-limited | Register a Hospital/Blood Bank account |
| POST | `/auth/login` | public, rate-limited | Authenticate, issue JWT |
| POST | `/auth/logout` | authenticated | Clear auth cookie |
| GET | `/auth/me` | authenticated | Fetch current user + sub-profile |
| GET | `/donors/me` | DONOR | Fetch own donor profile |
| PUT | `/donors/me` | DONOR | Update own donor profile |
| GET | `/donors/me/donations` | DONOR | Donation history |
| GET | `/donors/search` | HOSPITAL, BLOOD_BANK, ADMIN | Search compatible/nearby donors |
| GET | `/organizations/search` | optional auth | Search verified organizations |
| GET | `/organizations/me` | HOSPITAL, BLOOD_BANK | Fetch own organization profile |
| PUT | `/organizations/me` | HOSPITAL, BLOOD_BANK | Update own organization profile |
| GET | `/organizations/:id` | optional auth | Fetch organization detail + inventory |
| GET | `/inventory/me` | BLOOD_BANK | Fetch own inventory |
| PUT | `/inventory/me` | BLOOD_BANK | Upsert inventory units, triggers low-stock alerts |
| POST | `/requests` | HOSPITAL, BLOOD_BANK, rate-limited | Create emergency request, triggers donor matching |
| GET | `/requests` | authenticated | List requests (filterable) |
| GET | `/requests/:id` | authenticated | Request detail + responses |
| PATCH | `/requests/:id` | owning org | Update status/units/notes |
| POST | `/requests/:id/responses` | DONOR | Offer to fulfill a request |
| PATCH | `/requests/:id/responses/:responseId` | owning org or donor | Confirm/decline/complete/cancel a response |
| POST | `/ambulances` | HOSPITAL, BLOOD_BANK | Register an ambulance |
| GET | `/ambulances` | HOSPITAL, BLOOD_BANK | List own ambulances |
| PATCH | `/ambulances/:id` | owning org | Update ambulance details/status |
| POST | `/ambulances/requests` | HOSPITAL, BLOOD_BANK | Create an ambulance request |
| GET | `/ambulances/requests` | HOSPITAL, BLOOD_BANK | List ambulance requests |
| GET | `/ambulances/requests/:id` | authenticated | Ambulance request detail |
| PATCH | `/ambulances/requests/:id` | owning org | Update status/assignment |
| GET | `/notifications` | authenticated | List own notifications |
| PATCH | `/notifications/:id/read` | authenticated | Mark one notification read |
| PATCH | `/notifications/read-all` | authenticated | Mark all notifications read |
| GET | `/stats/overview` | public | Global counts (donors, orgs, requests, donations) |
| GET | `/admin/organizations` | ADMIN | List organizations (filter by verified) |
| PATCH | `/admin/organizations/:id/verify` | ADMIN | Verify an organization |

All request/response bodies are validated and typed via Zod schemas under `server/src/schemas/`; the inferred TypeScript types are the contract that `web/lib/types.ts` and `mobile/src/lib/types.ts` mirror by hand.

---

## 5. Key Workflows

### 5.1 Donor Registration

```
Client → POST /auth/register/donor {profile + health fields + password}
Server: validate (registerDonorSchema) → hash password (bcrypt)
      → create User + DonorProfile in one transaction
      → sign JWT {sub: userId, role: DONOR}
      → respond {token, user, donor}
Client: persist token, redirect to donor dashboard
```

### 5.2 Emergency Request Creation, Matching, and Notification

```
Client (org) → POST /requests {bloodGroup, unitsNeeded, urgency, ...}
Server: requireAuth + requireRole(HOSPITAL, BLOOD_BANK) + requestCreationLimiter
      → validate (createRequestSchema)
      → create EmergencyRequest (status=OPEN, expiresAt = now + expiresInHours)
      → matching.service.findCompatibleDonors(request):
            - filter DonorProfile by blood-compatible groups (utils/blood.ts) and isAvailable=true
            - filter by eligibility.ts (age, weight, donation interval)
            - compute Haversine distance (utils/distance.ts) from request location
            - keep donors within radiusKm (default DEFAULT_MATCH_RADIUS_KM)
            - sort ascending by distance
      → for each matched donor: create Notification(type=EMERGENCY_REQUEST) + emit Socket.IO "request:new" to room user:{donorUserId}
      → respond {request, matchedDonorCount}
Client (donor, if online): receives "request:new" in real time, updates UI/badge
```

### 5.3 Donor Response and Confirmation

```
Client (donor) → POST /requests/:id/responses
Server: requireAuth + requireRole(DONOR)
      → load request; reject if status not in {OPEN, PARTIALLY_FULFILLED}
      → reject if donor blood group incompatible, or donor ineligible, or donor already responded
      → create RequestResponse(status=OFFERED, distanceKm=computed)
      → notify owning organization: Notification(type=DONOR_RESPONSE) + Socket.IO "response:new"
Client (org) → PATCH /requests/:id/responses/:responseId {status: CONFIRMED|DECLINED}
Client (org or donor) → PATCH .../responses/:responseId {status: COMPLETED|CANCELLED}
Server on COMPLETED:
      → DonorProfile.lastDonationDate = now, totalDonations += 1
      → EmergencyRequest.unitsFulfilled += 1 (and status recalculated as needed)
      → Socket.IO "request:updated" to interested parties
```

### 5.4 Inventory Update and Low-Stock Alert

```
Client (blood bank) → PUT /inventory/me {items: [{bloodGroup, units}, ...]}
Server: requireAuth + requireRole(BLOOD_BANK) + validate(upsertInventorySchema)
      → Prisma transaction: upsert each InventoryItem
      → for items with units <= LOW_STOCK_THRESHOLD: Notification(type=LOW_STOCK_ALERT) to the blood bank's user
      → respond updated inventory list
```

### 5.5 Organization Verification

```
Client (admin) → GET /admin/organizations?verified=false
Client (admin) → PATCH /admin/organizations/:id/verify
Server: requireAuth + requireRole(ADMIN)
      → Organization.isVerified = true
      → Notification(type=ORGANIZATION_VERIFIED) to the organization's user
      → organization can now create EmergencyRequests
```

### 5.6 Ambulance Dispatch

```
Client (org) → POST /ambulances/requests {emergencyRequestId, responseId?, pickup..., dropoff?}
Server: create AmbulanceRequest(status=REQUESTED)
Client (org) → PATCH /ambulances/requests/:id {ambulanceId} → status ASSIGNED
             → PATCH ... {status: EN_ROUTE | ARRIVED | COMPLETED | CANCELLED} as the trip progresses
```

---

## 6. Real-Time Design (Socket.IO)

- On connection, the client presents the same JWT used for REST calls; the server verifies it and joins the socket to room `user:{userId}`.
- All real-time events are targeted emits to a specific user's room — there is no global broadcast of sensitive data.
- Event catalogue: `request:new` (donor matched to a new request), `response:new` (org receives a donor offer), `request:updated` (status/fulfillment change), and a generic `notification:new` mirroring any persisted Notification.
- Socket.IO currently runs in-memory on a single Node process; horizontal scaling would require the Redis adapter to share room membership across instances (noted as a future scaling consideration, not implemented).

---

## 7. Cross-Cutting Concerns

### 7.1 Validation

Every mutating endpoint validates its input through a Zod schema in `server/src/schemas/`, applied via the `validate(schema)` middleware before the controller runs. Schemas double as the TypeScript type source (`z.infer<typeof schema>`) for controller/service signatures.

### 7.2 Error Handling

A central `errorHandler` middleware normalizes all failures:
- `AppError` (explicit business errors: `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`) → mapped status code + message + optional details.
- `ZodError` → HTTP 400 with field-level validation errors.
- Prisma `P2002` (unique constraint) → 409 Conflict; `P2025` (record not found) → 404.
- Anything else → 500, with the stack trace included only outside production.

### 7.3 Authentication & Authorization

- `requireAuth` verifies the JWT and populates `req.userId`/`req.userRole`; missing/invalid tokens yield 401.
- `attachUserIfPresent` is the non-throwing variant used on public-but-personalizable endpoints (e.g. organization search).
- `requireRole(...roles)` enforces role-based access control and yields 403 on mismatch.
- Resource ownership (e.g. "only the owning organization may PATCH this request") is enforced inside the relevant service function, not just by role.

### 7.4 Rate Limiting

Three tiers, all backed by `express-rate-limit` and skipped automatically when `NODE_ENV=test`:
- Auth endpoints: 20 requests / 15 minutes.
- Emergency request creation: 10 requests / 60 seconds.
- General API: 120 requests / 60 seconds.

### 7.5 Security

- Helmet sets standard security headers; CORS is restricted to the configured `CORS_ORIGIN`.
- Passwords are hashed with bcrypt (10 salt rounds) and never logged or returned by any endpoint.
- Donor medical/lifestyle fields are treated as sensitive: they are returned in the donor's own profile responses and used internally for eligibility checks, but are not exposed in public donor-search results beyond what matching requires.

### 7.6 Testing Strategy

- **Unit tests** cover pure utility logic: blood-type compatibility (`utils/blood.ts`), Haversine distance (`utils/distance.ts`), and eligibility computation (`utils/eligibility.ts`).
- **Integration tests** (Vitest + Supertest, against a dedicated test database migrated via `prisma migrate deploy`) cover full HTTP flows: auth, the request/matching/response lifecycle, organization operations, ambulance requests, donor search, and notifications.
- Each test run cleans relevant tables before executing and disconnects Prisma afterward to keep runs isolated and repeatable.

---

## 8. Deployment View

- `server`, `web`, and `mobile` are independently deployable; `render.yaml` describes the hosted deployment shape for the server (and/or web) on Render.
- Configuration is entirely environment-variable driven (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `DEFAULT_MATCH_RADIUS_KM`, `MIN_DONATION_INTERVAL_DAYS`, `LOW_STOCK_THRESHOLD`, `PORT`, `NODE_ENV`) — there are no hard-coded secrets or environment-specific values in source.
- Database schema evolves exclusively through Prisma migrations (`prisma migrate dev` locally, `prisma migrate deploy` in CI/production) so schema state is reproducible across environments.
- The web client is a PWA with a registered service worker, enabling installability and basic offline shell caching.
