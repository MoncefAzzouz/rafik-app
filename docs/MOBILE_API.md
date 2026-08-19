# Rafik — Mobile App ↔ Backend Integration Guide

Everything the Flutter app needs to talk to the Rafik backend. Covers auth, push
notifications, app content, and the full **Truck (freight)** flow — including how
distance and price are calculated (free, no Google billing).

- **Base URL (production):** `https://rafik-algerie.com`
- All request/response bodies are **JSON** (`Content-Type: application/json`), except
  file uploads which use `multipart/form-data`.
- Auth uses a **JWT Bearer token**: send `Authorization: Bearer <token>` on protected calls.

---

## Table of contents
1. [Authentication](#1-authentication)
2. [Password reset by email](#2-password-reset-by-email)
3. [Push notifications (Firebase)](#3-push-notifications-firebase)
4. [App content (home grid, slides, promos, legal pages)](#4-app-content)
5. [Truck: reference data](#5-truck-reference-data)
6. [Truck: distance & price calculation](#6-truck-distance--price-calculation)
7. [Truck: quote & create an order (client)](#7-truck-quote--create-an-order-client)
8. [Truck: driver app (Tawsil-style)](#8-truck-driver-app-tawsil-style)
9. [Order object & maps links](#9-order-object--maps-links)
10. [Order status lifecycle](#10-order-status-lifecycle)
11. [Roles](#11-roles)
12. [Backend env the server needs](#12-backend-env-the-server-needs)

---

## 1. Authentication

### Register (client)
`POST /api/auth/register`
```json
{ "email": "a@b.com", "phone": "0550...", "password": "secret", "fullName": "Ali" }
```
→ `201 { "token": "...", "user": { "id","email","phone","fullName","role","profileImage" } }`

### Login (any role: CLIENT, TRUCKER, DRIVER, …)
`POST /api/auth/login`
```json
{ "email": "a@b.com", "password": "secret" }
```
→ `200 { "token": "...", "user": {...} }`
- `401` invalid credentials · `403` if the account is banned/suspended (message says until when).

**Ban enforcement (log out on the fly):** every authenticated request checks the account. If it was
banned or deleted **after** login, the API returns `403 { "code": "banned" }` or `401 { "code": "no_account" }`.
When the app sees either code, **discard the token and send the user to the login screen.**

### Current user
`GET /api/auth/me` (Bearer) → the user object.

### Update profile
`PUT /api/auth/me` (Bearer) — body may include `fullName, email, phone, profileImage`.

### Delete own account (Play-Store requirement)
`DELETE /api/auth/delete-account` (Bearer) → `{ "success": true }`.
Public info page (no login): `GET /delete-account` on the web front.

---

## 2. Password reset by email

1. `POST /api/auth/forgot-password` `{ "email": "a@b.com" }`
   → always `200 { "success": true }` (doesn't reveal if the email exists). Sends a
   link to `https://rafik-algerie.com/reset-password?token=…` (opens a web page to set a new password).
2. Optional pre-check: `GET /api/auth/reset-password/:token` → `{ "valid": true|false }`.
3. `POST /api/auth/reset-password` `{ "token": "...", "password": "newpass" }` → `{ "success": true }`.

The app can just call step 1 and tell the user to check their email — the rest happens on the web page.

---

## 3. Push notifications (Firebase)

The app must register its FCM device token so the admin can push notifications.

### Register a device (call on login & on token refresh)
`POST /api/app/device-token`  — Bearer token **optional but recommended** (links the
device to the user so pushes can target Clients/Drivers/…).
```json
{ "token": "<fcm_device_token>", "platform": "android" }   // or "ios"
```
→ `{ "success": true }`

### Unregister (on logout)
`DELETE /api/app/device-token` `{ "token": "<fcm_device_token>" }` → `{ "success": true }`

The admin sends pushes from the dashboard; the app just needs to **register the token**
and **display incoming FCM messages** (foreground + background handlers). Notification
payloads may carry a `data.link` (a deep link to open).

### Automatic notifications (server-side — nothing to build in the app)
The backend already reacts to order events on its own:
- **Clients are emailed automatically** on every order/booking state change — e.g. *accepted →
  in transit → delivered* (truck), *quote sent / completed* (services), ride/food status, etc.
  The app does **not** need to send these emails.
- **Admins** get an in-app bell alert + email in the dashboard for new orders and every state change.
- To also give the client a phone **pop-up** for these events, just make sure the app registered
  its FCM token (above) — push can then be enabled to fire alongside the emails.

So the app's only job for notifications is: **register the FCM token** and **show incoming pushes**.
Fetching the in-app feed (`GET /api/app/notifications`) is optional, for an in-app "notifications" list.

---

## 4. App content

All public (no auth). These drive the app's home screen and info pages.

| Call | Returns |
|---|---|
| `GET /api/app/modules` | Home-grid tiles (visible, ordered). Each: `type` (taxi/food/services/truck/service_category/truck_category/custom), `refId`, `label`, `labelAr`, `icon` (image URL or emoji), `color`, `link`, `locked`, `comingSoon`. |
| `GET /api/app/slides?type=home` | Home banner carousel. `type=promo` for the promo page. Each: `image`, `title`, `subtitle`, `link`. |
| `GET /api/app/promos` | Promo codes the admin chose to show. Each: `code`, `description`, `discountType`, `discountValue`, `scope`, `expiresAt`, `appBanner`. |
| `GET /api/app/notifications?limit=30` | In-app notification feed (most recent first). |
| `GET /api/app/legal/:slug` | `slug` ∈ `privacy-policy \| terms \| delete-account \| support`. Returns `{ title, content }` (content is Markdown). Also viewable on the web at `/privacy-policy`, `/terms`, `/delete-account`, `/support`. |

**Tile behavior:** `locked` = show but not tappable; `comingSoon` = show a "Coming soon" badge.

---

## 5. Truck: reference data

| Call | Auth | Returns |
|---|---|---|
| `GET /api/truck/wilayas` | public | All 58 wilayas with their base freight `price` (DZD). |
| `GET /api/truck/categories` | public | Freight categories (House moving, Towing…), each with its `allowedTypes` (truck types usable for it) and `image`. |
| `GET /api/truck/types` | public | Truck types: `name`, `capacityLabel`, `priceMultiplier`, `image`, and `features[]` — each `{ name, options: [{ label, image }] }` (e.g. **Size** → 10T / 20T, each with its own picture) for the app to show as selectable variants. |
| `GET /api/truck/config` | Bearer | Pricing config: `truckPerKm`, `truckMinFare`, `truckBaseFare`, commission mode/percent/subscription. |

**Client order flow:** pick a **category** → pick an allowed **truck type** → pick **A** and **B** on the map → get a **quote** → **create the order**.

---

## 6. Truck: distance & price calculation

**How Tawsil-style pricing works here — using OUR formula.** No Google billing needed:

- **Distance A→B**: real *driving* distance via **OSRM** (free, OpenStreetMap). If OSRM is
  unreachable, falls back to straight-line (haversine). The app can just send the two
  coordinates and let the backend compute km — or send its own `distanceKm`.
- **Which wilaya is B in?** reverse-geocoded from B's coordinates via **Nominatim** (free,
  OpenStreetMap) when the app doesn't send `destinationWilaya`. The matched wilaya sets the base price.

**Pricing formula** (all levers are admin-editable):
```
price = max( truckMinFare,
             round( (destinationWilayaPrice + truckBaseFare + km × truckPerKm) × typeMultiplier ) )
finalPrice = price − promoDiscount
```
- `destinationWilayaPrice` — from `GET /api/truck/wilayas` for B's wilaya.
- `truckBaseFare`, `truckPerKm`, `truckMinFare` — from `GET /api/truck/config`.
- `typeMultiplier` — from the chosen truck type.
- **`truckMinFare` is a hard floor** — the price never goes below it.

Example: B = Alger (base 5000), 300 km, perKm 10, base 0, multiplier 1 → `5000 + 300×10 = 8000 DZD`.

> The client does **not** negotiate the price — it's computed by the formula above.

---

## 7. Truck: quote & create an order (client)

### Get a live quote (call before ordering)
`POST /api/truck/quote` (public)
```json
{
  "truckTypeId": "…",
  "pickupLat": 36.19, "pickupLng": 5.41,
  "destinationLat": 36.75, "destinationLng": 3.06
  // optional: "distanceKm", "destinationWilaya" (skip to auto-compute both)
}
```
→
```json
{
  "estimatedPrice": 8000,
  "distanceKm": 268.2,
  "durationMin": 197,
  "source": "osrm",                 // or "haversine" / "given"
  "destinationWilaya": "Alger",     // reverse-geocoded if you didn't send it
  "destinationDisplay": "…full address…",
  "base": 0, "perKm": 10, "minFare": 0, "wilayaPrice": 5000
}
```

### Create the order
`POST /api/truck/orders` (Bearer — CLIENT or ADMIN)
```json
{
  "clientName": "Ali", "clientPhone": "0550...",
  "categoryId": "…",
  "truckTypeId": "…",                      // optional
  "pickupAddress": "Cité El Hidhab", "pickupWilaya": "Sétif", "pickupCommune": "Sétif",
  "pickupLat": 36.19, "pickupLng": 5.41,
  "destinationAddress": "Zone industrielle", "destinationWilaya": "Alger",
  "destinationLat": 36.75, "destinationLng": 3.06,
  "description": "3 rooms of furniture",
  "invoiceStatus": "NOT_REQUIRED",         // HAS_INVOICE | NO_INVOICE | NOT_REQUIRED
  "scheduledType": "now",                  // "now" or "scheduled"
  "scheduledDate": null,                   // required if scheduled, e.g. "2026-09-01"
  "promoCode": "WELCOME20",                // optional
  "featureSel": [                          // optional required options (e.g. Size = 20T)
    { "featureId":"…","featureName":"Size","optionId":"…","optionLabel":"20T","image":"…" }
  ]
}
```
- If `distanceKm` is omitted, it's computed from the coords (OSRM).
- If `destinationWilaya` is omitted but `destinationLat/Lng` are sent, it's reverse-geocoded.
- Returns the created order (status `requested`) with a `maps` object (see §9).

**The order goes straight to available drivers — no admin approval.**

---

## 8. Truck: driver app (Tawsil-style)

### Sign up (self-registration)
`POST /api/truck/register` (public)
```json
{
  "driverName": "Ali", "phone": "0550...", "email": "ali@x.com", "password": "secret",
  "truckTypeId": "…", "plate": "00111-119-19",
  "featureSel": [ { "featureId":"…", "featureName":"Size", "optionId":"…", "optionLabel":"10T", "image":"…" } ],
  "licenseDoc": "https://…/licence.pdf",        // optional at signup, can upload after login
  "registrationDoc": "https://…/carte-grise.jpg"
}
```
- **`featureSel`** — for each feature of the chosen truck type (from `GET /api/truck/types`), the driver
  must pick one option (e.g. **Size → 10T**). Send the chosen `{featureId,featureName,optionId,optionLabel,image}`.
- Account starts **unverified** and `offline`. Admins are alerted to verify it.

### Upload / update verification documents (after login)
1. Upload each file → `POST /api/upload/document` (Bearer, `multipart/form-data`, field `file`, **image OR PDF**) → `{ "url": "…" }`.
2. Save the URLs → `PUT /api/truck/trucks/me/documents` (Bearer)
```json
{ "licenseDoc": "https://…/licence.pdf", "registrationDoc": "https://…/carte-grise.jpg" }
```
(You can also re-send `featureSel` here to change the truck's option.)

### Verification gate
Until an admin verifies the driver, they **can't work**:
- `GET /driver/dashboard` returns `{ "verified": false, "needsDocuments": { "license": true/false, "registration": … }, "message": "…", available/active/... empty }`.
- Going online (`/driver/status`) and accepting orders return `403 { "code": "not_verified" }`.
Show the "pending verification" screen and let them (re)upload documents.

### Go online / offline
`PATCH /api/truck/driver/status` (Bearer)
```json
{ "online": true }
```
→ `{ "status": "available", "online": true }`  (offline hides available orders)

### Home screen — everything in one call
`GET /api/truck/driver/dashboard` (Bearer) →
```json
{
  "truck": { "id","truckCode","driverName","status","isVerified","truckTypeId","rating","totalTrips","licenseDoc","registrationDoc","featureSel" },
  "online": true, "verified": true,
  "available": { "now": [order…], "scheduled": [order…] },  // open jobs he can accept (only when online)
  "active":    [order…],   // in-progress / accepted "now" jobs  →  show on the MAP
  "scheduled": [order…],   // his accepted jobs for another day  →  show as a LIST
  "completed": [order…]    // recent finished jobs
}
```
- **`available.now`** = open jobs to do now · **`available.scheduled`** = open jobs booked for a future day.
- **`active`** = the "now" drive → render on the map (use `maps.directionsUrl`).
- **`scheduled`** = his own future-day jobs → render as a list ("another day").

### Accept an open order (no admin — first driver wins)
`POST /api/truck/orders/:id/accept` (Bearer, must be online & verified)
→ the order (now `accepted`, assigned to his truck). `409` if another driver already took it.

**Feature matching:** a driver only sees / can accept orders his truck can fulfil. If a truck is
**Size = 10T** and an order requires **Size = 20T**, that order is filtered out of the dashboard and
`accept` is refused. (Match = the order's `featureSel` option ids are all among the truck's.)

### Move the job forward
| Call | Effect |
|---|---|
| `POST /api/truck/orders/:id/arrived`  | at pickup |
| `POST /api/truck/orders/:id/loading`  | loading cargo |
| `POST /api/truck/orders/:id/start`    | in transit |
| `POST /api/truck/orders/:id/complete` | delivered (freezes commission & earnings) |
| `POST /api/truck/orders/:id/cancel` `{ "reason": "…" }` | cancel |

### Driver's own truck record
`GET /api/truck/trucks/me` (Bearer) → the truck + its active orders.

---

## 9. Order object & maps links

Every order returned by list/detail/accept/dashboard includes a **`maps`** object with
ready-to-open Google Maps links (built from coordinates, or the place name as fallback):
```json
"maps": {
  "pickupName": "Cité El Hidhab, Sétif",
  "destinationName": "Zone industrielle, Alger",
  "pickupMapUrl":      "https://www.google.com/maps/search/?api=1&query=36.19,5.41",
  "destinationMapUrl": "https://www.google.com/maps/search/?api=1&query=36.75,3.06",
  "directionsUrl":     "https://www.google.com/maps/dir/?api=1&origin=36.19,5.41&destination=36.75,3.06&travelmode=driving"
}
```
- Tap a place → open `pickupMapUrl` / `destinationMapUrl`.
- Tap **Directions** → open `directionsUrl` (turn-by-turn A→B).
- Raw coordinates are also on the order: `pickupLat/pickupLng`, `destinationLat/destinationLng`
  (use them if you draw the route inside the app instead of opening Google Maps).

Other useful order fields: `orderNumber`, `status`, `clientName`, `clientPhone`,
`category`, `truckType`, `pickupAddress/Wilaya/Commune`, `destinationAddress/Wilaya`,
`distanceKm`, `description`, `invoiceStatus`, `scheduledType`, `scheduledDate`,
`estimatedPrice`, `agreedPrice`, `promoDiscount`, `driverEarnings`, `commissionAmount`.

---

## 10. Order status lifecycle

```
requested → accepted → arrived → loading → in_transit → delivered
```
Cancellable (until in transit) → `cancelled_by_client | cancelled_by_driver | cancelled_by_admin`.
Terminal: `delivered`, any `cancelled_*`, `expired`.

- `requested` — created, waiting for a driver.
- `accepted` — a driver grabbed it (`acceptedAt`).
- `arrived / loading / in_transit` — driver progress.
- `delivered` — done; commission & `driverEarnings` frozen.

---

## 11. Roles
`ADMIN`, `CLIENT`, `WORKER` (services), `DRIVER` (taxi/food), `TRUCKER` (freight),
`RESTAURANT`, `CASHIER`. The truck driver app uses **`TRUCKER`**.

---

## 12. Backend env the server needs

`backend/.env` (see `.env.example`):
```bash
DATABASE_URL=...           # PostgreSQL
JWT_SECRET=...
APP_WEB_URL=https://rafik-algerie.com      # used for password-reset links

# Email (SMTP or SMTP_* aliases) — password resets & (optional) email blasts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...              # Gmail: a 16-char App Password

# Firebase Cloud Messaging — push notifications
FIREBASE_SERVICE_ACCOUNT_PATH=/var/www/rafik/backend/firebase-service-account.json

# Free geo services (optional overrides; defaults are the public servers)
# OSRM_URL=https://router.project-osrm.org
# NOMINATIM_URL=https://nominatim.openstreetmap.org

# Cloudflare R2 — image storage (categories, slides, truck photos)
R2_ACCOUNT_ID=...  R2_ACCESS_KEY_ID=...  R2_SECRET_ACCESS_KEY=...  R2_BUCKET=...  R2_PUBLIC_URL=...
```

**Note on the free geo services:** OSRM's public demo server and Nominatim are free with
fair-use limits (Nominatim ~1 request/second). Fine for launch. For heavy traffic,
self-host OSRM + Nominatim (or plug in a keyed provider) and set `OSRM_URL` / `NOMINATIM_URL`
— no other code changes needed.
