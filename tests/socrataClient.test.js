import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  buildSocrataUrl,
  buildCacheKey,
  fetchSocrataDataset,
} from '../chartspec/socrataClient.js';

const dom = new JSDOM('', { url: 'http://localhost' });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.AbortController = dom.window.AbortController;
global.DOMException = dom.window.DOMException;

const originalFetch = global.fetch;

function reset() {
  localStorage.clear();
  global.fetch = originalFetch;
}

test.afterEach(reset);

test('URL builder encodes SoQL params', () => {
  const url = buildSocrataUrl({
    domain: 'data.ny.gov',
    datasetId: 'abcd-1234',
    params: {
      $select: 'sum(value) as total',
      $where: "county='Albany'",
      $limit: 100,
    },
  });
  assert.match(url, /%24select=sum%28value%29\+as\+total/);
  assert.match(url, /%24where=county%3D%27Albany%27/);
  assert.match(url, /%24limit=100/);
});

test('cache key includes dataset, preset, and params', () => {
  const key = buildCacheKey({
    domain: 'data.ny.gov',
    datasetId: 'abcd-1234',
    preset: 'aggregate',
    params: { $limit: 50, $offset: 10 },
  });
  assert.ok(key.includes('abcd-1234'));
  assert.ok(key.includes('aggregate'));
  assert.ok(key.includes('$limit=50'));
  assert.ok(key.includes('$offset=10'));
});

test('TTL expiration forces network fetch', async () => {
  const params = { $limit: 5 };
  const cacheKey = buildCacheKey({
    domain: 'data.ny.gov',
    datasetId: 'abcd-1234',
    preset: 'quick',
    params,
  });

  localStorage.setItem(cacheKey, JSON.stringify({
    timestamp: Date.now() - 1000,
    value: [{ cached: true }],
  }));

  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return {
      ok: true,
      json: async () => [{ fresh: true }],
    };
  };

  const result = await fetchSocrataDataset({
    domain: 'data.ny.gov',
    datasetId: 'abcd-1234',
    params,
    preset: 'quick',
    cacheMode: 'cached',
    ttlMs: 1,
  });

  assert.equal(calls, 1);
  assert.equal(result.fromCache, false);
  assert.deepEqual(result.rows, [{ fresh: true }]);
});

test('abort cancels fetch', async () => {
  const controller = new AbortController();
  global.fetch = (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    setTimeout(() => resolve({
      ok: true,
      json: async () => [{ done: true }],
    }), 50);
  });

  const fetchPromise = fetchSocrataDataset({
    domain: 'data.ny.gov',
    datasetId: 'abcd-1234',
    params: {},
    preset: 'quick',
    cacheMode: 'live',
    signal: controller.signal,
  });

  controller.abort();
  await assert.rejects(fetchPromise, (err) => err.name === 'AbortError');
});

test('handles non-200 with error payload', async () => {
  global.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ message: 'rate limited' }),
  });

  await assert.rejects(
    fetchSocrataDataset({
      domain: 'data.ny.gov',
      datasetId: 'abcd-1234',
      params: {},
      preset: 'aggregate',
      cacheMode: 'live',
    }),
    /429.*rate limited/
  );
});
