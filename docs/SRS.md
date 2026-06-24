# Software Requirements Specification (SRS)

## BloodBank Finder

Version 1.0

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements of **BloodBank Finder**, a platform that connects voluntary blood donors with hospitals and blood banks to speed up the discovery and fulfillment of emergency blood requirements. It is intended for developers, testers, and maintainers of the system.

### 1.2 Scope

BloodBank Finder is delivered as three coordinated applications sharing one backend:

- **server** — an Express/Prisma REST + WebSocket API backed by PostgreSQL.
- **web** — a Next.js Progressive Web App (PWA) for browsers.
- **mobile** — an Expo/React Native app for Android and iOS.

The system allows:
- Donors to register, maintain a health/eligibility profile, and respond to nearby emergency requests.
- Hospitals and blood banks to register (subject to admin verification), manage blood inventory, raise emergency requests, search for compatible donors/organizations, and dispatch ambulances.
- Administrators to verify organizations.
- All users to receive real-time notifications about relevant events.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Meaning |
|---|---|
| Donor | A registered individual willing to donate blood |
| Organization | A Hospital or Blood Bank account |
| Emergency Request | A request for blood units raised by an organization |
| Response | A donor's offer to fulfill an emergency request |
| Eligibility | Whether a donor currently meets medical criteria to donate |
| JWT | JSON Web Token, used for authentication |
| PWA | Progressive Web App |
| SRS | Software Requirements Specification |

### 1.4 References

- `server/prisma/schema.prisma` — canonical data model
- `server/src/routes/*` — canonical API contract
- `docs/DESIGN.md` — companion design document

### 1.5 Overview

Section 2 describes the product at a high level. Section 3 enumerates functional requirements by feature area. Section 4 covers external interfaces. Section 5 covers non-functional requirements.

---

## 2. Overall Description

### 2.1 Product Perspective

BloodBank Finder is a standalone, self-contained system. It is not dependent on any external blood-bank registry; all organization and donor data is owned and stored by the system itself. The mobile and web clients are independent front-ends to the same server API, so they must remain functionally consistent.

### 2.2 Product Features (Summary)

1. Donor registration, profile management, and availability control.
2. Donor health/lifestyle and eligibility tracking (age, weight, donation interval, smoking, alcohol, drug use, chronic illness, genetic disorders).
3. Organization (Hospital / Blood Bank) registration and admin verification.
4. Blood inventory management for blood banks, with low-stock alerts.
5. Emergency blood request creation, listing, and lifecycle management.
6. Automatic compatibility- and distance-based donor matching with real-time notification.
7. Donor response/offer workflow with organization confirmation.
8. Ambulance fleet registration and ambulance request dispatch lifecycle.
9. Real-time notifications (in-app + WebSocket) for all of the above.
10. Search for nearby donors and organizations on a map.
11. System-wide statistics overview.
12. Administrative organization verification queue.

### 2.3 User Classes and Characteristics

| Role | Description |
|---|---|
| **Donor** | An individual who registers personal, medical, and location details to be discoverable by organizations and to respond to emergency requests. |
| **Hospital** | An organization type that primarily raises emergency requests and dispatches ambulances. |
| **Blood Bank** | An organization type that additionally manages a blood unit inventory. |
| **Admin** | Verifies new Hospital/Blood Bank registrations before they may raise requests. |

All organization accounts are unverified by default and gain full request-creation privileges only after admin verification.

### 2.4 Operating Environment

- **Server**: Node.js + Express 5, PostgreSQL database, deployable to any Node-compatible host (e.g. Render, per `render.yaml`).
- **Web**: Next.js 16 / React 19, runs in any modern evergreen browser, installable as a PWA.
- **Mobile**: Expo / React Native 0.85, targets Android and iOS.
- All clients communicate with the server exclusively over HTTPS REST + WebSocket (Socket.IO).

### 2.5 Design and Implementation Constraints

- All API input is validated server-side with Zod schemas; clients must not rely on client-side validation alone.
- Authentication is stateless (JWT bearer tokens, 7-day default expiry); the server holds no server-side session store.
- Currency of distance/eligibility calculations depends on donors keeping their location and last-donation-date accurate.
- Blood type compatibility and donation eligibility rules are encoded as business logic in the server and must remain the single source of truth used by both web and mobile clients.

### 2.6 Assumptions and Dependencies

- Donors and organizations provide truthful medical/identity information; the system does not independently verify medical claims beyond the admin's organization-verification step.
- Devices running the mobile/web clients have geolocation capability for full functionality (manual address entry is the fallback).
- A PostgreSQL instance is reachable via `DATABASE_URL` at all times.

---

## 3. System Features (Functional Requirements)

### 3.1 Authentication & Account Management

