# Testing Guide

## What You'll Learn

This guide covers:
- Running Playwright end-to-end tests
- Understanding test mode flags (`window.__TEST_MODE__`)
- Local development workflow
- Writing new tests
- CI integration
- Debugging test failures

## Test Infrastructure

ChartSpec uses **Playwright** for end-to-end testing with a built-in static server.

### Test Stack

- **Test framework:** Playwright (`@playwright/test`)
- **Browser:** Chromium (headless by default)
- **Server:** Node.js static server (`scripts/dev-server.js`)
- **Port:** 4173
- **Test directory:** `tests/`

### Test Files

```
tests/
├── workbench.spec.js       # Workbench UI tests
├── demoGallery.test.js     # Demo gallery tests (unit)
└── socrataClient.test.js   # Socrata client tests (unit)
```

**Note:** Unit tests (`*.test.js`) are currently ignored in Playwright config.

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install
```

### Run All Tests

```bash
# Run all E2E tests (headless)
npm test

# Or explicitly
npm run test:e2e
```

**What happens:**
1. Starts dev server on port 4173
2. Waits for server to be ready
3. Runs all `*.spec.js` files in `tests/`
4. Closes browser and server

### Run Tests in Headed Mode

```bash
# See tests run in browser window
npm run test:headed

# Or use Playwright's debug mode
PWDEBUG=1 npm run test:e2e
```

**Use cases:**
- Debugging test failures
- Understanding test flow visually
- Developing new tests

### Run Specific Test File

```bash
# Run only workbench tests
npx playwright test workbench.spec.js

# Run with debugging
npx playwright test workbench.spec.js --debug
```

### Run Specific Test Case

```bash
# Run tests matching pattern
npx playwright test -g "primary controls"

# Or use test.only in code
test.only('my specific test', async ({ page }) => {
  // ...
});
```

## Test Mode Flags

### `window.__TEST_MODE__`

This flag enables test-specific behavior to avoid issues in CI:

**What it does:**
- **Stub local model loader:** Avoids downloading large ML models
- **D3 fallback renderer:** Uses D3 instead of Plotly when needed
- **Faster execution:** Skips slow initialization steps
- **Deterministic behavior:** Reduces flakiness from network/timing

**How it's used:**

```javascript
// In test setup (tests/workbench.spec.js)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__TEST_MODE__ = true;
  });
});

// In application code (workbench/main.js)
if (window.__TEST_MODE__) {
  // Use stub local model loader
  localModelLoader = new StubLocalModelLoader();
} else {
  // Use real local model loader
  localModelLoader = new RealLocalModelLoader();
}

// In renderer code
if (window.__TEST_MODE__ && !isPlotlyAvailable()) {
  // Fall back to D3
  return d3Renderer;
}
```

### Other Test Flags

You can add custom flags for specific test scenarios:

```javascript
// Disable animations in tests
window.__DISABLE_ANIMATIONS__ = true;

// Mock API responses
window.__MOCK_API__ = true;

// Force specific renderer
window.__FORCE_RENDERER__ = 'D3';
```

## Local Development Workflow

### 1. Start Dev Server

```bash
# Terminal 1: Start server
npm run serve
```

Server runs at `http://localhost:4173`

**What it does:**
- Serves static files from project root
- Serves `/docs` directory for Pages testing
- Logs requests to console
- Supports hot reload (manual refresh)

### 2. Open in Browser

```
http://localhost:4173/              # Classic UI
http://localhost:4173/workbench.html # Workbench UI
http://localhost:4173/docs/          # GitHub Pages version
```

### 3. Make Changes

Edit files in your code editor:
- HTML files: `index.html`, `workbench.html`
- JavaScript modules: `chartspec/*.js`, `workbench/*.js`
- Styles: `styles.css`, `styles/*.css`

### 4. Test Changes

#### Manual Testing
1. Refresh browser
2. Interact with UI
3. Check browser console for errors
4. Verify chart rendering

#### Automated Testing
```bash
# Terminal 2: Run tests (server still running)
npm run test:e2e
```

### 5. Iterate

Repeat steps 3-4 until changes are complete.

### 6. Run Full Test Suite

```bash
# Stop dev server (Ctrl+C)
# Run complete test suite
npm test
```

## Writing New Tests

### Test Structure

```javascript
import { test, expect } from '@playwright/test';

// Helper functions
const captureConsoleErrors = (page) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
};

// Setup test mode
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__TEST_MODE__ = true;
  });
});

// Test case
test('my test case', async ({ page }) => {
  const errors = captureConsoleErrors(page);
  
  // Navigate to page
  await page.goto('/workbench.html');
  
  // Interact with UI
  await page.locator('#my-button').click();
  
  // Assert behavior
  await expect(page.locator('#result')).toBeVisible();
  
  // Check for errors
  expect(errors).toEqual([]);
});
```

