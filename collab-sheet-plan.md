# Collaborative Spreadsheet Editor — Phase-by-Phase Plan

> **Project goal:** Build a Google Sheets-like collaborative spreadsheet editor where users can create blank sheets, invite others, and edit concurrently in real time. Frontend: React web app. Backend: Go (high-concurrency WebSocket server). Real-time sync: CRDT (Yjs).

---

## Context & Motivation

The core problem is **concurrent editing of a shared grid** — when multiple users modify the same cell or adjacent cells simultaneously, conflicts must be resolved automatically, and all clients must converge to the same state. Google Sheets solves this with Operational Transformation (OT). Modern CRDT-based libraries (Yjs, Automerge) offer equivalent correctness with simpler infrastructure — no central "transformation server" needed.

This plan assumes the user has React/TypeScript experience (from the RentOk project) but is building a new, separate web application. The backend is intentionally chosen as Go for its goroutine-per-connection model, which handles thousands of concurrent WebSocket connections with minimal overhead.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                              │
│  ├── SpreadsheetGrid (canvas/virtualized DOM rendering)     │
│  ├── CellEditor (inline editing, formula bar)               │
│  ├── YjsProvider (CRDT sync via WebSocket)                  │
│  ├── PresenceManager (cursors, selections, user avatars)    │
│  └── AuthUI (login, share dialog, permissions)              │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket (Yjs protocol)
                           │ HTTPS (REST for auth, CRUD)
┌──────────────────────────▼──────────────────────────────────┐
│  Backend (Go)                                               │
│  ├── WebSocket Hub (broadcasts Yjs updates to room)        │
│  ├── Auth Service (JWT, session management)                 │
│  ├── Sheet Service (CRUD, permissions, metadata)           │
│  ├── Persistence Layer (PostgreSQL + Redis)                 │
│  └── REST API (sheet CRUD, user management, sharing)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Data Layer                                                 │
│  ├── PostgreSQL (sheets, users, permissions, versions)     │
│  ├── Redis (WebSocket connection state, presence, cache)   │
│  └── S3/MinIO (attachments, exports)                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Technology Choices

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + TypeScript | Component model, ecosystem, type safety |
| CRDT | Yjs | Mature CRDT library with React bindings, WebSocket provider, persistence adapters |
| Real-time | Yjs WebSocket Provider + custom Go WS server | Yjs handles conflict resolution; Go handles high-concurrency connections |
| Backend | Go 1.22+ | Goroutine-per-connection model ideal for WebSocket scaling |
| Database | PostgreSQL | ACID compliance, JSONB for cell data, excellent indexing |
| Cache/Presence | Redis | Pub/sub for cross-instance broadcasting, connection state |
| Auth | JWT + bcrypt | Stateless tokens, secure password hashing |
| Deployment | Docker + Kubernetes (or single VPS for MVP) | Containerized, horizontally scalable |

---

## Phase 1: Foundation & Core Data Model (Weeks 1–3)

### Goal
Set up the monorepo, define the spreadsheet data model, and render a single-user blank sheet.

### Deliverables

#### 1.1 Monorepo Structure
```
collab-sheet/
├── frontend/           # React web app (Vite + React 19)
│   ├── src/
│   │   ├── components/ # SpreadsheetGrid, Cell, FormulaBar, Toolbar
│   │   ├── hooks/      # useSheet, useCell, usePresence
│   │   ├── utils/      # CellAddress, Range, formula parser helpers
│   │   ├── types/      # Shared TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/            # Go WebSocket + REST server
│   ├── cmd/server/     # Entry point
│   ├── internal/
│   │   ├── ws/         # WebSocket hub, Yjs room management
│   │   ├── auth/       # JWT middleware, login handler
│   │   ├── sheet/      # Sheet CRUD service
│   │   └── models/     # Go structs for DB entities
│   ├── migrations/     # SQL migration files
│   └── go.mod
├── shared/             # Shared types (CRDT schema, API contracts)
│   └── types.ts
├── docker-compose.yml  # PostgreSQL, Redis, MinIO
└── Makefile            # Build, dev, test commands
```

#### 1.2 Spreadsheet Data Model
Define the core types (in `shared/types.ts` and backend Go structs):

