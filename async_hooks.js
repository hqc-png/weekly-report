// Polyfill for async_hooks module in Cloudflare Workers environment
// async_hooks is not available in Workers, but Next.js may try to import it
// This provides stub implementations to prevent runtime errors

export class AsyncLocalStorage {
  constructor() {
    this.store = new Map();
  }

  run(store, callback, ...args) {
    const previousStore = this.store;
    this.store = new Map(store);
    try {
      return callback(...args);
    } finally {
      this.store = previousStore;
    }
  }

  getStore() {
    return this.store;
  }

  enterWith(store) {
    this.store = new Map(store);
  }

  disable() {
    this.store = new Map();
  }
}

export class AsyncResource {
  constructor(type, options) {
    this.type = type;
    this.options = options;
  }

  runInAsyncScope(fn, thisArg, ...args) {
    return fn.apply(thisArg, args);
  }

  emitDestroy() {
    // no-op
  }

  asyncId() {
    return 0;
  }

  triggerAsyncId() {
    return 0;
  }
}

export function executionAsyncId() {
  return 0;
}

export function triggerAsyncId() {
  return 0;
}

export function createHook() {
  return {
    enable: () => {},
    disable: () => {},
  };
}

export default {
  AsyncLocalStorage,
  AsyncResource,
  executionAsyncId,
  triggerAsyncId,
  createHook,
};
