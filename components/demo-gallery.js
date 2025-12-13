import store from '../state/store.js';
import { listDemoDatasets } from '../chartspec/demoDatasets.js';
import { fetchSocrataDataset, clearSocrataCache } from '../chartspec/socrataClient.js';

const SAFE_ROW_LIMIT = 5000;
const RAW_PAGE_LIMIT = 1000;

class DemoGallery extends HTMLElement {
  constructor() {
    super();
    this.datasetState = {};
    this.pendingControllers = {};
    this.open = false;
    this.toastTimer = null;
    this.eventsBound = false;
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  connectedCallback() {
    this.render();
    this.attachGlobalListeners();
  }

  attachGlobalListeners() {
    store.on('command:open-demo-gallery', () => {
      this.open = true;
      this.render();
    });
  }

  getState(datasetId) {
    if (!this.datasetState[datasetId]) {
      this.datasetState[datasetId] = {
        preset: 'aggregate',
        freshness: 'live',
        page: 1,
        showOptions: false,
        loading: false,
        error: null,
        status: '',
        cachedAt: null,
        fromCache: false,
      };
    }
    return this.datasetState[datasetId];
  }

  render() {
    const datasets = listDemoDatasets();
    this.innerHTML = `
      <div class="demo-gallery ${this.open ? 'open' : ''}" aria-hidden="${!this.open}">
        <div class="demo-gallery__backdrop"></div>
        <div class="demo-gallery__panel" role="dialog" aria-modal="true">
          <div class="demo-gallery__header">
            <div>
              <div class="demo-gallery__title">Demo Gallery</div>
              <div class="demo-gallery__subtitle">Load live NYS Open Data with size & freshness guardrails.</div>
            </div>
            <button class="btn btn-secondary btn-sm" data-action="close-gallery">Close</button>
          </div>
          <div class="demo-gallery__cards">
            ${datasets.map(ds => this.renderCard(ds)).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderCard(ds) {
    const state = this.getState(ds.id);
    const cachedIndicator = state.cachedAt ? `
      <div class="demo-gallery__cached">Using cached data from ${this.formatTime(state.cachedAt)}</div>
    ` : '';

    const status = state.status ? `<div class="demo-gallery__status">${state.status}</div>` : '';
    const error = state.error ? `<div class="demo-gallery__error">${state.error}</div>` : '';

    const freshnessHelp = state.fromCache ? cachedIndicator : '';

    return `
      <div class="demo-card" data-dataset-id="${ds.id}">
        <div class="demo-card__body">
          <div>
            <div class="demo-card__title">${ds.title}</div>
            <div class="demo-card__desc">${ds.description}</div>
            <div class="demo-card__tags">
              ${ds.tags.map(tag => `<span class="demo-tag">${tag}</span>`).join('')}
            </div>
          </div>
          <div class="demo-card__actions">
            <button class="btn btn-primary" data-action="toggle-options" data-dataset-id="${ds.id}" ${state.loading ? 'disabled' : ''}>
              ${state.showOptions ? 'Hide' : 'Load'}
            </button>
          </div>
        </div>
        <div class="demo-card__advanced ${state.showOptions ? 'open' : ''}" data-options-for="${ds.id}">
          <div class="demo-card__section">
            <div class="demo-card__section-title">Data size</div>
            ${Object.entries(ds.queryPresets).map(([key, preset]) => `
              <label class="demo-option">
                <input type="radio" name="${ds.id}-preset" value="${key}" ${state.preset === key ? 'checked' : ''} data-action="set-preset" data-dataset-id="${ds.id}">
                <div>
                  <div class="demo-option__label">${preset.label}</div>
                  <div class="demo-option__desc">${preset.description}${key === 'raw' ? ' (limit enforced, pageable)' : ''}</div>
                </div>
              </label>
            `).join('')}
            <div class="demo-card__pagination" data-dataset-id="${ds.id}" ${state.preset === 'raw' ? '' : 'style="display:none;"'}>
              <button class="btn btn-ghost btn-sm" data-action="page-prev" data-dataset-id="${ds.id}" ${state.page <= 1 || state.loading ? 'disabled' : ''}>Prev</button>
              <span>Page <input type="number" min="1" value="${state.page}" data-action="set-page" data-dataset-id="${ds.id}" aria-label="Raw page" ${state.loading ? 'disabled' : ''}></span>
              <button class="btn btn-ghost btn-sm" data-action="page-next" data-dataset-id="${ds.id}" ${state.loading ? 'disabled' : ''}>Next</button>
              <div class="demo-card__hint">Raw rows are limited to 1,000 per page to keep the UI responsive.</div>
            </div>
          </div>
          <div class="demo-card__section">
            <div class="demo-card__section-title">Freshness</div>
            <label class="demo-option">
              <input type="radio" name="${ds.id}-freshness" value="live" ${state.freshness === 'live' ? 'checked' : ''} data-action="set-freshness" data-dataset-id="${ds.id}">
              <div>
                <div class="demo-option__label">Live</div>
                <div class="demo-option__desc">Fetch from Socrata each time.</div>
              </div>
            </label>
            <label class="demo-option">
              <input type="radio" name="${ds.id}-freshness" value="cached" ${state.freshness === 'cached' ? 'checked' : ''} data-action="set-freshness" data-dataset-id="${ds.id}">
              <div>
                <div class="demo-option__label">Cached (15 min TTL)</div>
                <div class="demo-option__desc">Use browser cache when present. Refresh to bypass.</div>
              </div>
            </label>
            ${freshnessHelp}
            <div class="demo-card__actions" style="margin-top: var(--space-2);">
              <button class="btn btn-ghost btn-sm" data-action="refresh-cache" data-dataset-id="${ds.id}" ${state.loading ? 'disabled' : ''}>Refresh</button>
            </div>
          </div>
          <div class="demo-card__footer">
            <button class="btn btn-primary" data-action="load" data-dataset-id="${ds.id}" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Loading…' : 'Load into workspace'}</button>
            <button class="btn btn-secondary" data-action="cancel" data-dataset-id="${ds.id}" ${state.loading ? '' : 'disabled'}>Cancel</button>
          </div>
          ${status}
          ${error}
        </div>
      </div>
    `;
  }

  bindEvents() {
    if (this.eventsBound) return;
    this.addEventListener('click', this.handleClick);
    this.addEventListener('change', this.handleChange);
    this.addEventListener('input', this.handleChange);
    this.eventsBound = true;
  }

  handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const datasetId = target.dataset.datasetId;
    if (action === 'set-preset' || action === 'set-freshness' || action === 'set-page') {
      return;
    }
    switch (action) {
      case 'close-gallery':
        this.open = false;
        this.render();
        break;
      case 'toggle-options':
        this.toggleOptions(datasetId);
        break;
      case 'page-prev':
        this.changePage(datasetId, -1);
        break;
      case 'page-next':
        this.changePage(datasetId, 1);
        break;
      case 'load':
        this.loadDataset(datasetId);
        break;
      case 'cancel':
        this.cancelLoad(datasetId);
        break;
      case 'refresh-cache':
        this.refreshCache(datasetId);
        break;
      default:
        break;
    }
  }

  handleChange(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const datasetId = target.dataset.datasetId;
    switch (action) {
      case 'set-preset':
        this.setPreset(datasetId, target.value);
        break;
      case 'set-freshness':
        this.setFreshness(datasetId, target.value);
        break;
      case 'set-page':
        this.setPage(datasetId, parseInt(target.value, 10) || 1);
        break;
      default:
        break;
    }
  }

  toggleOptions(datasetId) {
    const state = this.getState(datasetId);
    state.showOptions = !state.showOptions;
    this.render();
  }

  setPreset(datasetId, preset) {
    const state = this.getState(datasetId);
    state.preset = preset;
    if (preset !== 'raw') {
      state.page = 1;
    }
    this.render();
  }

  setFreshness(datasetId, freshness) {
    const state = this.getState(datasetId);
    state.freshness = freshness;
    this.render();
  }

  setPage(datasetId, page) {
    const state = this.getState(datasetId);
    state.page = Math.max(1, page);
    this.render();
  }

  changePage(datasetId, delta) {
    const state = this.getState(datasetId);
    const next = Math.max(1, state.page + delta);
    state.page = next;
    this.render();
  }

  refreshCache(datasetId) {
    const ds = listDemoDatasets().find(d => d.id === datasetId);
    if (!ds) return;
    const state = this.getState(datasetId);
    const preset = ds.queryPresets[state.preset] || ds.queryPresets.aggregate;
    const params = this.buildParams(preset.params, state);
    clearSocrataCache({ domain: ds.domain, datasetId: ds.datasetId, preset: state.preset, params });
    state.cachedAt = null;
    state.status = 'Cache cleared. Next load will fetch fresh data.';
    this.render();
  }

  cancelLoad(datasetId) {
    const controller = this.pendingControllers[datasetId];
    if (controller) {
      controller.abort();
    }
    const state = this.getState(datasetId);
    state.loading = false;
    state.status = 'Request cancelled.';
    this.render();
  }

  buildParams(baseParams, state) {
    const params = { ...(baseParams || {}) };
    if (state.preset === 'raw') {
      const limit = Math.min(parseInt(baseParams.$limit || RAW_PAGE_LIMIT, 10) || RAW_PAGE_LIMIT, RAW_PAGE_LIMIT);
      const page = Math.max(1, state.page || 1);
      params.$limit = limit;
      params.$offset = (page - 1) * limit;
    }
    return params;
  }

  async loadDataset(datasetId) {
    const ds = listDemoDatasets().find(d => d.id === datasetId);
    if (!ds) return;
    const state = this.getState(datasetId);
    if (state.loading) return;

    const preset = ds.queryPresets[state.preset] || ds.queryPresets.aggregate;
    const params = this.buildParams(preset.params, state);

    const controller = new AbortController();
    this.pendingControllers[datasetId] = controller;

    state.loading = true;
    state.error = null;
    state.status = 'Loading...';
    this.render();

    try {
      const result = await fetchSocrataDataset({
        domain: ds.domain,
        datasetId: ds.datasetId,
        params,
        preset: state.preset,
        cacheMode: state.freshness,
        signal: controller.signal,
      });

      const trimmedRows = Array.isArray(result.rows) ? result.rows.slice(0, SAFE_ROW_LIMIT) : [];
      await this.populateWorkspace(ds, trimmedRows, state);

      state.status = result.fromCache
        ? `Loaded from cache (${trimmedRows.length} rows).`
        : `Loaded ${trimmedRows.length} rows.`;
      state.cachedAt = result.cachedAt;
      state.fromCache = !!result.fromCache;
      this.showToast('Dataset ready in workspace');
    } catch (error) {
      if (error.name === 'AbortError') {
        state.status = 'Request cancelled.';
      } else {
        state.error = error.message || 'Failed to load dataset';
        state.status = '';
        this.showToast('Error loading dataset', true);
      }
    } finally {
      state.loading = false;
      delete this.pendingControllers[datasetId];
      this.render();
    }
  }

  async populateWorkspace(config, rows, state) {
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const datasetName = config.title;
    const datasetMeta = {
      name: datasetName,
      url: `https://${config.domain}/resource/${config.datasetId}.json`,
      rowCount: rows.length,
      columns,
      tags: config.tags,
      source: 'socrata',
      preset: state.preset
    };

    const datasets = store.get('datasets') || [];
    const filtered = datasets.filter(d => d.name !== datasetName);
    store.setDatasets([...filtered, datasetMeta]);
    store.selectDataset(datasetName);
    store.setCurrentRows(rows);

    if (typeof indexedDB !== 'undefined') {
      try {
        const { saveDataset } = await import('../state/idb.js');
        await saveDataset({ ...datasetMeta, rows });
      } catch (error) {
        console.warn('Failed to persist dataset', error);
      }
    }

    this.createSuggestedTiles(config, rows, columns);
  }

