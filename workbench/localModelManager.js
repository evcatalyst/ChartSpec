import store from '../state/store.js';
import { runUIAction, reportInfo, reportWarning } from './uiActions.js';

let worker = null;
let pendingLoad = null;
let pendingInference = null;

const MODEL_LIBRARY = {
  'smol-1.7b': { label: 'SmolLM 1.7B (recommended)', sizeMB: 120, memoryGB: 2 },
  'phi-mini': { label: 'Phi Mini', sizeMB: 60, memoryGB: 1 },
  'stub': { label: 'Stub (test)', sizeMB: 5, memoryGB: 0.1 },
};

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./workers/localModelWorker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (event) => handleWorkerMessage(event.data);
  worker.onerror = (error) => {
    store.updateLocalModel({ status: 'error', error: error.message || 'Worker error' });
    store.addSystemMessage('error', 'Local model worker crashed', { error: error.message });
  };
  return worker;
}

function handleWorkerMessage(data) {
  if (!data) return;
  switch (data.type) {
    case 'progress':
      store.updateLocalModel({ status: data.stage || 'loading', progress: data.progress, error: null });
      break;
    case 'loaded':
      if (pendingLoad) {
        pendingLoad.resolve(data);
        pendingLoad = null;
      }
      store.updateLocalModel({ status: 'ready', progress: 100, lastLoaded: data.model, error: null });
      reportInfo(`Local model "${data.model}" ready`, { model: data.model });
      break;
    case 'error':
      if (pendingLoad) {
        pendingLoad.reject(new Error(data.error || 'Local model error'));
        pendingLoad = null;
      } else if (pendingInference) {
        pendingInference.reject(new Error(data.error || 'Local model error'));
        pendingInference = null;
      }
      store.updateLocalModel({ status: 'error', error: data.error || 'Unknown error' });
      break;
    case 'canceled':
      if (pendingLoad) {
        pendingLoad.resolve({ canceled: true });
        pendingLoad = null;
      }
      store.updateLocalModel({ status: 'idle', progress: 0, error: null });
      reportInfo('Local model load canceled', { model: data.model });
      break;
    case 'inference:done':
      if (pendingInference) {
        pendingInference.resolve(data.spec);
        pendingInference = null;
      }
      break;
  }
}

function startLoad(model, options = {}) {
  ensureWorker();
  return new Promise((resolve, reject) => {
    pendingLoad = { resolve, reject };
    worker.postMessage({ type: 'load', model, options: { ...options, testMode: options.testMode ?? Boolean(window.__TEST_MODE__) } });
  });
}

function startInference(request) {
  ensureWorker();
  return new Promise((resolve, reject) => {
    pendingInference = { resolve, reject };
    worker.postMessage({
      type: 'infer',
      ...request,
      testMode: request.testMode ?? Boolean(window.__TEST_MODE__),
    });
  });
}

export function getModelInfo(selection) {
  return MODEL_LIBRARY[selection] || MODEL_LIBRARY['smol-1.7b'];
}

export function selectLocalModel(selection) {
  store.updateSettings({ provider: 'local' });
  store.updateLocalModel({ selection, status: 'idle', error: null, info: getModelInfo(selection) });
}

export async function loadSelectedLocalModel(options = {}) {
  const selection = store.get('localModel')?.selection || 'smol-1.7b';
  const info = getModelInfo(selection);
  await runUIAction('local-model', async () => {
    store.updateLocalModel({ status: 'loading', progress: 0, error: null, info });
    await preflightChecks(info);
    await startLoad(selection, { testMode: options.testMode });
  }, { label: 'Load local model', controls: options.controls || [] });
}

export function cancelLocalModelLoad() {
  if (!worker) return;
  worker.postMessage({ type: 'cancel' });
}

async function preflightChecks(info) {
  if (typeof navigator !== 'undefined' && (!navigator.gpu || typeof navigator.gpu.requestAdapter !== 'function')) {
    reportWarning('WebGPU not detected, falling back to CPU', { feature: 'webgpu' });
  }

  if (info.memoryGB && info.memoryGB > 3) {
    reportWarning('Local model may exceed typical memory limits', { memoryGB: info.memoryGB });
  }

  if (navigator?.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const needed = (info.sizeMB || 50) * 1024 * 1024;
      if (estimate.quota && estimate.quota - (estimate.usage || 0) < needed) {
        reportWarning('Storage quota may be insufficient for local model download', { neededMB: info.sizeMB, quota: estimate.quota, usage: estimate.usage });
      }
    } catch (err) {
      console.warn('Storage estimate failed', err);
    }
  }
}

export async function runLocalInference(payload) {
  return runUIAction('local-inference', async () => {
    const state = store.get('localModel');
    if (state.status !== 'ready') {
      throw new Error('Local model is not loaded');
    }
    const spec = await startInference(payload);
    return spec;
  }, { label: 'Local inference' });
}