- **FR-1.1**: The system shall allow a new donor to register with email, password, phone, full name, blood group, gender, date of birth, weight, location, address fields, and health/lifestyle answers.
- **FR-1.2**: The system shall allow a new organization (Hospital or Blood Bank) to register with name, registration number, contact person, location, address fields, email, password, and phone.
- **FR-1.3**: The system shall hash all passwords (bcrypt) before storage; plaintext passwords shall never be persisted or logged.
- **FR-1.4**: The system shall issue a signed JWT on successful registration or login, scoped to the user's id and role.
- **FR-1.5**: The system shall expose a `GET /api/auth/me` endpoint returning the authenticated user's profile (including donor or organization sub-profile).
- **FR-1.6**: The system shall reject more than 20 auth requests per 15 minutes from the same client (rate limiting).
- **FR-1.7**: New organization accounts shall default to unverified and shall be unable to create emergency requests until an admin verifies them.

### 3.2 Donor Profile & Eligibility

- **FR-2.1**: A donor shall be able to view and update their profile: name, phone, blood group, weight, address/location, availability flag, medical notes, and lifestyle/health fields.
- **FR-2.2**: The system shall compute donor eligibility based on: age between 18 and 65 inclusive, weight ≥ 50 kg, and at least `MIN_DONATION_INTERVAL_DAYS` (default 90) days since the donor's last completed donation.
- **FR-2.3**: The system shall expose the eligibility result (`isEligible`, `reason`, `nextEligibleDate`) to the donor.
- **FR-2.4**: A donor's lifestyle/health answers (smoker, alcohol use, drug use, chronic illness + details, genetic disorder + details) shall be collected at registration and editable afterward, and shall be visible only to the donor and to organizations the donor interacts with for matching purposes.
- **FR-2.5**: The system shall track and expose a donor's donation history (organization, blood group, units, distance, date).
- **FR-2.6**: A donor may toggle their own availability for matching at any time.

### 3.3 Organization Profile & Verification

- **FR-3.1**: An organization shall be able to view and update its profile: name, phone, contact person, address/location.
- **FR-3.2**: An admin shall be able to list organizations, optionally filtered by verification status.
- **FR-3.3**: An admin shall be able to verify an organization, after which the organization is notified and gains permission to create emergency requests.
- **FR-3.4**: Any client (authenticated or not) shall be able to search verified organizations by type, city, blood group availability, and/or geographic radius.

### 3.4 Blood Inventory Management

- **FR-4.1**: A Blood Bank shall be able to view its current inventory (units per blood group, for all 8 blood groups).
- **FR-4.2**: A Blood Bank shall be able to upsert inventory counts (1–8 blood groups per call, 0–100,000 units each) in a single atomic operation.
- **FR-4.3**: When an inventory update leaves any blood group at or below the low-stock threshold (default 5 units), the system shall notify the blood bank.
- **FR-4.4**: Organization search shall allow filtering to only organizations currently holding stock of a requested blood group.

### 3.5 Emergency Blood Requests

- **FR-5.1**: A verified Hospital or Blood Bank shall be able to create an emergency request specifying blood group, units needed (1–50), urgency (CRITICAL/HIGH/MODERATE), optional patient info/notes, optional location override, and an expiry window (default 24h, max 168h).
- **FR-5.2**: Emergency request creation shall be rate-limited to 10 per minute per organization.
- **FR-5.3**: On creation, the system shall automatically identify compatible, available, eligible donors within a configurable radius (default 15 km) and notify them in real time.
- **FR-5.4**: Any client shall be able to list emergency requests filtered by status, blood group, compatibility with a given donor blood group, ownership ("mine"), and geographic radius; results are ordered by urgency then distance.
- **FR-5.5**: The owning organization shall be able to update a request's status (OPEN → PARTIALLY_FULFILLED / FULFILLED / CANCELLED) and units fulfilled, but not after it has reached FULFILLED, CANCELLED, or EXPIRED.
- **FR-5.6**: The system shall automatically treat a request as EXPIRED once its expiry timestamp has passed.
- **FR-5.7**: Any client shall be able to fetch full request detail, including all donor responses.

### 3.6 Donor Response Workflow

- **FR-6.1**: An eligible donor with a compatible blood group shall be able to offer to fulfill an OPEN or PARTIALLY_FULFILLED request, creating a response with status OFFERED.
- **FR-6.2**: A donor may not submit more than one response to the same request.
- **FR-6.3**: The system shall reject responses from donors who are currently ineligible or whose blood group is incompatible with the request.
- **FR-6.4**: The owning organization shall be notified in real time whenever a donor responds.
- **FR-6.5**: The owning organization shall be able to transition a response: OFFERED → CONFIRMED or DECLINED.
- **FR-6.6**: A CONFIRMED response may be marked COMPLETED, which increments the donor's total donation count, sets their last-donation date to now, and increments the request's fulfilled units.
- **FR-6.7**: A donor may CANCEL their own still-pending (OFFERED) response.