### Common Patterns

#### Waiting for Elements
```javascript
// Wait for selector to appear
await page.waitForSelector('cs-chart-tile svg', { timeout: 20000 });

// Wait for element to be visible
await expect(page.locator('#my-element')).toBeVisible();

// Wait for specific text
await page.waitForSelector('text=Data loaded');
```

#### Interacting with Elements
```javascript
// Click button
await page.locator('#send-button').click();

// Fill input
await page.locator('#chat-input').fill('show bar chart');

// Select option
await page.selectOption('#dataset-select', 'sample-sales');

// Get button by role and name
await page.getByRole('button', { name: 'Send' }).click();
```

#### Handling Dialogs
```javascript
// Accept next dialog
page.once('dialog', (dialog) => dialog.accept());
await page.locator('#trigger-button').click();

// Dismiss next dialog
page.once('dialog', (dialog) => dialog.dismiss());
await page.locator('#trigger-button').click();

// Accept with input
page.once('dialog', (dialog) => dialog.accept('my input'));
await page.locator('#prompt-button').click();
```

#### Checking for Errors
```javascript
const errors = captureConsoleErrors(page);

// ... test actions ...

// Verify no errors occurred
expect(errors).toEqual([]);

// Or check for specific errors
expect(errors).toContain('Expected error message');
```

#### Testing Smart Mode
```javascript
// Switch to Smart mode
await page.selectOption('#nl-mode', 'smart');

// Type command
await page.locator('#chat-input').fill('show bar chart of Revenue by Region');

// Send
await page.getByRole('button', { name: 'Send' }).click();

// Verify chart rendered
await page.waitForSelector('cs-chart-tile svg', { timeout: 20000 });
await expect(page.locator('cs-chart-tile svg')).toBeVisible();
```

### Example Test: Dataset Loading

```javascript
test('loads and displays dataset', async ({ page }) => {
  await page.goto('/');
  
  // Select demo dataset
  await page.selectOption('#dataset-select', 'sample-sales');
  
  // Verify dataset info displayed
  const datasetInfo = page.locator('#dataset-info');
  await expect(datasetInfo).toContainText('20 rows');
  await expect(datasetInfo).toContainText('5 columns');
  
  // Verify columns listed
  await expect(datasetInfo).toContainText('Date');
  await expect(datasetInfo).toContainText('Region');
  await expect(datasetInfo).toContainText('Revenue');
});
```

### Example Test: Chart Rendering

```javascript
test('renders bar chart in Smart mode', async ({ page }) => {
  const errors = captureConsoleErrors(page);
  
  await page.goto('/workbench.html');
  
  // Select dataset
  page.once('dialog', (dialog) => dialog.accept('1'));
  await page.locator('#dataset-pill').click();
  
  // Switch to Smart mode
  await page.selectOption('#nl-mode', 'smart');
  
  // Request chart
  await page.locator('#chat-input').fill('show bar chart of Revenue by Region');
  await page.getByRole('button', { name: 'Send' }).click();
  
  // Wait for chart to render
  await page.waitForSelector('cs-chart-tile svg', { timeout: 20000 });
  
  // Verify chart visible
  await expect(page.locator('cs-chart-tile svg')).toBeVisible();
  
  // Verify no errors
  expect(errors).toEqual([]);
});
```

## Debugging Test Failures

### 1. Run in Headed Mode

See what's happening in the browser:

```bash
npm run test:headed
```

### 2. Use Playwright Inspector

Step through test execution:

```bash
PWDEBUG=1 npx playwright test workbench.spec.js
```

**Features:**
- Step through test actions
- Inspect page state
- View console logs
- Try selectors in real-time

### 3. Take Screenshots

Add screenshots to failing tests:

```javascript
test('my test', async ({ page }) => {
  await page.goto('/');
  
  // Take screenshot on failure
  try {
    await expect(page.locator('#result')).toBeVisible();
  } catch (e) {
    await page.screenshot({ path: 'test-failure.png' });
    throw e;
  }
});
```

### 4. Check Console Logs

```javascript
// Capture all console messages
page.on('console', (msg) => {
  console.log(`[${msg.type()}]`, msg.text());
});

// Capture only errors
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.error('Browser error:', msg.text());
  }
});
```

### 5. Increase Timeouts

If tests are timing out:

```javascript
// Increase global timeout
test.setTimeout(120000); // 2 minutes

// Increase specific wait timeout
await page.waitForSelector('svg', { timeout: 60000 });
```

### 6. Check for Race Conditions