  createSuggestedTiles(config, rows, columns) {
    const tiles = store.get('tiles') || [];
    const baseId = `tile-${Date.now()}`;

    const specs = this.buildSuggestions(config, rows, columns);
    specs.slice(0, 4).forEach((spec, idx) => {
      const tile = {
        id: `${baseId}-${idx}`,
        type: spec.chartType === 'table' ? 'table' : 'chart',
        title: spec.title || config.title,
        x: (idx % 2) * 6,
        y: Math.floor(idx / 2) * 4,
        w: 6,
        h: 4,
        data: spec.chartType === 'table'
          ? { rows: rows.slice(0, 50), columns }
          : { spec, rows },
      };
      store.addTile(tile);
    });
  }

  buildSuggestions(config, rows, columns) {
    const suggestions = [];
    const hints = config.columnHints || {};
    const dateField = hints.dateFields?.find(c => columns.includes(c)) || columns.find(c => c.toLowerCase().includes('date'));
    const categoryField = hints.categoryFields?.find(c => columns.includes(c)) || columns.find(c => typeof rows[0]?.[c] === 'string');
    const numericField = hints.numericFields?.find(c => columns.includes(c)) || columns.find(c => !isNaN(parseFloat(rows[0]?.[c])));
    const secondNumeric = hints.numericFields?.find(c => c !== numericField && columns.includes(c)) || columns.find(c => c !== numericField && !isNaN(parseFloat(rows[0]?.[c])));

    if (dateField && (numericField || rows.length > 0)) {
      suggestions.push({
        title: `${config.title} over time`,
        chartType: 'line',
        x: dateField,
        y: numericField || columns.find(c => c !== dateField),
        sort: { column: dateField, order: 'asc' }
      });
    }

    if (categoryField) {
      suggestions.push({
        title: `${config.title} by ${categoryField}`,
        chartType: 'bar',
        groupBy: { columns: [categoryField], aggregations: { count: { func: 'count' } } },
        x: categoryField,
        y: 'count',
        sort: { column: 'count', order: 'desc' },
        limit: 20
      });
    }

    if (numericField) {
      suggestions.push({
        title: `${numericField} distribution`,
        chartType: 'histogram',
        x: numericField,
        bins: 20
      });
    }

    if (numericField && secondNumeric) {
      suggestions.push({
        title: `${numericField} vs ${secondNumeric}`,
        chartType: 'scatter',
        x: numericField,
        y: secondNumeric
      });
    }

    // Always include a data preview table
    suggestions.push({
      chartType: 'table',
      title: `${config.title} preview`
    });

    return suggestions;
  }

  formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch (error) {
      return '';
    }
  }

  showToast(message, isError = false) {
    const existing = this.querySelector('.demo-gallery__toast');
    if (existing) {
      existing.remove();
    }
    const toast = document.createElement('div');
    toast.className = `demo-gallery__toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    this.appendChild(toast);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.remove(), 2200);
  }
}

customElements.define('cs-demo-gallery', DemoGallery);

export default DemoGallery;
