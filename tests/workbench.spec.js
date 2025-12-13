const { test, expect } = require('@playwright/test');

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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__TEST_MODE__ = true;
  });
});

test('primary controls stay responsive and charts render', async ({ page }) => {
  const errors = captureConsoleErrors(page);

  await page.goto('/workbench.html');
  const sendButton = page.getByRole('button', { name: 'Send' });

  // Error path: sending without dataset should not wedge the UI
  const missingDatasetDialog = page.waitForEvent('dialog', { timeout: 2000 }).catch(() => null);
  await sendButton.click();
  const dialog = await missingDatasetDialog;
  if (dialog) {
    await dialog.accept();
  }
  await expect(sendButton).toBeEnabled();

  // Dataset selector prompt
  page.once('dialog', (dialog) => dialog.accept('1'));
  await page.locator('#dataset-pill').click();

  // Settings prompt should be recoverable
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#toggle-settings').click();

  // Layout preset toggles
  await page.locator('.preset-btn[data-preset="2up"]').click();
  await page.locator('.preset-btn[data-preset="default"]').click();

  // Presentation mode toggle
  await page.locator('#toggle-presentation').click();
  await expect(page.locator('html')).toHaveAttribute('data-presentation-mode', 'true');
  await page.evaluate(() => window.chartSpecWorkbench?.store.togglePresentationMode());

  // Switch to Smart mode for deterministic charting
  await page.selectOption('#nl-mode', 'smart');

  const chatInput = page.locator('#chat-input');
  await chatInput.fill('show bar chart of Revenue by Region');
  await sendButton.click();

  await page.waitForSelector('cs-chart-tile svg', { timeout: 20000 });
  await expect(page.locator('cs-chart-tile svg')).toBeVisible();
  await expect(sendButton).toBeEnabled();
  expect(errors).toEqual([]);
});

test('local model load is cancellable and recovers', async ({ page }) => {
  const errors = captureConsoleErrors(page);

  await page.goto('/workbench.html');
  await page.selectOption('#local-model-select', 'stub');

  const loadButton = page.locator('#load-local-model');
  await loadButton.click();
  await page.locator('#cancel-local-model').click();
  await expect(loadButton).toBeEnabled();

  await loadButton.click();
  await page.waitForSelector('.local-model-status:has-text("Ready")', { timeout: 10000 });
  await expect(page.locator('.local-model-status')).toContainText('Ready');
  await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('local model worker failure clears busy state', async ({ page }) => {
  const errors = captureConsoleErrors(page);

  await page.addInitScript(() => {
    class ExplodingWorker {
      constructor() {
        this._errorHandlers = [];
        setTimeout(() => {
          const evt = new ErrorEvent('error', { message: 'boom' });
          if (typeof this.onerror === 'function') {
            this.onerror(evt);
          }
          this._errorHandlers.forEach((handler) => handler(evt));
        }, 200);
      }
      postMessage() {}
      terminate() {}
      addEventListener(type, handler) {
        if (type === 'error') {
          this._errorHandlers.push(handler);
        }
      }
      removeEventListener(type, handler) {
        if (type === 'error') {
          this._errorHandlers = this._errorHandlers.filter((h) => h !== handler);
        }
      }
    }
    window.Worker = ExplodingWorker;
  });

  await page.goto('/workbench.html');
  const loadButton = page.locator('#load-local-model');
  await loadButton.click();

  await expect(loadButton).toBeEnabled({ timeout: 5000 });
  await expect(page.locator('.local-model-error')).toContainText(/Error/i);
  await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();

  await page.screenshot({ path: 'test-results/local-model-worker-error.png', fullPage: true });

  // Ignore the intentional local model crash noise emitted by the stubbed worker
  const allowedErrorFragments = [
    'local model worker crashed',
    'local model load failed',
    'action "local-model" failed',
  ];
  const actionableErrors = errors.filter((msg) => {
    const lower = msg.toLowerCase();
    return !allowedErrorFragments.some((fragment) => lower.includes(fragment));
  });
  expect(actionableErrors).toEqual([]);
});