```javascript
// BAD: May fail due to timing
await page.click('#button');
await expect(page.locator('#result')).toBeVisible();

// GOOD: Wait for element to be ready
await page.waitForSelector('#button:not(:disabled)');
await page.click('#button');
await page.waitForSelector('#result', { state: 'visible' });
```

## CI Integration

### GitHub Actions

ChartSpec tests run in GitHub Actions on every push and PR.

**Configuration:** `.github/workflows/test.yml` (if exists)

**What runs:**
1. Install Node.js and dependencies
2. Install Playwright browsers
3. Run `npm test`
4. Upload test results and screenshots

### Test in CI Environment

Simulate CI locally:

```bash
# Set CI flag
CI=true npm test

# This forces:
# - Headless mode
# - No server reuse
# - Stricter timeouts
```

## Common Test Issues

### Test Flakiness

**Symptom:** Tests pass sometimes, fail other times

**Causes & Solutions:**

1. **Timing issues**
   - Use `waitForSelector` instead of fixed delays
   - Wait for specific states (visible, enabled, etc.)
   - Increase timeouts for slow operations

2. **State leakage**
   - Clear localStorage before each test
   - Reset UI state in `beforeEach`
   - Use isolated browser contexts

3. **Network issues**
   - Use `window.__TEST_MODE__` to avoid external requests
   - Mock API responses
   - Use cached data

```javascript
test.beforeEach(async ({ page }) => {
  // Clear state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Set test mode
  await page.addInitScript(() => {
    window.__TEST_MODE__ = true;
  });
});
```

### Element Not Found

**Symptom:** `Error: Element not found`

**Solutions:**

```javascript
// Wait for element to appear
await page.waitForSelector('#my-element');

// Use more specific selectors
await page.locator('button[aria-label="Send"]').click();

// Check if element exists first
const exists = await page.locator('#my-element').count() > 0;
if (exists) {
  await page.locator('#my-element').click();
}
```

### Timeout Errors

**Symptom:** `Error: Timeout 30000ms exceeded`

**Solutions:**

1. **Increase timeout:**
   ```javascript
   await page.waitForSelector('svg', { timeout: 60000 });
   ```

2. **Check if operation actually completes:**
   - View in headed mode
   - Check for blocking dialogs
   - Verify network requests complete

3. **Break down long operations:**
   ```javascript
   // Instead of waiting for final state
   await page.waitForSelector('#final-state', { timeout: 60000 });
   
   // Wait for intermediate states
   await page.waitForSelector('#loading');
   await page.waitForSelector('#loading', { state: 'hidden' });
   await page.waitForSelector('#result');
   ```

### Dialog Handling

**Symptom:** Test hangs on `alert()`, `confirm()`, or `prompt()`

**Solution:** Always handle dialogs before triggering them:

```javascript
// WRONG: Test will hang
await page.click('#show-alert');

// RIGHT: Handle dialog first
page.once('dialog', (dialog) => dialog.accept());
await page.click('#show-alert');
```

## Best Practices

1. **Use test mode:** Always set `window.__TEST_MODE__` to avoid slow/flaky operations
2. **Wait for elements:** Use `waitForSelector` instead of `setTimeout`
3. **Be specific:** Use precise selectors (role, aria-label, data-testid)
4. **Check for errors:** Capture console errors in every test
5. **Test user journeys:** Focus on complete workflows, not implementation details
6. **Keep tests independent:** Each test should work in isolation
7. **Clean up state:** Clear localStorage/sessionStorage between tests
8. **Use descriptive names:** Test names should explain what's being tested
9. **Assert behavior:** Test what users see, not internal state
10. **Avoid fixed delays:** Never use `page.waitForTimeout()` unless absolutely necessary

## Test Coverage

Current test coverage focuses on:

- ✅ Workbench UI interactions
- ✅ Chart rendering in Smart mode
- ✅ Local model loading (stub)
- ✅ Layout presets
- ✅ Presentation mode
- ✅ Error handling

Areas to expand:

- ⬜ Classic UI tests
- ⬜ LLM mode (with mocked APIs)
- ⬜ Dataset management (add/reload/delete)
- ⬜ Demo gallery integration
- ⬜ Renderer fallback behavior
- ⬜ Mobile responsiveness

## Next Steps

- **[Deployment Guide](deployment.md)** - Deploy your tested changes
- **[Architecture Guide](architecture.md)** - Understand what you're testing
- **[Schema Guide](schema.md)** - Test different ChartSpec variations
- **[Back to Index](index.md)** - Documentation hub

---

**Navigation:** [← Back to Index](index.md) | [Datasets →](datasets.md) | [Deployment →](deployment.md)
