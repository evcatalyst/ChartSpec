import store from '../state/store.js';

function flagControls(controls, disabled) {
  controls.forEach((control) => {
    if (!control) return;
    if (disabled) {
      control.dataset._prevDisabled = control.disabled ? 'true' : 'false';
      control.disabled = true;
      control.classList.add('is-busy');
    } else {
      const wasDisabled = control.dataset._prevDisabled === 'true';
      delete control.dataset._prevDisabled;
      control.disabled = wasDisabled ? true : false;
      control.classList.remove('is-busy');
    }
  });
}

export async function runUIAction(scope, asyncFn, options = {}) {
  const { label = scope, controls = [] } = options;

  if (store.isBusy(scope)) {
    console.warn(`Action "${scope}" is already running`);
    return;
  }

  store.setBusy(scope, label);
  flagControls(controls, true);

  try {
    return await asyncFn();
  } catch (error) {
    console.error(`Action "${scope}" failed`, error);
    store.addSystemMessage('error', `${label} failed`, { error: error.message || String(error) });
    throw error;
  } finally {
    flagControls(controls, false);
    store.clearBusy(scope);
  }
}

export function reportWarning(message, meta = {}) {
  console.warn(message, meta);
  store.addSystemMessage('warn', message, meta);
}

export function reportInfo(message, meta = {}) {
  console.info(message, meta);
  store.addSystemMessage('info', message, meta);
}