```typescript
// shared/types.ts
interface Sheet {
  id: string;           // UUID
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  rowCount: number;     // default 1000
  colCount: number;     // default 26 (A-Z)
}

interface Cell {
  address: CellAddress; // { row: number, col: number }
  value: CellValue;     // string | number | boolean | null
  formula?: string;     // e.g., "=A1+B1"
  format?: CellFormat;  // font, color, alignment, border
  version: number;      // Lamport timestamp for CRDT
}

type CellAddress = { row: number; col: number };
type CellValue = string | number | boolean | null;

interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  horizontalAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  border?: BorderStyle;
  numberFormat?: string; // e.g., "0.00", "date"
}

interface SheetMember {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: number;
}
```

#### 1.3 Yjs CRDT Schema
Define Yjs document types for the spreadsheet:

```typescript
// shared/crdt.ts
import * as Y from 'yjs';

export function createSheetDoc() {
  const doc = new Y.Doc();

  // Map of cell addresses → cell data
  const cells = doc.getMap('cells');

  // Array of sheet metadata
  const metadata = doc.getMap('metadata');

  // Awareness state for presence (cursors, selections)
  // handled by y-protocols/awareness

  return doc;
}

// Each cell is stored as a Y.Map under the key "A1", "B1", etc.
// Cell structure in Yjs:
// {
//   value: Y.XmlText or plain value,
//   formula: string,
//   format: Y.Map,
//   version: number
// }
```

#### 1.4 Backend WebSocket Server (Go)
- Minimal Go server with `gorilla/websocket` or `nhooyr.io/websocket`
- Room-based broadcasting: each sheet is a "room"
- Accept Yjs update messages (binary encoded), broadcast to all room members
- Handle connection lifecycle (connect, disconnect, reconnect)

#### 1.5 Frontend: Basic Sheet Rendering
- React component that renders a grid (HTML table or virtualized canvas)
- Column headers (A, B, C, ...) and row headers (1, 2, 3, ...)
- Click to select a cell, double-click to edit
- Basic keyboard navigation (arrow keys, Tab, Enter)
- Formula bar at the top showing the active cell's content

### Milestone: A single user can open a blank sheet, click cells, and type values.

### Verification
- `make dev` spins up frontend + backend + PostgreSQL + Redis via Docker Compose
- Frontend renders a 100-row × 26-column grid
- Cell editing works without real-time (single-user)
- Backend WebSocket server accepts connections and echoes messages

---

## Phase 2: Real-Time Collaboration with CRDT (Weeks 4–6)

### Goal
Multiple users can edit the same sheet simultaneously with automatic conflict resolution via Yjs CRDT.

### Deliverables

#### 2.1 Yjs WebSocket Integration
- Frontend: `y-websocket` provider connects to Go backend
- Backend: Custom Yjs WebSocket server that:
  - Accepts `update` messages (binary Yjs updates)
  - Broadcasts updates to all clients in the same room
  - Persists document state to PostgreSQL on every update (debounced)
  - Sends full document state on new client connection (sync)

#### 2.2 Room Management
- REST endpoint `POST /api/sheets/:id/join` — authenticates user, adds to room
- REST endpoint `POST /api/sheets/:id/leave` — removes from room
- WebSocket messages follow Yjs awareness protocol:
  - `sync` — initial state exchange
  - `update` — CRDT update broadcast
  - `awareness` — cursor position, selection range, user info

#### 2.3 Presence & Cursors
- Each user gets a unique cursor color
- Cursor position broadcast via Yjs awareness
- Show other users' selections (highlighted ranges)
- User avatar + name tooltip on hover
- "User X is editing cell A1" indicator

#### 2.4 Conflict Resolution (CRDT)
Yjs handles this automatically — no custom logic needed:
- Two users edit the same cell → last write wins (by Lamport timestamp)
- Two users edit different cells → both changes preserved
- Concurrent cell formatting → merged (no data loss)

### Milestone: Two browser tabs (or two users) can edit the same sheet simultaneously and see each other's changes in real time with colored cursors.

### Verification
- Open two browser tabs pointing to the same sheet
- Edit different cells in each tab → both changes appear in both tabs
- Edit the same cell in both tabs → changes merge without data loss
- Cursor positions and selections are visible across tabs

---

## Phase 3: Authentication, Sharing & Permissions (Weeks 7–9)

### Goal
Users can sign up, sign in, create sheets, share them with others, and control access levels.

### Deliverables

#### 3.1 Authentication System
- **Backend (Go):**
  - `POST /api/auth/register` — create account (email + password)
  - `POST /api/auth/login` — returns JWT access token + refresh token
  - `POST /api/auth/refresh` — rotate access token
  - `POST /api/auth/logout` — invalidate refresh token
  - Password hashing with `bcrypt` (cost factor 12)
  - JWT with RS256 (asymmetric keys) — access token (15 min), refresh token (7 days)

