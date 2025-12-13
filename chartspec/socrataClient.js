// Lightweight Socrata JSON fetcher with caching and abort support
// Uses SoQL params to keep payloads small and avoid UI freezes

import { DEFAULT_TTL_MS } from './demoDatasets.js';

function now() {
  return Date.now();
}

export function buildSocrataUrl({ domain, datasetId, params = {} }) {
  const base = `https://${domain}/resource/${datasetId}.json`;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.append(key, value);
  });
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export function buildCacheKey({ domain, datasetId, preset, params = {} }) {
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return `socrata:${domain}:${datasetId}:${preset || 'default'}:${sortedParams}`;
}

function readCache(cacheKey, ttlMs) {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.timestamp || (ttlMs && now() - parsed.timestamp > ttlMs)) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to read cache', error);
    return null;
  }
}

function writeCache(cacheKey, value) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now(), value }));
  } catch (error) {
    console.warn('Cache write failed', error);
  }
}

export async function fetchSocrataDataset({
  domain,
  datasetId,
  params = {},
  preset = 'default',
  cacheMode = 'live',
  ttlMs = DEFAULT_TTL_MS,
  signal,
  forceRefresh = false,
}) {
  const cacheKey = buildCacheKey({ domain, datasetId, preset, params });

  if (cacheMode === 'cached' && !forceRefresh) {
    const cached = readCache(cacheKey, ttlMs);
    if (cached) {
      return {
        rows: cached.value,
        fromCache: true,
        cachedAt: cached.timestamp,
        cacheKey,
      };
    }
  }

  const url = buildSocrataUrl({ domain, datasetId, params });
  const response = await fetch(url, { signal });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message || body?.error || JSON.stringify(body);
    } catch (error) {
      detail = '';
    }
    const error = new Error(`Socrata request failed (${response.status})${detail ? `: ${detail}` : ''}`);
    error.status = response.status;
    throw error;
  }

  const rows = await response.json();

  if (cacheMode === 'cached' || cacheMode === 'live') {
    writeCache(cacheKey, rows);
  }

  return {
    rows,
    fromCache: false,
    cachedAt: now(),
    cacheKey,
  };
}

export function clearSocrataCache(cacheKeyOrOptions) {
  const cacheKey = typeof cacheKeyOrOptions === 'string'
    ? cacheKeyOrOptions
    : cacheKeyOrOptions
      ? buildCacheKey(cacheKeyOrOptions)
      : null;
  if (!cacheKey) return;
  try {
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('Failed to clear cache', error);
  }
}
