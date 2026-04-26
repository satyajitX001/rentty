# RentOk Expo App (Hostel Rent Management)

RentOk is a React Native Expo app for hostel caretakers/owners with the following modules:
- Simplified property management dashboard
- Tenant management with lease/KYC and dues visibility
- Rent collection with payment tracking and receipt generation
- Maintenance workflow tracking
- Finance/expense summaries
- Document organization
- Report export cards (dues, complaint, tenant, expense, lead, collection)
- Automated alerts and reminders
- Data security readiness via token-based API contract design
- Customer support tickets overview

## Tech Stack
- Expo + React Native + TypeScript
- React Navigation bottom tabs
- Local mock API service backed by dummy dataset

## Run
```bash
npm install
npm run start
```

## Project Structure
- `src/data/mockData.ts`: in-app dummy dataset
- `src/services/mockApi.ts`: async mock API methods
- `src/screens/*`: module screens
- `docs/dummy-dataset.json`: standalone seed dataset
- `docs/API_ENDPOINTS.md`: endpoint contract with request/response examples

## Notes
- This version is frontend-first and uses a mocked API layer.
- You can swap `mockApi` with real network calls without changing screen contracts.
