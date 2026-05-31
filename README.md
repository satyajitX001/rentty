# RentOk Mobile App

RentOk is a React Native Expo app for rental property, PG, hostel, and shared accommodation operations. The mobile app is focused on owner and caretaker workflows: property occupancy, tenant lifecycle, rent collection, maintenance, reports, support, and account access.

## Tech Stack

- Expo 54 + React Native 0.81
- React 19 + TypeScript
- React Navigation
- TanStack Query
- Axios API client with token refresh handling
- Expo SecureStore for auth session persistence
- Expo Linear Gradient and Expo Vector Icons

## Setup

### Prerequisites

- Node.js `>=20.19.4` recommended for React Native 0.81 / Metro
- npm
- Expo CLI through `npx expo`
- Android Studio, Xcode, or Expo Go depending on target platform

### 1. Install dependencies

```powershell
npm install
```

### 2. Confirm API configuration

The API config is in:

```text
src/services/api/config.ts
```

Current values:

```ts
export const API_ROOT_URL = "https://rentok-backend.onrender.com";
export const API_BASE_URL = `${API_ROOT_URL}/api/v1`;
export const API_HEALTH_URL = `${API_ROOT_URL}/health`;
```

For local backend testing, change `API_ROOT_URL` to your machine-accessible backend URL.

For Android emulator, `localhost` from the app usually does not point to your computer. Use one of these depending on how you run Expo:

```text
http://10.0.2.2:5000
http://<your-lan-ip>:5000
```

### 3. Start Expo

```powershell
npm run start
```

Then choose Android, iOS, Expo Go, or web from the Expo CLI.

### 4. Platform commands

```powershell
npm run android    # Expo Android native run
npm run ios        # Expo iOS native run
npm run web        # Expo web
npm run typecheck  # TypeScript check
```

## App Features

- Owner/caretaker authentication with access and refresh token handling
- Owner account signup
- Forgot/reset password screens wired to backend development reset APIs
- Dashboard with profile summary, property studio, occupancy metrics, dues, collections, maintenance, and support signals
- Property creation and editing
- Caretaker assignment by phone from a property flow
- Tenant creation from an available property
- Tenant list with edit, deposit, transaction history, and remove-with-reason actions
- Tenant payment history with edit support for past collections
- Collections ledger with current-month collection and pending-dues overview
- Maintenance request list and status transitions
- Expenses, reports, documents, notifications, and support visibility
- Report generation with openable download links

## Project Structure

```text
src/
  components/            Shared UI components
  data/                  Static app data and report card catalog
  navigation/            Auth and app navigators
  screens/               Feature screens
  screens/auth/          Login, signup, forgot password, reset password
  services/api/          HTTP client, API services, query keys
  store/                 Auth/session state
  theme/                 Design tokens
  types/                 Shared frontend models
```

## Auth Flow

- Login stores access and refresh tokens in SecureStore.
- Protected requests include `Authorization: Bearer <token>`.
- On `401`, the API client attempts refresh and retries the failed request.
- Signup is owner-only in the mobile app. Caretakers are onboarded by an owner assigning a phone number to a property.

## Operational Flow

1. Owner signs up or logs in.
2. Owner creates a property from Dashboard > Properties Studio.
3. Owner assigns a caretaker by phone if needed.
4. Owner adds a tenant to an available property.
5. Tenant dues accrue from `joinedOn`, `monthlyRent`, and `rentDueDay`.
6. Rent is deposited from the tenant card.
7. Past payments can be edited from tenant transaction history.
8. Removing a tenant requires a reason and preserves property history.

## Development Notes

- Some older draft API docs under `docs/` are historical and may not match the latest backend contract.
- The password reset flow currently depends on a development backend implementation. It needs a real OTP delivery provider before production.
- There are no automated frontend tests configured yet.
- Product TODOs, launch blockers, and growth roadmap are tracked in `docs/PRODUCT_TODOS_AND_ROADMAP.md`.
