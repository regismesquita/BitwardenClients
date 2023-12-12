// Add chrome storage api
const QUOTA_BYTES = 10;
const storage = {
  local: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    QUOTA_BYTES,
    getBytesInUse: jest.fn(),
    clear: jest.fn(),
  },
  session: {
    set: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    remove: jest.fn(),
  },
};

const runtime = {
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  sendMessage: jest.fn(),
  getManifest: jest.fn(),
  getURL: jest.fn((path) => `chrome-extension://id/${path}`),
  connect: jest.fn(),
  onConnect: {
    addListener: jest.fn(),
  },
};

const contextMenus = {
  create: jest.fn(),
  removeAll: jest.fn(),
};

const i18n = {
  getMessage: jest.fn(),
  getUILanguage: jest.fn(),
};

const tabs = {
  executeScript: jest.fn(),
  sendMessage: jest.fn(),
  query: jest.fn(),
  onActivated: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  onReplaced: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  onUpdated: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  onRemoved: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
};

const scripting = {
  executeScript: jest.fn(),
};

const windows = {
  create: jest.fn(),
  get: jest.fn(),
  getCurrent: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  onFocusChanged: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
};

const port = {
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  postMessage: jest.fn(),
};

// set chrome
global.chrome = {
  i18n,
  storage,
  runtime,
  contextMenus,
  tabs,
  scripting,
  windows,
  port,
} as any;
