# E2E Testing Guide

## Overview
This project uses Playwright for end-to-end browser testing. E2E tests verify critical user flows and ensure the application works as expected in a real browser environment.

## Prerequisites
- Node.js installed
- Dependencies installed: `npm install`
- Playwright browsers installed: `npx playwright install`

## Running E2E Tests

### Run all E2E tests
```bash
npm run test:e2e
```

This will:
- Start the local dev server on port 5173
- Run all E2E tests in headless mode
- Generate an HTML report

### Run E2E tests with UI mode
```bash
npm run test:e2e:ui
```

This opens the Playwright UI for interactive test debugging.

### Run specific test file
```bash
npx playwright test e2e/routes.spec.ts
```

## Test Coverage

### Current E2E Tests

#### Basic Routes (`e2e/routes.spec.ts`)
- Home page loads
- Setup page loads
- Setup page with authentic mode loads
- Create room page loads
- Join room page loads
- Archive page loads
- Unknown route shows NotFound

#### Classic Local Gameplay (`e2e/classic-local.spec.ts`)
- Start Classic local match
- Verify board loads
- Verify initial turn is Shu
- Verify board is interactive
- Classic mode shows correct features

#### Modern 3K Local Gameplay (`e2e/authentic-local.spec.ts`)
- Start Authentic local match
- Verify board loads
- Verify Wu starts (Authentic rule)
- Verify board is interactive
- Authentic mode shows correct features

#### Archive Page (`e2e/archive.spec.ts`)
- Archive page loads
- Shows filter controls
- Replays saved Modern 3K local archive records in read-only mode

#### NotFound Page (`e2e/notfound.spec.ts`)
- Unknown route shows NotFound
- CTA buttons are present

## Online Tests

### Manual QA Required
Online Classic gameplay tests (room creation, joining, multiplayer) are not automated due to:
- Complexity of multi-browser context testing
- Backend dependency (requires running WebSocket server)
- Potential flakiness in real-time socket connections

To test online flows manually:
1. Start backend: `npm run server`
2. Open two browser tabs
3. Create a room in one tab
4. Join with the second tab using the room code
5. Verify slot claiming, ready states, and move synchronization

## Known Limitations

1. **Selector Stability**: Some tests use generic selectors (canvas, text). These may need refinement as the UI evolves.

2. **No Move Verification**: Current tests verify board loading but do not make actual piece moves due to canvas-based rendering complexity.

3. **No Online Automation**: Real-time WebSocket testing is not automated; requires manual QA.

4. **Single Browser**: Tests currently run only on Chromium. Firefox and WebKit can be added to playwright.config.ts if needed.

## Adding New Tests

1. Create a new test file in `e2e/` directory
2. Use the following template:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('test description', async ({ page }) => {
    await page.goto('/route');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

3. Run the test to verify it works

## Test IDs

If selectors become unstable, add `data-testid` attributes to React components:

```tsx
<button data-testid="start-match-button">Start Match</button>
```

Then use in tests:
```typescript
await page.getByTestId('start-match-button').click();
```

## Troubleshooting

### Tests fail with "Connection refused"
- Ensure no other process is using port 5173
- The webServer config in playwright.config.ts will start the dev server automatically

### Tests timeout
- Increase timeout in playwright.config.ts
- Check if the dev server is slow to start

### Selectors not found
- Use Playwright Inspector: `npx playwright codegen localhost:5173`
- Add data-testid attributes if needed
