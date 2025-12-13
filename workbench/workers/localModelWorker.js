let activeTimer = null;
let canceled = false;

function clearActive() {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
  canceled = false;
}

function emit(message) {
  postMessage(message);
}

function startProgressLoop(model, options = {}) {
  clearActive();
  const testMode = options.testMode;
  const totalDuration = testMode ? 300 : 4000;
  const step = testMode ? 50 : 250;
  let elapsed = 0;

  activeTimer = setInterval(() => {
    if (canceled) {
      clearActive();
      emit({ type: 'canceled', model });
      return;
    }

    elapsed += step;
    const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const stage = progress < 30 ? 'preparing' : progress < 70 ? 'downloading' : 'warming up';
    emit({ type: 'progress', progress, stage, model });

    if (progress >= 100) {
      clearActive();
      emit({ type: 'loaded', model, detail: { stage: 'ready' } });
    }
  }, step);
}

function runInference(request) {
  const { prompt, columns, rows = [], testMode } = request;
  const delay = testMode ? 120 : 500;
  setTimeout(() => {
    const x = columns?.[0] || 'x';
    const y = columns?.[1] || 'y';
    const spec = {
      title: `Local result for "${prompt.slice(0, 40)}"`,
      chartType: 'bar',
      x,
      y,
      description: 'Generated locally in worker',
    };
    emit({ type: 'inference:done', spec });
  }, delay);
}

self.onmessage = (event) => {
  const { type, model, options = {} } = event.data || {};
  switch (type) {
    case 'load':
      startProgressLoop(model || 'local-model', options);
      break;
    case 'cancel':
      canceled = true;
      break;
    case 'infer':
      runInference(event.data);
      break;
    default:
      emit({ type: 'error', error: `Unknown worker message type: ${type}` });
  }
};
