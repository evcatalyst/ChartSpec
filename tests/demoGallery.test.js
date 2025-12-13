import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import store from '../state/store.js';
import { DEMO_DATASETS } from '../chartspec/demoDatasets.js';
import { buildCacheKey } from '../chartspec/socrataClient.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.localStorage = dom.window.localStorage;
global.DOMException = dom.window.DOMException;
global.AbortController = dom.window.AbortController;

await import('../components/demo-gallery.js');

const originalFetch = global.fetch;
const defaultState = store.getState();

function resetStore() {
  store.listeners = new Map();
  store.middlewares = [];
  store.state = { ...defaultState, datasets: [], selectedDataset: null, currentRows: [], tiles: [], gridLayout: null, chatHistory: [] };
}

function resetEnv() {
  document.body.innerHTML = '';
  localStorage.clear();
  global.fetch = originalFetch;
  resetStore();
}

function createGallery() {
  const el = document.createElement('cs-demo-gallery');
  document.body.appendChild(el);
  el.open = true;
  el.render();
  return el;
}

test.afterEach(resetEnv);

test('Gallery renders dataset cards', () => {
  const gallery = createGallery();
  const cards = gallery.querySelectorAll('.demo-card');
  assert.equal(cards.length, DEMO_DATASETS.length);
});

test('Clicking Load opens options with default aggregate + live', () => {
  const gallery = createGallery();
  const first = DEMO_DATASETS[0];
  const button = gallery.querySelector(`[data-dataset-id="${first.id}"][data-action="toggle-options"]`);
  button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  const options = gallery.querySelector(`[data-options-for="${first.id}"]`);
  assert.ok(options.classList.contains('open'));
  const preset = gallery.querySelector(`input[name="${first.id}-preset"]:checked`);
  const freshness = gallery.querySelector(`input[name="${first.id}-freshness"]:checked`);
  assert.equal(preset.value, 'aggregate');
  assert.equal(freshness.value, 'live');
});

test('Loading dataset triggers fetch and populates workspace', async () => {
  const gallery = createGallery();
  const first = DEMO_DATASETS[0];
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return { ok: true, json: async () => [{ a: 1, b: 2 }] };
  };

  await gallery.loadDataset(first.id);

  assert.equal(calls, 1);
  assert.ok(store.get('currentRows').length > 0);
  assert.ok(store.get('tiles').length >= 2);
});

test('Rapid double load does not issue two fetches', async () => {
  const gallery = createGallery();
  const first = DEMO_DATASETS[0];
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return { ok: true, json: async () => [{ a: calls }] };
  };

  const p1 = gallery.loadDataset(first.id);
  const p2 = gallery.loadDataset(first.id);
  await Promise.allSettled([p1, p2]);

  assert.equal(calls, 1);
});

test('Cached freshness uses primed cache without fetch', async () => {
  const gallery = createGallery();
  const first = DEMO_DATASETS[0];
  const preset = first.queryPresets.aggregate;
  const cacheKey = buildCacheKey({
    domain: first.domain,
    datasetId: first.datasetId,
    preset: 'aggregate',
    params: preset.params,
  });

  localStorage.setItem(cacheKey, JSON.stringify({
    timestamp: Date.now(),
    value: [{ cached: true }],
  }));

  global.fetch = () => {
    throw new Error('fetch should not be called when cache is primed');
  };

  const state = gallery.getState(first.id);
  state.preset = 'aggregate';
  state.freshness = 'cached';
  state.showOptions = true;

  await gallery.loadDataset(first.id);

  assert.deepEqual(store.get('currentRows'), [{ cached: true }]);
});

test('Raw paging loads page 2 with offset applied', async () => {
  const gallery = createGallery();
  const first = DEMO_DATASETS[0];
  let sawOffset = false;
  global.fetch = async (url) => {
    sawOffset = /(%24|\\$)offset=1000/.test(url);
    return { ok: true, json: async () => [{ page: 2 }] };
  };

  const state = gallery.getState(first.id);
  state.preset = 'raw';
  state.page = 2;
  state.showOptions = true;

  await gallery.loadDataset(first.id);

  assert.ok(sawOffset);
  assert.equal(store.get('currentRows')[0].page, 2);
});

test('Error state is surfaced and UI stays usable', async () => {
  const gallery = createGallery();
  const first = DEMO_DATASETS[0];
  global.fetch = async () => ({ ok: false, status: 500, json: async () => ({ message: 'boom' }) });

  await gallery.loadDataset(first.id);

  const error = gallery.querySelector('.demo-gallery__error');
  assert.ok(error);
  assert.match(error.textContent, /boom|500/);
});

test('Large responses complete quickly without leaving spinner active', async () => {
  const gallery = createGallery();
  const first = DEMO_DATASETS[0];
  const largeRows = Array.from({ length: 5000 }, (_, i) => ({ idx: i, value: i }));
  global.fetch = async () => ({ ok: true, json: async () => largeRows });

  const start = Date.now();
  await gallery.loadDataset(first.id);
  const duration = Date.now() - start;

  assert.ok(duration < 1000);
  assert.ok(store.get('currentRows').length <= 5000);
  assert.equal(gallery.getState(first.id).loading, false);
});