- **Frontend (React):**
  - Login / Register forms
  - Auth context (React Context + `useAuth` hook, similar to RentOk's pattern)
  - Protected routes (redirect to login if unauthenticated)
  - Token refresh on app startup

#### 3.2 Sheet CRUD
- `POST /api/sheets` — create a new blank sheet (default 1000 rows × 26 cols)
- `GET /api/sheets/:id` — get sheet metadata + all cell data
- `PATCH /api/sheets/:id` — rename sheet
- `DELETE /api/sheets/:id` — delete sheet (owner only)
- `GET /api/sheets` — list user's sheets

#### 3.3 Sharing & Permissions
- `POST /api/sheets/:id/share` — invite user by email
  - Body: `{ email: string, role: 'viewer' | 'editor' | 'admin' }`
- `GET /api/sheets/:id/members` — list all members
- `PATCH /api/sheets/:id/members/:userId` — change role
- `DELETE /api/sheets/:id/members/:userId` — remove member
- Share link generation (unique URL with access token)
- "Anyone with the link can view/edit" toggle

#### 3.4 Permission Enforcement
- **Frontend:** UI hides edit controls for viewers, hides share/delete for non-admins
- **Backend (Go middleware):** Every request validated against permission level
  - `viewer` — read-only (GET only)
  - `editor` — read + write (GET, PATCH on cells)
  - `admin` — full control (CRUD + share + delete)

### Milestone: A user can create a sheet, share it via email or link, and other users can join with appropriate permissions.

### Verification
- Register two accounts, create a sheet, share with the second account
- Second account can view the sheet and edit cells (if editor role)
- Viewer role cannot edit cells (UI hides editor, backend rejects writes)
- Admin can change roles and remove members
- Share link works for anonymous access (with role restrictions)

---

## Phase 4: Formulas & Functions (Weeks 10–13)

### Goal
Cells can contain formulas that reference other cells and compute values automatically.

### Deliverables

#### 4.1 Formula Parser
- Build a recursive-descent parser for spreadsheet formulas
- Grammar:
  ```
  expression := term (('+' | '-') term)*
  term       := factor (('*' | '/') factor)*
  factor     := cell_ref | number | function_call | '(' expression ')' | string
  cell_ref   := LETTER+ NUMBER+ (':' LETTER+ NUMBER+)?   // A1, B2:B5
  function_call := FUNCTION_NAME '(' args? ')'
  ```
- Tokenizer → AST → evaluator

#### 4.2 Built-in Functions
Implement these function categories:

| Category | Functions |
|---|---|
| Math | `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA`, `PRODUCT`, `MOD`, `ABS`, `ROUND`, `CEILING`, `FLOOR` |
| Logical | `IF`, `AND`, `OR`, `NOT`, `TRUE`, `FALSE`, `IFERROR`, `IFNA` |
| Text | `CONCATENATE`, `LEFT`, `RIGHT`, `MID`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `FIND`, `REPLACE` |
| Lookup | `VLOOKUP`, `HLOOKUP`, `INDEX`, `MATCH` |
| Date | `TODAY`, `NOW`, `DATE`, `YEAR`, `MONTH`, `DAY`, `DATEDIF` |
| Statistical | `MEDIAN`, `MODE`, `STDEV`, `VAR`, `QUARTILE` |

#### 4.3 Dependency Graph & Recalculation
- Build a directed dependency graph when formulas are entered/changed
- Detect circular dependencies → show `#CIRCULAR!` error in cell
- Topological sort for evaluation order
- When a cell changes, invalidate all dependent cells and recalculate
- Batch recalculation (don't recalculate on every keystroke — debounce 300ms)

#### 4.4 Cell Reference Resolution
- A1 notation: `A1`, `B2`, `$A$1` (absolute), `A$1` (mixed), `$A1` (mixed)
- Range references: `A1:B5`
- Cross-sheet references: `Sheet2!A1` (if sheets are in the same document)

#### 4.5 Formula Bar UI
- Formula bar at the top of the spreadsheet shows the active cell's formula
- Clicking a cell shows its formula; showing the computed value in the cell
- Auto-complete for function names and cell references as user types

### Milestone: Users can write formulas like `=SUM(A1:A10)`, `=IF(B1>100,"High","Low")`, `=VLOOKUP(C1,Sheet2!A:B,2,FALSE)` and see computed results that update automatically when dependencies change.

### Verification
- Enter `=SUM(A1:A5)` with values 1,2,3,4,5 in A1:A5 → cell shows 15
- Change A1 to 10 → formula result updates to 19
- Enter circular reference `=A1` in A1 → shows `#CIRCULAR!` error
- Cross-sheet reference `=Sheet2!A1` works when Sheet2 exists
- Performance: recalculating a sheet with 1000 formula cells completes in <100ms

---

## Phase 5: Version History & Persistence (Weeks 14–16)

### Goal
Every change is saved to the database, and users can view/restore previous versions of the sheet.

### Deliverables

#### 5.1 Auto-Save
- Backend debounces Yjs updates and persists sheet state to PostgreSQL every 5 seconds
- Store the full Yjs document state as a binary blob (or JSON) in a `sheet_versions` table
- Also store a diff (only changed cells) for efficient querying

#### 5.2 Version History
- `GET /api/sheets/:id/versions` — list all versions with timestamps and author
- `GET /api/sheets/:id/versions/:versionId` — get sheet state at a specific version
- `POST /api/sheets/:id/restore/:versionId` — restore sheet to a previous version
- UI: Version history sidebar with timeline, diff view (what changed between versions)

#### 5.3 Offline Support
- Frontend uses `y-indexeddb` to persist Yjs document to IndexedDB
- On reconnect, the client sends any missed updates to the server
- Conflict resolution handled by CRDT — no data loss on reconnect
- UI indicator: "Offline — changes will sync when reconnected"

#### 5.4 Database Schema
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sheets
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled Sheet',
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  row_count INT DEFAULT 1000,
  col_count INT DEFAULT 26,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sheet Members (sharing)
CREATE TABLE sheet_members (
  sheet_id UUID REFERENCES sheets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) CHECK (role IN ('viewer', 'editor', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (sheet_id, user_id)
);

-- Sheet Versions (for history)
CREATE TABLE sheet_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID REFERENCES sheets(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  author_id UUID REFERENCES users(id),
  ydoc_state BYTEA,          -- Full Yjs document state
  changed_cells JSONB,       -- Only the cells that changed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sheet_versions_sheet ON sheet_versions(sheet_id, version_number DESC);

-- Refresh tokens (for JWT rotation)
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5.5 Undo/Redo
- Local undo/redo stack per user (not shared across users)
- Each user action is recorded as a Yjs transaction
- Undo reverts the user's own changes; redo re-applies them
- Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z

### Milestone: Users can view a version history timeline, restore any previous version, and work offline with automatic sync on reconnect.

### Verification
- Edit a sheet for 5 minutes → version history shows 5+ entries
- Restore to version 3 → sheet state matches version 3 exactly
- Disconnect network → continue editing → reconnect → changes sync without conflicts
- Ctrl+Z undoes the last 10 edits; Ctrl+Shift+Z redoes them

---

## Phase 6: Performance at Scale (Weeks 17–20)

### Goal
The application handles large sheets (10,000+ rows, 100+ concurrent users) without degradation.

### Deliverables

#### 6.1 Virtualized Rendering
- Only render visible cells in the DOM (windowing/virtualization)
- Use `react-window` or custom canvas-based renderer
- Row height: 24px default, adjustable
- Column width: 100px default, adjustable
- Frozen rows/columns (header row + column A always visible)

#### 6.2 Lazy Cell Loading
- Backend: `GET /api/sheets/:id/cells?range=A1:Z100` — fetch only visible range
- Database: Store cells in a JSONB column on the `sheets` table for small sheets, or in a normalized `cells` table for large sheets
- Index on `(sheet_id, row, col)` for fast range queries
- Pagination for loading sheets with 100k+ rows

#### 6.3 WebSocket Scaling
- Single Go server handles ~10k concurrent WebSocket connections (goroutine-per-connection)
- For >10k connections: deploy multiple backend instances behind a load balancer
- Redis Pub/Sub for cross-instance broadcasting:
  - When User A on Server 1 edits a cell, Server 1 publishes to Redis channel `sheet:{id}`
  - Server 2 (hosting User B) subscribes and forwards the update to User B

#### 6.4 CRDT State Compression
- Yjs updates can be compressed with `yjs`'s built-in `encodeStateAsUpdate` + `decodeUpdate`
- Periodically compact the CRDT state (remove tombstones, garbage collect deleted content)
- Store compacted state in PostgreSQL, not the full update history

#### 6.5 Database Optimization
- Connection pooling (pgBouncer or Go `pgxpool`)
- Read replicas for `GET /api/sheets/:id` (sheet data reads)
- Write primary for mutations (cell updates, version history)
- Indexes on: `sheet_members(sheet_id, user_id)`, `sheet_versions(sheet_id, version_number)`, `cells(sheet_id, row, col)`

#### 6.6 Caching Layer
- Redis cache for sheet metadata and recent cell data
- Cache invalidation on cell update (pub/sub from Go backend)
- TTL of 30 seconds for cached sheet data (stale-while-revalidate pattern)

### Milestone: A sheet with 10,000 rows × 50 columns renders smoothly, 50 concurrent users can edit simultaneously without noticeable lag, and the server uses <500MB RAM for 1,000 active connections.

### Verification
- Load test with `k6` or `artillery`: 100 concurrent users editing a 10k-row sheet for 10 minutes
- P95 latency for cell update broadcast <200ms
- Memory usage per WebSocket connection <5MB
- Database query for visible cell range returns in <10ms

---

## Phase 7: Export, Import & Integrations (Weeks 21–23)

### Goal
Users can import existing spreadsheets and export their work in standard formats.

### Deliverables

#### 7.1 Import
- `POST /api/sheets/:id/import` — upload `.xlsx`, `.csv`, `.ods` file
- Backend uses a Go library (e.g., `tealeg/xlsx`) to parse the file
- Map imported data to the cell model
- Preserve basic formatting (bold, font size, cell colors)
- Show import preview before confirming

#### 7.2 Export
- `GET /api/sheets/:id/export?format=xlsx|csv|pdf|html`
- XLSX export: use `tealeg/xlsx` (Go library) to generate Excel files
- CSV export: simple text generation
- PDF export: use headless Chrome (Puppeteer/Playwright) or Go PDF library
- HTML export: generate a styled HTML table

#### 7.3 Keyboard Shortcuts
- `Ctrl+C / Cmd+C` — copy selected cells
- `Ctrl+V / Cmd+V` — paste (with format preservation)
- `Ctrl+X / Cmd+X` — cut
- `Ctrl+Z / Cmd+Z` — undo
- `Ctrl+Shift+Z / Cmd+Shift+Z` — redo
- `Ctrl+F / Cmd+F` — find and replace
- `Ctrl+S / Cmd+S` — manual save (auto-save is always on)
- `Ctrl+Home / Cmd+Home` — go to cell A1
- `Ctrl+End / Cmd+End` — go to last used cell

#### 7.4 Print & Page Setup
- Print-friendly view (hide toolbar, formula bar, headers)
- Page setup: margins, orientation, paper size
- Print area definition

### Milestone: Users can import a CSV, edit it collaboratively, and export as XLSX or PDF.

### Verification
- Import a 500-row CSV → all data appears correctly in the grid
- Export to XLSX → opened in Excel/LibreOffice with data intact
- Export to PDF → formatted correctly with headers and gridlines
- Keyboard shortcuts work as expected

---

## Phase 8: Production Polish & Deployment (Weeks 24–26)

### Goal
Production-ready application with monitoring, security hardening, and CI/CD.

### Deliverables

#### 8.1 Error Handling & Monitoring
- Global error boundary in React (catch render errors, show fallback UI)
- Backend: structured logging with `zerolog` (Go)
- Metrics endpoint (`/metrics`) for Prometheus:
  - Active WebSocket connections
  - Requests per second
  - P50/P95/P99 latency
  - Error rate
- Alerting: PagerDuty or Slack webhook for error rate >1%

#### 8.2 Security Hardening
- Rate limiting on auth endpoints (10 req/min per IP)
- CORS restricted to frontend origin
- Content Security Policy headers
- XSS protection: sanitize all cell values before rendering (DOMPurify)
- CSRF protection for REST endpoints
- Input validation on all API endpoints (Go struct validation)
- SQL injection prevention (parameterized queries with `pgx`)
- JWT token revocation on logout
- HTTPS everywhere (TLS termination at load balancer)

#### 8.3 CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
# - Lint (eslint, golangci-lint)
# - Type check (tsc --noEmit)
# - Unit tests (Jest for frontend, Go test for backend)
# - Integration tests (Docker Compose with test DB)
# - Build Docker images
# - Push to registry
# - Deploy to staging (automatic on main branch)
# - Deploy to production (manual trigger)
```

#### 8.4 Testing Strategy
| Type | Tool | Coverage |
|---|---|---|
| Unit | Jest (frontend), Go test (backend) | 80%+ |
| Integration | Playwright / Cypress | Critical paths |
| E2E | Playwright | Full user flows |
| Load | k6 / artillery | 100 concurrent users |
| CRDT correctness | Yjs test suite | Conflict resolution scenarios |

#### 8.5 Documentation
- `README.md` — project overview, setup instructions, architecture diagram
- `ARCHITECTURE.md` — detailed design decisions, CRDT explanation, scaling strategy
- `API.md` — OpenAPI/Swagger spec for REST endpoints
- `CONTRIBUTING.md` — how to contribute, code style, PR process
- `DEPLOYMENT.md` — Docker deployment, environment variables, scaling guide

#### 8.6 Deployment
- Docker Compose for local development
- Kubernetes manifests for production (or single VPS with Docker for MVP)
- Environment variables for all secrets and config:
  ```env
  DATABASE_URL=postgres://...
  REDIS_URL=redis://...
  JWT_PRIVATE_KEY=...
  JWT_PUBLIC_KEY=...
  FRONTEND_URL=https://app.example.com
  CORS_ORIGIN=https://app.example.com
  ```
- Health check endpoint: `GET /health` → 200 OK

### Milestone: The application is deployed to production with monitoring, automated CI/CD, and documented for other engineers to maintain.

### Verification
- `make test` passes all unit and integration tests
- `make build` produces Docker images successfully
- `make deploy` deploys to staging environment
- `curl https://app.example.com/health` returns 200
- Prometheus dashboard shows healthy metrics

---

## Summary Timeline

| Phase | Duration | Key Outcome |
|---|---|---|
| 1. Foundation | Weeks 1–3 | Single-user blank sheet with grid rendering |
| 2. Real-Time Collab | Weeks 4–6 | Multi-user editing with CRDT, cursors, presence |
| 3. Auth & Sharing | Weeks 7–9 | Sign up, sign in, share sheets, permissions |
| 4. Formulas | Weeks 10–13 | Formula parser, 30+ functions, dependency graph |
| 5. Version History | Weeks 14–16 | Auto-save, version timeline, offline sync, undo/redo |
| 6. Performance | Weeks 17–20 | Virtualization, scaling, load testing |
| 7. Import/Export | Weeks 21–23 | XLSX/CSV/PDF import and export, keyboard shortcuts |
| 8. Production | Weeks 24–26 | Monitoring, security, CI/CD, documentation, deploy |

**Total: ~26 weeks (6 months) for a production-ready MVP.**

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CRDT conflicts produce unexpected results | Medium | High | Extensive integration tests with concurrent edit scenarios; Yjs has been battle-tested |
| Go WebSocket server doesn't scale to target load | Low | High | Load test early (Week 6); switch to a managed WebSocket service (Pusher, Ably) if needed |
| Formula engine has edge cases | Medium | Medium | Start with common functions only; expand incrementally; use existing formula spec (Excel/Google Sheets) |
| Large sheet performance degrades | Medium | High | Virtualization from Day 1 (Phase 1); lazy loading; don't render off-screen cells |
| Security vulnerability in CRDT sync | Low | Critical | Validate all Yjs updates server-side; limit update size; rate-limit WebSocket messages |

---

## Key Files to Create (in order)

1. `shared/types.ts` — shared TypeScript types (cells, sheets, members)
2. `shared/crdt.ts` — Yjs document factory and CRDT schema
3. `backend/go.mod` — Go module definition
4. `backend/internal/ws/hub.go` — WebSocket hub and room management
5. `backend/internal/auth/` — JWT auth middleware and handlers
6. `backend/internal/sheet/` — Sheet CRUD service
7. `backend/migrations/001_init.sql` — database schema
8. `frontend/src/App.tsx` — main app with routing and auth context
9. `frontend/src/components/SpreadsheetGrid.tsx` — core grid renderer
10. `frontend/src/components/Cell.tsx` — individual cell component
11. `frontend/src/hooks/useSheet.ts` — Yjs integration hook
12. `frontend/src/hooks/usePresence.ts` — cursor and selection tracking
13. `docker-compose.yml` — PostgreSQL, Redis, MinIO, app services
14. `Makefile` — build, dev, test, deploy commands
