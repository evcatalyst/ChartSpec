const TEST_TOTAL_DURATION = 300;
const PROD_TOTAL_DURATION = 4000;
const TEST_STEP = 50;
const PROD_STEP = 250;
const PROMPT_SLICE_LENGTH = 40;

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
  const totalDuration = testMode ? TEST_TOTAL_DURATION : PROD_TOTAL_DURATION;
  const step = testMode ? TEST_STEP : PROD_STEP;
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
  const { prompt, columns, testMode } = request;
  const delay = testMode ? 120 : 500;
  setTimeout(() => {
    const x = columns?.[0] || 'x';
    const y = columns?.[1] || 'y';
    const spec = {
      title: `Local result for "${prompt.slice(0, PROMPT_SLICE_LENGTH)}"`,
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
