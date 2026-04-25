# Testing Guide

This document explains how to run the automated test suite for the JJU Reading Club application.

## Overview

The project has two separate test suites:

| Suite | Framework | Location |
|---|---|---|
| **Backend** | [Vitest](https://vitest.dev/) | `backend/__tests__/` |
| **Frontend** | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) | `frontend/src/__tests__/` |

---

## Quick Start

Run **all tests** from the repository root:

```bash
npm test
```

Run **backend tests only**:

```bash
npm run test:backend
```

Run **frontend tests only**:

```bash
npm run test:frontend
# or, from inside the frontend directory:
cd frontend && npm test
```

---

## Frontend-specific Commands

```bash
# Run tests once
cd frontend && npm test

# Watch mode (re-runs on file change)
cd frontend && npm run test:watch

# Run with coverage report
cd frontend && npm run test:coverage
```

---

## Test Structure

### Backend (`backend/__tests__/`)

```
backend/__tests__/
├── utils/
│   ├── streakUtils.test.js       # calcLongestStreak, calcPagesRead utilities
│   └── borrowingRules.test.js    # checkBorrowingRules eligibility logic
├── auth.test.js                  # registerUser / loginUser controller validation
└── reservation.test.js           # createReservation controller validation
```

All backend tests run in a Node environment with Mongoose models mocked — **no real database connection is required**.

### Frontend (`frontend/src/__tests__/`)

```
frontend/src/__tests__/
├── AuthSlice.test.js             # Redux auth slice (setAuth / setClear)
├── LoginForm.test.jsx            # Login form rendering and submission
├── ProtectedRoute.test.jsx       # Redirect and auth-guard behaviour
└── FAQ.test.jsx                  # FAQ accordion rendering and interaction
```

All frontend tests run in a jsdom environment with API calls mocked via [Vitest's `vi.mock`](https://vitest.dev/api/vi.html#vi-mock) — **no real backend or browser is required**.

---

## Shared Test Utilities

### `frontend/src/test/renderWithProviders.jsx`

A custom `render` helper that wraps components in all required providers (Redux store, React Query, React Router). Use it instead of `@testing-library/react`'s plain `render` when testing components that depend on those contexts:

```jsx
import { renderWithProviders } from '../test/renderWithProviders';

renderWithProviders(<MyComponent />, {
  preloadedState: {
    auth: { user: { _id: 'u1' }, token: 'tok', IsAuthenticated: true },
  },
  initialPath: '/dashboard',
});
```

### `frontend/src/test/setup.js`

Loaded automatically before every test file. Imports `@testing-library/jest-dom` to add DOM-specific matchers (`toBeInTheDocument`, `toHaveValue`, etc.).

---

## Writing New Tests

### Backend

1. Create a file in `backend/__tests__/` (or a subdirectory).
2. Mock any Mongoose model you need with `vi.mock('../../models/ModelName.js', () => ({ default: { ... } }))`.
3. Import the controller or utility under test **after** the `vi.mock` calls.
4. Use plain `describe` / `it` / `expect` — globals are enabled via `vitest.backend.config.js`.

### Frontend

1. Create a `.test.jsx` (or `.test.js`) file inside `frontend/src/__tests__/`.
2. Mock API calls and external services with `vi.mock(...)`.
3. Use `renderWithProviders` to render components that require Redux / React Query / Router.
4. DOM matchers from `@testing-library/jest-dom` are available globally.

---

## Configuration Files

| File | Purpose |
|---|---|
| `vitest.backend.config.js` | Vitest config for backend tests (`node` environment) |
| `frontend/vitest.config.js` | Vitest config for frontend tests (`jsdom` environment) |
| `frontend/src/test/setup.js` | Global test setup (jest-dom matchers) |

---

## Known Limitations

- **Database integration tests**: Backend controller tests mock all Mongoose models. To add true integration tests, consider using [`mongodb-memory-server`](https://github.com/nodkz/mongodb-memory-server) to spin up an in-memory MongoDB instance.
- **End-to-end tests**: No E2E test framework (e.g. Playwright / Cypress) is configured yet. The current unit/integration tests cover the most critical paths without requiring a running server.
- **Components with heavy external dependencies**: Some components (e.g. those using `framer-motion`, Cloudinary uploads, or push notifications) require lightweight mocks in tests.
