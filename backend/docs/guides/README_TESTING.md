Testing and seeding (backend)

This document shows the small, safe steps to reproduce the seeded billing data and run the quick integration test that validates login, refresh, and billing endpoints.

Prerequisites
- Node.js (18+ recommended)
- A running MySQL DB with credentials matching your `backend/.env` (or use local DB settings in `.env`)

Quick local steps
1. Start the backend server (recommended to run in one terminal):

```powershell
cd backend
npm start
```

2. Seed sample data (idempotent):

```powershell
cd backend
npm run seed:sample
# or use sequelize-cli
# npx sequelize-cli db:seed:all
```

3. Run the integration test (it will log in as the seeded admin, call protected billing GET and call /api/auth/refresh using Cookie header):

```powershell
cd backend
npm run test:integration
```

4. Start the frontend dev server and open the invoices viewer

```powershell
cd frontend
npm run dev
# Open http://localhost:5173/invoices.html in your browser
```

Notes
- The integration test captures `Set-Cookie` from the login response and resends it as a `Cookie` header to exercise the refresh endpoint. It does not modify auth code.
- Debug/bypass routes were removed from the main server to avoid accidentally bypassing auth. If you need a local debug harness, create it in a throwaway branch or local-only file.
- CI: a GitHub Actions workflow (`.github/workflows/integration-tests.yml`) is included to run the integration script against a MySQL service. Review/adjust DB credentials in the workflow if needed for your CI setup.

If you want, I can also: convert the seeder into a central test fixture, add a more robust test harness (supertest/mocha), or remove the remaining convenience scripts. Tell me which and I'll implement it.