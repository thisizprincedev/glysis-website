globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import 'node-fetch-native/polyfill';
import { Server as Server$1 } from 'http';
import { Server } from 'https';
import destr from 'destr';
import { defineEventHandler, handleCacheHeaders, createEvent, eventHandler, createError, createApp, createRouter, lazyEventHandler } from 'h3';
import { createFetch as createFetch$1, Headers } from 'ohmyfetch';
import { createRouter as createRouter$1 } from 'radix3';
import { createCall, createFetch } from 'unenv/runtime/fetch/index';
import { createHooks } from 'hookable';
import { snakeCase } from 'scule';
import { hash } from 'ohash';
import { createStorage } from 'unstorage';
import { withQuery, withLeadingSlash, withoutTrailingSlash, parseURL } from 'ufo';
import { promises } from 'fs';
import { resolve, dirname } from 'pathe';
import { fileURLToPath } from 'url';

const _runtimeConfig = {"app":{"baseURL":"/","buildAssetsDir":"/_nuxt/","cdnURL":""},"nitro":{"routes":{},"envPrefix":"NUXT_"},"public":{}};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _runtimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
const getEnv = (key) => {
  const envKey = snakeCase(key).toUpperCase();
  return destr(process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]);
};
function isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function overrideConfig(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey);
    if (isObject(obj[key])) {
      if (isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      overrideConfig(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
}
overrideConfig(_runtimeConfig);
const config = deepFreeze(_runtimeConfig);
const useRuntimeConfig = () => config;
function deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

const globalTiming = globalThis.__timing__ || {
  start: () => 0,
  end: () => 0,
  metrics: []
};
function timingMiddleware(_req, res, next) {
  const start = globalTiming.start();
  const _end = res.end;
  res.end = (data, encoding, callback) => {
    const metrics = [["Generate", globalTiming.end(start)], ...globalTiming.metrics];
    const serverTiming = metrics.map((m) => `-;dur=${m[1]};desc="${encodeURIComponent(m[0])}"`).join(", ");
    if (!res.headersSent) {
      res.setHeader("Server-Timing", serverTiming);
    }
    _end.call(res, data, encoding, callback);
  };
  next();
}

const _assets = {

};

function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

const storage = createStorage({});

const useStorage = () => storage;

storage.mount('/assets', assets$1);

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro";
  const name = opts.name || fn.name || "_";
  const integrity = hash([opts.integrity, fn, opts]);
  async function get(key, resolver) {
    const cacheKey = [opts.base, group, name, key].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl;
    const _resolve = async () => {
      if (!pending[key]) {
        pending[key] = Promise.resolve(resolver());
      }
      entry.value = await pending[key];
      entry.mtime = Date.now();
      entry.integrity = integrity;
      delete pending[key];
      useStorage().setItem(cacheKey, entry).catch((error) => console.error("[nitro] [cache]", error));
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (opts.swr && entry.value) {
      _resolvePromise.catch(console.error);
      return Promise.resolve(entry);
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const key = (opts.getKey || getKey)(...args);
    const entry = await get(key, () => fn(...args));
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length ? hash(args, {}) : "";
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const _opts = {
    ...opts,
    getKey: (event) => {
      return event.req.originalUrl || event.req.url;
    },
    group: opts.group || "nitro/handlers",
    integrity: [
      opts.integrity,
      handler
    ]
  };
  const _cachedHandler = cachedFunction(async (incomingEvent) => {
    const reqProxy = cloneWithProxy(incomingEvent.req, { headers: {} });
    const resHeaders = {};
    const resProxy = cloneWithProxy(incomingEvent.res, {
      statusCode: 200,
      getHeader(name) {
        return resHeaders[name];
      },
      setHeader(name, value) {
        resHeaders[name] = value;
        return this;
      },
      getHeaderNames() {
        return Object.keys(resHeaders);
      },
      hasHeader(name) {
        return name in resHeaders;
      },
      removeHeader(name) {
        delete resHeaders[name];
      },
      getHeaders() {
        return resHeaders;
      }
    });
    const event = createEvent(reqProxy, resProxy);
    event.context = incomingEvent.context;
    const body = await handler(event);
    const headers = event.res.getHeaders();
    headers.Etag = `W/"${hash(body)}"`;
    headers["Last-Modified"] = new Date().toUTCString();
    const cacheControl = [];
    if (opts.swr) {
      if (opts.maxAge) {
        cacheControl.push(`s-maxage=${opts.maxAge}`);
      }
      if (opts.staleMaxAge) {
        cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
      } else {
        cacheControl.push("stale-while-revalidate");
      }
    } else if (opts.maxAge) {
      cacheControl.push(`max-age=${opts.maxAge}`);
    }
    if (cacheControl.length) {
      headers["Cache-Control"] = cacheControl.join(", ");
    }
    const cacheEntry = {
      code: event.res.statusCode,
      headers,
      body
    };
    return cacheEntry;
  }, _opts);
  return defineEventHandler(async (event) => {
    const response = await _cachedHandler(event);
    if (event.res.headersSent || event.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["Last-Modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.res.statusCode = response.code;
    for (const name in response.headers) {
      event.res.setHeader(name, response.headers[name]);
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const plugins = [
  
];

function hasReqHeader(req, header, includes) {
  const value = req.headers[header];
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  return hasReqHeader(event.req, "accept", "application/json") || hasReqHeader(event.req, "user-agent", "curl/") || hasReqHeader(event.req, "user-agent", "httpie/") || event.req.url?.endsWith(".json") || event.req.url?.includes("/api/");
}
function normalizeError(error) {
  const cwd = process.cwd();
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Route Not Found" : "Internal Server Error");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}

const errorHandler = (async function errorhandler(_error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(_error);
  const errorObject = {
    url: event.req.url,
    statusCode,
    statusMessage,
    message,
    description: "",
    data: _error.data
  };
  event.res.statusCode = errorObject.statusCode;
  event.res.statusMessage = errorObject.statusMessage;
  if (errorObject.statusCode !== 404) {
    console.error("[nuxt] [request error]", errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (isJsonRequest(event)) {
    event.res.setHeader("Content-Type", "application/json");
    event.res.end(JSON.stringify(errorObject));
    return;
  }
  const url = withQuery("/__nuxt_error", errorObject);
  const html = await $fetch(url).catch((error) => {
    console.error("[nitro] Error while generating error response", error);
    return errorObject.statusMessage;
  });
  event.res.setHeader("Content-Type", "text/html;charset=UTF-8");
  event.res.end(html);
});

const assets = {
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"10be-C55WuIAyh7hKQVer/LFA+m9aKYY\"",
    "mtime": "2022-06-19T04:53:14.000Z",
    "path": "../public/favicon.ico"
  },
  "/_nuxt/about-9d9120e9.mjs": {
    "type": "application/javascript",
    "etag": "\"411-60h7EXyoPC6EA8s96SLol9+JF3U\"",
    "mtime": "2022-06-19T10:52:49.680Z",
    "path": "../public/_nuxt/about-9d9120e9.mjs"
  },
  "/_nuxt/Anchor-5282f7f8.mjs": {
    "type": "application/javascript",
    "etag": "\"393-KqHecx8IW8RS/wE9nSLji9Y/eps\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/Anchor-5282f7f8.mjs"
  },
  "/_nuxt/blank-d643559e.mjs": {
    "type": "application/javascript",
    "etag": "\"332-OjZgdiu9UB32c68IQkW+v5KloH4\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/blank-d643559e.mjs"
  },
  "/_nuxt/Body-00afdb9e.mjs": {
    "type": "application/javascript",
    "etag": "\"21a-uJeEDcZSJ2suwVoPSLleC00JL5c\"",
    "mtime": "2022-06-19T10:52:49.680Z",
    "path": "../public/_nuxt/Body-00afdb9e.mjs"
  },
  "/_nuxt/Button-ac5688c0.mjs": {
    "type": "application/javascript",
    "etag": "\"79e-Pk/y7HLWM5tnnxw8fPBi3e8aNRs\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/Button-ac5688c0.mjs"
  },
  "/_nuxt/dashboard-2128e46a.mjs": {
    "type": "application/javascript",
    "etag": "\"132d-RZOKeC1KCmIzc/vFMnkPDcukbGQ\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/dashboard-2128e46a.mjs"
  },
  "/_nuxt/entry-1567ad96.mjs": {
    "type": "application/javascript",
    "etag": "\"3cf5d-ZvA88FBovMxZqz0NUwuPE0uQWMg\"",
    "mtime": "2022-06-19T10:52:49.680Z",
    "path": "../public/_nuxt/entry-1567ad96.mjs"
  },
  "/_nuxt/entry.aeb5b9d0.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7d15-DUcT5vJuCidyHsVfWbhTP8Apgo4\"",
    "mtime": "2022-06-19T10:52:49.687Z",
    "path": "../public/_nuxt/entry.aeb5b9d0.css"
  },
  "/_nuxt/Footer-a50e3ed9.mjs": {
    "type": "application/javascript",
    "etag": "\"414b-KE37rWStJQl1kBwlCOquu2x6YYg\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/Footer-a50e3ed9.mjs"
  },
  "/_nuxt/Footer.cc8d9db6.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"264-7ZPAOjb9jWEIyY8zoFl6DemP+lY\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/Footer.cc8d9db6.css"
  },
  "/_nuxt/index-2f79af35.mjs": {
    "type": "application/javascript",
    "etag": "\"7a5-fBFBqMM5fejg6Bw/TbgMBBUeGEk\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/index-2f79af35.mjs"
  },
  "/_nuxt/index-7da89590.mjs": {
    "type": "application/javascript",
    "etag": "\"d3-0smE4mmRF/+EiiqL2xN7KDar20o\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/index-7da89590.mjs"
  },
  "/_nuxt/index-f329c476.mjs": {
    "type": "application/javascript",
    "etag": "\"44b-9hspLz7dXEz7OqMTZthM27zruvA\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/index-f329c476.mjs"
  },
  "/_nuxt/manifest.json": {
    "type": "application/json",
    "etag": "\"fc3-rnRZfUfUTeEQCy47yxcrWjmfn/k\"",
    "mtime": "2022-06-19T10:52:49.687Z",
    "path": "../public/_nuxt/manifest.json"
  },
  "/_nuxt/page-4ed87476.mjs": {
    "type": "application/javascript",
    "etag": "\"1095-Dv/YrBZY7iBPJWyiPqM485Usdkw\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/page-4ed87476.mjs"
  },
  "/_nuxt/setting-b0c928ab.mjs": {
    "type": "application/javascript",
    "etag": "\"d17-kc11TJ8dWFwnF6X5cQ0Wqmny6vY\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/setting-b0c928ab.mjs"
  },
  "/_nuxt/test-b2a8581f.mjs": {
    "type": "application/javascript",
    "etag": "\"b8e-BGBOsAxzsxYZtl28tiq2c8h4wps\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/test-b2a8581f.mjs"
  },
  "/_nuxt/TextInput-7e4daf21.mjs": {
    "type": "application/javascript",
    "etag": "\"690-ldHOb7pCUpy+rV2vg6CkbQAWH0w\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/TextInput-7e4daf21.mjs"
  },
  "/_nuxt/useLang-36bb84a5.mjs": {
    "type": "application/javascript",
    "etag": "\"62-cGuRq9xrNEjlZlHhfvMKdg5EGx0\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/useLang-36bb84a5.mjs"
  },
  "/_nuxt/Wrapper-7781b307.mjs": {
    "type": "application/javascript",
    "etag": "\"d2-zv3vBoItTDRf+Z+8kb9CVrbfmRQ\"",
    "mtime": "2022-06-19T10:52:49.681Z",
    "path": "../public/_nuxt/Wrapper-7781b307.mjs"
  }
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = ["/_nuxt"];

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return
  }
  for (const base of publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = ["HEAD", "GET"];
const _152570 = eventHandler(async (event) => {
  if (event.req.method && !METHODS.includes(event.req.method)) {
    return;
  }
  let id = decodeURIComponent(withLeadingSlash(withoutTrailingSlash(parseURL(event.req.url).pathname)));
  let asset;
  for (const _id of [id, id + "/index.html"]) {
    const _asset = getAsset(_id);
    if (_asset) {
      asset = _asset;
      id = _id;
      break;
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      throw createError({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404
      });
    }
    return;
  }
  const ifNotMatch = event.req.headers["if-none-match"] === asset.etag;
  if (ifNotMatch) {
    event.res.statusCode = 304;
    event.res.end("Not Modified (etag)");
    return;
  }
  const ifModifiedSinceH = event.req.headers["if-modified-since"];
  if (ifModifiedSinceH && asset.mtime) {
    if (new Date(ifModifiedSinceH) >= new Date(asset.mtime)) {
      event.res.statusCode = 304;
      event.res.end("Not Modified (mtime)");
      return;
    }
  }
  if (asset.type) {
    event.res.setHeader("Content-Type", asset.type);
  }
  if (asset.etag) {
    event.res.setHeader("ETag", asset.etag);
  }
  if (asset.mtime) {
    event.res.setHeader("Last-Modified", asset.mtime);
  }
  const contents = await readAsset(id);
  event.res.end(contents);
});

const _lazy_332873 = () => import('./renderer.mjs').then(function (n) { return n.a; });

const handlers = [
  { route: '', handler: _152570, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_332873, lazy: true, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_332873, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const h3App = createApp({
    debug: destr(false),
    onError: errorHandler
  });
  h3App.use(config.app.baseURL, timingMiddleware);
  const router = createRouter();
  const routerOptions = createRouter$1({ routes: config.nitro.routes });
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    const referenceRoute = h.route.replace(/:\w+|\*\*/g, "_");
    const routeOptions = routerOptions.lookup(referenceRoute) || {};
    if (routeOptions.swr) {
      handler = cachedEventHandler(handler, {
        group: "nitro/routes"
      });
    }
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(/\/+/g, "/");
      h3App.use(middlewareBase, handler);
    } else {
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router);
  const localCall = createCall(h3App.nodeHandler);
  const localFetch = createFetch(localCall, globalThis.fetch);
  const $fetch = createFetch$1({ fetch: localFetch, Headers, defaults: { baseURL: config.app.baseURL } });
  globalThis.$fetch = $fetch;
  const app = {
    hooks,
    h3App,
    localCall,
    localFetch
  };
  for (const plugin of plugins) {
    plugin(app);
  }
  return app;
}
const nitroApp = createNitroApp();

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const server = cert && key ? new Server({ key, cert }, nitroApp.h3App.nodeHandler) : new Server$1(nitroApp.h3App.nodeHandler);
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const hostname = process.env.NITRO_HOST || process.env.HOST || "0.0.0.0";
server.listen(port, hostname, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  console.log(`Listening on ${protocol}://${hostname}:${port}${useRuntimeConfig().app.baseURL}`);
});
{
  process.on("unhandledRejection", (err) => console.error("[nitro] [dev] [unhandledRejection] " + err));
  process.on("uncaughtException", (err) => console.error("[nitro] [dev] [uncaughtException] " + err));
}
const nodeServer = {};

export { nodeServer as n, useRuntimeConfig as u };
//# sourceMappingURL=node-server.mjs.map
