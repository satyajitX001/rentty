# RentOk Expo App (Hostel Rent Management)

RentOk is a React Native Expo app for hostel caretakers/owners with modules for:
- Authentication flow (Login and Sign Up)
- Property management dashboard
- Tenant management (lease/KYC/dues)
- Rent collections + receipt flow
- Maintenance tracking
- Expenses/documents/reports
- Notifications and support visibility

## Backend Integration
- Root URL: `https://rentok-backend-production.up.railway.app`
- Health URL: `https://rentok-backend-production.up.railway.app/health`
- API Base URL: `https://rentok-backend-production.up.railway.app/api/v1`

## Tech Stack
- Expo + React Native + TypeScript
- React Navigation (bottom tabs)
- TanStack Query for API handling, caching, invalidation, and loading states
- Expo SecureStore for persistent auth session storage (Keychain/Keystore-backed)
- Axios for API client + interceptor-based auth refresh/retry

## Run
```bash
npm install
npm run start
```

## Project Structure
- `src/services/api/httpClient.ts`: shared HTTP client
- `src/services/api/tokenStore.ts`: auth token store for Authorization header
- `src/services/api/*Service.ts`: separate service unit per API domain
- `src/services/api/queryClient.ts`: TanStack Query client config
- `src/services/api/queryKeys.ts`: centralized query keys
- `src/store/AuthContext.tsx`: session state and sign-in/sign-out helpers
- `src/navigation/AuthStackNavigator.tsx`: auth stack navigation (login/signup)
- `src/navigation/AppStackNavigator.tsx`: app stack navigation (main tabs + future app screens)
- `src/screens/*`: feature screens connected to real APIs
- `docs/API_ENDPOINTS.md`: API contract examples
- `docs/dummy-dataset.json`: sample data reference

## API Notes
- Query data fetching uses `useQuery`.
- Button-triggered events (collect rent, maintenance status update, report generation) use `useMutation` with button loaders.
- Screen loaders show during screen fetches; button loaders show during action mutations.
- Access token is sent in `Authorization` header.
- On `401`, client attempts refresh-token flow and retries the failed API call automatically.