### 3.7 Ambulance Management

- **FR-7.1**: A Hospital or Blood Bank shall be able to register ambulances (vehicle number unique per organization, driver name/phone, optional location).
- **FR-7.2**: An organization shall be able to list and update its own ambulances, including status (AVAILABLE, ON_TRIP, OFFLINE).
- **FR-7.3**: An organization shall be able to create an ambulance request linked to an emergency request (and optionally a specific donor response), specifying pickup location/address and optional dropoff.
- **FR-7.4**: An ambulance request shall progress through statuses: REQUESTED → ASSIGNED → EN_ROUTE → ARRIVED → COMPLETED, or be CANCELLED at any point before COMPLETED.
- **FR-7.5**: Only the owning organization may update an ambulance request's status or assigned ambulance.

### 3.8 Notifications

- **FR-8.1**: The system shall persist a notification record for: new matched emergency requests (to donors), new donor responses (to organizations), organization verification (to organizations), and low stock alerts (to blood banks).
- **FR-8.2**: The system shall push notifications to connected clients in real time via WebSocket, in addition to persisting them.
- **FR-8.3**: A user shall be able to list their notifications, mark one as read, or mark all as read.

### 3.9 Statistics

- **FR-9.1**: The system shall expose a public statistics overview: total donor count, blood bank count, hospital count, active request count, units fulfilled, and total donations.

---

## 4. External Interface Requirements

### 4.1 User Interfaces

- **Web**: Responsive PWA with pages for landing/search, authentication, role-specific dashboards, request browsing/detail, inventory management, ambulance management, notifications, and an admin verification console.
- **Mobile**: Tab-based navigation (Home, Requests, Search, Notifications, Profile) with role-specific home/profile screens and the same functional coverage as the web client.

### 4.2 Hardware Interfaces

- Donor and organization location capture relies on the host device's geolocation hardware/service (browser Geolocation API on web, Expo Location on mobile). Manual address entry is supported as a fallback.

### 4.3 Software Interfaces

- **Database**: PostgreSQL, accessed exclusively through Prisma Client.
- **Real-time channel**: Socket.IO over WebSocket, authenticated via the same JWT used for REST calls.

### 4.4 Communications Interfaces

- All client–server communication occurs over HTTP(S) REST endpoints under `/api/*` and a Socket.IO WebSocket channel, secured with CORS restricted to configured origins.

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Donor/organization matching queries must filter by indexed columns (blood group + availability, type + city, status + blood group) to remain performant as data grows.
- Request listing endpoints are capped at 200 results per call; donor/organization search results are capped via `radiusKm` and `limit` parameters.

### 5.2 Security

- All passwords are hashed with bcrypt; plaintext is never stored.
- All endpoints that mutate or expose private data require a valid JWT (`requireAuth`) and, where applicable, a specific role (`requireRole`).
- All request bodies/queries are validated with Zod before reaching business logic; invalid input yields HTTP 400 with field-level error detail.
- Security headers are applied via Helmet; rate limiting is applied per-endpoint-class to mitigate abuse and brute force.
- Donor medical/lifestyle data is sensitive and is only ever returned in profile responses to the donor themself or as needed for organization-facing matching/response views — never broadcast publicly.

### 5.3 Reliability & Availability

- Inventory updates are applied transactionally (all-or-nothing) to avoid partial writes.
- The system distinguishes expected error conditions (validation failures, not-found, conflicts) from unexpected ones, returning structured error responses for the former and generic 500s (with stack traces only in development) for the latter.

### 5.4 Usability

- Forms on both web and mobile provide inline validation feedback and loading states.
- Demo accounts are provided with one-tap login on the web client to ease evaluation.
- UI surfaces distance, urgency, and status using consistent badges/colors across web and mobile.

### 5.5 Maintainability

- Server logic is layered into routes → controllers → services, with Zod schemas as the single validation source per resource.
- Web and mobile clients each maintain a local mirror of the server's TypeScript types (`lib/types.ts`) to keep API contracts explicit.
- An automated test suite (Vitest + Supertest) covers authentication, request lifecycle and matching, donor search, organization operations, ambulance flows, notifications, and core utility logic (blood compatibility, distance, eligibility).

### 5.6 Portability

- The web client is a PWA, installable on any platform supporting modern browsers.
- The mobile client targets both Android and iOS from a single Expo/React Native codebase.

---

## 6. Other Requirements

- Configuration (database connection, JWT secret/expiry, CORS origin, match radius, donation interval, low-stock threshold) shall be supplied via environment variables, never hard-coded.
- Database schema changes shall be made exclusively through Prisma migrations to keep schema history reproducible across environments.
