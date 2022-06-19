import { v as vue_cjs_prod, s as serverRenderer, r as require$$0 } from './renderer.mjs';
import { hasProtocol, isEqual, withBase, withQuery, joinURL } from 'ufo';
import { defineStore, createPinia, setActivePinia } from 'pinia/dist/pinia.mjs';
import { u as useRuntimeConfig$1 } from './node-server.mjs';
import 'h3';
import 'unenv/runtime/mock/proxy';
import 'stream';
import 'node-fetch-native/polyfill';
import 'http';
import 'https';
import 'destr';
import 'ohmyfetch';
import 'radix3';
import 'unenv/runtime/fetch/index';
import 'hookable';
import 'scule';
import 'ohash';
import 'unstorage';
import 'fs';
import 'pathe';
import 'url';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^["{[]|^-?[0-9][0-9.]{0,14}$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor") {
    return;
  }
  return value;
}
function destr(val) {
  if (typeof val !== "string") {
    return val;
  }
  const _lval = val.toLowerCase();
  if (_lval === "true") {
    return true;
  }
  if (_lval === "false") {
    return false;
  }
  if (_lval === "null") {
    return null;
  }
  if (_lval === "nan") {
    return NaN;
  }
  if (_lval === "infinity") {
    return Infinity;
  }
  if (_lval === "undefined") {
    return void 0;
  }
  if (!JsonSigRx.test(val)) {
    return val;
  }
  try {
    if (suspectProtoRx.test(val) || suspectConstructorRx.test(val)) {
      return JSON.parse(val, jsonParseTransform);
    }
    return JSON.parse(val);
  } catch (_e) {
    return val;
  }
}
class FetchError extends Error {
  constructor() {
    super(...arguments);
    this.name = "FetchError";
  }
}
function createFetchError(request, error, response) {
  let message = "";
  if (request && response) {
    message = `${response.status} ${response.statusText} (${request.toString()})`;
  }
  if (error) {
    message = `${error.message} (${message})`;
  }
  const fetchError = new FetchError(message);
  Object.defineProperty(fetchError, "request", { get() {
    return request;
  } });
  Object.defineProperty(fetchError, "response", { get() {
    return response;
  } });
  Object.defineProperty(fetchError, "data", { get() {
    return response && response._data;
  } });
  return fetchError;
}
const payloadMethods = new Set(Object.freeze(["PATCH", "POST", "PUT", "DELETE"]));
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(val) {
  if (val === void 0) {
    return false;
  }
  const t = typeof val;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(val)) {
    return true;
  }
  return val.constructor && val.constructor.name === "Object" || typeof val.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*`\-.^~]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift();
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  409,
  425,
  429,
  500,
  502,
  503,
  504
]);
function createFetch(globalOptions) {
  const { fetch: fetch2, Headers: Headers2 } = globalOptions;
  function onError(ctx) {
    if (ctx.options.retry !== false) {
      const retries = typeof ctx.options.retry === "number" ? ctx.options.retry : isPayloadMethod(ctx.options.method) ? 0 : 1;
      const responseCode = ctx.response && ctx.response.status || 500;
      if (retries > 0 && retryStatusCodes.has(responseCode)) {
        return $fetchRaw(ctx.request, __spreadProps(__spreadValues({}, ctx.options), {
          retry: retries - 1
        }));
      }
    }
    const err = createFetchError(ctx.request, ctx.error, ctx.response);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(err, $fetchRaw);
    }
    throw err;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _opts = {}) {
    const ctx = {
      request: _request,
      options: __spreadValues(__spreadValues({}, globalOptions.defaults), _opts),
      response: void 0,
      error: void 0
    };
    if (ctx.options.onRequest) {
      await ctx.options.onRequest(ctx);
    }
    if (typeof ctx.request === "string") {
      if (ctx.options.baseURL) {
        ctx.request = withBase(ctx.request, ctx.options.baseURL);
      }
      if (ctx.options.params) {
        ctx.request = withQuery(ctx.request, ctx.options.params);
      }
      if (ctx.options.body && isPayloadMethod(ctx.options.method)) {
        if (isJSONSerializable(ctx.options.body)) {
          ctx.options.body = typeof ctx.options.body === "string" ? ctx.options.body : JSON.stringify(ctx.options.body);
          ctx.options.headers = new Headers2(ctx.options.headers);
          if (!ctx.options.headers.has("content-type")) {
            ctx.options.headers.set("content-type", "application/json");
          }
          if (!ctx.options.headers.has("accept")) {
            ctx.options.headers.set("accept", "application/json");
          }
        }
      }
    }
    ctx.response = await fetch2(ctx.request, ctx.options).catch(async (error) => {
      ctx.error = error;
      if (ctx.options.onRequestError) {
        await ctx.options.onRequestError(ctx);
      }
      return onError(ctx);
    });
    const responseType = (ctx.options.parseResponse ? "json" : ctx.options.responseType) || detectResponseType(ctx.response.headers.get("content-type") || "");
    if (responseType === "json") {
      const data = await ctx.response.text();
      const parseFn = ctx.options.parseResponse || destr;
      ctx.response._data = parseFn(data);
    } else {
      ctx.response._data = await ctx.response[responseType]();
    }
    if (ctx.options.onResponse) {
      await ctx.options.onResponse(ctx);
    }
    if (!ctx.response.ok) {
      if (ctx.options.onResponseError) {
        await ctx.options.onResponseError(ctx);
      }
    }
    return ctx.response.ok ? ctx.response : onError(ctx);
  };
  const $fetch2 = function $fetch22(request, opts) {
    return $fetchRaw(request, opts).then((r) => r._data);
  };
  $fetch2.raw = $fetchRaw;
  $fetch2.create = (defaultOptions = {}) => createFetch(__spreadProps(__spreadValues({}, globalOptions), {
    defaults: __spreadValues(__spreadValues({}, globalOptions.defaults), defaultOptions)
  }));
  return $fetch2;
}
const _globalThis$3 = function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
}();
const fetch$1 = _globalThis$3.fetch || (() => Promise.reject(new Error("[ohmyfetch] global.fetch is not supported!")));
const Headers = _globalThis$3.Headers;
const $fetch = createFetch({ fetch: fetch$1, Headers });
const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
function serialCaller(hooks, args) {
  return hooks.reduce((promise, hookFn) => promise.then(() => hookFn.apply(void 0, args)), Promise.resolve(null));
}
function parallelCaller(hooks, args) {
  return Promise.all(hooks.map((hook) => hook.apply(void 0, args)));
}
class Hookable {
  constructor() {
    this._hooks = {};
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, fn) {
    if (!name || typeof fn !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let deprecatedHookObj;
    while (this._deprecatedHooks[name]) {
      const deprecatedHook = this._deprecatedHooks[name];
      if (typeof deprecatedHook === "string") {
        deprecatedHookObj = { to: deprecatedHook };
      } else {
        deprecatedHookObj = deprecatedHook;
      }
      name = deprecatedHookObj.to;
    }
    if (deprecatedHookObj) {
      if (!deprecatedHookObj.message) {
        console.warn(`${originalName} hook has been deprecated` + (deprecatedHookObj.to ? `, please use ${deprecatedHookObj.to}` : ""));
      } else {
        console.warn(deprecatedHookObj.message);
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(fn);
    return () => {
      if (fn) {
        this.removeHook(name, fn);
        fn = null;
      }
    };
  }
  hookOnce(name, fn) {
    let _unreg;
    let _fn = (...args) => {
      _unreg();
      _unreg = null;
      _fn = null;
      return fn(...args);
    };
    _unreg = this.hook(name, _fn);
    return _unreg;
  }
  removeHook(name, fn) {
    if (this._hooks[name]) {
      const idx = this._hooks[name].indexOf(fn);
      if (idx !== -1) {
        this._hooks[name].splice(idx, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = deprecated;
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
    return () => {
      removeFns.splice(0, removeFns.length).forEach((unreg) => unreg());
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  callHook(name, ...args) {
    return serialCaller(this._hooks[name] || [], args);
  }
  callHookParallel(name, ...args) {
    return parallelCaller(this._hooks[name] || [], args);
  }
  callHookWith(caller, name, ...args) {
    return caller(this._hooks[name] || [], args);
  }
}
function createHooks() {
  return new Hookable();
}
function createContext() {
  let currentInstance = null;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  return {
    use: () => currentInstance,
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = null;
      isSingleton = false;
    },
    call: (instance, cb) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return cb();
      } finally {
        if (!isSingleton) {
          currentInstance = null;
        }
      }
    },
    async callAsync(instance, cb) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = cb();
        if (!isSingleton) {
          currentInstance = null;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace() {
  const contexts = {};
  return {
    get(key) {
      if (!contexts[key]) {
        contexts[key] = createContext();
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$2 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey$1 = "__unctx__";
const defaultNamespace = _globalThis$2[globalKey$1] || (_globalThis$2[globalKey$1] = createNamespace());
const getContext = (key) => defaultNamespace.get(key);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis$2[asyncHandlersKey] || (_globalThis$2[asyncHandlersKey] = /* @__PURE__ */ new Set());
function createMock(name, overrides = {}) {
  const fn = function() {
  };
  fn.prototype.name = name;
  const props = {};
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === "caller") {
        return null;
      }
      if (prop === "__createMock__") {
        return createMock;
      }
      if (prop in overrides) {
        return overrides[prop];
      }
      return props[prop] = props[prop] || createMock(`${name}.${prop.toString()}`);
    },
    apply(_target, _this, _args) {
      return createMock(`${name}()`);
    },
    construct(_target, _args, _newT) {
      return createMock(`[${name}]`);
    },
    enumerate(_target) {
      return [];
    }
  });
}
const mockContext = createMock("mock");
function mock(warning) {
  console.warn(warning);
  return mockContext;
}
const unsupported = /* @__PURE__ */ new Set([
  "store",
  "spa",
  "fetchCounters"
]);
const todo = /* @__PURE__ */ new Set([
  "isHMR",
  "base",
  "payload",
  "from",
  "next",
  "error",
  "redirect",
  "redirected",
  "enablePreview",
  "$preview",
  "beforeNuxtRender",
  "beforeSerialize"
]);
const routerKeys = ["route", "params", "query"];
const staticFlags = {
  isClient: false,
  isServer: true,
  isDev: false,
  isStatic: void 0,
  target: "server",
  modern: false
};
const legacyPlugin = (nuxtApp) => {
  nuxtApp._legacyContext = new Proxy(nuxtApp, {
    get(nuxt, p) {
      if (unsupported.has(p)) {
        return mock(`Accessing ${p} is not supported in Nuxt 3.`);
      }
      if (todo.has(p)) {
        return mock(`Accessing ${p} is not yet supported in Nuxt 3.`);
      }
      if (routerKeys.includes(p)) {
        if (!("$router" in nuxtApp)) {
          return mock("vue-router is not being used in this project.");
        }
        switch (p) {
          case "route":
            return nuxt.$router.currentRoute.value;
          case "params":
          case "query":
            return nuxt.$router.currentRoute.value[p];
        }
      }
      if (p === "$config" || p === "env") {
        return useRuntimeConfig();
      }
      if (p in staticFlags) {
        return staticFlags[p];
      }
      if (p === "ssrContext") {
        return nuxt._legacyContext;
      }
      if (nuxt.ssrContext && p in nuxt.ssrContext) {
        return nuxt.ssrContext[p];
      }
      if (p === "nuxt") {
        return nuxt.payload;
      }
      if (p === "nuxtState") {
        return nuxt.payload.data;
      }
      if (p in nuxtApp.vueApp) {
        return nuxtApp.vueApp[p];
      }
      if (p in nuxtApp) {
        return nuxtApp[p];
      }
      return mock(`Accessing ${p} is not supported in Nuxt3.`);
    }
  });
};
const nuxtAppCtx = getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  const nuxtApp = __spreadValues({
    provide: void 0,
    globalName: "nuxt",
    payload: vue_cjs_prod.reactive(__spreadValues({
      data: {},
      state: {},
      _errors: {}
    }, { serverRendered: true })),
    isHydrating: false,
    _asyncDataPromises: {}
  }, options);
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  if (nuxtApp.ssrContext) {
    nuxtApp.ssrContext.nuxt = nuxtApp;
  }
  {
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    nuxtApp.ssrContext.payload = nuxtApp.payload;
  }
  {
    nuxtApp.payload.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  const compatibilityConfig = new Proxy(runtimeConfig, {
    get(target, prop) {
      var _a2;
      if (prop === "public") {
        return target.public;
      }
      return (_a2 = target[prop]) != null ? _a2 : target.public[prop];
    },
    set(target, prop, value) {
      {
        return false;
      }
    }
  });
  nuxtApp.provide("config", compatibilityConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin !== "function") {
    return;
  }
  const { provide: provide2 } = await callWithNuxt(nuxtApp, plugin, [nuxtApp]) || {};
  if (provide2 && typeof provide2 === "object") {
    for (const key in provide2) {
      nuxtApp.provide(key, provide2[key]);
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  for (const plugin of plugins2) {
    await applyPlugin(nuxtApp, plugin);
  }
}
function normalizePlugins(_plugins2) {
  let needsLegacyContext = false;
  const plugins2 = _plugins2.map((plugin) => {
    if (typeof plugin !== "function") {
      return () => {
      };
    }
    if (isLegacyPlugin(plugin)) {
      needsLegacyContext = true;
      return (nuxtApp) => plugin(nuxtApp._legacyContext, nuxtApp.provide);
    }
    return plugin;
  });
  if (needsLegacyContext) {
    plugins2.unshift(legacyPlugin);
  }
  return plugins2;
}
function defineNuxtPlugin(plugin) {
  plugin[NuxtPluginIndicator] = true;
  return plugin;
}
function isLegacyPlugin(plugin) {
  return !plugin[NuxtPluginIndicator];
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxtAppCtx.callAsync(nuxt, fn);
  }
}
function useNuxtApp() {
  const vm = vue_cjs_prod.getCurrentInstance();
  if (!vm) {
    const nuxtAppInstance = nuxtAppCtx.use();
    if (!nuxtAppInstance) {
      throw new Error("nuxt instance unavailable");
    }
    return nuxtAppInstance;
  }
  return vm.appContext.app.$nuxt;
}
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var vueRouter_cjs_prod = {};
/*!
  * vue-router v4.0.16
  * (c) 2022 Eduardo San Martin Morote
  * @license MIT
  */
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var vue = require$$0;
  const hasSymbol2 = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
  const PolySymbol = (name) => hasSymbol2 ? Symbol(name) : "_vr_" + name;
  const matchedRouteKey = /* @__PURE__ */ PolySymbol("rvlm");
  const viewDepthKey = /* @__PURE__ */ PolySymbol("rvd");
  const routerKey = /* @__PURE__ */ PolySymbol("r");
  const routeLocationKey = /* @__PURE__ */ PolySymbol("rl");
  const routerViewLocationKey = /* @__PURE__ */ PolySymbol("rvl");
  function isESModule(obj) {
    return obj.__esModule || hasSymbol2 && obj[Symbol.toStringTag] === "Module";
  }
  const assign2 = Object.assign;
  function applyToParams(fn, params) {
    const newParams = {};
    for (const key in params) {
      const value = params[key];
      newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value);
    }
    return newParams;
  }
  const noop = () => {
  };
  const TRAILING_SLASH_RE = /\/$/;
  const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, "");
  function parseURL(parseQuery2, location2, currentLocation = "/") {
    let path, query = {}, searchString = "", hash = "";
    const searchPos = location2.indexOf("?");
    const hashPos = location2.indexOf("#", searchPos > -1 ? searchPos : 0);
    if (searchPos > -1) {
      path = location2.slice(0, searchPos);
      searchString = location2.slice(searchPos + 1, hashPos > -1 ? hashPos : location2.length);
      query = parseQuery2(searchString);
    }
    if (hashPos > -1) {
      path = path || location2.slice(0, hashPos);
      hash = location2.slice(hashPos, location2.length);
    }
    path = resolveRelativePath(path != null ? path : location2, currentLocation);
    return {
      fullPath: path + (searchString && "?") + searchString + hash,
      path,
      query,
      hash
    };
  }
  function stringifyURL(stringifyQuery2, location2) {
    const query = location2.query ? stringifyQuery2(location2.query) : "";
    return location2.path + (query && "?") + query + (location2.hash || "");
  }
  function stripBase(pathname, base) {
    if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
      return pathname;
    return pathname.slice(base.length) || "/";
  }
  function isSameRouteLocation(stringifyQuery2, a, b) {
    const aLastIndex = a.matched.length - 1;
    const bLastIndex = b.matched.length - 1;
    return aLastIndex > -1 && aLastIndex === bLastIndex && isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) && isSameRouteLocationParams(a.params, b.params) && stringifyQuery2(a.query) === stringifyQuery2(b.query) && a.hash === b.hash;
  }
  function isSameRouteRecord(a, b) {
    return (a.aliasOf || a) === (b.aliasOf || b);
  }
  function isSameRouteLocationParams(a, b) {
    if (Object.keys(a).length !== Object.keys(b).length)
      return false;
    for (const key in a) {
      if (!isSameRouteLocationParamsValue(a[key], b[key]))
        return false;
    }
    return true;
  }
  function isSameRouteLocationParamsValue(a, b) {
    return Array.isArray(a) ? isEquivalentArray(a, b) : Array.isArray(b) ? isEquivalentArray(b, a) : a === b;
  }
  function isEquivalentArray(a, b) {
    return Array.isArray(b) ? a.length === b.length && a.every((value, i) => value === b[i]) : a.length === 1 && a[0] === b;
  }
  function resolveRelativePath(to, from) {
    if (to.startsWith("/"))
      return to;
    if (!to)
      return from;
    const fromSegments = from.split("/");
    const toSegments = to.split("/");
    let position = fromSegments.length - 1;
    let toPosition;
    let segment;
    for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
      segment = toSegments[toPosition];
      if (position === 1 || segment === ".")
        continue;
      if (segment === "..")
        position--;
      else
        break;
    }
    return fromSegments.slice(0, position).join("/") + "/" + toSegments.slice(toPosition - (toPosition === toSegments.length ? 1 : 0)).join("/");
  }
  var NavigationType;
  (function(NavigationType2) {
    NavigationType2["pop"] = "pop";
    NavigationType2["push"] = "push";
  })(NavigationType || (NavigationType = {}));
  var NavigationDirection;
  (function(NavigationDirection2) {
    NavigationDirection2["back"] = "back";
    NavigationDirection2["forward"] = "forward";
    NavigationDirection2["unknown"] = "";
  })(NavigationDirection || (NavigationDirection = {}));
  const START = "";
  function normalizeBase(base) {
    if (!base) {
      {
        base = "/";
      }
    }
    if (base[0] !== "/" && base[0] !== "#")
      base = "/" + base;
    return removeTrailingSlash(base);
  }
  const BEFORE_HASH_RE = /^[^#]+#/;
  function createHref(base, location2) {
    return base.replace(BEFORE_HASH_RE, "#") + location2;
  }
  const computeScrollPosition = () => ({
    left: window.pageXOffset,
    top: window.pageYOffset
  });
  let createBaseLocation = () => location.protocol + "//" + location.host;
  function createCurrentLocation(base, location2) {
    const { pathname, search, hash } = location2;
    const hashPos = base.indexOf("#");
    if (hashPos > -1) {
      let slicePos = hash.includes(base.slice(hashPos)) ? base.slice(hashPos).length : 1;
      let pathFromHash = hash.slice(slicePos);
      if (pathFromHash[0] !== "/")
        pathFromHash = "/" + pathFromHash;
      return stripBase(pathFromHash, "");
    }
    const path = stripBase(pathname, base);
    return path + search + hash;
  }
  function useHistoryListeners(base, historyState, currentLocation, replace) {
    let listeners = [];
    let teardowns = [];
    let pauseState = null;
    const popStateHandler = ({ state }) => {
      const to = createCurrentLocation(base, location);
      const from = currentLocation.value;
      const fromState = historyState.value;
      let delta = 0;
      if (state) {
        currentLocation.value = to;
        historyState.value = state;
        if (pauseState && pauseState === from) {
          pauseState = null;
          return;
        }
        delta = fromState ? state.position - fromState.position : 0;
      } else {
        replace(to);
      }
      listeners.forEach((listener) => {
        listener(currentLocation.value, from, {
          delta,
          type: NavigationType.pop,
          direction: delta ? delta > 0 ? NavigationDirection.forward : NavigationDirection.back : NavigationDirection.unknown
        });
      });
    };
    function pauseListeners() {
      pauseState = currentLocation.value;
    }
    function listen(callback) {
      listeners.push(callback);
      const teardown = () => {
        const index2 = listeners.indexOf(callback);
        if (index2 > -1)
          listeners.splice(index2, 1);
      };
      teardowns.push(teardown);
      return teardown;
    }
    function beforeUnloadListener() {
      const { history: history2 } = window;
      if (!history2.state)
        return;
      history2.replaceState(assign2({}, history2.state, { scroll: computeScrollPosition() }), "");
    }
    function destroy() {
      for (const teardown of teardowns)
        teardown();
      teardowns = [];
      window.removeEventListener("popstate", popStateHandler);
      window.removeEventListener("beforeunload", beforeUnloadListener);
    }
    window.addEventListener("popstate", popStateHandler);
    window.addEventListener("beforeunload", beforeUnloadListener);
    return {
      pauseListeners,
      listen,
      destroy
    };
  }
  function buildState(back, current, forward, replaced = false, computeScroll = false) {
    return {
      back,
      current,
      forward,
      replaced,
      position: window.history.length,
      scroll: computeScroll ? computeScrollPosition() : null
    };
  }
  function useHistoryStateNavigation(base) {
    const { history: history2, location: location2 } = window;
    const currentLocation = {
      value: createCurrentLocation(base, location2)
    };
    const historyState = { value: history2.state };
    if (!historyState.value) {
      changeLocation(currentLocation.value, {
        back: null,
        current: currentLocation.value,
        forward: null,
        position: history2.length - 1,
        replaced: true,
        scroll: null
      }, true);
    }
    function changeLocation(to, state, replace2) {
      const hashIndex = base.indexOf("#");
      const url = hashIndex > -1 ? (location2.host && document.querySelector("base") ? base : base.slice(hashIndex)) + to : createBaseLocation() + base + to;
      try {
        history2[replace2 ? "replaceState" : "pushState"](state, "", url);
        historyState.value = state;
      } catch (err) {
        {
          console.error(err);
        }
        location2[replace2 ? "replace" : "assign"](url);
      }
    }
    function replace(to, data) {
      const state = assign2({}, history2.state, buildState(historyState.value.back, to, historyState.value.forward, true), data, { position: historyState.value.position });
      changeLocation(to, state, true);
      currentLocation.value = to;
    }
    function push(to, data) {
      const currentState = assign2({}, historyState.value, history2.state, {
        forward: to,
        scroll: computeScrollPosition()
      });
      changeLocation(currentState.current, currentState, true);
      const state = assign2({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data);
      changeLocation(to, state, false);
      currentLocation.value = to;
    }
    return {
      location: currentLocation,
      state: historyState,
      push,
      replace
    };
  }
  function createWebHistory(base) {
    base = normalizeBase(base);
    const historyNavigation = useHistoryStateNavigation(base);
    const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
    function go(delta, triggerListeners = true) {
      if (!triggerListeners)
        historyListeners.pauseListeners();
      history.go(delta);
    }
    const routerHistory = assign2({
      location: "",
      base,
      go,
      createHref: createHref.bind(null, base)
    }, historyNavigation, historyListeners);
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => historyNavigation.location.value
    });
    Object.defineProperty(routerHistory, "state", {
      enumerable: true,
      get: () => historyNavigation.state.value
    });
    return routerHistory;
  }
  function createMemoryHistory(base = "") {
    let listeners = [];
    let queue = [START];
    let position = 0;
    base = normalizeBase(base);
    function setLocation(location2) {
      position++;
      if (position === queue.length) {
        queue.push(location2);
      } else {
        queue.splice(position);
        queue.push(location2);
      }
    }
    function triggerListeners(to, from, { direction, delta }) {
      const info = {
        direction,
        delta,
        type: NavigationType.pop
      };
      for (const callback of listeners) {
        callback(to, from, info);
      }
    }
    const routerHistory = {
      location: START,
      state: {},
      base,
      createHref: createHref.bind(null, base),
      replace(to) {
        queue.splice(position--, 1);
        setLocation(to);
      },
      push(to, data) {
        setLocation(to);
      },
      listen(callback) {
        listeners.push(callback);
        return () => {
          const index2 = listeners.indexOf(callback);
          if (index2 > -1)
            listeners.splice(index2, 1);
        };
      },
      destroy() {
        listeners = [];
        queue = [START];
        position = 0;
      },
      go(delta, shouldTrigger = true) {
        const from = this.location;
        const direction = delta < 0 ? NavigationDirection.back : NavigationDirection.forward;
        position = Math.max(0, Math.min(position + delta, queue.length - 1));
        if (shouldTrigger) {
          triggerListeners(this.location, from, {
            direction,
            delta
          });
        }
      }
    };
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => queue[position]
    });
    return routerHistory;
  }
  function createWebHashHistory(base) {
    base = location.host ? base || location.pathname + location.search : "";
    if (!base.includes("#"))
      base += "#";
    return createWebHistory(base);
  }
  function isRouteLocation(route) {
    return typeof route === "string" || route && typeof route === "object";
  }
  function isRouteName(name) {
    return typeof name === "string" || typeof name === "symbol";
  }
  const START_LOCATION_NORMALIZED = {
    path: "/",
    name: void 0,
    params: {},
    query: {},
    hash: "",
    fullPath: "/",
    matched: [],
    meta: {},
    redirectedFrom: void 0
  };
  const NavigationFailureSymbol = /* @__PURE__ */ PolySymbol("nf");
  exports.NavigationFailureType = void 0;
  (function(NavigationFailureType) {
    NavigationFailureType[NavigationFailureType["aborted"] = 4] = "aborted";
    NavigationFailureType[NavigationFailureType["cancelled"] = 8] = "cancelled";
    NavigationFailureType[NavigationFailureType["duplicated"] = 16] = "duplicated";
  })(exports.NavigationFailureType || (exports.NavigationFailureType = {}));
  const ErrorTypeMessages = {
    [1]({ location: location2, currentLocation }) {
      return `No match for
 ${JSON.stringify(location2)}${currentLocation ? "\nwhile being at\n" + JSON.stringify(currentLocation) : ""}`;
    },
    [2]({ from, to }) {
      return `Redirected from "${from.fullPath}" to "${stringifyRoute(to)}" via a navigation guard.`;
    },
    [4]({ from, to }) {
      return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`;
    },
    [8]({ from, to }) {
      return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`;
    },
    [16]({ from, to }) {
      return `Avoided redundant navigation to current location: "${from.fullPath}".`;
    }
  };
  function createRouterError(type, params) {
    {
      return assign2(new Error(ErrorTypeMessages[type](params)), {
        type,
        [NavigationFailureSymbol]: true
      }, params);
    }
  }
  function isNavigationFailure(error, type) {
    return error instanceof Error && NavigationFailureSymbol in error && (type == null || !!(error.type & type));
  }
  const propertiesToLog = ["params", "query", "hash"];
  function stringifyRoute(to) {
    if (typeof to === "string")
      return to;
    if ("path" in to)
      return to.path;
    const location2 = {};
    for (const key of propertiesToLog) {
      if (key in to)
        location2[key] = to[key];
    }
    return JSON.stringify(location2, null, 2);
  }
  const BASE_PARAM_PATTERN = "[^/]+?";
  const BASE_PATH_PARSER_OPTIONS = {
    sensitive: false,
    strict: false,
    start: true,
    end: true
  };
  const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
  function tokensToParser(segments, extraOptions) {
    const options = assign2({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
    const score = [];
    let pattern = options.start ? "^" : "";
    const keys = [];
    for (const segment of segments) {
      const segmentScores = segment.length ? [] : [90];
      if (options.strict && !segment.length)
        pattern += "/";
      for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
        const token = segment[tokenIndex];
        let subSegmentScore = 40 + (options.sensitive ? 0.25 : 0);
        if (token.type === 0) {
          if (!tokenIndex)
            pattern += "/";
          pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
          subSegmentScore += 40;
        } else if (token.type === 1) {
          const { value, repeatable, optional, regexp } = token;
          keys.push({
            name: value,
            repeatable,
            optional
          });
          const re2 = regexp ? regexp : BASE_PARAM_PATTERN;
          if (re2 !== BASE_PARAM_PATTERN) {
            subSegmentScore += 10;
            try {
              new RegExp(`(${re2})`);
            } catch (err) {
              throw new Error(`Invalid custom RegExp for param "${value}" (${re2}): ` + err.message);
            }
          }
          let subPattern = repeatable ? `((?:${re2})(?:/(?:${re2}))*)` : `(${re2})`;
          if (!tokenIndex)
            subPattern = optional && segment.length < 2 ? `(?:/${subPattern})` : "/" + subPattern;
          if (optional)
            subPattern += "?";
          pattern += subPattern;
          subSegmentScore += 20;
          if (optional)
            subSegmentScore += -8;
          if (repeatable)
            subSegmentScore += -20;
          if (re2 === ".*")
            subSegmentScore += -50;
        }
        segmentScores.push(subSegmentScore);
      }
      score.push(segmentScores);
    }
    if (options.strict && options.end) {
      const i = score.length - 1;
      score[i][score[i].length - 1] += 0.7000000000000001;
    }
    if (!options.strict)
      pattern += "/?";
    if (options.end)
      pattern += "$";
    else if (options.strict)
      pattern += "(?:/|$)";
    const re = new RegExp(pattern, options.sensitive ? "" : "i");
    function parse2(path) {
      const match = path.match(re);
      const params = {};
      if (!match)
        return null;
      for (let i = 1; i < match.length; i++) {
        const value = match[i] || "";
        const key = keys[i - 1];
        params[key.name] = value && key.repeatable ? value.split("/") : value;
      }
      return params;
    }
    function stringify(params) {
      let path = "";
      let avoidDuplicatedSlash = false;
      for (const segment of segments) {
        if (!avoidDuplicatedSlash || !path.endsWith("/"))
          path += "/";
        avoidDuplicatedSlash = false;
        for (const token of segment) {
          if (token.type === 0) {
            path += token.value;
          } else if (token.type === 1) {
            const { value, repeatable, optional } = token;
            const param = value in params ? params[value] : "";
            if (Array.isArray(param) && !repeatable)
              throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
            const text = Array.isArray(param) ? param.join("/") : param;
            if (!text) {
              if (optional) {
                if (segment.length < 2 && segments.length > 1) {
                  if (path.endsWith("/"))
                    path = path.slice(0, -1);
                  else
                    avoidDuplicatedSlash = true;
                }
              } else
                throw new Error(`Missing required param "${value}"`);
            }
            path += text;
          }
        }
      }
      return path;
    }
    return {
      re,
      score,
      keys,
      parse: parse2,
      stringify
    };
  }
  function compareScoreArray(a, b) {
    let i = 0;
    while (i < a.length && i < b.length) {
      const diff = b[i] - a[i];
      if (diff)
        return diff;
      i++;
    }
    if (a.length < b.length) {
      return a.length === 1 && a[0] === 40 + 40 ? -1 : 1;
    } else if (a.length > b.length) {
      return b.length === 1 && b[0] === 40 + 40 ? 1 : -1;
    }
    return 0;
  }
  function comparePathParserScore(a, b) {
    let i = 0;
    const aScore = a.score;
    const bScore = b.score;
    while (i < aScore.length && i < bScore.length) {
      const comp = compareScoreArray(aScore[i], bScore[i]);
      if (comp)
        return comp;
      i++;
    }
    if (Math.abs(bScore.length - aScore.length) === 1) {
      if (isLastScoreNegative(aScore))
        return 1;
      if (isLastScoreNegative(bScore))
        return -1;
    }
    return bScore.length - aScore.length;
  }
  function isLastScoreNegative(score) {
    const last = score[score.length - 1];
    return score.length > 0 && last[last.length - 1] < 0;
  }
  const ROOT_TOKEN = {
    type: 0,
    value: ""
  };
  const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
  function tokenizePath(path) {
    if (!path)
      return [[]];
    if (path === "/")
      return [[ROOT_TOKEN]];
    if (!path.startsWith("/")) {
      throw new Error(`Invalid path "${path}"`);
    }
    function crash(message) {
      throw new Error(`ERR (${state})/"${buffer}": ${message}`);
    }
    let state = 0;
    let previousState = state;
    const tokens = [];
    let segment;
    function finalizeSegment() {
      if (segment)
        tokens.push(segment);
      segment = [];
    }
    let i = 0;
    let char;
    let buffer = "";
    let customRe = "";
    function consumeBuffer() {
      if (!buffer)
        return;
      if (state === 0) {
        segment.push({
          type: 0,
          value: buffer
        });
      } else if (state === 1 || state === 2 || state === 3) {
        if (segment.length > 1 && (char === "*" || char === "+"))
          crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
        segment.push({
          type: 1,
          value: buffer,
          regexp: customRe,
          repeatable: char === "*" || char === "+",
          optional: char === "*" || char === "?"
        });
      } else {
        crash("Invalid state to consume buffer");
      }
      buffer = "";
    }
    function addCharToBuffer() {
      buffer += char;
    }
    while (i < path.length) {
      char = path[i++];
      if (char === "\\" && state !== 2) {
        previousState = state;
        state = 4;
        continue;
      }
      switch (state) {
        case 0:
          if (char === "/") {
            if (buffer) {
              consumeBuffer();
            }
            finalizeSegment();
          } else if (char === ":") {
            consumeBuffer();
            state = 1;
          } else {
            addCharToBuffer();
          }
          break;
        case 4:
          addCharToBuffer();
          state = previousState;
          break;
        case 1:
          if (char === "(") {
            state = 2;
          } else if (VALID_PARAM_RE.test(char)) {
            addCharToBuffer();
          } else {
            consumeBuffer();
            state = 0;
            if (char !== "*" && char !== "?" && char !== "+")
              i--;
          }
          break;
        case 2:
          if (char === ")") {
            if (customRe[customRe.length - 1] == "\\")
              customRe = customRe.slice(0, -1) + char;
            else
              state = 3;
          } else {
            customRe += char;
          }
          break;
        case 3:
          consumeBuffer();
          state = 0;
          if (char !== "*" && char !== "?" && char !== "+")
            i--;
          customRe = "";
          break;
        default:
          crash("Unknown state");
          break;
      }
    }
    if (state === 2)
      crash(`Unfinished custom RegExp for param "${buffer}"`);
    consumeBuffer();
    finalizeSegment();
    return tokens;
  }
  function createRouteRecordMatcher(record, parent, options) {
    const parser = tokensToParser(tokenizePath(record.path), options);
    const matcher = assign2(parser, {
      record,
      parent,
      children: [],
      alias: []
    });
    if (parent) {
      if (!matcher.record.aliasOf === !parent.record.aliasOf)
        parent.children.push(matcher);
    }
    return matcher;
  }
  function createRouterMatcher(routes2, globalOptions) {
    const matchers = [];
    const matcherMap = /* @__PURE__ */ new Map();
    globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions);
    function getRecordMatcher(name) {
      return matcherMap.get(name);
    }
    function addRoute(record, parent, originalRecord) {
      const isRootAdd = !originalRecord;
      const mainNormalizedRecord = normalizeRouteRecord(record);
      mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
      const options = mergeOptions(globalOptions, record);
      const normalizedRecords = [
        mainNormalizedRecord
      ];
      if ("alias" in record) {
        const aliases = typeof record.alias === "string" ? [record.alias] : record.alias;
        for (const alias of aliases) {
          normalizedRecords.push(assign2({}, mainNormalizedRecord, {
            components: originalRecord ? originalRecord.record.components : mainNormalizedRecord.components,
            path: alias,
            aliasOf: originalRecord ? originalRecord.record : mainNormalizedRecord
          }));
        }
      }
      let matcher;
      let originalMatcher;
      for (const normalizedRecord of normalizedRecords) {
        const { path } = normalizedRecord;
        if (parent && path[0] !== "/") {
          const parentPath = parent.record.path;
          const connectingSlash = parentPath[parentPath.length - 1] === "/" ? "" : "/";
          normalizedRecord.path = parent.record.path + (path && connectingSlash + path);
        }
        matcher = createRouteRecordMatcher(normalizedRecord, parent, options);
        if (originalRecord) {
          originalRecord.alias.push(matcher);
        } else {
          originalMatcher = originalMatcher || matcher;
          if (originalMatcher !== matcher)
            originalMatcher.alias.push(matcher);
          if (isRootAdd && record.name && !isAliasRecord(matcher))
            removeRoute(record.name);
        }
        if ("children" in mainNormalizedRecord) {
          const children = mainNormalizedRecord.children;
          for (let i = 0; i < children.length; i++) {
            addRoute(children[i], matcher, originalRecord && originalRecord.children[i]);
          }
        }
        originalRecord = originalRecord || matcher;
        insertMatcher(matcher);
      }
      return originalMatcher ? () => {
        removeRoute(originalMatcher);
      } : noop;
    }
    function removeRoute(matcherRef) {
      if (isRouteName(matcherRef)) {
        const matcher = matcherMap.get(matcherRef);
        if (matcher) {
          matcherMap.delete(matcherRef);
          matchers.splice(matchers.indexOf(matcher), 1);
          matcher.children.forEach(removeRoute);
          matcher.alias.forEach(removeRoute);
        }
      } else {
        const index2 = matchers.indexOf(matcherRef);
        if (index2 > -1) {
          matchers.splice(index2, 1);
          if (matcherRef.record.name)
            matcherMap.delete(matcherRef.record.name);
          matcherRef.children.forEach(removeRoute);
          matcherRef.alias.forEach(removeRoute);
        }
      }
    }
    function getRoutes() {
      return matchers;
    }
    function insertMatcher(matcher) {
      let i = 0;
      while (i < matchers.length && comparePathParserScore(matcher, matchers[i]) >= 0 && (matcher.record.path !== matchers[i].record.path || !isRecordChildOf(matcher, matchers[i])))
        i++;
      matchers.splice(i, 0, matcher);
      if (matcher.record.name && !isAliasRecord(matcher))
        matcherMap.set(matcher.record.name, matcher);
    }
    function resolve(location2, currentLocation) {
      let matcher;
      let params = {};
      let path;
      let name;
      if ("name" in location2 && location2.name) {
        matcher = matcherMap.get(location2.name);
        if (!matcher)
          throw createRouterError(1, {
            location: location2
          });
        name = matcher.record.name;
        params = assign2(paramsFromLocation(currentLocation.params, matcher.keys.filter((k) => !k.optional).map((k) => k.name)), location2.params);
        path = matcher.stringify(params);
      } else if ("path" in location2) {
        path = location2.path;
        matcher = matchers.find((m) => m.re.test(path));
        if (matcher) {
          params = matcher.parse(path);
          name = matcher.record.name;
        }
      } else {
        matcher = currentLocation.name ? matcherMap.get(currentLocation.name) : matchers.find((m) => m.re.test(currentLocation.path));
        if (!matcher)
          throw createRouterError(1, {
            location: location2,
            currentLocation
          });
        name = matcher.record.name;
        params = assign2({}, currentLocation.params, location2.params);
        path = matcher.stringify(params);
      }
      const matched = [];
      let parentMatcher = matcher;
      while (parentMatcher) {
        matched.unshift(parentMatcher.record);
        parentMatcher = parentMatcher.parent;
      }
      return {
        name,
        path,
        params,
        matched,
        meta: mergeMetaFields(matched)
      };
    }
    routes2.forEach((route) => addRoute(route));
    return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher };
  }
  function paramsFromLocation(params, keys) {
    const newParams = {};
    for (const key of keys) {
      if (key in params)
        newParams[key] = params[key];
    }
    return newParams;
  }
  function normalizeRouteRecord(record) {
    return {
      path: record.path,
      redirect: record.redirect,
      name: record.name,
      meta: record.meta || {},
      aliasOf: void 0,
      beforeEnter: record.beforeEnter,
      props: normalizeRecordProps(record),
      children: record.children || [],
      instances: {},
      leaveGuards: /* @__PURE__ */ new Set(),
      updateGuards: /* @__PURE__ */ new Set(),
      enterCallbacks: {},
      components: "components" in record ? record.components || {} : { default: record.component }
    };
  }
  function normalizeRecordProps(record) {
    const propsObject = {};
    const props = record.props || false;
    if ("component" in record) {
      propsObject.default = props;
    } else {
      for (const name in record.components)
        propsObject[name] = typeof props === "boolean" ? props : props[name];
    }
    return propsObject;
  }
  function isAliasRecord(record) {
    while (record) {
      if (record.record.aliasOf)
        return true;
      record = record.parent;
    }
    return false;
  }
  function mergeMetaFields(matched) {
    return matched.reduce((meta2, record) => assign2(meta2, record.meta), {});
  }
  function mergeOptions(defaults, partialOptions) {
    const options = {};
    for (const key in defaults) {
      options[key] = key in partialOptions ? partialOptions[key] : defaults[key];
    }
    return options;
  }
  function isRecordChildOf(record, parent) {
    return parent.children.some((child) => child === record || isRecordChildOf(record, child));
  }
  const HASH_RE = /#/g;
  const AMPERSAND_RE = /&/g;
  const SLASH_RE = /\//g;
  const EQUAL_RE = /=/g;
  const IM_RE = /\?/g;
  const PLUS_RE = /\+/g;
  const ENC_BRACKET_OPEN_RE = /%5B/g;
  const ENC_BRACKET_CLOSE_RE = /%5D/g;
  const ENC_CARET_RE = /%5E/g;
  const ENC_BACKTICK_RE = /%60/g;
  const ENC_CURLY_OPEN_RE = /%7B/g;
  const ENC_PIPE_RE = /%7C/g;
  const ENC_CURLY_CLOSE_RE = /%7D/g;
  const ENC_SPACE_RE = /%20/g;
  function commonEncode(text) {
    return encodeURI("" + text).replace(ENC_PIPE_RE, "|").replace(ENC_BRACKET_OPEN_RE, "[").replace(ENC_BRACKET_CLOSE_RE, "]");
  }
  function encodeHash(text) {
    return commonEncode(text).replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryValue(text) {
    return commonEncode(text).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryKey(text) {
    return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
  }
  function encodePath(text) {
    return commonEncode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F");
  }
  function encodeParam(text) {
    return text == null ? "" : encodePath(text).replace(SLASH_RE, "%2F");
  }
  function decode2(text) {
    try {
      return decodeURIComponent("" + text);
    } catch (err) {
    }
    return "" + text;
  }
  function parseQuery(search) {
    const query = {};
    if (search === "" || search === "?")
      return query;
    const hasLeadingIM = search[0] === "?";
    const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
    for (let i = 0; i < searchParams.length; ++i) {
      const searchParam = searchParams[i].replace(PLUS_RE, " ");
      const eqPos = searchParam.indexOf("=");
      const key = decode2(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
      const value = eqPos < 0 ? null : decode2(searchParam.slice(eqPos + 1));
      if (key in query) {
        let currentValue = query[key];
        if (!Array.isArray(currentValue)) {
          currentValue = query[key] = [currentValue];
        }
        currentValue.push(value);
      } else {
        query[key] = value;
      }
    }
    return query;
  }
  function stringifyQuery(query) {
    let search = "";
    for (let key in query) {
      const value = query[key];
      key = encodeQueryKey(key);
      if (value == null) {
        if (value !== void 0) {
          search += (search.length ? "&" : "") + key;
        }
        continue;
      }
      const values = Array.isArray(value) ? value.map((v2) => v2 && encodeQueryValue(v2)) : [value && encodeQueryValue(value)];
      values.forEach((value2) => {
        if (value2 !== void 0) {
          search += (search.length ? "&" : "") + key;
          if (value2 != null)
            search += "=" + value2;
        }
      });
    }
    return search;
  }
  function normalizeQuery(query) {
    const normalizedQuery = {};
    for (const key in query) {
      const value = query[key];
      if (value !== void 0) {
        normalizedQuery[key] = Array.isArray(value) ? value.map((v2) => v2 == null ? null : "" + v2) : value == null ? value : "" + value;
      }
    }
    return normalizedQuery;
  }
  function useCallbacks() {
    let handlers2 = [];
    function add(handler) {
      handlers2.push(handler);
      return () => {
        const i = handlers2.indexOf(handler);
        if (i > -1)
          handlers2.splice(i, 1);
      };
    }
    function reset() {
      handlers2 = [];
    }
    return {
      add,
      list: () => handlers2,
      reset
    };
  }
  function registerGuard(record, name, guard) {
    const removeFromList = () => {
      record[name].delete(guard);
    };
    vue.onUnmounted(removeFromList);
    vue.onDeactivated(removeFromList);
    vue.onActivated(() => {
      record[name].add(guard);
    });
    record[name].add(guard);
  }
  function onBeforeRouteLeave(leaveGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "leaveGuards", leaveGuard);
  }
  function onBeforeRouteUpdate(updateGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "updateGuards", updateGuard);
  }
  function guardToPromiseFn(guard, to, from, record, name) {
    const enterCallbackArray = record && (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
    return () => new Promise((resolve, reject) => {
      const next = (valid) => {
        if (valid === false)
          reject(createRouterError(4, {
            from,
            to
          }));
        else if (valid instanceof Error) {
          reject(valid);
        } else if (isRouteLocation(valid)) {
          reject(createRouterError(2, {
            from: to,
            to: valid
          }));
        } else {
          if (enterCallbackArray && record.enterCallbacks[name] === enterCallbackArray && typeof valid === "function")
            enterCallbackArray.push(valid);
          resolve();
        }
      };
      const guardReturn = guard.call(record && record.instances[name], to, from, next);
      let guardCall = Promise.resolve(guardReturn);
      if (guard.length < 3)
        guardCall = guardCall.then(next);
      guardCall.catch((err) => reject(err));
    });
  }
  function extractComponentsGuards(matched, guardType, to, from) {
    const guards = [];
    for (const record of matched) {
      for (const name in record.components) {
        let rawComponent = record.components[name];
        if (guardType !== "beforeRouteEnter" && !record.instances[name])
          continue;
        if (isRouteComponent(rawComponent)) {
          const options = rawComponent.__vccOpts || rawComponent;
          const guard = options[guardType];
          guard && guards.push(guardToPromiseFn(guard, to, from, record, name));
        } else {
          let componentPromise = rawComponent();
          guards.push(() => componentPromise.then((resolved) => {
            if (!resolved)
              return Promise.reject(new Error(`Couldn't resolve component "${name}" at "${record.path}"`));
            const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
            record.components[name] = resolvedComponent;
            const options = resolvedComponent.__vccOpts || resolvedComponent;
            const guard = options[guardType];
            return guard && guardToPromiseFn(guard, to, from, record, name)();
          }));
        }
      }
    }
    return guards;
  }
  function isRouteComponent(component) {
    return typeof component === "object" || "displayName" in component || "props" in component || "__vccOpts" in component;
  }
  function useLink(props) {
    const router = vue.inject(routerKey);
    const currentRoute = vue.inject(routeLocationKey);
    const route = vue.computed(() => router.resolve(vue.unref(props.to)));
    const activeRecordIndex = vue.computed(() => {
      const { matched } = route.value;
      const { length } = matched;
      const routeMatched = matched[length - 1];
      const currentMatched = currentRoute.matched;
      if (!routeMatched || !currentMatched.length)
        return -1;
      const index2 = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
      if (index2 > -1)
        return index2;
      const parentRecordPath = getOriginalPath(matched[length - 2]);
      return length > 1 && getOriginalPath(routeMatched) === parentRecordPath && currentMatched[currentMatched.length - 1].path !== parentRecordPath ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2])) : index2;
    });
    const isActive = vue.computed(() => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params));
    const isExactActive = vue.computed(() => activeRecordIndex.value > -1 && activeRecordIndex.value === currentRoute.matched.length - 1 && isSameRouteLocationParams(currentRoute.params, route.value.params));
    function navigate(e = {}) {
      if (guardEvent(e)) {
        return router[vue.unref(props.replace) ? "replace" : "push"](vue.unref(props.to)).catch(noop);
      }
      return Promise.resolve();
    }
    return {
      route,
      href: vue.computed(() => route.value.href),
      isActive,
      isExactActive,
      navigate
    };
  }
  const RouterLinkImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterLink",
    compatConfig: { MODE: 3 },
    props: {
      to: {
        type: [String, Object],
        required: true
      },
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      custom: Boolean,
      ariaCurrentValue: {
        type: String,
        default: "page"
      }
    },
    useLink,
    setup(props, { slots }) {
      const link = vue.reactive(useLink(props));
      const { options } = vue.inject(routerKey);
      const elClass = vue.computed(() => ({
        [getLinkClass(props.activeClass, options.linkActiveClass, "router-link-active")]: link.isActive,
        [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, "router-link-exact-active")]: link.isExactActive
      }));
      return () => {
        const children = slots.default && slots.default(link);
        return props.custom ? children : vue.h("a", {
          "aria-current": link.isExactActive ? props.ariaCurrentValue : null,
          href: link.href,
          onClick: link.navigate,
          class: elClass.value
        }, children);
      };
    }
  });
  const RouterLink = RouterLinkImpl;
  function guardEvent(e) {
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
      return;
    if (e.defaultPrevented)
      return;
    if (e.button !== void 0 && e.button !== 0)
      return;
    if (e.currentTarget && e.currentTarget.getAttribute) {
      const target = e.currentTarget.getAttribute("target");
      if (/\b_blank\b/i.test(target))
        return;
    }
    if (e.preventDefault)
      e.preventDefault();
    return true;
  }
  function includesParams(outer, inner) {
    for (const key in inner) {
      const innerValue = inner[key];
      const outerValue = outer[key];
      if (typeof innerValue === "string") {
        if (innerValue !== outerValue)
          return false;
      } else {
        if (!Array.isArray(outerValue) || outerValue.length !== innerValue.length || innerValue.some((value, i) => value !== outerValue[i]))
          return false;
      }
    }
    return true;
  }
  function getOriginalPath(record) {
    return record ? record.aliasOf ? record.aliasOf.path : record.path : "";
  }
  const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null ? propClass : globalClass != null ? globalClass : defaultClass;
  const RouterViewImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterView",
    inheritAttrs: false,
    props: {
      name: {
        type: String,
        default: "default"
      },
      route: Object
    },
    compatConfig: { MODE: 3 },
    setup(props, { attrs, slots }) {
      const injectedRoute = vue.inject(routerViewLocationKey);
      const routeToDisplay = vue.computed(() => props.route || injectedRoute.value);
      const depth = vue.inject(viewDepthKey, 0);
      const matchedRouteRef = vue.computed(() => routeToDisplay.value.matched[depth]);
      vue.provide(viewDepthKey, depth + 1);
      vue.provide(matchedRouteKey, matchedRouteRef);
      vue.provide(routerViewLocationKey, routeToDisplay);
      const viewRef = vue.ref();
      vue.watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
        if (to) {
          to.instances[name] = instance;
          if (from && from !== to && instance && instance === oldInstance) {
            if (!to.leaveGuards.size) {
              to.leaveGuards = from.leaveGuards;
            }
            if (!to.updateGuards.size) {
              to.updateGuards = from.updateGuards;
            }
          }
        }
        if (instance && to && (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
          (to.enterCallbacks[name] || []).forEach((callback) => callback(instance));
        }
      }, { flush: "post" });
      return () => {
        const route = routeToDisplay.value;
        const matchedRoute = matchedRouteRef.value;
        const ViewComponent = matchedRoute && matchedRoute.components[props.name];
        const currentName = props.name;
        if (!ViewComponent) {
          return normalizeSlot(slots.default, { Component: ViewComponent, route });
        }
        const routePropsOption = matchedRoute.props[props.name];
        const routeProps = routePropsOption ? routePropsOption === true ? route.params : typeof routePropsOption === "function" ? routePropsOption(route) : routePropsOption : null;
        const onVnodeUnmounted = (vnode) => {
          if (vnode.component.isUnmounted) {
            matchedRoute.instances[currentName] = null;
          }
        };
        const component = vue.h(ViewComponent, assign2({}, routeProps, attrs, {
          onVnodeUnmounted,
          ref: viewRef
        }));
        return normalizeSlot(slots.default, { Component: component, route }) || component;
      };
    }
  });
  function normalizeSlot(slot, data) {
    if (!slot)
      return null;
    const slotContent = slot(data);
    return slotContent.length === 1 ? slotContent[0] : slotContent;
  }
  const RouterView = RouterViewImpl;
  function createRouter(options) {
    const matcher = createRouterMatcher(options.routes, options);
    const parseQuery$1 = options.parseQuery || parseQuery;
    const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
    const routerHistory = options.history;
    const beforeGuards = useCallbacks();
    const beforeResolveGuards = useCallbacks();
    const afterGuards = useCallbacks();
    const currentRoute = vue.shallowRef(START_LOCATION_NORMALIZED);
    let pendingLocation = START_LOCATION_NORMALIZED;
    const normalizeParams = applyToParams.bind(null, (paramValue) => "" + paramValue);
    const encodeParams = applyToParams.bind(null, encodeParam);
    const decodeParams = applyToParams.bind(null, decode2);
    function addRoute(parentOrRoute, route) {
      let parent;
      let record;
      if (isRouteName(parentOrRoute)) {
        parent = matcher.getRecordMatcher(parentOrRoute);
        record = route;
      } else {
        record = parentOrRoute;
      }
      return matcher.addRoute(record, parent);
    }
    function removeRoute(name) {
      const recordMatcher = matcher.getRecordMatcher(name);
      if (recordMatcher) {
        matcher.removeRoute(recordMatcher);
      }
    }
    function getRoutes() {
      return matcher.getRoutes().map((routeMatcher) => routeMatcher.record);
    }
    function hasRoute(name) {
      return !!matcher.getRecordMatcher(name);
    }
    function resolve(rawLocation, currentLocation) {
      currentLocation = assign2({}, currentLocation || currentRoute.value);
      if (typeof rawLocation === "string") {
        const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
        const matchedRoute2 = matcher.resolve({ path: locationNormalized.path }, currentLocation);
        const href2 = routerHistory.createHref(locationNormalized.fullPath);
        return assign2(locationNormalized, matchedRoute2, {
          params: decodeParams(matchedRoute2.params),
          hash: decode2(locationNormalized.hash),
          redirectedFrom: void 0,
          href: href2
        });
      }
      let matcherLocation;
      if ("path" in rawLocation) {
        matcherLocation = assign2({}, rawLocation, {
          path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path
        });
      } else {
        const targetParams = assign2({}, rawLocation.params);
        for (const key in targetParams) {
          if (targetParams[key] == null) {
            delete targetParams[key];
          }
        }
        matcherLocation = assign2({}, rawLocation, {
          params: encodeParams(rawLocation.params)
        });
        currentLocation.params = encodeParams(currentLocation.params);
      }
      const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
      const hash = rawLocation.hash || "";
      matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
      const fullPath = stringifyURL(stringifyQuery$1, assign2({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path
      }));
      const href = routerHistory.createHref(fullPath);
      return assign2({
        fullPath,
        hash,
        query: stringifyQuery$1 === stringifyQuery ? normalizeQuery(rawLocation.query) : rawLocation.query || {}
      }, matchedRoute, {
        redirectedFrom: void 0,
        href
      });
    }
    function locationAsObject(to) {
      return typeof to === "string" ? parseURL(parseQuery$1, to, currentRoute.value.path) : assign2({}, to);
    }
    function checkCanceledNavigation(to, from) {
      if (pendingLocation !== to) {
        return createRouterError(8, {
          from,
          to
        });
      }
    }
    function push(to) {
      return pushWithRedirect(to);
    }
    function replace(to) {
      return push(assign2(locationAsObject(to), { replace: true }));
    }
    function handleRedirectRecord(to) {
      const lastMatched = to.matched[to.matched.length - 1];
      if (lastMatched && lastMatched.redirect) {
        const { redirect } = lastMatched;
        let newTargetLocation = typeof redirect === "function" ? redirect(to) : redirect;
        if (typeof newTargetLocation === "string") {
          newTargetLocation = newTargetLocation.includes("?") || newTargetLocation.includes("#") ? newTargetLocation = locationAsObject(newTargetLocation) : { path: newTargetLocation };
          newTargetLocation.params = {};
        }
        return assign2({
          query: to.query,
          hash: to.hash,
          params: to.params
        }, newTargetLocation);
      }
    }
    function pushWithRedirect(to, redirectedFrom) {
      const targetLocation = pendingLocation = resolve(to);
      const from = currentRoute.value;
      const data = to.state;
      const force = to.force;
      const replace2 = to.replace === true;
      const shouldRedirect = handleRedirectRecord(targetLocation);
      if (shouldRedirect)
        return pushWithRedirect(assign2(locationAsObject(shouldRedirect), {
          state: data,
          force,
          replace: replace2
        }), redirectedFrom || targetLocation);
      const toLocation = targetLocation;
      toLocation.redirectedFrom = redirectedFrom;
      let failure;
      if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
        failure = createRouterError(16, { to: toLocation, from });
        handleScroll();
      }
      return (failure ? Promise.resolve(failure) : navigate(toLocation, from)).catch((error) => isNavigationFailure(error) ? isNavigationFailure(error, 2) ? error : markAsReady(error) : triggerError(error, toLocation, from)).then((failure2) => {
        if (failure2) {
          if (isNavigationFailure(failure2, 2)) {
            return pushWithRedirect(assign2(locationAsObject(failure2.to), {
              state: data,
              force,
              replace: replace2
            }), redirectedFrom || toLocation);
          }
        } else {
          failure2 = finalizeNavigation(toLocation, from, true, replace2, data);
        }
        triggerAfterEach(toLocation, from, failure2);
        return failure2;
      });
    }
    function checkCanceledNavigationAndReject(to, from) {
      const error = checkCanceledNavigation(to, from);
      return error ? Promise.reject(error) : Promise.resolve();
    }
    function navigate(to, from) {
      let guards;
      const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
      guards = extractComponentsGuards(leavingRecords.reverse(), "beforeRouteLeave", to, from);
      for (const record of leavingRecords) {
        record.leaveGuards.forEach((guard) => {
          guards.push(guardToPromiseFn(guard, to, from));
        });
      }
      const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards).then(() => {
        guards = [];
        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = extractComponentsGuards(updatingRecords, "beforeRouteUpdate", to, from);
        for (const record of updatingRecords) {
          record.updateGuards.forEach((guard) => {
            guards.push(guardToPromiseFn(guard, to, from));
          });
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const record of to.matched) {
          if (record.beforeEnter && !from.matched.includes(record)) {
            if (Array.isArray(record.beforeEnter)) {
              for (const beforeEnter of record.beforeEnter)
                guards.push(guardToPromiseFn(beforeEnter, to, from));
            } else {
              guards.push(guardToPromiseFn(record.beforeEnter, to, from));
            }
          }
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        to.matched.forEach((record) => record.enterCallbacks = {});
        guards = extractComponentsGuards(enteringRecords, "beforeRouteEnter", to, from);
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).catch((err) => isNavigationFailure(err, 8) ? err : Promise.reject(err));
    }
    function triggerAfterEach(to, from, failure) {
      for (const guard of afterGuards.list())
        guard(to, from, failure);
    }
    function finalizeNavigation(toLocation, from, isPush, replace2, data) {
      const error = checkCanceledNavigation(toLocation, from);
      if (error)
        return error;
      const isFirstNavigation = from === START_LOCATION_NORMALIZED;
      const state = {};
      if (isPush) {
        if (replace2 || isFirstNavigation)
          routerHistory.replace(toLocation.fullPath, assign2({
            scroll: isFirstNavigation && state && state.scroll
          }, data));
        else
          routerHistory.push(toLocation.fullPath, data);
      }
      currentRoute.value = toLocation;
      handleScroll();
      markAsReady();
    }
    let removeHistoryListener;
    function setupListeners() {
      if (removeHistoryListener)
        return;
      removeHistoryListener = routerHistory.listen((to, _from, info) => {
        const toLocation = resolve(to);
        const shouldRedirect = handleRedirectRecord(toLocation);
        if (shouldRedirect) {
          pushWithRedirect(assign2(shouldRedirect, { replace: true }), toLocation).catch(noop);
          return;
        }
        pendingLocation = toLocation;
        const from = currentRoute.value;
        navigate(toLocation, from).catch((error) => {
          if (isNavigationFailure(error, 4 | 8)) {
            return error;
          }
          if (isNavigationFailure(error, 2)) {
            pushWithRedirect(error.to, toLocation).then((failure) => {
              if (isNavigationFailure(failure, 4 | 16) && !info.delta && info.type === NavigationType.pop) {
                routerHistory.go(-1, false);
              }
            }).catch(noop);
            return Promise.reject();
          }
          if (info.delta)
            routerHistory.go(-info.delta, false);
          return triggerError(error, toLocation, from);
        }).then((failure) => {
          failure = failure || finalizeNavigation(toLocation, from, false);
          if (failure) {
            if (info.delta) {
              routerHistory.go(-info.delta, false);
            } else if (info.type === NavigationType.pop && isNavigationFailure(failure, 4 | 16)) {
              routerHistory.go(-1, false);
            }
          }
          triggerAfterEach(toLocation, from, failure);
        }).catch(noop);
      });
    }
    let readyHandlers = useCallbacks();
    let errorHandlers = useCallbacks();
    let ready;
    function triggerError(error, to, from) {
      markAsReady(error);
      const list = errorHandlers.list();
      if (list.length) {
        list.forEach((handler) => handler(error, to, from));
      } else {
        console.error(error);
      }
      return Promise.reject(error);
    }
    function isReady() {
      if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
        return Promise.resolve();
      return new Promise((resolve2, reject) => {
        readyHandlers.add([resolve2, reject]);
      });
    }
    function markAsReady(err) {
      if (!ready) {
        ready = !err;
        setupListeners();
        readyHandlers.list().forEach(([resolve2, reject]) => err ? reject(err) : resolve2());
        readyHandlers.reset();
      }
      return err;
    }
    function handleScroll(to, from, isPush, isFirstNavigation) {
      return Promise.resolve();
    }
    const go = (delta) => routerHistory.go(delta);
    const installedApps = /* @__PURE__ */ new Set();
    const router = {
      currentRoute,
      addRoute,
      removeRoute,
      hasRoute,
      getRoutes,
      resolve,
      options,
      push,
      replace,
      go,
      back: () => go(-1),
      forward: () => go(1),
      beforeEach: beforeGuards.add,
      beforeResolve: beforeResolveGuards.add,
      afterEach: afterGuards.add,
      onError: errorHandlers.add,
      isReady,
      install(app2) {
        const router2 = this;
        app2.component("RouterLink", RouterLink);
        app2.component("RouterView", RouterView);
        app2.config.globalProperties.$router = router2;
        Object.defineProperty(app2.config.globalProperties, "$route", {
          enumerable: true,
          get: () => vue.unref(currentRoute)
        });
        const reactiveRoute = {};
        for (const key in START_LOCATION_NORMALIZED) {
          reactiveRoute[key] = vue.computed(() => currentRoute.value[key]);
        }
        app2.provide(routerKey, router2);
        app2.provide(routeLocationKey, vue.reactive(reactiveRoute));
        app2.provide(routerViewLocationKey, currentRoute);
        const unmountApp = app2.unmount;
        installedApps.add(app2);
        app2.unmount = function() {
          installedApps.delete(app2);
          if (installedApps.size < 1) {
            pendingLocation = START_LOCATION_NORMALIZED;
            removeHistoryListener && removeHistoryListener();
            removeHistoryListener = null;
            currentRoute.value = START_LOCATION_NORMALIZED;
            ready = false;
          }
          unmountApp();
        };
      }
    };
    return router;
  }
  function runGuardQueue(guards) {
    return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
  }
  function extractChangingRecords(to, from) {
    const leavingRecords = [];
    const updatingRecords = [];
    const enteringRecords = [];
    const len = Math.max(from.matched.length, to.matched.length);
    for (let i = 0; i < len; i++) {
      const recordFrom = from.matched[i];
      if (recordFrom) {
        if (to.matched.find((record) => isSameRouteRecord(record, recordFrom)))
          updatingRecords.push(recordFrom);
        else
          leavingRecords.push(recordFrom);
      }
      const recordTo = to.matched[i];
      if (recordTo) {
        if (!from.matched.find((record) => isSameRouteRecord(record, recordTo))) {
          enteringRecords.push(recordTo);
        }
      }
    }
    return [leavingRecords, updatingRecords, enteringRecords];
  }
  function useRouter2() {
    return vue.inject(routerKey);
  }
  function useRoute2() {
    return vue.inject(routeLocationKey);
  }
  exports.RouterLink = RouterLink;
  exports.RouterView = RouterView;
  exports.START_LOCATION = START_LOCATION_NORMALIZED;
  exports.createMemoryHistory = createMemoryHistory;
  exports.createRouter = createRouter;
  exports.createRouterMatcher = createRouterMatcher;
  exports.createWebHashHistory = createWebHashHistory;
  exports.createWebHistory = createWebHistory;
  exports.isNavigationFailure = isNavigationFailure;
  exports.matchedRouteKey = matchedRouteKey;
  exports.onBeforeRouteLeave = onBeforeRouteLeave;
  exports.onBeforeRouteUpdate = onBeforeRouteUpdate;
  exports.parseQuery = parseQuery;
  exports.routeLocationKey = routeLocationKey;
  exports.routerKey = routerKey;
  exports.routerViewLocationKey = routerViewLocationKey;
  exports.stringifyQuery = stringifyQuery;
  exports.useLink = useLink;
  exports.useRoute = useRoute2;
  exports.useRouter = useRouter2;
  exports.viewDepthKey = viewDepthKey;
})(vueRouter_cjs_prod);
const wrapInRef = (value) => vue_cjs_prod.isRef(value) ? value : vue_cjs_prod.ref(value);
const useState = (key, init) => {
  const nuxt = useNuxtApp();
  const state = vue_cjs_prod.toRef(nuxt.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (vue_cjs_prod.isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
};
const useError = () => {
  const nuxtApp = useNuxtApp();
  return useState("error", () => nuxtApp.ssrContext.error);
};
const throwError = (_err) => {
  const nuxtApp = useNuxtApp();
  useError();
  const err = typeof _err === "string" ? new Error(_err) : _err;
  nuxtApp.callHook("app:error", err);
  {
    nuxtApp.ssrContext.error = nuxtApp.ssrContext.error || err;
  }
  return err;
};
const decode = decodeURIComponent;
const encode = encodeURIComponent;
const pairSplitRegExp = /; */;
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
function parse$1(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  let obj = {};
  let opt = options || {};
  let pairs = str.split(pairSplitRegExp);
  let dec = opt.decode || decode;
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i];
    let eq_idx = pair.indexOf("=");
    if (eq_idx < 0) {
      continue;
    }
    let key = pair.substr(0, eq_idx).trim();
    let val = pair.substr(++eq_idx, pair.length).trim();
    if (val[0] == '"') {
      val = val.slice(1, -1);
    }
    if (obj[key] == void 0) {
      obj[key] = tryDecode(val, dec);
    }
  }
  return obj;
}
function serialize(name, value, options) {
  let opt = options || {};
  let enc = opt.encode || encode;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  let encodedValue = enc(value);
  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError("argument val is invalid");
  }
  let str = name + "=" + encodedValue;
  if (opt.maxAge != null) {
    let maxAge = opt.maxAge - 0;
    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== "function") {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.sameSite) {
    let sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true:
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError("option sameSite is invalid");
    }
  }
  return str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch (e) {
    return str;
  }
}
const MIMES = {
  html: "text/html",
  json: "application/json"
};
const defer = typeof setImmediate !== "undefined" ? setImmediate : (fn) => fn();
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      event.res.end(data);
      resolve(void 0);
    });
  });
}
function defaultContentType(event, type) {
  if (type && !event.res.getHeader("Content-Type")) {
    event.res.setHeader("Content-Type", type);
  }
}
function sendRedirect(event, location2, code2 = 302) {
  event.res.statusCode = code2;
  event.res.setHeader("Location", location2);
  return send(event, "Redirecting to " + location2, MIMES.html);
}
function appendHeader(event, name, value) {
  let current = event.res.getHeader(name);
  if (!current) {
    event.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.res.setHeader(name, current.concat(value));
}
class H3Error extends Error {
  constructor() {
    super(...arguments);
    this.statusCode = 500;
    this.statusMessage = "H3Error";
  }
}
function createError(input) {
  var _a2;
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (input instanceof H3Error) {
    return input;
  }
  const err = new H3Error((_a2 = input.message) != null ? _a2 : input.statusMessage, input.cause ? { cause: input.cause } : void 0);
  if (input.statusCode) {
    err.statusCode = input.statusCode;
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  }
  if (input.data) {
    err.data = input.data;
  }
  return err;
}
function useRequestEvent(nuxtApp = useNuxtApp()) {
  var _a2;
  return (_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.event;
}
const CookieDefaults = {
  path: "/",
  decode: (val) => destr(decodeURIComponent(val)),
  encode: (val) => encodeURIComponent(typeof val === "string" ? val : JSON.stringify(val))
};
function useCookie(name, _opts) {
  var _a2, _b2;
  const opts = __spreadValues(__spreadValues({}, CookieDefaults), _opts);
  const cookies = readRawCookies(opts);
  const cookie = wrapInRef((_b2 = cookies[name]) != null ? _b2 : (_a2 = opts.default) == null ? void 0 : _a2.call(opts));
  {
    const nuxtApp = useNuxtApp();
    const writeFinalCookieValue = () => {
      if (cookie.value !== cookies[name]) {
        writeServerCookie(useRequestEvent(nuxtApp), name, cookie.value, opts);
      }
    };
    nuxtApp.hooks.hookOnce("app:rendered", writeFinalCookieValue);
    nuxtApp.hooks.hookOnce("app:redirected", writeFinalCookieValue);
  }
  return cookie;
}
function readRawCookies(opts = {}) {
  var _a2;
  {
    return parse$1(((_a2 = useRequestEvent()) == null ? void 0 : _a2.req.headers.cookie) || "", opts);
  }
}
function serializeCookie(name, value, opts = {}) {
  if (value === null || value === void 0) {
    return serialize(name, value, __spreadProps(__spreadValues({}, opts), { maxAge: -1 }));
  }
  return serialize(name, value, opts);
}
function writeServerCookie(event, name, value, opts = {}) {
  if (event) {
    appendHeader(event, "Set-Cookie", serializeCookie(name, value, opts));
  }
}
const useRouter = () => {
  var _a2;
  return (_a2 = useNuxtApp()) == null ? void 0 : _a2.$router;
};
const useRoute = () => {
  return useNuxtApp()._route;
};
const navigateTo = (to, options = {}) => {
  if (!to) {
    to = "/";
  }
  const router = useRouter();
  {
    const nuxtApp = useNuxtApp();
    if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
      const redirectLocation = joinURL(useRuntimeConfig().app.baseURL, router.resolve(to).fullPath || "/");
      return nuxtApp.callHook("app:redirected").then(() => sendRedirect(nuxtApp.ssrContext.event, redirectLocation, options.redirectCode || 302));
    }
  }
  return options.replace ? router.replace(to) : router.push(to);
};
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  const checkPropConflicts = (props, main, sub) => {
  };
  return vue_cjs_prod.defineComponent({
    name: componentName,
    props: {
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = vue_cjs_prod.computed(() => {
        checkPropConflicts(props, "to", "href");
        return props.to || props.href || "";
      });
      const isExternal = vue_cjs_prod.computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, true);
      });
      return () => {
        var _a2, _b2, _c;
        if (!isExternal.value) {
          return vue_cjs_prod.h(vue_cjs_prod.resolveComponent("RouterLink"), {
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue
          }, slots.default);
        }
        const href = typeof to.value === "object" ? (_b2 = (_a2 = router.resolve(to.value)) == null ? void 0 : _a2.href) != null ? _b2 : null : to.value || null;
        const target = props.target || null;
        checkPropConflicts(props, "noRel", "rel");
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        return vue_cjs_prod.h("a", { href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0$4 = defineNuxtLink({ componentName: "NuxtLink" });
var shared_cjs_prod = {};
Object.defineProperty(shared_cjs_prod, "__esModule", { value: true });
function makeMap(str, expectsLowerCase) {
  const map = /* @__PURE__ */ Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
const PatchFlagNames = {
  [1]: `TEXT`,
  [2]: `CLASS`,
  [4]: `STYLE`,
  [8]: `PROPS`,
  [16]: `FULL_PROPS`,
  [32]: `HYDRATE_EVENTS`,
  [64]: `STABLE_FRAGMENT`,
  [128]: `KEYED_FRAGMENT`,
  [256]: `UNKEYED_FRAGMENT`,
  [512]: `NEED_PATCH`,
  [1024]: `DYNAMIC_SLOTS`,
  [2048]: `DEV_ROOT_FRAGMENT`,
  [-1]: `HOISTED`,
  [-2]: `BAIL`
};
const slotFlagsText = {
  [1]: "STABLE",
  [2]: "DYNAMIC",
  [3]: "FORWARDED"
};
const GLOBALS_WHITE_LISTED = "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt";
const isGloballyWhitelisted = /* @__PURE__ */ makeMap(GLOBALS_WHITE_LISTED);
const range = 2;
function generateCodeFrame$1(source, start = 0, end = source.length) {
  let lines = source.split(/(\r?\n)/);
  const newlineSequences = lines.filter((_, idx) => idx % 2 === 1);
  lines = lines.filter((_, idx) => idx % 2 === 0);
  let count = 0;
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + (newlineSequences[i] && newlineSequences[i].length || 0);
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length)
          continue;
        const line = j + 1;
        res.push(`${line}${" ".repeat(Math.max(3 - String(line).length, 0))}|  ${lines[j]}`);
        const lineLength = lines[j].length;
        const newLineSeqLength = newlineSequences[j] && newlineSequences[j].length || 0;
        if (j === i) {
          const pad = start - (count - (lineLength + newLineSeqLength));
          const length = Math.max(1, end > count ? lineLength - pad : end - start);
          res.push(`   |  ` + " ".repeat(pad) + "^".repeat(length));
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1);
            res.push(`   |  ` + "^".repeat(length));
          }
          count += lineLength + newLineSeqLength;
        }
      }
      break;
    }
  }
  return res.join("\n");
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
const isBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
const unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/;
const attrValidationCache = {};
function isSSRSafeAttrName(name) {
  if (attrValidationCache.hasOwnProperty(name)) {
    return attrValidationCache[name];
  }
  const isUnsafe = unsafeAttrCharRE.test(name);
  if (isUnsafe) {
    console.error(`unsafe attribute name: ${name}`);
  }
  return attrValidationCache[name] = !isUnsafe;
}
const propsToAttrMap = {
  acceptCharset: "accept-charset",
  className: "class",
  htmlFor: "for",
  httpEquiv: "http-equiv"
};
const isNoUnitNumericStyleProp = /* @__PURE__ */ makeMap(`animation-iteration-count,border-image-outset,border-image-slice,border-image-width,box-flex,box-flex-group,box-ordinal-group,column-count,columns,flex,flex-grow,flex-positive,flex-shrink,flex-negative,flex-order,grid-row,grid-row-end,grid-row-span,grid-row-start,grid-column,grid-column-end,grid-column-span,grid-column-start,font-weight,line-clamp,line-height,opacity,order,orphans,tab-size,widows,z-index,zoom,fill-opacity,flood-opacity,stop-opacity,stroke-dasharray,stroke-dashoffset,stroke-miterlimit,stroke-opacity,stroke-width`);
const isKnownHtmlAttr = /* @__PURE__ */ makeMap(`accept,accept-charset,accesskey,action,align,allow,alt,async,autocapitalize,autocomplete,autofocus,autoplay,background,bgcolor,border,buffered,capture,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,crossorigin,csp,data,datetime,decoding,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,enterkeyhint,for,form,formaction,formenctype,formmethod,formnovalidate,formtarget,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,importance,integrity,ismap,itemprop,keytype,kind,label,lang,language,loading,list,loop,low,manifest,max,maxlength,minlength,media,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,referrerpolicy,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,selected,shape,size,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,translate,type,usemap,value,width,wrap`);
const isKnownSvgAttr = /* @__PURE__ */ makeMap(`xmlns,accent-height,accumulate,additive,alignment-baseline,alphabetic,amplitude,arabic-form,ascent,attributeName,attributeType,azimuth,baseFrequency,baseline-shift,baseProfile,bbox,begin,bias,by,calcMode,cap-height,class,clip,clipPathUnits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,contentScriptType,contentStyleType,crossorigin,cursor,cx,cy,d,decelerate,descent,diffuseConstant,direction,display,divisor,dominant-baseline,dur,dx,dy,edgeMode,elevation,enable-background,end,exponent,fill,fill-opacity,fill-rule,filter,filterRes,filterUnits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,format,from,fr,fx,fy,g1,g2,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,glyphRef,gradientTransform,gradientUnits,hanging,height,href,hreflang,horiz-adv-x,horiz-origin-x,id,ideographic,image-rendering,in,in2,intercept,k,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,kerning,keyPoints,keySplines,keyTimes,lang,lengthAdjust,letter-spacing,lighting-color,limitingConeAngle,local,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mask,maskContentUnits,maskUnits,mathematical,max,media,method,min,mode,name,numOctaves,offset,opacity,operator,order,orient,orientation,origin,overflow,overline-position,overline-thickness,panose-1,paint-order,path,pathLength,patternContentUnits,patternTransform,patternUnits,ping,pointer-events,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,r,radius,referrerPolicy,refX,refY,rel,rendering-intent,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,rotate,rx,ry,scale,seed,shape-rendering,slope,spacing,specularConstant,specularExponent,speed,spreadMethod,startOffset,stdDeviation,stemh,stemv,stitchTiles,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,string,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,style,surfaceScale,systemLanguage,tabindex,tableValues,target,targetX,targetY,text-anchor,text-decoration,text-rendering,textLength,to,transform,transform-origin,type,u1,u2,underline-position,underline-thickness,unicode,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,values,vector-effect,version,vert-adv-y,vert-origin-x,vert-origin-y,viewBox,viewTarget,visibility,width,widths,word-spacing,writing-mode,x,x-height,x1,x2,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,y,y1,y2,yChannelSelector,z,zoomAndPan`);
function normalizeStyle(value) {
  if (isArray$1(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString$1(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString$1(value)) {
    return value;
  } else if (isObject$2(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:(.+)/;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function stringifyStyle(styles) {
  let ret = "";
  if (!styles || isString$1(styles)) {
    return ret;
  }
  for (const key in styles) {
    const value = styles[key];
    const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key);
    if (isString$1(value) || typeof value === "number" && isNoUnitNumericStyleProp(normalizedKey)) {
      ret += `${normalizedKey}:${value};`;
    }
  }
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString$1(value)) {
    res = value;
  } else if (isArray$1(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject$2(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
function normalizeProps(props) {
  if (!props)
    return null;
  let { class: klass, style } = props;
  if (klass && !isString$1(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}
const HTML_TAGS = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot";
const SVG_TAGS = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view";
const VOID_TAGS = "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";
const isHTMLTag = /* @__PURE__ */ makeMap(HTML_TAGS);
const isSVGTag = /* @__PURE__ */ makeMap(SVG_TAGS);
const isVoidTag = /* @__PURE__ */ makeMap(VOID_TAGS);
const escapeRE = /["'&<>]/;
function escapeHtml$1(string) {
  const str = "" + string;
  const match = escapeRE.exec(str);
  if (!match) {
    return str;
  }
  let html = "";
  let escaped;
  let index2;
  let lastIndex = 0;
  for (index2 = match.index; index2 < str.length; index2++) {
    switch (str.charCodeAt(index2)) {
      case 34:
        escaped = "&quot;";
        break;
      case 38:
        escaped = "&amp;";
        break;
      case 39:
        escaped = "&#39;";
        break;
      case 60:
        escaped = "&lt;";
        break;
      case 62:
        escaped = "&gt;";
        break;
      default:
        continue;
    }
    if (lastIndex !== index2) {
      html += str.slice(lastIndex, index2);
    }
    lastIndex = index2 + 1;
    html += escaped;
  }
  return lastIndex !== index2 ? html + str.slice(lastIndex, index2) : html;
}
const commentStripRE = /^-?>|<!--|-->|--!>|<!-$/g;
function escapeHtmlComment(src) {
  return src.replace(commentStripRE, "");
}
function looseCompareArrays(a, b) {
  if (a.length !== b.length)
    return false;
  let equal = true;
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i]);
  }
  return equal;
}
function looseEqual(a, b) {
  if (a === b)
    return true;
  let aValidType = isDate$1(a);
  let bValidType = isDate$1(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol(a);
  bValidType = isSymbol(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray$1(a);
  bValidType = isArray$1(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false;
  }
  aValidType = isObject$2(a);
  bValidType = isObject$2(b);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    const aKeysCount = Object.keys(a).length;
    const bKeysCount = Object.keys(b).length;
    if (aKeysCount !== bKeysCount) {
      return false;
    }
    for (const key in a) {
      const aHasKey = a.hasOwnProperty(key);
      const bHasKey = b.hasOwnProperty(key);
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
        return false;
      }
    }
  }
  return String(a) === String(b);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}
const toDisplayString$1 = (val) => {
  return isString$1(val) ? val : val == null ? "" : isArray$1(val) || isObject$2(val) && (val.toString === objectToString$1 || !isFunction$1(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
        entries[`${key} =>`] = val2;
        return entries;
      }, {})
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    };
  } else if (isObject$2(val) && !isArray$1(val) && !isPlainObject$1(val)) {
    return String(val);
  }
  return val;
};
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn$1 = (val, key) => hasOwnProperty$1.call(val, key);
const isArray$1 = Array.isArray;
const isMap = (val) => toTypeString$1(val) === "[object Map]";
const isSet = (val) => toTypeString$1(val) === "[object Set]";
const isDate$1 = (val) => toTypeString$1(val) === "[object Date]";
const isFunction$1 = (val) => typeof val === "function";
const isString$1 = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject$2 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return isObject$2(val) && isFunction$1(val.then) && isFunction$1(val.catch);
};
const objectToString$1 = Object.prototype.toString;
const toTypeString$1 = (value) => objectToString$1.call(value);
const toRawType = (value) => {
  return toTypeString$1(value).slice(8, -1);
};
const isPlainObject$1 = (val) => toTypeString$1(val) === "[object Object]";
const isIntegerKey = (key) => isString$1(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
const isBuiltInDirective = /* @__PURE__ */ makeMap("bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo");
const cacheStringFunction = (fn) => {
  const cache2 = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache2[str];
    return hit || (cache2[str] = fn(str));
  };
};
const camelizeRE = /-(\w)/g;
const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
});
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
};
const toNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
let _globalThis$1;
const getGlobalThis$1 = () => {
  return _globalThis$1 || (_globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : {});
};
const identRE = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;
function genPropsAccessExp(name) {
  return identRE.test(name) ? `__props.${name}` : `__props[${JSON.stringify(name)}]`;
}
shared_cjs_prod.EMPTY_ARR = EMPTY_ARR;
shared_cjs_prod.EMPTY_OBJ = EMPTY_OBJ;
shared_cjs_prod.NO = NO;
shared_cjs_prod.NOOP = NOOP;
shared_cjs_prod.PatchFlagNames = PatchFlagNames;
shared_cjs_prod.camelize = camelize;
shared_cjs_prod.capitalize = capitalize;
shared_cjs_prod.def = def;
shared_cjs_prod.escapeHtml = escapeHtml$1;
shared_cjs_prod.escapeHtmlComment = escapeHtmlComment;
shared_cjs_prod.extend = extend;
shared_cjs_prod.genPropsAccessExp = genPropsAccessExp;
shared_cjs_prod.generateCodeFrame = generateCodeFrame$1;
shared_cjs_prod.getGlobalThis = getGlobalThis$1;
shared_cjs_prod.hasChanged = hasChanged;
shared_cjs_prod.hasOwn = hasOwn$1;
shared_cjs_prod.hyphenate = hyphenate;
shared_cjs_prod.includeBooleanAttr = includeBooleanAttr;
shared_cjs_prod.invokeArrayFns = invokeArrayFns;
shared_cjs_prod.isArray = isArray$1;
shared_cjs_prod.isBooleanAttr = isBooleanAttr;
shared_cjs_prod.isBuiltInDirective = isBuiltInDirective;
shared_cjs_prod.isDate = isDate$1;
var isFunction_1 = shared_cjs_prod.isFunction = isFunction$1;
shared_cjs_prod.isGloballyWhitelisted = isGloballyWhitelisted;
shared_cjs_prod.isHTMLTag = isHTMLTag;
shared_cjs_prod.isIntegerKey = isIntegerKey;
shared_cjs_prod.isKnownHtmlAttr = isKnownHtmlAttr;
shared_cjs_prod.isKnownSvgAttr = isKnownSvgAttr;
shared_cjs_prod.isMap = isMap;
shared_cjs_prod.isModelListener = isModelListener;
shared_cjs_prod.isNoUnitNumericStyleProp = isNoUnitNumericStyleProp;
shared_cjs_prod.isObject = isObject$2;
shared_cjs_prod.isOn = isOn;
shared_cjs_prod.isPlainObject = isPlainObject$1;
shared_cjs_prod.isPromise = isPromise;
shared_cjs_prod.isReservedProp = isReservedProp;
shared_cjs_prod.isSSRSafeAttrName = isSSRSafeAttrName;
shared_cjs_prod.isSVGTag = isSVGTag;
shared_cjs_prod.isSet = isSet;
shared_cjs_prod.isSpecialBooleanAttr = isSpecialBooleanAttr;
shared_cjs_prod.isString = isString$1;
shared_cjs_prod.isSymbol = isSymbol;
shared_cjs_prod.isVoidTag = isVoidTag;
shared_cjs_prod.looseEqual = looseEqual;
shared_cjs_prod.looseIndexOf = looseIndexOf;
shared_cjs_prod.makeMap = makeMap;
shared_cjs_prod.normalizeClass = normalizeClass;
shared_cjs_prod.normalizeProps = normalizeProps;
shared_cjs_prod.normalizeStyle = normalizeStyle;
shared_cjs_prod.objectToString = objectToString$1;
shared_cjs_prod.parseStringStyle = parseStringStyle;
shared_cjs_prod.propsToAttrMap = propsToAttrMap;
shared_cjs_prod.remove = remove;
shared_cjs_prod.slotFlagsText = slotFlagsText;
shared_cjs_prod.stringifyStyle = stringifyStyle;
shared_cjs_prod.toDisplayString = toDisplayString$1;
shared_cjs_prod.toHandlerKey = toHandlerKey;
shared_cjs_prod.toNumber = toNumber;
shared_cjs_prod.toRawType = toRawType;
shared_cjs_prod.toTypeString = toTypeString$1;
function useHead(meta2) {
  const resolvedMeta = isFunction_1(meta2) ? vue_cjs_prod.computed(meta2) : meta2;
  useNuxtApp()._useHead(resolvedMeta);
}
function useMeta(meta2) {
  return useHead(meta2);
}
const preload = defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.mixin({
    beforeCreate() {
      const { _registeredComponents } = this.$nuxt.ssrContext;
      const { __moduleIdentifier } = this.$options;
      _registeredComponents.add(__moduleIdentifier);
    }
  });
});
const components = {};
function F_58_47p45mjn_47_46nuxt_47components_46plugin_46mjs(nuxtApp) {
  for (const name in components) {
    nuxtApp.vueApp.component(name, components[name]);
    nuxtApp.vueApp.component("Lazy" + name, components[name]);
  }
}
var __defProp2 = Object.defineProperty;
var __defProps2 = Object.defineProperties;
var __getOwnPropDescs2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp2(a, prop, b[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b)) {
      if (__propIsEnum2.call(b, prop))
        __defNormalProp2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps2 = (a, b) => __defProps2(a, __getOwnPropDescs2(b));
var PROVIDE_KEY = `usehead`;
var HEAD_COUNT_KEY = `head:count`;
var HEAD_ATTRS_KEY = `data-head-attrs`;
var SELF_CLOSING_TAGS = ["meta", "link", "base"];
var createElement = (tag, attrs, document2) => {
  const el = document2.createElement(tag);
  for (const key of Object.keys(attrs)) {
    let value = attrs[key];
    if (key === "key" || value === false) {
      continue;
    }
    if (key === "children") {
      el.textContent = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  return el;
};
var htmlEscape = (str) => str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var stringifyAttrs = (attributes) => {
  const handledAttributes = [];
  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue;
    }
    if (value === false || value == null) {
      continue;
    }
    let attribute = htmlEscape(key);
    if (value !== true) {
      attribute += `="${htmlEscape(String(value))}"`;
    }
    handledAttributes.push(attribute);
  }
  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : "";
};
function isEqualNode(oldTag, newTag) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute("nonce");
    if (nonce && !oldTag.getAttribute("nonce")) {
      const cloneTag = newTag.cloneNode(true);
      cloneTag.setAttribute("nonce", "");
      cloneTag.nonce = nonce;
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag);
    }
  }
  return oldTag.isEqualNode(newTag);
}
var getTagKey = (props) => {
  const names = ["key", "id", "name", "property"];
  for (const n of names) {
    const value = typeof props.getAttribute === "function" ? props.hasAttribute(n) ? props.getAttribute(n) : void 0 : props[n];
    if (value !== void 0) {
      return { name: n, value };
    }
  }
};
var acceptFields = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "htmlAttrs",
  "bodyAttrs"
];
var headObjToTags = (obj) => {
  const tags = [];
  for (const key of Object.keys(obj)) {
    if (obj[key] == null)
      continue;
    if (key === "title") {
      tags.push({ tag: key, props: { children: obj[key] } });
    } else if (key === "base") {
      tags.push({ tag: key, props: __spreadValues2({ key: "default" }, obj[key]) });
    } else if (acceptFields.includes(key)) {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          tags.push({ tag: key, props: item });
        });
      } else if (value) {
        tags.push({ tag: key, props: value });
      }
    }
  }
  return tags;
};
var setAttrs = (el, attrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY);
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key);
      }
    }
  }
  const keys = [];
  for (const key in attrs) {
    const value = attrs[key];
    if (value == null)
      continue;
    if (value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
    keys.push(key);
  }
  if (keys.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(","));
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY);
  }
};
var updateElements = (document2 = window.document, type, tags) => {
  var _a2;
  const head = document2.head;
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`);
  const headCount = headCountEl ? Number(headCountEl.getAttribute("content")) : 0;
  const oldElements = [];
  if (headCountEl) {
    for (let i = 0, j = headCountEl.previousElementSibling; i < headCount; i++, j = (j == null ? void 0 : j.previousElementSibling) || null) {
      if (((_a2 = j == null ? void 0 : j.tagName) == null ? void 0 : _a2.toLowerCase()) === type) {
        oldElements.push(j);
      }
    }
  } else {
    headCountEl = document2.createElement("meta");
    headCountEl.setAttribute("name", HEAD_COUNT_KEY);
    headCountEl.setAttribute("content", "0");
    head.append(headCountEl);
  }
  let newElements = tags.map((tag) => createElement(tag.tag, tag.props, document2));
  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldElements.length; i++) {
      const oldEl = oldElements[i];
      if (isEqualNode(oldEl, newEl)) {
        oldElements.splice(i, 1);
        return false;
      }
    }
    return true;
  });
  oldElements.forEach((t) => {
    var _a22;
    return (_a22 = t.parentNode) == null ? void 0 : _a22.removeChild(t);
  });
  newElements.forEach((t) => {
    head.insertBefore(t, headCountEl);
  });
  headCountEl.setAttribute("content", "" + (headCount - oldElements.length + newElements.length));
};
var createHead = () => {
  let allHeadObjs = [];
  let previousTags = /* @__PURE__ */ new Set();
  const head = {
    install(app2) {
      app2.config.globalProperties.$head = head;
      app2.provide(PROVIDE_KEY, head);
    },
    get headTags() {
      const deduped = [];
      allHeadObjs.forEach((objs) => {
        const tags = headObjToTags(objs.value);
        tags.forEach((tag) => {
          if (tag.tag === "meta" || tag.tag === "base" || tag.tag === "script") {
            const key = getTagKey(tag.props);
            if (key) {
              let index2 = -1;
              for (let i = 0; i < deduped.length; i++) {
                const prev = deduped[i];
                const prevValue = prev.props[key.name];
                const nextValue = tag.props[key.name];
                if (prev.tag === tag.tag && prevValue === nextValue) {
                  index2 = i;
                  break;
                }
              }
              if (index2 !== -1) {
                deduped.splice(index2, 1);
              }
            }
          }
          deduped.push(tag);
        });
      });
      return deduped;
    },
    addHeadObjs(objs) {
      allHeadObjs.push(objs);
    },
    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter((_objs) => _objs !== objs);
    },
    updateDOM(document2 = window.document) {
      let title;
      let htmlAttrs = {};
      let bodyAttrs = {};
      const actualTags = {};
      for (const tag of head.headTags) {
        if (tag.tag === "title") {
          title = tag.props.children;
          continue;
        }
        if (tag.tag === "htmlAttrs") {
          Object.assign(htmlAttrs, tag.props);
          continue;
        }
        if (tag.tag === "bodyAttrs") {
          Object.assign(bodyAttrs, tag.props);
          continue;
        }
        actualTags[tag.tag] = actualTags[tag.tag] || [];
        actualTags[tag.tag].push(tag);
      }
      if (title !== void 0) {
        document2.title = title;
      }
      setAttrs(document2.documentElement, htmlAttrs);
      setAttrs(document2.body, bodyAttrs);
      const tags = /* @__PURE__ */ new Set([...Object.keys(actualTags), ...previousTags]);
      for (const tag of tags) {
        updateElements(document2, tag, actualTags[tag] || []);
      }
      previousTags.clear();
      Object.keys(actualTags).forEach((i) => previousTags.add(i));
    }
  };
  return head;
};
var tagToString = (tag) => {
  let attrs = stringifyAttrs(tag.props);
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}>`;
  }
  return `<${tag.tag}${attrs}>${tag.props.children || ""}</${tag.tag}>`;
};
var renderHeadToString = (head) => {
  const tags = [];
  let titleTag = "";
  let htmlAttrs = {};
  let bodyAttrs = {};
  for (const tag of head.headTags) {
    if (tag.tag === "title") {
      titleTag = tagToString(tag);
    } else if (tag.tag === "htmlAttrs") {
      Object.assign(htmlAttrs, tag.props);
    } else if (tag.tag === "bodyAttrs") {
      Object.assign(bodyAttrs, tag.props);
    } else {
      tags.push(tagToString(tag));
    }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`);
  return {
    get headTags() {
      return titleTag + tags.join("");
    },
    get htmlAttrs() {
      return stringifyAttrs(__spreadProps2(__spreadValues2({}, htmlAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(",")
      }));
    },
    get bodyAttrs() {
      return stringifyAttrs(__spreadProps2(__spreadValues2({}, bodyAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(",")
      }));
    }
  };
};
function isObject$1(val) {
  return val !== null && typeof val === "object";
}
function _defu(baseObj, defaults, namespace = ".", merger) {
  if (!isObject$1(defaults)) {
    return _defu(baseObj, {}, namespace, merger);
  }
  const obj = Object.assign({}, defaults);
  for (const key in baseObj) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const val = baseObj[key];
    if (val === null || val === void 0) {
      continue;
    }
    if (merger && merger(obj, key, val, namespace)) {
      continue;
    }
    if (Array.isArray(val) && Array.isArray(obj[key])) {
      obj[key] = val.concat(obj[key]);
    } else if (isObject$1(val) && isObject$1(obj[key])) {
      obj[key] = _defu(val, obj[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
    } else {
      obj[key] = val;
    }
  }
  return obj;
}
function createDefu(merger) {
  return (...args) => args.reduce((p, c) => _defu(p, c, "", merger), {});
}
const defu = createDefu();
const F_58_47p45mjn_47node_modules_47nuxt_47dist_47head_47runtime_47lib_47vueuse_45head_46plugin = defineNuxtPlugin((nuxtApp) => {
  const head = createHead();
  nuxtApp.vueApp.use(head);
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    vue_cjs_prod.watchEffect(() => {
      head.updateDOM();
    });
  });
  const titleTemplate = vue_cjs_prod.ref();
  nuxtApp._useHead = (_meta) => {
    const meta2 = vue_cjs_prod.ref(_meta);
    if ("titleTemplate" in meta2.value) {
      titleTemplate.value = meta2.value.titleTemplate;
    }
    const headObj = vue_cjs_prod.computed(() => {
      const overrides = { meta: [] };
      if (titleTemplate.value && "title" in meta2.value) {
        overrides.title = typeof titleTemplate.value === "function" ? titleTemplate.value(meta2.value.title) : titleTemplate.value.replace(/%s/g, meta2.value.title);
      }
      if (meta2.value.charset) {
        overrides.meta.push({ key: "charset", charset: meta2.value.charset });
      }
      if (meta2.value.viewport) {
        overrides.meta.push({ name: "viewport", content: meta2.value.viewport });
      }
      return defu(overrides, meta2.value);
    });
    head.addHeadObjs(headObj);
    {
      return;
    }
  };
  {
    nuxtApp.ssrContext.renderMeta = () => renderHeadToString(head);
  }
});
const removeUndefinedProps = (props) => Object.fromEntries(Object.entries(props).filter(([, value]) => value !== void 0));
const setupForUseMeta = (metaFactory, renderChild) => (props, ctx) => {
  useHead(() => metaFactory(__spreadValues(__spreadValues({}, removeUndefinedProps(props)), ctx.attrs), ctx));
  return () => {
    var _a2, _b2;
    return renderChild ? (_b2 = (_a2 = ctx.slots).default) == null ? void 0 : _b2.call(_a2) : null;
  };
};
const globalProps = {
  accesskey: String,
  autocapitalize: String,
  autofocus: {
    type: Boolean,
    default: void 0
  },
  class: String,
  contenteditable: {
    type: Boolean,
    default: void 0
  },
  contextmenu: String,
  dir: String,
  draggable: {
    type: Boolean,
    default: void 0
  },
  enterkeyhint: String,
  exportparts: String,
  hidden: {
    type: Boolean,
    default: void 0
  },
  id: String,
  inputmode: String,
  is: String,
  itemid: String,
  itemprop: String,
  itemref: String,
  itemscope: String,
  itemtype: String,
  lang: String,
  nonce: String,
  part: String,
  slot: String,
  spellcheck: {
    type: Boolean,
    default: void 0
  },
  style: String,
  tabindex: String,
  title: String,
  translate: String
};
const Script = vue_cjs_prod.defineComponent({
  name: "Script",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues({}, globalProps), {
    async: Boolean,
    crossorigin: {
      type: [Boolean, String],
      default: void 0
    },
    defer: Boolean,
    integrity: String,
    nomodule: Boolean,
    nonce: String,
    referrerpolicy: String,
    src: String,
    type: String,
    charset: String,
    language: String
  }),
  setup: setupForUseMeta((script) => ({
    script: [script]
  }))
});
const Link = vue_cjs_prod.defineComponent({
  name: "Link",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues({}, globalProps), {
    as: String,
    crossorigin: String,
    disabled: Boolean,
    href: String,
    hreflang: String,
    imagesizes: String,
    imagesrcset: String,
    integrity: String,
    media: String,
    prefetch: {
      type: Boolean,
      default: void 0
    },
    referrerpolicy: String,
    rel: String,
    sizes: String,
    title: String,
    type: String,
    methods: String,
    target: String
  }),
  setup: setupForUseMeta((link) => ({
    link: [link]
  }))
});
const Base = vue_cjs_prod.defineComponent({
  name: "Base",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues({}, globalProps), {
    href: String,
    target: String
  }),
  setup: setupForUseMeta((base) => ({
    base
  }))
});
const Title = vue_cjs_prod.defineComponent({
  name: "Title",
  inheritAttrs: false,
  setup: setupForUseMeta((_, { slots }) => {
    var _a2, _b2, _c;
    const title = ((_c = (_b2 = (_a2 = slots.default) == null ? void 0 : _a2.call(slots)) == null ? void 0 : _b2[0]) == null ? void 0 : _c.children) || null;
    return {
      title
    };
  })
});
const Meta = vue_cjs_prod.defineComponent({
  name: "Meta",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues({}, globalProps), {
    charset: String,
    content: String,
    httpEquiv: String,
    name: String
  }),
  setup: setupForUseMeta((meta2) => ({
    meta: [meta2]
  }))
});
const Style = vue_cjs_prod.defineComponent({
  name: "Style",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues({}, globalProps), {
    type: String,
    media: String,
    nonce: String,
    title: String,
    scoped: {
      type: Boolean,
      default: void 0
    }
  }),
  setup: setupForUseMeta((props, { slots }) => {
    var _a2, _b2, _c;
    const style = __spreadValues({}, props);
    const textContent = (_c = (_b2 = (_a2 = slots.default) == null ? void 0 : _a2.call(slots)) == null ? void 0 : _b2[0]) == null ? void 0 : _c.children;
    if (textContent) {
      style.children = textContent;
    }
    return {
      style: [style]
    };
  })
});
const Head = vue_cjs_prod.defineComponent({
  name: "Head",
  inheritAttrs: false,
  setup: (_props, ctx) => () => {
    var _a2, _b2;
    return (_b2 = (_a2 = ctx.slots).default) == null ? void 0 : _b2.call(_a2);
  }
});
const Html = vue_cjs_prod.defineComponent({
  name: "Html",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues({}, globalProps), {
    manifest: String,
    version: String,
    xmlns: String
  }),
  setup: setupForUseMeta((htmlAttrs) => ({ htmlAttrs }), true)
});
const Body = vue_cjs_prod.defineComponent({
  name: "Body",
  inheritAttrs: false,
  props: globalProps,
  setup: setupForUseMeta((bodyAttrs) => ({ bodyAttrs }), true)
});
const Components = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  Script,
  Link,
  Base,
  Title,
  Meta,
  Style,
  Head,
  Html,
  Body
});
const metaConfig = { "globalMeta": { "charset": "utf-8", "viewport": "width=device-width, initial-scale=1", "meta": [{ "name": "viewport", "content": "width=device-width, initial-scale=1" }, { "hid": "description", "name": "description", "content": "India's Best IT COMPANY For Website &amp; Softwares Development." }], "link": [{ "rel": "icon", "type": "image/x-icon", "href": "/favicon.ico" }], "style": [], "script": [], "title": "Glysis Softwares", "titleTemplate": "%s - India's Best IT COMPANY For Website &amp; Softwares Development." } };
const metaMixin = {
  created() {
    const instance = vue_cjs_prod.getCurrentInstance();
    if (!instance) {
      return;
    }
    const options = instance.type;
    if (!options || !("head" in options)) {
      return;
    }
    const nuxtApp = useNuxtApp();
    const source = typeof options.head === "function" ? vue_cjs_prod.computed(() => options.head(nuxtApp)) : options.head;
    useHead(source);
  }
};
const F_58_47p45mjn_47node_modules_47nuxt_47dist_47head_47runtime_47plugin = defineNuxtPlugin((nuxtApp) => {
  useHead(vue_cjs_prod.markRaw(__spreadValues({ title: "" }, metaConfig.globalMeta)));
  nuxtApp.vueApp.mixin(metaMixin);
  for (const name in Components) {
    nuxtApp.vueApp.component(name, Components[name]);
  }
});
const interpolatePath = (route, match) => {
  return match.path.replace(/(:\w+)\([^)]+\)/g, "$1").replace(/(:\w+)[?+*]/g, "$1").replace(/:\w+/g, (r) => {
    var _a2;
    return ((_a2 = route.params[r.slice(1)]) == null ? void 0 : _a2.toString()) || "";
  });
};
const generateRouteKey = (override, routeProps) => {
  var _a2;
  const matchedRoute = routeProps.route.matched.find((m) => m.components.default === routeProps.Component.type);
  const source = (_a2 = override != null ? override : matchedRoute == null ? void 0 : matchedRoute.meta.key) != null ? _a2 : interpolatePath(routeProps.route, matchedRoute);
  return typeof source === "function" ? source(routeProps.route) : source;
};
const wrapInKeepAlive = (props, children) => {
  return { default: () => children };
};
const Fragment = {
  setup(_props, { slots }) {
    return () => {
      var _a2;
      return (_a2 = slots.default) == null ? void 0 : _a2.call(slots);
    };
  }
};
const _wrapIf = (component, props, slots) => {
  return { default: () => props ? vue_cjs_prod.h(component, props === true ? {} : props, slots) : vue_cjs_prod.h(Fragment, {}, slots) };
};
const isNestedKey = Symbol("isNested");
const NuxtPage = vue_cjs_prod.defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs }) {
    const nuxtApp = useNuxtApp();
    const isNested = vue_cjs_prod.inject(isNestedKey, false);
    vue_cjs_prod.provide(isNestedKey, true);
    return () => {
      return vue_cjs_prod.h(vueRouter_cjs_prod.RouterView, __spreadValues({ name: props.name, route: props.route }, attrs), {
        default: (routeProps) => {
          var _a2;
          return routeProps.Component && _wrapIf(vue_cjs_prod.Transition, (_a2 = routeProps.route.meta.pageTransition) != null ? _a2 : defaultPageTransition, wrapInKeepAlive(routeProps.route.meta.keepalive, isNested && nuxtApp.isHydrating ? vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) : vue_cjs_prod.h(vue_cjs_prod.Suspense, {
            onPending: () => nuxtApp.callHook("page:start", routeProps.Component),
            onResolve: () => nuxtApp.callHook("page:finish", routeProps.Component)
          }, { default: () => vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) }))).default();
        }
      });
    };
  }
});
const defaultPageTransition = { name: "page", mode: "out-in" };
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$I = {};
function _sfc_ssrRender$c(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "flex-1 relative py-8" }, _attrs))}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$I = _sfc_main$I.setup;
_sfc_main$I.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Wrapper.vue");
  return _sfc_setup$I ? _sfc_setup$I(props, ctx) : void 0;
};
const __nuxt_component_0$3 = /* @__PURE__ */ _export_sfc(_sfc_main$I, [["ssrRender", _sfc_ssrRender$c]]);
const _sfc_main$H = vue_cjs_prod.defineComponent({
  layout: "dashboard"
});
function _sfc_ssrRender$b(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "lg:px-8 px-4 mb-6" }, _attrs))}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$H = _sfc_main$H.setup;
_sfc_main$H.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Header.vue");
  return _sfc_setup$H ? _sfc_setup$H(props, ctx) : void 0;
};
const __nuxt_component_1$2 = /* @__PURE__ */ _export_sfc(_sfc_main$H, [["ssrRender", _sfc_ssrRender$b]]);
const _sfc_main$G = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Title",
  __ssrInlineRender: true,
  props: {
    text: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "text-4xl font-bold" }, _attrs))}>`);
      serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
        _push(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
      }, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$G = _sfc_main$G.setup;
_sfc_main$G.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Title.vue");
  return _sfc_setup$G ? _sfc_setup$G(props, ctx) : void 0;
};
const _sfc_main$F = {};
function _sfc_ssrRender$a(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(_attrs)}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$F = _sfc_main$F.setup;
_sfc_main$F.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Body.vue");
  return _sfc_setup$F ? _sfc_setup$F(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$F, [["ssrRender", _sfc_ssrRender$a]]);
const _sfc_main$E = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Button",
  __ssrInlineRender: true,
  props: {
    text: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      default: "primary"
    },
    size: {
      type: String,
      default: "md"
    },
    to: {
      type: [String, Object],
      default: void 0
    },
    href: {
      type: String,
      default: void 0
    }
  },
  setup(__props) {
    const props = __props;
    const defaultStyle = `
  cursor-pointer
  border transition-color duration-300
  focus:outline-none focus:ring-1 focus:ring-offset-1 focus:dark:ring-offset-gray-50 focus:dark:ring-gray-400 focus:ring-gray-600/[0.6] focus:ring-offset-gray-800/[0.6]
  flex items-center justify-center font-semibold
`;
    const styles = vue_cjs_prod.reactive({
      primary: "text-white bg-primary-500 hover:bg-primary-400 border-primary-500",
      secondary: "text-slate-800 bg-gray-200 border-gray-200 hover:bg-gray-300 dark:text-white dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700",
      opposite: "text-white bg-gray-800 hover:bg-white hover:text-gray-800 hover:border-gray-900 dark:text-gray-800 dark:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:border-white"
    });
    const sizes = vue_cjs_prod.reactive({
      lg: "h-12 px-8 text-lg rounded-lg",
      md: "h-10 px-6 text-base rounded",
      sm: "h-8 px-4 text-sm rounded",
      xs: "h-6 px-3 text-xs rounded"
    });
    const selectedStyle = vue_cjs_prod.computed(() => styles[props.type] || styles.primary);
    const selectedSize = vue_cjs_prod.computed(() => sizes[props.size] || sizes.lg);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$4;
      if (__props.to) {
        _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtLink, vue_cjs_prod.mergeProps({
          tag: "a",
          to: __props.to,
          class: `${defaultStyle} ${vue_cjs_prod.unref(selectedStyle)} ${vue_cjs_prod.unref(selectedSize)}`
        }, _attrs), {
          default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
                _push2(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
              }, _push2, _parent2, _scopeId);
            } else {
              return [
                vue_cjs_prod.renderSlot(_ctx.$slots, "default", {}, () => [
                  vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(__props.text), 1)
                ])
              ];
            }
          }),
          _: 3
        }, _parent));
      } else {
        _push(`<a${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({
          class: `${defaultStyle} ${vue_cjs_prod.unref(selectedStyle)} ${vue_cjs_prod.unref(selectedSize)}`,
          href: __props.href
        }, _attrs))}>`);
        serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
          _push(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
        }, _push, _parent);
        _push(`</a>`);
      }
    };
  }
});
const _sfc_setup$E = _sfc_main$E.setup;
_sfc_main$E.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Button.vue");
  return _sfc_setup$E ? _sfc_setup$E(props, ctx) : void 0;
};
const _sfc_main$D = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "about",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_Button = _sfc_main$E;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, vue_cjs_prod.mergeProps({ class: "flex flex-col justify-center items-center" }, _attrs), {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.about.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.about.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex flex-col items-center"${_scopeId2}><img src="https://avatars.githubusercontent.com/u/25566363?v=4" class="inline-block rounded-full" alt="thisizprincedev" width="100" height="100"${_scopeId2}>`);
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                    size: "xs",
                    type: "opposite",
                    text: "Prince Dev (@thisizprincedev)",
                    class: "font-extrabold mt-4",
                    href: "https://github.com/thisizprincedev"
                  }, null, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center" }, [
                      vue_cjs_prod.createVNode("img", {
                        src: "https://avatars.githubusercontent.com/u/25566363?v=4",
                        class: "inline-block rounded-full",
                        alt: "thisizprincedev",
                        width: "100",
                        height: "100"
                      }),
                      vue_cjs_prod.createVNode(_component_Button, {
                        size: "xs",
                        type: "opposite",
                        text: "Prince Dev (@thisizprincedev)",
                        class: "font-extrabold mt-4",
                        href: "https://github.com/thisizprincedev"
                      })
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.about.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center" }, [
                    vue_cjs_prod.createVNode("img", {
                      src: "https://avatars.githubusercontent.com/u/25566363?v=4",
                      class: "inline-block rounded-full",
                      alt: "thisizprincedev",
                      width: "100",
                      height: "100"
                    }),
                    vue_cjs_prod.createVNode(_component_Button, {
                      size: "xs",
                      type: "opposite",
                      text: "Prince Dev (@thisizprincedev)",
                      class: "font-extrabold mt-4",
                      href: "https://github.com/thisizprincedev"
                    })
                  ])
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$D = _sfc_main$D.setup;
_sfc_main$D.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/about.vue");
  return _sfc_setup$D ? _sfc_setup$D(props, ctx) : void 0;
};
const meta$5 = {
  layout: "page"
};
const _sfc_main$C = {};
function _sfc_ssrRender$9(_ctx, _push, _parent, _attrs) {
  _push(`<section${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "lg:px-8 px-4 mb-6" }, _attrs))}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</section>`);
}
const _sfc_setup$C = _sfc_main$C.setup;
_sfc_main$C.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Section/index.vue");
  return _sfc_setup$C ? _sfc_setup$C(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$C, [["ssrRender", _sfc_ssrRender$9]]);
const _sfc_main$B = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "blank",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_PageSection = __nuxt_component_4;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.blank.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.blank.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<!--[-->`);
                        serverRenderer.exports.ssrRenderList(30, (i) => {
                          _push4(`<div class="text-6xl uppercase"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.blank.just_blank_page_with_title"))}</div>`);
                        });
                        _push4(`<!--]-->`);
                      } else {
                        return [
                          (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                            return vue_cjs_prod.createVNode("div", {
                              key: i,
                              class: "text-6xl uppercase"
                            }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                          }), 64))
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                          return vue_cjs_prod.createVNode("div", {
                            key: i,
                            class: "text-6xl uppercase"
                          }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                        }), 64))
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.blank.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                        return vue_cjs_prod.createVNode("div", {
                          key: i,
                          class: "text-6xl uppercase"
                        }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                      }), 64))
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$B = _sfc_main$B.setup;
_sfc_main$B.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/blank.vue");
  return _sfc_setup$B ? _sfc_setup$B(props, ctx) : void 0;
};
const meta$4 = {
  layout: "page"
};
const _sfc_main$A = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_PageSection = __nuxt_component_4;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.dashboard.index.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.dashboard.index.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<p${_scopeId3}> Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? </p>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode("p", null, " Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<!--[-->`);
                        serverRenderer.exports.ssrRenderList(30, (i) => {
                          _push4(`<div class="text-6xl uppercase"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.blank.just_blank_page_with_title"))}</div>`);
                        });
                        _push4(`<!--]-->`);
                      } else {
                        return [
                          (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                            return vue_cjs_prod.createVNode("div", {
                              key: i,
                              class: "text-6xl uppercase"
                            }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                          }), 64))
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode("p", null, " Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? ")
                      ]),
                      _: 1
                    }),
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                          return vue_cjs_prod.createVNode("div", {
                            key: i,
                            class: "text-6xl uppercase"
                          }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                        }), 64))
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.dashboard.index.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode("p", null, " Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? ")
                    ]),
                    _: 1
                  }),
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                        return vue_cjs_prod.createVNode("div", {
                          key: i,
                          class: "text-6xl uppercase"
                        }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                      }), 64))
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$A = _sfc_main$A.setup;
_sfc_main$A.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/index.vue");
  return _sfc_setup$A ? _sfc_setup$A(props, ctx) : void 0;
};
const meta$3 = {
  layout: "dashboard"
};
const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
const makeSymbol = (name) => hasSymbol ? Symbol(name) : name;
const generateFormatCacheKey = (locale, key, source) => friendlyJSONstringify({ l: locale, k: key, s: source });
const friendlyJSONstringify = (json) => JSON.stringify(json).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/\u0027/g, "\\u0027");
const isNumber = (val) => typeof val === "number" && isFinite(val);
const isDate = (val) => toTypeString(val) === "[object Date]";
const isRegExp = (val) => toTypeString(val) === "[object RegExp]";
const isEmptyObject = (val) => isPlainObject(val) && Object.keys(val).length === 0;
function warn(msg, err) {
  if (typeof console !== "undefined") {
    console.warn(`[intlify] ` + msg);
    if (err) {
      console.warn(err.stack);
    }
  }
}
const assign = Object.assign;
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {});
};
function escapeHtml(rawText) {
  return rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}
const isArray = Array.isArray;
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isBoolean = (val) => typeof val === "boolean";
const isObject = (val) => val !== null && typeof val === "object";
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const toDisplayString = (val) => {
  return val == null ? "" : isArray(val) || isPlainObject(val) && val.toString === objectToString ? JSON.stringify(val, null, 2) : String(val);
};
/*!
  * message-compiler v9.2.0-beta.30
  * (c) 2022 kazuya kawaguchi
  * Released under the MIT License.
  */
const CompileErrorCodes = {
  EXPECTED_TOKEN: 1,
  INVALID_TOKEN_IN_PLACEHOLDER: 2,
  UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER: 3,
  UNKNOWN_ESCAPE_SEQUENCE: 4,
  INVALID_UNICODE_ESCAPE_SEQUENCE: 5,
  UNBALANCED_CLOSING_BRACE: 6,
  UNTERMINATED_CLOSING_BRACE: 7,
  EMPTY_PLACEHOLDER: 8,
  NOT_ALLOW_NEST_PLACEHOLDER: 9,
  INVALID_LINKED_FORMAT: 10,
  MUST_HAVE_MESSAGES_IN_PLURAL: 11,
  UNEXPECTED_EMPTY_LINKED_MODIFIER: 12,
  UNEXPECTED_EMPTY_LINKED_KEY: 13,
  UNEXPECTED_LEXICAL_ANALYSIS: 14,
  __EXTEND_POINT__: 15
};
function createCompileError(code2, loc, options = {}) {
  const { domain, messages: messages2, args } = options;
  const msg = code2;
  const error = new SyntaxError(String(msg));
  error.code = code2;
  if (loc) {
    error.location = loc;
  }
  error.domain = domain;
  return error;
}
/*!
  * devtools-if v9.2.0-beta.30
  * (c) 2022 kazuya kawaguchi
  * Released under the MIT License.
  */
const IntlifyDevToolsHooks = {
  I18nInit: "i18n:init",
  FunctionTranslate: "function:translate"
};
/*!
  * core-base v9.2.0-beta.30
  * (c) 2022 kazuya kawaguchi
  * Released under the MIT License.
  */
const pathStateMachine = [];
pathStateMachine[0] = {
  ["w"]: [0],
  ["i"]: [3, 0],
  ["["]: [4],
  ["o"]: [7]
};
pathStateMachine[1] = {
  ["w"]: [1],
  ["."]: [2],
  ["["]: [4],
  ["o"]: [7]
};
pathStateMachine[2] = {
  ["w"]: [2],
  ["i"]: [3, 0],
  ["0"]: [3, 0]
};
pathStateMachine[3] = {
  ["i"]: [3, 0],
  ["0"]: [3, 0],
  ["w"]: [1, 1],
  ["."]: [2, 1],
  ["["]: [4, 1],
  ["o"]: [7, 1]
};
pathStateMachine[4] = {
  ["'"]: [5, 0],
  ['"']: [6, 0],
  ["["]: [
    4,
    2
  ],
  ["]"]: [1, 3],
  ["o"]: 8,
  ["l"]: [4, 0]
};
pathStateMachine[5] = {
  ["'"]: [4, 0],
  ["o"]: 8,
  ["l"]: [5, 0]
};
pathStateMachine[6] = {
  ['"']: [4, 0],
  ["o"]: 8,
  ["l"]: [6, 0]
};
const literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
function isLiteral(exp) {
  return literalValueRE.test(exp);
}
function stripQuotes(str) {
  const a = str.charCodeAt(0);
  const b = str.charCodeAt(str.length - 1);
  return a === b && (a === 34 || a === 39) ? str.slice(1, -1) : str;
}
function getPathCharType(ch) {
  if (ch === void 0 || ch === null) {
    return "o";
  }
  const code2 = ch.charCodeAt(0);
  switch (code2) {
    case 91:
    case 93:
    case 46:
    case 34:
    case 39:
      return ch;
    case 95:
    case 36:
    case 45:
      return "i";
    case 9:
    case 10:
    case 13:
    case 160:
    case 65279:
    case 8232:
    case 8233:
      return "w";
  }
  return "i";
}
function formatSubPath(path) {
  const trimmed = path.trim();
  if (path.charAt(0) === "0" && isNaN(parseInt(path))) {
    return false;
  }
  return isLiteral(trimmed) ? stripQuotes(trimmed) : "*" + trimmed;
}
function parse(path) {
  const keys = [];
  let index2 = -1;
  let mode = 0;
  let subPathDepth = 0;
  let c;
  let key;
  let newChar;
  let type;
  let transition;
  let action;
  let typeMap;
  const actions = [];
  actions[0] = () => {
    if (key === void 0) {
      key = newChar;
    } else {
      key += newChar;
    }
  };
  actions[1] = () => {
    if (key !== void 0) {
      keys.push(key);
      key = void 0;
    }
  };
  actions[2] = () => {
    actions[0]();
    subPathDepth++;
  };
  actions[3] = () => {
    if (subPathDepth > 0) {
      subPathDepth--;
      mode = 4;
      actions[0]();
    } else {
      subPathDepth = 0;
      if (key === void 0) {
        return false;
      }
      key = formatSubPath(key);
      if (key === false) {
        return false;
      } else {
        actions[1]();
      }
    }
  };
  function maybeUnescapeQuote() {
    const nextChar = path[index2 + 1];
    if (mode === 5 && nextChar === "'" || mode === 6 && nextChar === '"') {
      index2++;
      newChar = "\\" + nextChar;
      actions[0]();
      return true;
    }
  }
  while (mode !== null) {
    index2++;
    c = path[index2];
    if (c === "\\" && maybeUnescapeQuote()) {
      continue;
    }
    type = getPathCharType(c);
    typeMap = pathStateMachine[mode];
    transition = typeMap[type] || typeMap["l"] || 8;
    if (transition === 8) {
      return;
    }
    mode = transition[0];
    if (transition[1] !== void 0) {
      action = actions[transition[1]];
      if (action) {
        newChar = c;
        if (action() === false) {
          return;
        }
      }
    }
    if (mode === 7) {
      return keys;
    }
  }
}
const cache = /* @__PURE__ */ new Map();
function resolveWithKeyValue(obj, path) {
  return isObject(obj) ? obj[path] : null;
}
function resolveValue(obj, path) {
  if (!isObject(obj)) {
    return null;
  }
  let hit = cache.get(path);
  if (!hit) {
    hit = parse(path);
    if (hit) {
      cache.set(path, hit);
    }
  }
  if (!hit) {
    return null;
  }
  const len = hit.length;
  let last = obj;
  let i = 0;
  while (i < len) {
    const val = last[hit[i]];
    if (val === void 0) {
      return null;
    }
    last = val;
    i++;
  }
  return last;
}
const DEFAULT_MODIFIER = (str) => str;
const DEFAULT_MESSAGE = (ctx) => "";
const DEFAULT_MESSAGE_DATA_TYPE = "text";
const DEFAULT_NORMALIZE = (values) => values.length === 0 ? "" : values.join("");
const DEFAULT_INTERPOLATE = toDisplayString;
function pluralDefault(choice, choicesLength) {
  choice = Math.abs(choice);
  if (choicesLength === 2) {
    return choice ? choice > 1 ? 1 : 0 : 1;
  }
  return choice ? Math.min(choice, 2) : 0;
}
function getPluralIndex(options) {
  const index2 = isNumber(options.pluralIndex) ? options.pluralIndex : -1;
  return options.named && (isNumber(options.named.count) || isNumber(options.named.n)) ? isNumber(options.named.count) ? options.named.count : isNumber(options.named.n) ? options.named.n : index2 : index2;
}
function normalizeNamed(pluralIndex, props) {
  if (!props.count) {
    props.count = pluralIndex;
  }
  if (!props.n) {
    props.n = pluralIndex;
  }
}
function createMessageContext(options = {}) {
  const locale = options.locale;
  const pluralIndex = getPluralIndex(options);
  const pluralRule = isObject(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? options.pluralRules[locale] : pluralDefault;
  const orgPluralRule = isObject(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? pluralDefault : void 0;
  const plural = (messages2) => messages2[pluralRule(pluralIndex, messages2.length, orgPluralRule)];
  const _list = options.list || [];
  const list = (index2) => _list[index2];
  const _named = options.named || {};
  isNumber(options.pluralIndex) && normalizeNamed(pluralIndex, _named);
  const named = (key) => _named[key];
  function message(key) {
    const msg = isFunction(options.messages) ? options.messages(key) : isObject(options.messages) ? options.messages[key] : false;
    return !msg ? options.parent ? options.parent.message(key) : DEFAULT_MESSAGE : msg;
  }
  const _modifier = (name) => options.modifiers ? options.modifiers[name] : DEFAULT_MODIFIER;
  const normalize = isPlainObject(options.processor) && isFunction(options.processor.normalize) ? options.processor.normalize : DEFAULT_NORMALIZE;
  const interpolate = isPlainObject(options.processor) && isFunction(options.processor.interpolate) ? options.processor.interpolate : DEFAULT_INTERPOLATE;
  const type = isPlainObject(options.processor) && isString(options.processor.type) ? options.processor.type : DEFAULT_MESSAGE_DATA_TYPE;
  const ctx = {
    ["list"]: list,
    ["named"]: named,
    ["plural"]: plural,
    ["linked"]: (key, modifier) => {
      const msg = message(key)(ctx);
      return isString(modifier) ? _modifier(modifier)(msg) : msg;
    },
    ["message"]: message,
    ["type"]: type,
    ["interpolate"]: interpolate,
    ["normalize"]: normalize
  };
  return ctx;
}
let devtools = null;
function setDevToolsHook(hook) {
  devtools = hook;
}
function initI18nDevTools(i18n, version, meta2) {
  devtools && devtools.emit(IntlifyDevToolsHooks.I18nInit, {
    timestamp: Date.now(),
    i18n,
    version,
    meta: meta2
  });
}
const translateDevTools = /* @__PURE__ */ createDevToolsHook(IntlifyDevToolsHooks.FunctionTranslate);
function createDevToolsHook(hook) {
  return (payloads) => devtools && devtools.emit(hook, payloads);
}
function fallbackWithSimple(ctx, fallback, start) {
  return [.../* @__PURE__ */ new Set([
    start,
    ...isArray(fallback) ? fallback : isObject(fallback) ? Object.keys(fallback) : isString(fallback) ? [fallback] : [start]
  ])];
}
function fallbackWithLocaleChain(ctx, fallback, start) {
  const startLocale = isString(start) ? start : DEFAULT_LOCALE;
  const context = ctx;
  if (!context.__localeChainCache) {
    context.__localeChainCache = /* @__PURE__ */ new Map();
  }
  let chain = context.__localeChainCache.get(startLocale);
  if (!chain) {
    chain = [];
    let block = [start];
    while (isArray(block)) {
      block = appendBlockToChain(chain, block, fallback);
    }
    const defaults = isArray(fallback) || !isPlainObject(fallback) ? fallback : fallback["default"] ? fallback["default"] : null;
    block = isString(defaults) ? [defaults] : defaults;
    if (isArray(block)) {
      appendBlockToChain(chain, block, false);
    }
    context.__localeChainCache.set(startLocale, chain);
  }
  return chain;
}
function appendBlockToChain(chain, block, blocks) {
  let follow = true;
  for (let i = 0; i < block.length && isBoolean(follow); i++) {
    const locale = block[i];
    if (isString(locale)) {
      follow = appendLocaleToChain(chain, block[i], blocks);
    }
  }
  return follow;
}
function appendLocaleToChain(chain, locale, blocks) {
  let follow;
  const tokens = locale.split("-");
  do {
    const target = tokens.join("-");
    follow = appendItemToChain(chain, target, blocks);
    tokens.splice(-1, 1);
  } while (tokens.length && follow === true);
  return follow;
}
function appendItemToChain(chain, target, blocks) {
  let follow = false;
  if (!chain.includes(target)) {
    follow = true;
    if (target) {
      follow = target[target.length - 1] !== "!";
      const locale = target.replace(/!/g, "");
      chain.push(locale);
      if ((isArray(blocks) || isPlainObject(blocks)) && blocks[locale]) {
        follow = blocks[locale];
      }
    }
  }
  return follow;
}
const VERSION$1 = "9.2.0-beta.30";
const NOT_REOSLVED = -1;
const DEFAULT_LOCALE = "en-US";
const MISSING_RESOLVE_VALUE = "";
function getDefaultLinkedModifiers() {
  return {
    upper: (val) => isString(val) ? val.toUpperCase() : val,
    lower: (val) => isString(val) ? val.toLowerCase() : val,
    capitalize: (val) => isString(val) ? `${val.charAt(0).toLocaleUpperCase()}${val.substr(1)}` : val
  };
}
let _compiler;
let _resolver;
function registerMessageResolver(resolver) {
  _resolver = resolver;
}
let _fallbacker;
function registerLocaleFallbacker(fallbacker) {
  _fallbacker = fallbacker;
}
let _additionalMeta = null;
const setAdditionalMeta = (meta2) => {
  _additionalMeta = meta2;
};
const getAdditionalMeta = () => _additionalMeta;
let _cid = 0;
function createCoreContext(options = {}) {
  const version = isString(options.version) ? options.version : VERSION$1;
  const locale = isString(options.locale) ? options.locale : DEFAULT_LOCALE;
  const fallbackLocale = isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || isString(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : locale;
  const messages2 = isPlainObject(options.messages) ? options.messages : { [locale]: {} };
  const datetimeFormats = isPlainObject(options.datetimeFormats) ? options.datetimeFormats : { [locale]: {} };
  const numberFormats = isPlainObject(options.numberFormats) ? options.numberFormats : { [locale]: {} };
  const modifiers = assign({}, options.modifiers || {}, getDefaultLinkedModifiers());
  const pluralRules = options.pluralRules || {};
  const missing = isFunction(options.missing) ? options.missing : null;
  const missingWarn = isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
  const fallbackWarn = isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
  const fallbackFormat = !!options.fallbackFormat;
  const unresolving = !!options.unresolving;
  const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
  const processor = isPlainObject(options.processor) ? options.processor : null;
  const warnHtmlMessage = isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
  const escapeParameter = !!options.escapeParameter;
  const messageCompiler = isFunction(options.messageCompiler) ? options.messageCompiler : _compiler;
  const messageResolver = isFunction(options.messageResolver) ? options.messageResolver : _resolver || resolveWithKeyValue;
  const localeFallbacker = isFunction(options.localeFallbacker) ? options.localeFallbacker : _fallbacker || fallbackWithSimple;
  const onWarn = isFunction(options.onWarn) ? options.onWarn : warn;
  const internalOptions = options;
  const __datetimeFormatters = isObject(internalOptions.__datetimeFormatters) ? internalOptions.__datetimeFormatters : /* @__PURE__ */ new Map();
  const __numberFormatters = isObject(internalOptions.__numberFormatters) ? internalOptions.__numberFormatters : /* @__PURE__ */ new Map();
  const __meta = isObject(internalOptions.__meta) ? internalOptions.__meta : {};
  _cid++;
  const context = {
    version,
    cid: _cid,
    locale,
    fallbackLocale,
    messages: messages2,
    modifiers,
    pluralRules,
    missing,
    missingWarn,
    fallbackWarn,
    fallbackFormat,
    unresolving,
    postTranslation,
    processor,
    warnHtmlMessage,
    escapeParameter,
    messageCompiler,
    messageResolver,
    localeFallbacker,
    onWarn,
    __meta
  };
  {
    context.datetimeFormats = datetimeFormats;
    context.numberFormats = numberFormats;
    context.__datetimeFormatters = __datetimeFormatters;
    context.__numberFormatters = __numberFormatters;
  }
  if (__INTLIFY_PROD_DEVTOOLS__) {
    initI18nDevTools(context, version, __meta);
  }
  return context;
}
function handleMissing(context, key, locale, missingWarn, type) {
  const { missing, onWarn } = context;
  if (missing !== null) {
    const ret = missing(context, locale, key, type);
    return isString(ret) ? ret : key;
  } else {
    return key;
  }
}
function updateFallbackLocale(ctx, locale, fallback) {
  const context = ctx;
  context.__localeChainCache = /* @__PURE__ */ new Map();
  ctx.localeFallbacker(ctx, fallback, locale);
}
let code$2 = CompileErrorCodes.__EXTEND_POINT__;
const inc$2 = () => ++code$2;
const CoreErrorCodes = {
  INVALID_ARGUMENT: code$2,
  INVALID_DATE_ARGUMENT: inc$2(),
  INVALID_ISO_DATE_ARGUMENT: inc$2(),
  __EXTEND_POINT__: inc$2()
};
function createCoreError(code2) {
  return createCompileError(code2, null, void 0);
}
const NOOP_MESSAGE_FUNCTION = () => "";
const isMessageFunction = (val) => isFunction(val);
function translate(context, ...args) {
  const { fallbackFormat, postTranslation, unresolving, messageCompiler, fallbackLocale, messages: messages2 } = context;
  const [key, options] = parseTranslateArgs(...args);
  const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
  const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
  const escapeParameter = isBoolean(options.escapeParameter) ? options.escapeParameter : context.escapeParameter;
  const resolvedMessage = !!options.resolvedMessage;
  const defaultMsgOrKey = isString(options.default) || isBoolean(options.default) ? !isBoolean(options.default) ? options.default : key : fallbackFormat ? !messageCompiler ? () => key : key : "";
  const enableDefaultMsg = fallbackFormat || defaultMsgOrKey !== "";
  const locale = isString(options.locale) ? options.locale : context.locale;
  escapeParameter && escapeParams(options);
  let [formatScope, targetLocale, message] = !resolvedMessage ? resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) : [
    key,
    locale,
    messages2[locale] || {}
  ];
  let format2 = formatScope;
  let cacheBaseKey = key;
  if (!resolvedMessage && !(isString(format2) || isMessageFunction(format2))) {
    if (enableDefaultMsg) {
      format2 = defaultMsgOrKey;
      cacheBaseKey = format2;
    }
  }
  if (!resolvedMessage && (!(isString(format2) || isMessageFunction(format2)) || !isString(targetLocale))) {
    return unresolving ? NOT_REOSLVED : key;
  }
  let occurred = false;
  const errorDetector = () => {
    occurred = true;
  };
  const msg = !isMessageFunction(format2) ? compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, errorDetector) : format2;
  if (occurred) {
    return format2;
  }
  const ctxOptions = getMessageContextOptions(context, targetLocale, message, options);
  const msgContext = createMessageContext(ctxOptions);
  const messaged = evaluateMessage(context, msg, msgContext);
  const ret = postTranslation ? postTranslation(messaged) : messaged;
  if (__INTLIFY_PROD_DEVTOOLS__) {
    const payloads = {
      timestamp: Date.now(),
      key: isString(key) ? key : isMessageFunction(format2) ? format2.key : "",
      locale: targetLocale || (isMessageFunction(format2) ? format2.locale : ""),
      format: isString(format2) ? format2 : isMessageFunction(format2) ? format2.source : "",
      message: ret
    };
    payloads.meta = assign({}, context.__meta, getAdditionalMeta() || {});
    translateDevTools(payloads);
  }
  return ret;
}
function escapeParams(options) {
  if (isArray(options.list)) {
    options.list = options.list.map((item) => isString(item) ? escapeHtml(item) : item);
  } else if (isObject(options.named)) {
    Object.keys(options.named).forEach((key) => {
      if (isString(options.named[key])) {
        options.named[key] = escapeHtml(options.named[key]);
      }
    });
  }
}
function resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) {
  const { messages: messages2, onWarn, messageResolver: resolveValue2, localeFallbacker } = context;
  const locales = localeFallbacker(context, fallbackLocale, locale);
  let message = {};
  let targetLocale;
  let format2 = null;
  const type = "translate";
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i];
    message = messages2[targetLocale] || {};
    if ((format2 = resolveValue2(message, key)) === null) {
      format2 = message[key];
    }
    if (isString(format2) || isFunction(format2))
      break;
    const missingRet = handleMissing(context, key, targetLocale, missingWarn, type);
    if (missingRet !== key) {
      format2 = missingRet;
    }
  }
  return [format2, targetLocale, message];
}
function compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, errorDetector) {
  const { messageCompiler, warnHtmlMessage } = context;
  if (isMessageFunction(format2)) {
    const msg2 = format2;
    msg2.locale = msg2.locale || targetLocale;
    msg2.key = msg2.key || key;
    return msg2;
  }
  const msg = messageCompiler(format2, getCompileOptions(context, targetLocale, cacheBaseKey, format2, warnHtmlMessage, errorDetector));
  msg.locale = targetLocale;
  msg.key = key;
  msg.source = format2;
  return msg;
}
function evaluateMessage(context, msg, msgCtx) {
  const messaged = msg(msgCtx);
  return messaged;
}
function parseTranslateArgs(...args) {
  const [arg1, arg2, arg3] = args;
  const options = {};
  if (!isString(arg1) && !isNumber(arg1) && !isMessageFunction(arg1)) {
    throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
  }
  const key = isNumber(arg1) ? String(arg1) : isMessageFunction(arg1) ? arg1 : arg1;
  if (isNumber(arg2)) {
    options.plural = arg2;
  } else if (isString(arg2)) {
    options.default = arg2;
  } else if (isPlainObject(arg2) && !isEmptyObject(arg2)) {
    options.named = arg2;
  } else if (isArray(arg2)) {
    options.list = arg2;
  }
  if (isNumber(arg3)) {
    options.plural = arg3;
  } else if (isString(arg3)) {
    options.default = arg3;
  } else if (isPlainObject(arg3)) {
    assign(options, arg3);
  }
  return [key, options];
}
function getCompileOptions(context, locale, key, source, warnHtmlMessage, errorDetector) {
  return {
    warnHtmlMessage,
    onError: (err) => {
      errorDetector && errorDetector(err);
      {
        throw err;
      }
    },
    onCacheKey: (source2) => generateFormatCacheKey(locale, key, source2)
  };
}
function getMessageContextOptions(context, locale, message, options) {
  const { modifiers, pluralRules, messageResolver: resolveValue2 } = context;
  const resolveMessage = (key) => {
    const val = resolveValue2(message, key);
    if (isString(val)) {
      let occurred = false;
      const errorDetector = () => {
        occurred = true;
      };
      const msg = compileMessageFormat(context, key, locale, val, key, errorDetector);
      return !occurred ? msg : NOOP_MESSAGE_FUNCTION;
    } else if (isMessageFunction(val)) {
      return val;
    } else {
      return NOOP_MESSAGE_FUNCTION;
    }
  };
  const ctxOptions = {
    locale,
    modifiers,
    pluralRules,
    messages: resolveMessage
  };
  if (context.processor) {
    ctxOptions.processor = context.processor;
  }
  if (options.list) {
    ctxOptions.list = options.list;
  }
  if (options.named) {
    ctxOptions.named = options.named;
  }
  if (isNumber(options.plural)) {
    ctxOptions.pluralIndex = options.plural;
  }
  return ctxOptions;
}
function datetime(context, ...args) {
  const { datetimeFormats, unresolving, fallbackLocale, onWarn, localeFallbacker } = context;
  const { __datetimeFormatters } = context;
  const [key, value, options, overrides] = parseDateTimeArgs(...args);
  const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
  isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
  const part = !!options.part;
  const locale = isString(options.locale) ? options.locale : context.locale;
  const locales = localeFallbacker(context, fallbackLocale, locale);
  if (!isString(key) || key === "") {
    return new Intl.DateTimeFormat(locale).format(value);
  }
  let datetimeFormat = {};
  let targetLocale;
  let format2 = null;
  const type = "datetime format";
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i];
    datetimeFormat = datetimeFormats[targetLocale] || {};
    format2 = datetimeFormat[key];
    if (isPlainObject(format2))
      break;
    handleMissing(context, key, targetLocale, missingWarn, type);
  }
  if (!isPlainObject(format2) || !isString(targetLocale)) {
    return unresolving ? NOT_REOSLVED : key;
  }
  let id = `${targetLocale}__${key}`;
  if (!isEmptyObject(overrides)) {
    id = `${id}__${JSON.stringify(overrides)}`;
  }
  let formatter = __datetimeFormatters.get(id);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(targetLocale, assign({}, format2, overrides));
    __datetimeFormatters.set(id, formatter);
  }
  return !part ? formatter.format(value) : formatter.formatToParts(value);
}
function parseDateTimeArgs(...args) {
  const [arg1, arg2, arg3, arg4] = args;
  let options = {};
  let overrides = {};
  let value;
  if (isString(arg1)) {
    const matches = arg1.match(/(\d{4}-\d{2}-\d{2})(T|\s)?(.*)/);
    if (!matches) {
      throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
    }
    const dateTime = matches[3] ? matches[3].trim().startsWith("T") ? `${matches[1].trim()}${matches[3].trim()}` : `${matches[1].trim()}T${matches[3].trim()}` : matches[1].trim();
    value = new Date(dateTime);
    try {
      value.toISOString();
    } catch (e) {
      throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
    }
  } else if (isDate(arg1)) {
    if (isNaN(arg1.getTime())) {
      throw createCoreError(CoreErrorCodes.INVALID_DATE_ARGUMENT);
    }
    value = arg1;
  } else if (isNumber(arg1)) {
    value = arg1;
  } else {
    throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
  }
  if (isString(arg2)) {
    options.key = arg2;
  } else if (isPlainObject(arg2)) {
    options = arg2;
  }
  if (isString(arg3)) {
    options.locale = arg3;
  } else if (isPlainObject(arg3)) {
    overrides = arg3;
  }
  if (isPlainObject(arg4)) {
    overrides = arg4;
  }
  return [options.key || "", value, options, overrides];
}
function clearDateTimeFormat(ctx, locale, format2) {
  const context = ctx;
  for (const key in format2) {
    const id = `${locale}__${key}`;
    if (!context.__datetimeFormatters.has(id)) {
      continue;
    }
    context.__datetimeFormatters.delete(id);
  }
}
function number(context, ...args) {
  const { numberFormats, unresolving, fallbackLocale, onWarn, localeFallbacker } = context;
  const { __numberFormatters } = context;
  const [key, value, options, overrides] = parseNumberArgs(...args);
  const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
  isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
  const part = !!options.part;
  const locale = isString(options.locale) ? options.locale : context.locale;
  const locales = localeFallbacker(context, fallbackLocale, locale);
  if (!isString(key) || key === "") {
    return new Intl.NumberFormat(locale).format(value);
  }
  let numberFormat = {};
  let targetLocale;
  let format2 = null;
  const type = "number format";
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i];
    numberFormat = numberFormats[targetLocale] || {};
    format2 = numberFormat[key];
    if (isPlainObject(format2))
      break;
    handleMissing(context, key, targetLocale, missingWarn, type);
  }
  if (!isPlainObject(format2) || !isString(targetLocale)) {
    return unresolving ? NOT_REOSLVED : key;
  }
  let id = `${targetLocale}__${key}`;
  if (!isEmptyObject(overrides)) {
    id = `${id}__${JSON.stringify(overrides)}`;
  }
  let formatter = __numberFormatters.get(id);
  if (!formatter) {
    formatter = new Intl.NumberFormat(targetLocale, assign({}, format2, overrides));
    __numberFormatters.set(id, formatter);
  }
  return !part ? formatter.format(value) : formatter.formatToParts(value);
}
function parseNumberArgs(...args) {
  const [arg1, arg2, arg3, arg4] = args;
  let options = {};
  let overrides = {};
  if (!isNumber(arg1)) {
    throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
  }
  const value = arg1;
  if (isString(arg2)) {
    options.key = arg2;
  } else if (isPlainObject(arg2)) {
    options = arg2;
  }
  if (isString(arg3)) {
    options.locale = arg3;
  } else if (isPlainObject(arg3)) {
    overrides = arg3;
  }
  if (isPlainObject(arg4)) {
    overrides = arg4;
  }
  return [options.key || "", value, options, overrides];
}
function clearNumberFormat(ctx, locale, format2) {
  const context = ctx;
  for (const key in format2) {
    const id = `${locale}__${key}`;
    if (!context.__numberFormatters.has(id)) {
      continue;
    }
    context.__numberFormatters.delete(id);
  }
}
{
  if (typeof __INTLIFY_PROD_DEVTOOLS__ !== "boolean") {
    getGlobalThis().__INTLIFY_PROD_DEVTOOLS__ = false;
  }
}
/*!
  * vue-i18n v9.2.0-beta.30
  * (c) 2022 kazuya kawaguchi
  * Released under the MIT License.
  */
const VERSION = "9.2.0-beta.30";
function initFeatureFlags() {
  if (typeof __INTLIFY_PROD_DEVTOOLS__ !== "boolean") {
    getGlobalThis().__INTLIFY_PROD_DEVTOOLS__ = false;
  }
}
let code = CompileErrorCodes.__EXTEND_POINT__;
const inc = () => ++code;
const I18nErrorCodes = {
  UNEXPECTED_RETURN_TYPE: code,
  INVALID_ARGUMENT: inc(),
  MUST_BE_CALL_SETUP_TOP: inc(),
  NOT_INSLALLED: inc(),
  NOT_AVAILABLE_IN_LEGACY_MODE: inc(),
  REQUIRED_VALUE: inc(),
  INVALID_VALUE: inc(),
  CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN: inc(),
  NOT_INSLALLED_WITH_PROVIDE: inc(),
  UNEXPECTED_ERROR: inc(),
  NOT_COMPATIBLE_LEGACY_VUE_I18N: inc(),
  BRIDGE_SUPPORT_VUE_2_ONLY: inc(),
  __EXTEND_POINT__: inc()
};
function createI18nError(code2, ...args) {
  return createCompileError(code2, null, void 0);
}
const TransrateVNodeSymbol = /* @__PURE__ */ makeSymbol("__transrateVNode");
const DatetimePartsSymbol = /* @__PURE__ */ makeSymbol("__datetimeParts");
const NumberPartsSymbol = /* @__PURE__ */ makeSymbol("__numberParts");
const SetPluralRulesSymbol = makeSymbol("__setPluralRules");
const InejctWithOption = /* @__PURE__ */ makeSymbol("__injectWithOption");
function handleFlatJson(obj) {
  if (!isObject(obj)) {
    return obj;
  }
  for (const key in obj) {
    if (!hasOwn(obj, key)) {
      continue;
    }
    if (!key.includes(".")) {
      if (isObject(obj[key])) {
        handleFlatJson(obj[key]);
      }
    } else {
      const subKeys = key.split(".");
      const lastIndex = subKeys.length - 1;
      let currentObj = obj;
      for (let i = 0; i < lastIndex; i++) {
        if (!(subKeys[i] in currentObj)) {
          currentObj[subKeys[i]] = {};
        }
        currentObj = currentObj[subKeys[i]];
      }
      currentObj[subKeys[lastIndex]] = obj[key];
      delete obj[key];
      if (isObject(currentObj[subKeys[lastIndex]])) {
        handleFlatJson(currentObj[subKeys[lastIndex]]);
      }
    }
  }
  return obj;
}
function getLocaleMessages(locale, options) {
  const { messages: messages2, __i18n, messageResolver, flatJson } = options;
  const ret = isPlainObject(messages2) ? messages2 : isArray(__i18n) ? {} : { [locale]: {} };
  if (isArray(__i18n)) {
    __i18n.forEach((custom) => {
      if ("locale" in custom && "resource" in custom) {
        const { locale: locale2, resource } = custom;
        if (locale2) {
          ret[locale2] = ret[locale2] || {};
          deepCopy(resource, ret[locale2]);
        } else {
          deepCopy(resource, ret);
        }
      } else {
        isString(custom) && deepCopy(JSON.parse(custom), ret);
      }
    });
  }
  if (messageResolver == null && flatJson) {
    for (const key in ret) {
      if (hasOwn(ret, key)) {
        handleFlatJson(ret[key]);
      }
    }
  }
  return ret;
}
const isNotObjectOrIsArray = (val) => !isObject(val) || isArray(val);
function deepCopy(src, des) {
  if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) {
    throw createI18nError(I18nErrorCodes.INVALID_VALUE);
  }
  for (const key in src) {
    if (hasOwn(src, key)) {
      if (isNotObjectOrIsArray(src[key]) || isNotObjectOrIsArray(des[key])) {
        des[key] = src[key];
      } else {
        deepCopy(src[key], des[key]);
      }
    }
  }
}
function getComponentOptions(instance) {
  return instance.type;
}
function adjustI18nResources(global2, options, componentOptions) {
  let messages2 = isObject(options.messages) ? options.messages : {};
  if ("__i18nGlobal" in componentOptions) {
    messages2 = getLocaleMessages(globalThis.locale.value, {
      messages: messages2,
      __i18n: componentOptions.__i18nGlobal
    });
  }
  const locales = Object.keys(messages2);
  if (locales.length) {
    locales.forEach((locale) => {
      global2.mergeLocaleMessage(locale, messages2[locale]);
    });
  }
  {
    if (isObject(options.datetimeFormats)) {
      const locales2 = Object.keys(options.datetimeFormats);
      if (locales2.length) {
        locales2.forEach((locale) => {
          global2.mergeDateTimeFormat(locale, options.datetimeFormats[locale]);
        });
      }
    }
    if (isObject(options.numberFormats)) {
      const locales2 = Object.keys(options.numberFormats);
      if (locales2.length) {
        locales2.forEach((locale) => {
          global2.mergeNumberFormat(locale, options.numberFormats[locale]);
        });
      }
    }
  }
}
function createTextNode(key) {
  return vue_cjs_prod.createVNode(vue_cjs_prod.Text, null, key, 0);
}
const DEVTOOLS_META = "__INTLIFY_META__";
let composerID = 0;
function defineCoreMissingHandler(missing) {
  return (ctx, locale, key, type) => {
    return missing(locale, key, vue_cjs_prod.getCurrentInstance() || void 0, type);
  };
}
const getMetaInfo = () => {
  const instance = vue_cjs_prod.getCurrentInstance();
  let meta2 = null;
  return instance && (meta2 = getComponentOptions(instance)[DEVTOOLS_META]) ? { [DEVTOOLS_META]: meta2 } : null;
};
function createComposer(options = {}, VueI18nLegacy) {
  const { __root } = options;
  const _isGlobal = __root === void 0;
  let _inheritLocale = isBoolean(options.inheritLocale) ? options.inheritLocale : true;
  const _locale = vue_cjs_prod.ref(__root && _inheritLocale ? __root.locale.value : isString(options.locale) ? options.locale : DEFAULT_LOCALE);
  const _fallbackLocale = vue_cjs_prod.ref(__root && _inheritLocale ? __root.fallbackLocale.value : isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : _locale.value);
  const _messages = vue_cjs_prod.ref(getLocaleMessages(_locale.value, options));
  const _datetimeFormats = vue_cjs_prod.ref(isPlainObject(options.datetimeFormats) ? options.datetimeFormats : { [_locale.value]: {} });
  const _numberFormats = vue_cjs_prod.ref(isPlainObject(options.numberFormats) ? options.numberFormats : { [_locale.value]: {} });
  let _missingWarn = __root ? __root.missingWarn : isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
  let _fallbackWarn = __root ? __root.fallbackWarn : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
  let _fallbackRoot = __root ? __root.fallbackRoot : isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
  let _fallbackFormat = !!options.fallbackFormat;
  let _missing = isFunction(options.missing) ? options.missing : null;
  let _runtimeMissing = isFunction(options.missing) ? defineCoreMissingHandler(options.missing) : null;
  let _postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
  let _warnHtmlMessage = __root ? __root.warnHtmlMessage : isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
  let _escapeParameter = !!options.escapeParameter;
  const _modifiers = __root ? __root.modifiers : isPlainObject(options.modifiers) ? options.modifiers : {};
  let _pluralRules = options.pluralRules || __root && __root.pluralRules;
  let _context;
  function getCoreContext() {
    const ctxOptions = {
      version: VERSION,
      locale: _locale.value,
      fallbackLocale: _fallbackLocale.value,
      messages: _messages.value,
      modifiers: _modifiers,
      pluralRules: _pluralRules,
      missing: _runtimeMissing === null ? void 0 : _runtimeMissing,
      missingWarn: _missingWarn,
      fallbackWarn: _fallbackWarn,
      fallbackFormat: _fallbackFormat,
      unresolving: true,
      postTranslation: _postTranslation === null ? void 0 : _postTranslation,
      warnHtmlMessage: _warnHtmlMessage,
      escapeParameter: _escapeParameter,
      messageResolver: options.messageResolver,
      __meta: { framework: "vue" }
    };
    {
      ctxOptions.datetimeFormats = _datetimeFormats.value;
      ctxOptions.numberFormats = _numberFormats.value;
      ctxOptions.__datetimeFormatters = isPlainObject(_context) ? _context.__datetimeFormatters : void 0;
      ctxOptions.__numberFormatters = isPlainObject(_context) ? _context.__numberFormatters : void 0;
    }
    return createCoreContext(ctxOptions);
  }
  _context = getCoreContext();
  updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
  function trackReactivityValues() {
    return [
      _locale.value,
      _fallbackLocale.value,
      _messages.value,
      _datetimeFormats.value,
      _numberFormats.value
    ];
  }
  const locale = vue_cjs_prod.computed({
    get: () => _locale.value,
    set: (val) => {
      _locale.value = val;
      _context.locale = _locale.value;
    }
  });
  const fallbackLocale = vue_cjs_prod.computed({
    get: () => _fallbackLocale.value,
    set: (val) => {
      _fallbackLocale.value = val;
      _context.fallbackLocale = _fallbackLocale.value;
      updateFallbackLocale(_context, _locale.value, val);
    }
  });
  const messages2 = vue_cjs_prod.computed(() => _messages.value);
  const datetimeFormats = /* @__PURE__ */ vue_cjs_prod.computed(() => _datetimeFormats.value);
  const numberFormats = /* @__PURE__ */ vue_cjs_prod.computed(() => _numberFormats.value);
  function getPostTranslationHandler() {
    return isFunction(_postTranslation) ? _postTranslation : null;
  }
  function setPostTranslationHandler(handler) {
    _postTranslation = handler;
    _context.postTranslation = handler;
  }
  function getMissingHandler() {
    return _missing;
  }
  function setMissingHandler(handler) {
    if (handler !== null) {
      _runtimeMissing = defineCoreMissingHandler(handler);
    }
    _missing = handler;
    _context.missing = _runtimeMissing;
  }
  function wrapWithDeps(fn, argumentParser, warnType, fallbackSuccess, fallbackFail, successCondition) {
    trackReactivityValues();
    let ret;
    if (__INTLIFY_PROD_DEVTOOLS__) {
      try {
        setAdditionalMeta(getMetaInfo());
        ret = fn(_context);
      } finally {
        setAdditionalMeta(null);
      }
    } else {
      ret = fn(_context);
    }
    if (isNumber(ret) && ret === NOT_REOSLVED) {
      const [key, arg2] = argumentParser();
      return __root && _fallbackRoot ? fallbackSuccess(__root) : fallbackFail(key);
    } else if (successCondition(ret)) {
      return ret;
    } else {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_RETURN_TYPE);
    }
  }
  function t(...args) {
    return wrapWithDeps((context) => Reflect.apply(translate, null, [context, ...args]), () => parseTranslateArgs(...args), "translate", (root) => Reflect.apply(root.t, root, [...args]), (key) => key, (val) => isString(val));
  }
  function rt2(...args) {
    const [arg1, arg2, arg3] = args;
    if (arg3 && !isObject(arg3)) {
      throw createI18nError(I18nErrorCodes.INVALID_ARGUMENT);
    }
    return t(...[arg1, arg2, assign({ resolvedMessage: true }, arg3 || {})]);
  }
  function d(...args) {
    return wrapWithDeps((context) => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), "datetime format", (root) => Reflect.apply(root.d, root, [...args]), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
  }
  function n(...args) {
    return wrapWithDeps((context) => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), "number format", (root) => Reflect.apply(root.n, root, [...args]), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
  }
  function normalize(values) {
    return values.map((val) => isString(val) ? createTextNode(val) : val);
  }
  const interpolate = (val) => val;
  const processor = {
    normalize,
    interpolate,
    type: "vnode"
  };
  function transrateVNode(...args) {
    return wrapWithDeps((context) => {
      let ret;
      const _context2 = context;
      try {
        _context2.processor = processor;
        ret = Reflect.apply(translate, null, [_context2, ...args]);
      } finally {
        _context2.processor = null;
      }
      return ret;
    }, () => parseTranslateArgs(...args), "translate", (root) => root[TransrateVNodeSymbol](...args), (key) => [createTextNode(key)], (val) => isArray(val));
  }
  function numberParts(...args) {
    return wrapWithDeps((context) => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), "number format", (root) => root[NumberPartsSymbol](...args), () => [], (val) => isString(val) || isArray(val));
  }
  function datetimeParts(...args) {
    return wrapWithDeps((context) => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), "datetime format", (root) => root[DatetimePartsSymbol](...args), () => [], (val) => isString(val) || isArray(val));
  }
  function setPluralRules(rules) {
    _pluralRules = rules;
    _context.pluralRules = _pluralRules;
  }
  function te2(key, locale2) {
    const targetLocale = isString(locale2) ? locale2 : _locale.value;
    const message = getLocaleMessage(targetLocale);
    return _context.messageResolver(message, key) !== null;
  }
  function resolveMessages(key) {
    let messages3 = null;
    const locales = fallbackWithLocaleChain(_context, _fallbackLocale.value, _locale.value);
    for (let i = 0; i < locales.length; i++) {
      const targetLocaleMessages = _messages.value[locales[i]] || {};
      const messageValue = _context.messageResolver(targetLocaleMessages, key);
      if (messageValue != null) {
        messages3 = messageValue;
        break;
      }
    }
    return messages3;
  }
  function tm(key) {
    const messages3 = resolveMessages(key);
    return messages3 != null ? messages3 : __root ? __root.tm(key) || {} : {};
  }
  function getLocaleMessage(locale2) {
    return _messages.value[locale2] || {};
  }
  function setLocaleMessage(locale2, message) {
    _messages.value[locale2] = message;
    _context.messages = _messages.value;
  }
  function mergeLocaleMessage(locale2, message) {
    _messages.value[locale2] = _messages.value[locale2] || {};
    deepCopy(message, _messages.value[locale2]);
    _context.messages = _messages.value;
  }
  function getDateTimeFormat(locale2) {
    return _datetimeFormats.value[locale2] || {};
  }
  function setDateTimeFormat(locale2, format2) {
    _datetimeFormats.value[locale2] = format2;
    _context.datetimeFormats = _datetimeFormats.value;
    clearDateTimeFormat(_context, locale2, format2);
  }
  function mergeDateTimeFormat(locale2, format2) {
    _datetimeFormats.value[locale2] = assign(_datetimeFormats.value[locale2] || {}, format2);
    _context.datetimeFormats = _datetimeFormats.value;
    clearDateTimeFormat(_context, locale2, format2);
  }
  function getNumberFormat(locale2) {
    return _numberFormats.value[locale2] || {};
  }
  function setNumberFormat(locale2, format2) {
    _numberFormats.value[locale2] = format2;
    _context.numberFormats = _numberFormats.value;
    clearNumberFormat(_context, locale2, format2);
  }
  function mergeNumberFormat(locale2, format2) {
    _numberFormats.value[locale2] = assign(_numberFormats.value[locale2] || {}, format2);
    _context.numberFormats = _numberFormats.value;
    clearNumberFormat(_context, locale2, format2);
  }
  composerID++;
  if (__root) {
    vue_cjs_prod.watch(__root.locale, (val) => {
      if (_inheritLocale) {
        _locale.value = val;
        _context.locale = val;
        updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
      }
    });
    vue_cjs_prod.watch(__root.fallbackLocale, (val) => {
      if (_inheritLocale) {
        _fallbackLocale.value = val;
        _context.fallbackLocale = val;
        updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
      }
    });
  }
  const composer = {
    id: composerID,
    locale,
    fallbackLocale,
    get inheritLocale() {
      return _inheritLocale;
    },
    set inheritLocale(val) {
      _inheritLocale = val;
      if (val && __root) {
        _locale.value = __root.locale.value;
        _fallbackLocale.value = __root.fallbackLocale.value;
        updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
      }
    },
    get availableLocales() {
      return Object.keys(_messages.value).sort();
    },
    messages: messages2,
    get modifiers() {
      return _modifiers;
    },
    get pluralRules() {
      return _pluralRules || {};
    },
    get isGlobal() {
      return _isGlobal;
    },
    get missingWarn() {
      return _missingWarn;
    },
    set missingWarn(val) {
      _missingWarn = val;
      _context.missingWarn = _missingWarn;
    },
    get fallbackWarn() {
      return _fallbackWarn;
    },
    set fallbackWarn(val) {
      _fallbackWarn = val;
      _context.fallbackWarn = _fallbackWarn;
    },
    get fallbackRoot() {
      return _fallbackRoot;
    },
    set fallbackRoot(val) {
      _fallbackRoot = val;
    },
    get fallbackFormat() {
      return _fallbackFormat;
    },
    set fallbackFormat(val) {
      _fallbackFormat = val;
      _context.fallbackFormat = _fallbackFormat;
    },
    get warnHtmlMessage() {
      return _warnHtmlMessage;
    },
    set warnHtmlMessage(val) {
      _warnHtmlMessage = val;
      _context.warnHtmlMessage = val;
    },
    get escapeParameter() {
      return _escapeParameter;
    },
    set escapeParameter(val) {
      _escapeParameter = val;
      _context.escapeParameter = val;
    },
    t,
    getLocaleMessage,
    setLocaleMessage,
    mergeLocaleMessage,
    getPostTranslationHandler,
    setPostTranslationHandler,
    getMissingHandler,
    setMissingHandler,
    [SetPluralRulesSymbol]: setPluralRules
  };
  {
    composer.datetimeFormats = datetimeFormats;
    composer.numberFormats = numberFormats;
    composer.rt = rt2;
    composer.te = te2;
    composer.tm = tm;
    composer.d = d;
    composer.n = n;
    composer.getDateTimeFormat = getDateTimeFormat;
    composer.setDateTimeFormat = setDateTimeFormat;
    composer.mergeDateTimeFormat = mergeDateTimeFormat;
    composer.getNumberFormat = getNumberFormat;
    composer.setNumberFormat = setNumberFormat;
    composer.mergeNumberFormat = mergeNumberFormat;
    composer[InejctWithOption] = options.__injectWithOption;
    composer[TransrateVNodeSymbol] = transrateVNode;
    composer[DatetimePartsSymbol] = datetimeParts;
    composer[NumberPartsSymbol] = numberParts;
  }
  return composer;
}
function convertComposerOptions(options) {
  const locale = isString(options.locale) ? options.locale : DEFAULT_LOCALE;
  const fallbackLocale = isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : locale;
  const missing = isFunction(options.missing) ? options.missing : void 0;
  const missingWarn = isBoolean(options.silentTranslationWarn) || isRegExp(options.silentTranslationWarn) ? !options.silentTranslationWarn : true;
  const fallbackWarn = isBoolean(options.silentFallbackWarn) || isRegExp(options.silentFallbackWarn) ? !options.silentFallbackWarn : true;
  const fallbackRoot = isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
  const fallbackFormat = !!options.formatFallbackMessages;
  const modifiers = isPlainObject(options.modifiers) ? options.modifiers : {};
  const pluralizationRules = options.pluralizationRules;
  const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : void 0;
  const warnHtmlMessage = isString(options.warnHtmlInMessage) ? options.warnHtmlInMessage !== "off" : true;
  const escapeParameter = !!options.escapeParameterHtml;
  const inheritLocale = isBoolean(options.sync) ? options.sync : true;
  let messages2 = options.messages;
  if (isPlainObject(options.sharedMessages)) {
    const sharedMessages = options.sharedMessages;
    const locales = Object.keys(sharedMessages);
    messages2 = locales.reduce((messages3, locale2) => {
      const message = messages3[locale2] || (messages3[locale2] = {});
      assign(message, sharedMessages[locale2]);
      return messages3;
    }, messages2 || {});
  }
  const { __i18n, __root, __injectWithOption } = options;
  const datetimeFormats = options.datetimeFormats;
  const numberFormats = options.numberFormats;
  const flatJson = options.flatJson;
  return {
    locale,
    fallbackLocale,
    messages: messages2,
    flatJson,
    datetimeFormats,
    numberFormats,
    missing,
    missingWarn,
    fallbackWarn,
    fallbackRoot,
    fallbackFormat,
    modifiers,
    pluralRules: pluralizationRules,
    postTranslation,
    warnHtmlMessage,
    escapeParameter,
    messageResolver: options.messageResolver,
    inheritLocale,
    __i18n,
    __root,
    __injectWithOption
  };
}
function createVueI18n(options = {}, VueI18nLegacy) {
  {
    const composer = createComposer(convertComposerOptions(options));
    const vueI18n = {
      id: composer.id,
      get locale() {
        return composer.locale.value;
      },
      set locale(val) {
        composer.locale.value = val;
      },
      get fallbackLocale() {
        return composer.fallbackLocale.value;
      },
      set fallbackLocale(val) {
        composer.fallbackLocale.value = val;
      },
      get messages() {
        return composer.messages.value;
      },
      get datetimeFormats() {
        return composer.datetimeFormats.value;
      },
      get numberFormats() {
        return composer.numberFormats.value;
      },
      get availableLocales() {
        return composer.availableLocales;
      },
      get formatter() {
        return {
          interpolate() {
            return [];
          }
        };
      },
      set formatter(val) {
      },
      get missing() {
        return composer.getMissingHandler();
      },
      set missing(handler) {
        composer.setMissingHandler(handler);
      },
      get silentTranslationWarn() {
        return isBoolean(composer.missingWarn) ? !composer.missingWarn : composer.missingWarn;
      },
      set silentTranslationWarn(val) {
        composer.missingWarn = isBoolean(val) ? !val : val;
      },
      get silentFallbackWarn() {
        return isBoolean(composer.fallbackWarn) ? !composer.fallbackWarn : composer.fallbackWarn;
      },
      set silentFallbackWarn(val) {
        composer.fallbackWarn = isBoolean(val) ? !val : val;
      },
      get modifiers() {
        return composer.modifiers;
      },
      get formatFallbackMessages() {
        return composer.fallbackFormat;
      },
      set formatFallbackMessages(val) {
        composer.fallbackFormat = val;
      },
      get postTranslation() {
        return composer.getPostTranslationHandler();
      },
      set postTranslation(handler) {
        composer.setPostTranslationHandler(handler);
      },
      get sync() {
        return composer.inheritLocale;
      },
      set sync(val) {
        composer.inheritLocale = val;
      },
      get warnHtmlInMessage() {
        return composer.warnHtmlMessage ? "warn" : "off";
      },
      set warnHtmlInMessage(val) {
        composer.warnHtmlMessage = val !== "off";
      },
      get escapeParameterHtml() {
        return composer.escapeParameter;
      },
      set escapeParameterHtml(val) {
        composer.escapeParameter = val;
      },
      get preserveDirectiveContent() {
        return true;
      },
      set preserveDirectiveContent(val) {
      },
      get pluralizationRules() {
        return composer.pluralRules || {};
      },
      __composer: composer,
      t(...args) {
        const [arg1, arg2, arg3] = args;
        const options2 = {};
        let list = null;
        let named = null;
        if (!isString(arg1)) {
          throw createI18nError(I18nErrorCodes.INVALID_ARGUMENT);
        }
        const key = arg1;
        if (isString(arg2)) {
          options2.locale = arg2;
        } else if (isArray(arg2)) {
          list = arg2;
        } else if (isPlainObject(arg2)) {
          named = arg2;
        }
        if (isArray(arg3)) {
          list = arg3;
        } else if (isPlainObject(arg3)) {
          named = arg3;
        }
        return Reflect.apply(composer.t, composer, [
          key,
          list || named || {},
          options2
        ]);
      },
      rt(...args) {
        return Reflect.apply(composer.rt, composer, [...args]);
      },
      tc(...args) {
        const [arg1, arg2, arg3] = args;
        const options2 = { plural: 1 };
        let list = null;
        let named = null;
        if (!isString(arg1)) {
          throw createI18nError(I18nErrorCodes.INVALID_ARGUMENT);
        }
        const key = arg1;
        if (isString(arg2)) {
          options2.locale = arg2;
        } else if (isNumber(arg2)) {
          options2.plural = arg2;
        } else if (isArray(arg2)) {
          list = arg2;
        } else if (isPlainObject(arg2)) {
          named = arg2;
        }
        if (isString(arg3)) {
          options2.locale = arg3;
        } else if (isArray(arg3)) {
          list = arg3;
        } else if (isPlainObject(arg3)) {
          named = arg3;
        }
        return Reflect.apply(composer.t, composer, [
          key,
          list || named || {},
          options2
        ]);
      },
      te(key, locale) {
        return composer.te(key, locale);
      },
      tm(key) {
        return composer.tm(key);
      },
      getLocaleMessage(locale) {
        return composer.getLocaleMessage(locale);
      },
      setLocaleMessage(locale, message) {
        composer.setLocaleMessage(locale, message);
      },
      mergeLocaleMessage(locale, message) {
        composer.mergeLocaleMessage(locale, message);
      },
      d(...args) {
        return Reflect.apply(composer.d, composer, [...args]);
      },
      getDateTimeFormat(locale) {
        return composer.getDateTimeFormat(locale);
      },
      setDateTimeFormat(locale, format2) {
        composer.setDateTimeFormat(locale, format2);
      },
      mergeDateTimeFormat(locale, format2) {
        composer.mergeDateTimeFormat(locale, format2);
      },
      n(...args) {
        return Reflect.apply(composer.n, composer, [...args]);
      },
      getNumberFormat(locale) {
        return composer.getNumberFormat(locale);
      },
      setNumberFormat(locale, format2) {
        composer.setNumberFormat(locale, format2);
      },
      mergeNumberFormat(locale, format2) {
        composer.mergeNumberFormat(locale, format2);
      },
      getChoiceIndex(choice, choicesLength) {
        return -1;
      },
      __onComponentInstanceCreated(target) {
        const { componentInstanceCreatedListener } = options;
        if (componentInstanceCreatedListener) {
          componentInstanceCreatedListener(target, vueI18n);
        }
      }
    };
    return vueI18n;
  }
}
const baseFormatProps = {
  tag: {
    type: [String, Object]
  },
  locale: {
    type: String
  },
  scope: {
    type: String,
    validator: (val) => val === "parent" || val === "global",
    default: "parent"
  },
  i18n: {
    type: Object
  }
};
function getInterpolateArg({ slots }, keys) {
  if (keys.length === 1 && keys[0] === "default") {
    const ret = slots.default ? slots.default() : [];
    return ret.reduce((slot, current) => {
      return slot = [
        ...slot,
        ...isArray(current.children) ? current.children : [current]
      ];
    }, []);
  } else {
    return keys.reduce((arg, key) => {
      const slot = slots[key];
      if (slot) {
        arg[key] = slot();
      }
      return arg;
    }, {});
  }
}
function getFragmentableTag(tag) {
  return vue_cjs_prod.Fragment;
}
const Translation = {
  name: "i18n-t",
  props: assign({
    keypath: {
      type: String,
      required: true
    },
    plural: {
      type: [Number, String],
      validator: (val) => isNumber(val) || !isNaN(val)
    }
  }, baseFormatProps),
  setup(props, context) {
    const { slots, attrs } = context;
    const i18n = props.i18n || useI18n({
      useScope: props.scope,
      __useComponent: true
    });
    const keys = Object.keys(slots).filter((key) => key !== "_");
    return () => {
      const options = {};
      if (props.locale) {
        options.locale = props.locale;
      }
      if (props.plural !== void 0) {
        options.plural = isString(props.plural) ? +props.plural : props.plural;
      }
      const arg = getInterpolateArg(context, keys);
      const children = i18n[TransrateVNodeSymbol](props.keypath, arg, options);
      const assignedAttrs = assign({}, attrs);
      const tag = isString(props.tag) || isObject(props.tag) ? props.tag : getFragmentableTag();
      return vue_cjs_prod.h(tag, assignedAttrs, children);
    };
  }
};
function renderFormatter(props, context, slotKeys, partFormatter) {
  const { slots, attrs } = context;
  return () => {
    const options = { part: true };
    let overrides = {};
    if (props.locale) {
      options.locale = props.locale;
    }
    if (isString(props.format)) {
      options.key = props.format;
    } else if (isObject(props.format)) {
      if (isString(props.format.key)) {
        options.key = props.format.key;
      }
      overrides = Object.keys(props.format).reduce((options2, prop) => {
        return slotKeys.includes(prop) ? assign({}, options2, { [prop]: props.format[prop] }) : options2;
      }, {});
    }
    const parts = partFormatter(...[props.value, options, overrides]);
    let children = [options.key];
    if (isArray(parts)) {
      children = parts.map((part, index2) => {
        const slot = slots[part.type];
        return slot ? slot({ [part.type]: part.value, index: index2, parts }) : [part.value];
      });
    } else if (isString(parts)) {
      children = [parts];
    }
    const assignedAttrs = assign({}, attrs);
    const tag = isString(props.tag) || isObject(props.tag) ? props.tag : getFragmentableTag();
    return vue_cjs_prod.h(tag, assignedAttrs, children);
  };
}
const NUMBER_FORMAT_KEYS = [
  "localeMatcher",
  "style",
  "unit",
  "unitDisplay",
  "currency",
  "currencyDisplay",
  "useGrouping",
  "numberingSystem",
  "minimumIntegerDigits",
  "minimumFractionDigits",
  "maximumFractionDigits",
  "minimumSignificantDigits",
  "maximumSignificantDigits",
  "notation",
  "formatMatcher"
];
const NumberFormat = {
  name: "i18n-n",
  props: assign({
    value: {
      type: Number,
      required: true
    },
    format: {
      type: [String, Object]
    }
  }, baseFormatProps),
  setup(props, context) {
    const i18n = props.i18n || useI18n({ useScope: "parent", __useComponent: true });
    return renderFormatter(props, context, NUMBER_FORMAT_KEYS, (...args) => i18n[NumberPartsSymbol](...args));
  }
};
const DATETIME_FORMAT_KEYS = [
  "dateStyle",
  "timeStyle",
  "fractionalSecondDigits",
  "calendar",
  "dayPeriod",
  "numberingSystem",
  "localeMatcher",
  "timeZone",
  "hour12",
  "hourCycle",
  "formatMatcher",
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "timeZoneName"
];
const DatetimeFormat = {
  name: "i18n-d",
  props: assign({
    value: {
      type: [Number, Date],
      required: true
    },
    format: {
      type: [String, Object]
    }
  }, baseFormatProps),
  setup(props, context) {
    const i18n = props.i18n || useI18n({ useScope: "parent", __useComponent: true });
    return renderFormatter(props, context, DATETIME_FORMAT_KEYS, (...args) => i18n[DatetimePartsSymbol](...args));
  }
};
function getComposer$2(i18n, instance) {
  const i18nInternal = i18n;
  if (i18n.mode === "composition") {
    return i18nInternal.__getInstance(instance) || i18n.global;
  } else {
    const vueI18n = i18nInternal.__getInstance(instance);
    return vueI18n != null ? vueI18n.__composer : i18n.global.__composer;
  }
}
function vTDirective(i18n) {
  const bind = (el, { instance, value, modifiers }) => {
    if (!instance || !instance.$) {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
    }
    const composer = getComposer$2(i18n, instance.$);
    const parsedValue = parseValue(value);
    el.textContent = Reflect.apply(composer.t, composer, [
      ...makeParams(parsedValue)
    ]);
  };
  return {
    beforeMount: bind,
    beforeUpdate: bind
  };
}
function parseValue(value) {
  if (isString(value)) {
    return { path: value };
  } else if (isPlainObject(value)) {
    if (!("path" in value)) {
      throw createI18nError(I18nErrorCodes.REQUIRED_VALUE, "path");
    }
    return value;
  } else {
    throw createI18nError(I18nErrorCodes.INVALID_VALUE);
  }
}
function makeParams(value) {
  const { path, locale, args, choice, plural } = value;
  const options = {};
  const named = args || {};
  if (isString(locale)) {
    options.locale = locale;
  }
  if (isNumber(choice)) {
    options.plural = choice;
  }
  if (isNumber(plural)) {
    options.plural = plural;
  }
  return [path, named, options];
}
function apply(app2, i18n, ...options) {
  const pluginOptions = isPlainObject(options[0]) ? options[0] : {};
  const useI18nComponentName = !!pluginOptions.useI18nComponentName;
  const globalInstall = isBoolean(pluginOptions.globalInstall) ? pluginOptions.globalInstall : true;
  if (globalInstall) {
    app2.component(!useI18nComponentName ? Translation.name : "i18n", Translation);
    app2.component(NumberFormat.name, NumberFormat);
    app2.component(DatetimeFormat.name, DatetimeFormat);
  }
  {
    app2.directive("t", vTDirective(i18n));
  }
}
function defineMixin(vuei18n, composer, i18n) {
  return {
    beforeCreate() {
      const instance = vue_cjs_prod.getCurrentInstance();
      if (!instance) {
        throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
      }
      const options = this.$options;
      if (options.i18n) {
        const optionsI18n = options.i18n;
        if (options.__i18n) {
          optionsI18n.__i18n = options.__i18n;
        }
        optionsI18n.__root = composer;
        if (this === this.$root) {
          this.$i18n = mergeToRoot(vuei18n, optionsI18n);
        } else {
          optionsI18n.__injectWithOption = true;
          this.$i18n = createVueI18n(optionsI18n);
        }
      } else if (options.__i18n) {
        if (this === this.$root) {
          this.$i18n = mergeToRoot(vuei18n, options);
        } else {
          this.$i18n = createVueI18n({
            __i18n: options.__i18n,
            __injectWithOption: true,
            __root: composer
          });
        }
      } else {
        this.$i18n = vuei18n;
      }
      if (options.__i18nGlobal) {
        adjustI18nResources(composer, options, options);
      }
      vuei18n.__onComponentInstanceCreated(this.$i18n);
      i18n.__setInstance(instance, this.$i18n);
      this.$t = (...args) => this.$i18n.t(...args);
      this.$rt = (...args) => this.$i18n.rt(...args);
      this.$tc = (...args) => this.$i18n.tc(...args);
      this.$te = (key, locale) => this.$i18n.te(key, locale);
      this.$d = (...args) => this.$i18n.d(...args);
      this.$n = (...args) => this.$i18n.n(...args);
      this.$tm = (key) => this.$i18n.tm(key);
    },
    mounted() {
    },
    unmounted() {
      const instance = vue_cjs_prod.getCurrentInstance();
      if (!instance) {
        throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
      }
      delete this.$t;
      delete this.$rt;
      delete this.$tc;
      delete this.$te;
      delete this.$d;
      delete this.$n;
      delete this.$tm;
      i18n.__deleteInstance(instance);
      delete this.$i18n;
    }
  };
}
function mergeToRoot(root, options) {
  root.locale = options.locale || root.locale;
  root.fallbackLocale = options.fallbackLocale || root.fallbackLocale;
  root.missing = options.missing || root.missing;
  root.silentTranslationWarn = options.silentTranslationWarn || root.silentFallbackWarn;
  root.silentFallbackWarn = options.silentFallbackWarn || root.silentFallbackWarn;
  root.formatFallbackMessages = options.formatFallbackMessages || root.formatFallbackMessages;
  root.postTranslation = options.postTranslation || root.postTranslation;
  root.warnHtmlInMessage = options.warnHtmlInMessage || root.warnHtmlInMessage;
  root.escapeParameterHtml = options.escapeParameterHtml || root.escapeParameterHtml;
  root.sync = options.sync || root.sync;
  root.__composer[SetPluralRulesSymbol](options.pluralizationRules || root.pluralizationRules);
  const messages2 = getLocaleMessages(root.locale, {
    messages: options.messages,
    __i18n: options.__i18n
  });
  Object.keys(messages2).forEach((locale) => root.mergeLocaleMessage(locale, messages2[locale]));
  if (options.datetimeFormats) {
    Object.keys(options.datetimeFormats).forEach((locale) => root.mergeDateTimeFormat(locale, options.datetimeFormats[locale]));
  }
  if (options.numberFormats) {
    Object.keys(options.numberFormats).forEach((locale) => root.mergeNumberFormat(locale, options.numberFormats[locale]));
  }
  return root;
}
const I18nInjectionKey = /* @__PURE__ */ makeSymbol("global-vue-i18n");
function createI18n(options = {}, VueI18nLegacy) {
  const __legacyMode = isBoolean(options.legacy) ? options.legacy : true;
  const __globalInjection = !!options.globalInjection;
  const __instances = /* @__PURE__ */ new Map();
  const __global = createGlobal(options, __legacyMode);
  const symbol = makeSymbol("");
  function __getInstance(component) {
    return __instances.get(component) || null;
  }
  function __setInstance(component, instance) {
    __instances.set(component, instance);
  }
  function __deleteInstance(component) {
    __instances.delete(component);
  }
  {
    const i18n = {
      get mode() {
        return __legacyMode ? "legacy" : "composition";
      },
      async install(app2, ...options2) {
        app2.__VUE_I18N_SYMBOL__ = symbol;
        app2.provide(app2.__VUE_I18N_SYMBOL__, i18n);
        if (!__legacyMode && __globalInjection) {
          injectGlobalFields(app2, i18n.global);
        }
        {
          apply(app2, i18n, ...options2);
        }
        if (__legacyMode) {
          app2.mixin(defineMixin(__global, __global.__composer, i18n));
        }
      },
      get global() {
        return __global;
      },
      __instances,
      __getInstance,
      __setInstance,
      __deleteInstance
    };
    return i18n;
  }
}
function useI18n(options = {}) {
  const instance = vue_cjs_prod.getCurrentInstance();
  if (instance == null) {
    throw createI18nError(I18nErrorCodes.MUST_BE_CALL_SETUP_TOP);
  }
  if (!instance.isCE && instance.appContext.app != null && !instance.appContext.app.__VUE_I18N_SYMBOL__) {
    throw createI18nError(I18nErrorCodes.NOT_INSLALLED);
  }
  const i18n = getI18nInstance(instance);
  const global2 = getGlobalComposer(i18n);
  const componentOptions = getComponentOptions(instance);
  const scope = getScope(options, componentOptions);
  if (scope === "global") {
    adjustI18nResources(global2, options, componentOptions);
    return global2;
  }
  if (scope === "parent") {
    let composer2 = getComposer(i18n, instance, options.__useComponent);
    if (composer2 == null) {
      composer2 = global2;
    }
    return composer2;
  }
  if (i18n.mode === "legacy") {
    throw createI18nError(I18nErrorCodes.NOT_AVAILABLE_IN_LEGACY_MODE);
  }
  const i18nInternal = i18n;
  let composer = i18nInternal.__getInstance(instance);
  if (composer == null) {
    const composerOptions = assign({}, options);
    if ("__i18n" in componentOptions) {
      composerOptions.__i18n = componentOptions.__i18n;
    }
    if (global2) {
      composerOptions.__root = global2;
    }
    composer = createComposer(composerOptions);
    setupLifeCycle(i18nInternal, instance);
    i18nInternal.__setInstance(instance, composer);
  }
  return composer;
}
function createGlobal(options, legacyMode, VueI18nLegacy) {
  {
    return legacyMode ? createVueI18n(options) : createComposer(options);
  }
}
function getI18nInstance(instance) {
  {
    const i18n = vue_cjs_prod.inject(!instance.isCE ? instance.appContext.app.__VUE_I18N_SYMBOL__ : I18nInjectionKey);
    if (!i18n) {
      throw createI18nError(!instance.isCE ? I18nErrorCodes.UNEXPECTED_ERROR : I18nErrorCodes.NOT_INSLALLED_WITH_PROVIDE);
    }
    return i18n;
  }
}
function getScope(options, componentOptions) {
  return isEmptyObject(options) ? "__i18n" in componentOptions ? "local" : "global" : !options.useScope ? "local" : options.useScope;
}
function getGlobalComposer(i18n) {
  return i18n.mode === "composition" ? i18n.global : i18n.global.__composer;
}
function getComposer(i18n, target, useComponent = false) {
  let composer = null;
  const root = target.root;
  let current = target.parent;
  while (current != null) {
    const i18nInternal = i18n;
    if (i18n.mode === "composition") {
      composer = i18nInternal.__getInstance(current);
    } else {
      {
        const vueI18n = i18nInternal.__getInstance(current);
        if (vueI18n != null) {
          composer = vueI18n.__composer;
          if (useComponent && composer && !composer[InejctWithOption]) {
            composer = null;
          }
        }
      }
    }
    if (composer != null) {
      break;
    }
    if (root === current) {
      break;
    }
    current = current.parent;
  }
  return composer;
}
function setupLifeCycle(i18n, target, composer) {
  {
    vue_cjs_prod.onMounted(() => {
    }, target);
    vue_cjs_prod.onUnmounted(() => {
      i18n.__deleteInstance(target);
    }, target);
  }
}
const globalExportProps = [
  "locale",
  "fallbackLocale",
  "availableLocales"
];
const globalExportMethods = ["t", "rt", "d", "n", "tm"];
function injectGlobalFields(app2, composer) {
  const i18n = /* @__PURE__ */ Object.create(null);
  globalExportProps.forEach((prop) => {
    const desc = Object.getOwnPropertyDescriptor(composer, prop);
    if (!desc) {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
    }
    const wrap = vue_cjs_prod.isRef(desc.value) ? {
      get() {
        return desc.value.value;
      },
      set(val) {
        desc.value.value = val;
      }
    } : {
      get() {
        return desc.get && desc.get();
      }
    };
    Object.defineProperty(i18n, prop, wrap);
  });
  app2.config.globalProperties.$i18n = i18n;
  globalExportMethods.forEach((method) => {
    const desc = Object.getOwnPropertyDescriptor(composer, method);
    if (!desc || !desc.value) {
      throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
    }
    Object.defineProperty(app2.config.globalProperties, `$${method}`, desc);
  });
}
registerMessageResolver(resolveValue);
registerLocaleFallbacker(fallbackWithLocaleChain);
{
  initFeatureFlags();
}
if (__INTLIFY_PROD_DEVTOOLS__) {
  const target = getGlobalThis();
  target.__INTLIFY__ = true;
  setDevToolsHook(target.__INTLIFY_DEVTOOLS_GLOBAL_HOOK__);
}
const useLang = () => {
  const { t } = useI18n();
  return {
    t
  };
};
const _sfc_main$z = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useLang();
    const titlesText = vue_cjs_prod.computed(() => t("pages.index.title").split(","));
    const leadingsText = vue_cjs_prod.computed(() => [
      {
        text: titlesText.value[0],
        startColor: "#007CF0",
        endColor: "#00DFD8",
        delay: 0
      },
      {
        text: titlesText.value[1],
        startColor: "#7928CA",
        endColor: "#FF0080",
        delay: 2
      },
      {
        text: titlesText.value[2],
        startColor: "#FF4D4D",
        endColor: "#F9CB28",
        delay: 4
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_Button = _sfc_main$E;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, vue_cjs_prod.mergeProps({ class: "flex justify-center items-center" }, _attrs), {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="background-overlay"${_scopeId}><div class="absolute top-0 left-0 transform translate-x-64 translate-y-4 h-14 w-14 rounded-full bg-gray-900 dark:bg-white"${_scopeId}></div><div class="absolute hidden md:block top-0 left-0 transform translate-x-18 translate-y-20 h-28 w-28 rounded-full bg-blue-600 linear-wipe"${_scopeId}></div><div class="absolute hidden md:block bottom-0 right-0 transform -translate-x-4 -translate-y-40 h-16 w-16 rounded bg-purple-600 linear-wipe"${_scopeId}></div><div class="absolute bottom-0 right-0 triangle-shape"${_scopeId}></div></div><div class="flex flex-col z-10"${_scopeId}><h1 class="text-center"${_scopeId}><!--[-->`);
            serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(leadingsText), (item, i) => {
              _push2(`<span style="${serverRenderer.exports.ssrRenderStyle(`--content: '${item.text}'; --start-color: ${item.startColor}; --end-color: ${item.endColor}; --delay: ${item.delay}s`)}" class="animated-text-bg drop-shadow-xl text-5xl xl:text-8xl 2xl:text-9xl block font-black uppercase"${_scopeId}><span class="animated-text-fg"${_scopeId}>${serverRenderer.exports.ssrInterpolate(item.text)}</span></span>`);
            });
            _push2(`<!--]--></h1><div class="flex space-x-4 justify-center mt-10"${_scopeId}>`);
            _push2(serverRenderer.exports.ssrRenderComponent(_component_Button, {
              size: "lg",
              text: "Explore Glysis",
              class: "font-extrabold",
              href: "https://v3.nuxtjs.org"
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              vue_cjs_prod.createVNode("div", { class: "background-overlay" }, [
                vue_cjs_prod.createVNode("div", { class: "absolute top-0 left-0 transform translate-x-64 translate-y-4 h-14 w-14 rounded-full bg-gray-900 dark:bg-white" }),
                vue_cjs_prod.createVNode("div", { class: "absolute hidden md:block top-0 left-0 transform translate-x-18 translate-y-20 h-28 w-28 rounded-full bg-blue-600 linear-wipe" }),
                vue_cjs_prod.createVNode("div", { class: "absolute hidden md:block bottom-0 right-0 transform -translate-x-4 -translate-y-40 h-16 w-16 rounded bg-purple-600 linear-wipe" }),
                vue_cjs_prod.createVNode("div", { class: "absolute bottom-0 right-0 triangle-shape" })
              ]),
              vue_cjs_prod.createVNode("div", { class: "flex flex-col z-10" }, [
                vue_cjs_prod.createVNode("h1", { class: "text-center" }, [
                  (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(leadingsText), (item, i) => {
                    return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("span", {
                      key: i,
                      style: `--content: '${item.text}'; --start-color: ${item.startColor}; --end-color: ${item.endColor}; --delay: ${item.delay}s`,
                      class: "animated-text-bg drop-shadow-xl text-5xl xl:text-8xl 2xl:text-9xl block font-black uppercase"
                    }, [
                      vue_cjs_prod.createVNode("span", { class: "animated-text-fg" }, vue_cjs_prod.toDisplayString(item.text), 1)
                    ], 4);
                  }), 128))
                ]),
                vue_cjs_prod.createVNode("div", { class: "flex space-x-4 justify-center mt-10" }, [
                  vue_cjs_prod.createVNode(_component_Button, {
                    size: "lg",
                    text: "Explore Glysis",
                    class: "font-extrabold",
                    href: "https://v3.nuxtjs.org"
                  })
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$z = _sfc_main$z.setup;
_sfc_main$z.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup$z ? _sfc_setup$z(props, ctx) : void 0;
};
const meta$2 = {
  layout: "page"
};
const _hoisted_1$f = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 36 36",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$f = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "m19.41 18l8.29-8.29a1 1 0 0 0-1.41-1.41L18 16.59l-8.29-8.3a1 1 0 0 0-1.42 1.42l8.3 8.29l-8.3 8.29A1 1 0 1 0 9.7 27.7l8.3-8.29l8.29 8.29a1 1 0 0 0 1.41-1.41Z",
  class: "clr-i-outline clr-i-outline-path-1"
}, null, -1);
const _hoisted_3$f = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "none",
  d: "M0 0h36v36H0z"
}, null, -1);
const _hoisted_4$1 = [
  _hoisted_2$f,
  _hoisted_3$f
];
function render$f(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$f, _hoisted_4$1);
}
const __unplugin_components_3$2 = { name: "clarity-times-line", render: render$f };
const _hoisted_1$e = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 16 16",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$e = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2a1 1 0 0 0 0-2z"
}, null, -1);
const _hoisted_3$e = [
  _hoisted_2$e
];
function render$e(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$e, _hoisted_3$e);
}
const __unplugin_components_2$2 = { name: "bi-exclamation-circle-fill", render: render$e };
const _hoisted_1$d = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 36 36",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$d = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2Zm8 22.1a1.4 1.4 0 0 1-2 2l-6-6l-6 6.02a1.4 1.4 0 1 1-2-2l6-6.04l-6.17-6.22a1.4 1.4 0 1 1 2-2L18 16.1l6.17-6.17a1.4 1.4 0 1 1 2 2L20 18.08Z",
  class: "clr-i-solid clr-i-solid-path-1"
}, null, -1);
const _hoisted_3$d = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "none",
  d: "M0 0h36v36H0z"
}, null, -1);
const _hoisted_4 = [
  _hoisted_2$d,
  _hoisted_3$d
];
function render$d(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$d, _hoisted_4);
}
const __unplugin_components_1$2 = { name: "clarity-times-circle-solid", render: render$d };
const _hoisted_1$c = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$c = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z"
}, null, -1);
const _hoisted_3$c = [
  _hoisted_2$c
];
function render$c(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$c, _hoisted_3$c);
}
const __unplugin_components_0$6 = { name: "mdi-check-circle", render: render$c };
function T(t, n, ...u) {
  if (t in n) {
    let o = n[t];
    return typeof o == "function" ? o(...u) : o;
  }
  let e = new Error(`Tried to handle "${t}" but there is no handler defined. Only defined handlers are: ${Object.keys(n).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(e, T), e;
}
function x(_a2) {
  var _b2 = _a2, { visible: t = true, features: n = 0 } = _b2, u = __objRest(_b2, ["visible", "features"]);
  var e;
  if (t || n & 2 && u.props.static)
    return Se(u);
  if (n & 1) {
    let o = ((e = u.props.unmount) != null ? e : true) ? 0 : 1;
    return T(o, { [0]() {
      return null;
    }, [1]() {
      return Se(__spreadProps(__spreadValues({}, u), { props: __spreadProps(__spreadValues({}, u.props), { hidden: true, style: { display: "none" } }) }));
    } });
  }
  return Se(u);
}
function Se({ props: t, attrs: n, slots: u, slot: e, name: o }) {
  var a;
  let _a2 = L(t, ["unmount", "static"]), { as: r } = _a2, s = __objRest(_a2, ["as"]), d = (a = u.default) == null ? void 0 : a.call(u, e);
  if (r === "template") {
    if (Object.keys(s).length > 0 || Object.keys(n).length > 0) {
      let [i, ...l] = d != null ? d : [];
      if (!co(i) || l.length > 0)
        throw new Error(['Passing props on "template"!', "", `The current component <${o} /> is rendering a "template".`, "However we need to passthrough the following props:", Object.keys(s).concat(Object.keys(n)).map((c) => `  - ${c}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "template".', "Render a single element as the child so that we can forward the props onto that element."].map((c) => `  - ${c}`).join(`
`)].join(`
`));
      return vue_cjs_prod.cloneVNode(i, s);
    }
    return Array.isArray(d) && d.length === 1 ? d[0] : d;
  }
  return vue_cjs_prod.h(r, s, d);
}
function L(t, n = []) {
  let u = Object.assign({}, t);
  for (let e of n)
    e in u && delete u[e];
  return u;
}
function co(t) {
  return t == null ? false : typeof t.type == "string" || typeof t.type == "object" || typeof t.type == "function";
}
var mo = 0;
function vo() {
  return ++mo;
}
function h() {
  return vo();
}
function bo(t) {
  throw new Error("Unexpected object: " + t);
}
function J(t, n) {
  let u = n.resolveItems();
  if (u.length <= 0)
    return null;
  let e = n.resolveActiveIndex(), o = e != null ? e : -1, r = (() => {
    switch (t.focus) {
      case 0:
        return u.findIndex((s) => !n.resolveDisabled(s));
      case 1: {
        let s = u.slice().reverse().findIndex((d, a, i) => o !== -1 && i.length - a - 1 >= o ? false : !n.resolveDisabled(d));
        return s === -1 ? s : u.length - 1 - s;
      }
      case 2:
        return u.findIndex((s, d) => d <= o ? false : !n.resolveDisabled(s));
      case 3: {
        let s = u.slice().reverse().findIndex((d) => !n.resolveDisabled(d));
        return s === -1 ? s : u.length - 1 - s;
      }
      case 4:
        return u.findIndex((s) => n.resolveId(s) === t.id);
      case 5:
        return null;
      default:
        bo(t);
    }
  })();
  return r === -1 ? e : r;
}
function v(t) {
  return t == null || t.value == null ? null : "$el" in t.value ? t.value.$el : t.value;
}
var at = Symbol("Context");
function it() {
  return I() !== null;
}
function I() {
  return vue_cjs_prod.inject(at, null);
}
function M(t) {
  vue_cjs_prod.provide(at, t);
}
function ut(t, n) {
  if (t)
    return t;
  let u = n != null ? n : "button";
  if (typeof u == "string" && u.toLowerCase() === "button")
    return "button";
}
function P(t, n) {
  let u = vue_cjs_prod.ref(ut(t.value.type, t.value.as));
  return vue_cjs_prod.onMounted(() => {
    u.value = ut(t.value.type, t.value.as);
  }), vue_cjs_prod.watchEffect(() => {
    var e;
    u.value || !v(n) || v(n) instanceof HTMLButtonElement && !((e = v(n)) == null ? void 0 : e.hasAttribute("type")) && (u.value = "button");
  }), u;
}
function Y({ container: t, accept: n, walk: u, enabled: e }) {
  vue_cjs_prod.watchEffect(() => {
    let o = t.value;
    if (!o || e !== void 0 && !e.value)
      return;
    let r = Object.assign((d) => n(d), { acceptNode: n }), s = document.createTreeWalker(o, NodeFilter.SHOW_ELEMENT, r, false);
    for (; s.nextNode(); )
      u(s.currentNode);
  });
}
var ct = Symbol("ComboboxContext");
function ee(t) {
  let n = vue_cjs_prod.inject(ct, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <Combobox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, ee), u;
  }
  return n;
}
vue_cjs_prod.defineComponent({ name: "Combobox", emits: { "update:modelValue": (t) => true }, props: { as: { type: [Object, String], default: "template" }, disabled: { type: [Boolean], default: false }, modelValue: { type: [Object, String, Number, Boolean] } }, setup(t, { slots: n, attrs: u, emit: e }) {
  let o = vue_cjs_prod.ref(1), r = vue_cjs_prod.ref(null), s = vue_cjs_prod.ref(null), d = vue_cjs_prod.ref(null), a = vue_cjs_prod.ref(null), i = vue_cjs_prod.ref({ static: false, hold: false }), l = vue_cjs_prod.ref([]), c = vue_cjs_prod.ref(null), p = vue_cjs_prod.computed(() => t.modelValue), f = { comboboxState: o, value: p, inputRef: s, labelRef: r, buttonRef: d, optionsRef: a, disabled: vue_cjs_prod.computed(() => t.disabled), options: l, activeOptionIndex: c, inputPropsRef: vue_cjs_prod.ref({ displayValue: void 0 }), optionsPropsRef: i, closeCombobox() {
    t.disabled || o.value !== 1 && (o.value = 1, c.value = null);
  }, openCombobox() {
    t.disabled || o.value !== 0 && (o.value = 0);
  }, goToOption(m, g) {
    if (t.disabled || a.value && !i.value.static && o.value === 1)
      return;
    let S = J(m === 4 ? { focus: 4, id: g } : { focus: m }, { resolveItems: () => l.value, resolveActiveIndex: () => c.value, resolveId: (y) => y.id, resolveDisabled: (y) => y.dataRef.disabled });
    c.value !== S && (c.value = S);
  }, syncInputValue() {
    let m = f.value.value;
    if (!v(f.inputRef) || m === void 0)
      return;
    let g = f.inputPropsRef.value.displayValue;
    typeof g == "function" ? f.inputRef.value.value = g(m) : typeof m == "string" && (f.inputRef.value.value = m);
  }, selectOption(m) {
    let g = l.value.find((y) => y.id === m);
    if (!g)
      return;
    let { dataRef: S } = g;
    e("update:modelValue", S.value), f.syncInputValue();
  }, selectActiveOption() {
    if (c.value === null)
      return;
    let { dataRef: m } = l.value[c.value];
    e("update:modelValue", m.value), f.syncInputValue();
  }, registerOption(m, g) {
    var R, E;
    let S = c.value !== null ? l.value[c.value] : null, y = Array.from((E = (R = a.value) == null ? void 0 : R.querySelectorAll('[id^="headlessui-combobox-option-"]')) != null ? E : []).reduce((D, w, F) => Object.assign(D, { [w.id]: F }), {});
    l.value = [...l.value, { id: m, dataRef: g }].sort((D, w) => y[D.id] - y[w.id]), c.value = (() => S === null ? null : l.value.indexOf(S))();
  }, unregisterOption(m) {
    let g = l.value.slice(), S = c.value !== null ? g[c.value] : null, y = g.findIndex((R) => R.id === m);
    y !== -1 && g.splice(y, 1), l.value = g, c.value = (() => y === c.value || S === null ? null : g.indexOf(S))();
  } };
  vue_cjs_prod.watch([f.value, f.inputRef], () => f.syncInputValue(), { immediate: true }), vue_cjs_prod.provide(ct, f), M(vue_cjs_prod.computed(() => T(o.value, { [0]: 0, [1]: 1 })));
  let b = vue_cjs_prod.computed(() => c.value === null ? null : l.value[c.value].dataRef.value);
  return () => {
    let m = { open: o.value === 0, disabled: t.disabled, activeIndex: c.value, activeOption: b.value };
    return x({ props: L(t, ["modelValue", "onUpdate:modelValue", "disabled"]), slot: m, slots: n, attrs: u, name: "Combobox" });
  };
} });
vue_cjs_prod.defineComponent({ name: "ComboboxLabel", props: { as: { type: [Object, String], default: "label" } }, setup(t, { attrs: n, slots: u }) {
  let e = ee("ComboboxLabel"), o = `headlessui-combobox-label-${h()}`;
  function r() {
    var s;
    (s = v(e.inputRef)) == null || s.focus({ preventScroll: true });
  }
  return () => {
    let s = { open: e.comboboxState.value === 0, disabled: e.disabled.value }, d = { id: o, ref: e.labelRef, onClick: r };
    return x({ props: __spreadValues(__spreadValues({}, t), d), slot: s, attrs: n, slots: u, name: "ComboboxLabel" });
  };
} });
vue_cjs_prod.defineComponent({ name: "ComboboxButton", props: { as: { type: [Object, String], default: "button" } }, setup(t, { attrs: n, slots: u }) {
  let e = ee("ComboboxButton"), o = `headlessui-combobox-button-${h()}`;
  function r(a) {
    e.disabled.value || (e.comboboxState.value === 0 ? e.closeCombobox() : (a.preventDefault(), e.openCombobox()), vue_cjs_prod.nextTick(() => {
      var i;
      return (i = v(e.inputRef)) == null ? void 0 : i.focus({ preventScroll: true });
    }));
  }
  function s(a) {
    switch (a.key) {
      case "ArrowDown":
        a.preventDefault(), a.stopPropagation(), e.comboboxState.value === 1 && (e.openCombobox(), vue_cjs_prod.nextTick(() => {
          e.value.value || e.goToOption(0);
        })), vue_cjs_prod.nextTick(() => {
          var i;
          return (i = e.inputRef.value) == null ? void 0 : i.focus({ preventScroll: true });
        });
        return;
      case "ArrowUp":
        a.preventDefault(), a.stopPropagation(), e.comboboxState.value === 1 && (e.openCombobox(), vue_cjs_prod.nextTick(() => {
          e.value.value || e.goToOption(3);
        })), vue_cjs_prod.nextTick(() => {
          var i;
          return (i = e.inputRef.value) == null ? void 0 : i.focus({ preventScroll: true });
        });
        return;
      case "Escape":
        a.preventDefault(), e.optionsRef.value && !e.optionsPropsRef.value.static && a.stopPropagation(), e.closeCombobox(), vue_cjs_prod.nextTick(() => {
          var i;
          return (i = e.inputRef.value) == null ? void 0 : i.focus({ preventScroll: true });
        });
        return;
    }
  }
  let d = P(vue_cjs_prod.computed(() => ({ as: t.as, type: n.type })), e.buttonRef);
  return () => {
    var l, c;
    let a = { open: e.comboboxState.value === 0, disabled: e.disabled.value }, i = { ref: e.buttonRef, id: o, type: d.value, tabindex: "-1", "aria-haspopup": true, "aria-controls": (l = v(e.optionsRef)) == null ? void 0 : l.id, "aria-expanded": e.disabled.value ? void 0 : e.comboboxState.value === 0, "aria-labelledby": e.labelRef.value ? [(c = v(e.labelRef)) == null ? void 0 : c.id, o].join(" ") : void 0, disabled: e.disabled.value === true ? true : void 0, onKeydown: s, onClick: r };
    return x({ props: __spreadValues(__spreadValues({}, t), i), slot: a, attrs: n, slots: u, name: "ComboboxButton" });
  };
} });
vue_cjs_prod.defineComponent({ name: "ComboboxInput", props: { as: { type: [Object, String], default: "input" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, displayValue: { type: Function } }, emits: { change: (t) => true }, setup(t, { emit: n, attrs: u, slots: e }) {
  let o = ee("ComboboxInput"), r = `headlessui-combobox-input-${h()}`;
  o.inputPropsRef = vue_cjs_prod.computed(() => t);
  function s(a) {
    switch (a.key) {
      case "Enter":
        a.preventDefault(), a.stopPropagation(), o.selectActiveOption(), o.closeCombobox();
        break;
      case "ArrowDown":
        return a.preventDefault(), a.stopPropagation(), T(o.comboboxState.value, { [0]: () => o.goToOption(2), [1]: () => {
          o.openCombobox(), vue_cjs_prod.nextTick(() => {
            o.value.value || o.goToOption(0);
          });
        } });
      case "ArrowUp":
        return a.preventDefault(), a.stopPropagation(), T(o.comboboxState.value, { [0]: () => o.goToOption(1), [1]: () => {
          o.openCombobox(), vue_cjs_prod.nextTick(() => {
            o.value.value || o.goToOption(3);
          });
        } });
      case "Home":
      case "PageUp":
        return a.preventDefault(), a.stopPropagation(), o.goToOption(0);
      case "End":
      case "PageDown":
        return a.preventDefault(), a.stopPropagation(), o.goToOption(3);
      case "Escape":
        a.preventDefault(), o.optionsRef.value && !o.optionsPropsRef.value.static && a.stopPropagation(), o.closeCombobox();
        break;
      case "Tab":
        o.selectActiveOption(), o.closeCombobox();
        break;
    }
  }
  function d(a) {
    o.openCombobox(), n("change", a);
  }
  return () => {
    var c, p, f, b, m;
    let a = { open: o.comboboxState.value === 0 }, i = { "aria-controls": (c = o.optionsRef.value) == null ? void 0 : c.id, "aria-expanded": o.disabled ? void 0 : o.comboboxState.value === 0, "aria-activedescendant": o.activeOptionIndex.value === null || (p = o.options.value[o.activeOptionIndex.value]) == null ? void 0 : p.id, "aria-labelledby": (m = (f = v(o.labelRef)) == null ? void 0 : f.id) != null ? m : (b = v(o.buttonRef)) == null ? void 0 : b.id, id: r, onKeydown: s, onChange: d, onInput: d, role: "combobox", type: "text", tabIndex: 0, ref: o.inputRef }, l = L(t, ["displayValue"]);
    return x({ props: __spreadValues(__spreadValues({}, l), i), slot: a, attrs: u, slots: e, features: 1 | 2, name: "ComboboxInput" });
  };
} });
vue_cjs_prod.defineComponent({ name: "ComboboxOptions", props: { as: { type: [Object, String], default: "ul" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, hold: { type: [Boolean], default: false } }, setup(t, { attrs: n, slots: u }) {
  let e = ee("ComboboxOptions"), o = `headlessui-combobox-options-${h()}`;
  vue_cjs_prod.watchEffect(() => {
    e.optionsPropsRef.value.static = t.static;
  }), vue_cjs_prod.watchEffect(() => {
    e.optionsPropsRef.value.hold = t.hold;
  });
  let r = I(), s = vue_cjs_prod.computed(() => r !== null ? r.value === 0 : e.comboboxState.value === 0);
  return Y({ container: vue_cjs_prod.computed(() => v(e.optionsRef)), enabled: vue_cjs_prod.computed(() => e.comboboxState.value === 0), accept(d) {
    return d.getAttribute("role") === "option" ? NodeFilter.FILTER_REJECT : d.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(d) {
    d.setAttribute("role", "none");
  } }), () => {
    var l, c, p, f;
    let d = { open: e.comboboxState.value === 0 }, a = { "aria-activedescendant": e.activeOptionIndex.value === null || (l = e.options.value[e.activeOptionIndex.value]) == null ? void 0 : l.id, "aria-labelledby": (f = (c = v(e.labelRef)) == null ? void 0 : c.id) != null ? f : (p = v(e.buttonRef)) == null ? void 0 : p.id, id: o, ref: e.optionsRef, role: "listbox" }, i = L(t, ["hold"]);
    return x({ props: __spreadValues(__spreadValues({}, i), a), slot: d, attrs: n, slots: u, features: 1 | 2, visible: s.value, name: "ComboboxOptions" });
  };
} });
vue_cjs_prod.defineComponent({ name: "ComboboxOption", props: { as: { type: [Object, String], default: "li" }, value: { type: [Object, String, Number, Boolean] }, disabled: { type: Boolean, default: false } }, setup(t, { slots: n, attrs: u }) {
  let e = ee("ComboboxOption"), o = `headlessui-combobox-option-${h()}`, r = vue_cjs_prod.computed(() => e.activeOptionIndex.value !== null ? e.options.value[e.activeOptionIndex.value].id === o : false), s = vue_cjs_prod.computed(() => vue_cjs_prod.toRaw(e.value.value) === vue_cjs_prod.toRaw(t.value)), d = vue_cjs_prod.computed(() => ({ disabled: t.disabled, value: t.value }));
  vue_cjs_prod.onMounted(() => e.registerOption(o, d)), vue_cjs_prod.onUnmounted(() => e.unregisterOption(o)), vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watch([e.comboboxState, s], () => {
      e.comboboxState.value === 0 && (!s.value || e.goToOption(4, o));
    }, { immediate: true });
  }), vue_cjs_prod.watchEffect(() => {
    e.comboboxState.value === 0 && (!r.value || vue_cjs_prod.nextTick(() => {
      var p, f;
      return (f = (p = document.getElementById(o)) == null ? void 0 : p.scrollIntoView) == null ? void 0 : f.call(p, { block: "nearest" });
    }));
  });
  function a(p) {
    if (t.disabled)
      return p.preventDefault();
    e.selectOption(o), e.closeCombobox(), vue_cjs_prod.nextTick(() => {
      var f;
      return (f = v(e.inputRef)) == null ? void 0 : f.focus({ preventScroll: true });
    });
  }
  function i() {
    if (t.disabled)
      return e.goToOption(5);
    e.goToOption(4, o);
  }
  function l() {
    t.disabled || r.value || e.goToOption(4, o);
  }
  function c() {
    t.disabled || !r.value || e.optionsPropsRef.value.hold || e.goToOption(5);
  }
  return () => {
    let { disabled: p } = t, f = { active: r.value, selected: s.value, disabled: p }, b = { id: o, role: "option", tabIndex: p === true ? void 0 : -1, "aria-disabled": p === true ? true : void 0, "aria-selected": s.value === true ? s.value : void 0, disabled: void 0, onClick: a, onFocus: i, onPointermove: l, onMousemove: l, onPointerleave: c, onMouseleave: c };
    return x({ props: __spreadValues(__spreadValues({}, t), b), slot: f, attrs: u, slots: n, name: "ComboboxOption" });
  };
} });
var Ke = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((t) => `${t}:not([tabindex='-1'])`).join(",");
function ae(t = document.body) {
  return t == null ? [] : Array.from(t.querySelectorAll(Ke));
}
function te(t) {
  t == null || t.focus({ preventScroll: true });
}
function O(t, n) {
  let u = Array.isArray(t) ? t.slice().sort((l, c) => {
    let p = l.compareDocumentPosition(c);
    return p & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : p & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  }) : ae(t), e = document.activeElement, o = (() => {
    if (n & (1 | 4))
      return 1;
    if (n & (2 | 8))
      return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), r = (() => {
    if (n & 1)
      return 0;
    if (n & 2)
      return Math.max(0, u.indexOf(e)) - 1;
    if (n & 4)
      return Math.max(0, u.indexOf(e)) + 1;
    if (n & 8)
      return u.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), s = n & 32 ? { preventScroll: true } : {}, d = 0, a = u.length, i;
  do {
    if (d >= a || d + a <= 0)
      return 0;
    let l = r + d;
    if (n & 16)
      l = (l + a) % a;
    else {
      if (l < 0)
        return 3;
      if (l >= a)
        return 1;
    }
    i = u[l], i == null || i.focus(s), d += o;
  } while (i !== document.activeElement);
  return i.hasAttribute("tabindex") || i.setAttribute("tabindex", "0"), 2;
}
function ie(t, n) {
  for (let u of t)
    if (u.contains(n))
      return true;
  return false;
}
function Re(t, n = vue_cjs_prod.ref(true), u = vue_cjs_prod.ref({})) {
  let e = vue_cjs_prod.ref(null), o = vue_cjs_prod.ref(null);
  function r() {
    if (!n.value || t.value.size !== 1)
      return;
    let { initialFocus: d } = u.value, a = document.activeElement;
    if (d) {
      if (d === a)
        return;
    } else if (ie(t.value, a))
      return;
    if (e.value = a, d)
      te(d);
    else {
      let i = false;
      for (let l of t.value)
        if (O(l, 1) === 2) {
          i = true;
          break;
        }
      i || console.warn("There are no focusable elements inside the <FocusTrap />");
    }
    o.value = document.activeElement;
  }
  function s() {
    te(e.value), e.value = null, o.value = null;
  }
  vue_cjs_prod.watchEffect(r), vue_cjs_prod.onUpdated(() => {
    n.value ? r() : s();
  }), vue_cjs_prod.onUnmounted(s);
}
var bt = "body > *", oe = /* @__PURE__ */ new Set(), K = /* @__PURE__ */ new Map();
function gt(t) {
  t.setAttribute("aria-hidden", "true"), t.inert = true;
}
function xt(t) {
  let n = K.get(t);
  !n || (n["aria-hidden"] === null ? t.removeAttribute("aria-hidden") : t.setAttribute("aria-hidden", n["aria-hidden"]), t.inert = n.inert);
}
function yt(t, n = vue_cjs_prod.ref(true)) {
  vue_cjs_prod.watchEffect((u) => {
    if (!n.value || !t.value)
      return;
    let e = t.value;
    oe.add(e);
    for (let o of K.keys())
      o.contains(e) && (xt(o), K.delete(o));
    document.querySelectorAll(bt).forEach((o) => {
      if (o instanceof HTMLElement) {
        for (let r of oe)
          if (o.contains(r))
            return;
        oe.size === 1 && (K.set(o, { "aria-hidden": o.getAttribute("aria-hidden"), inert: o.inert }), gt(o));
      }
    }), u(() => {
      if (oe.delete(e), oe.size > 0)
        document.querySelectorAll(bt).forEach((o) => {
          if (o instanceof HTMLElement && !K.has(o)) {
            for (let r of oe)
              if (o.contains(r))
                return;
            K.set(o, { "aria-hidden": o.getAttribute("aria-hidden"), inert: o.inert }), gt(o);
          }
        });
      else
        for (let o of K.keys())
          xt(o), K.delete(o);
    });
  });
}
var St = Symbol("StackContext");
function ht() {
  return vue_cjs_prod.inject(St, () => {
  });
}
function Rt(t) {
  let n = ht();
  vue_cjs_prod.watchEffect((u) => {
    let e = t == null ? void 0 : t.value;
    !e || (n(0, e), u(() => n(1, e)));
  });
}
function Te(t) {
  let n = ht();
  function u(...e) {
    t == null || t(...e), n(...e);
  }
  vue_cjs_prod.provide(St, u);
}
var Tt = Symbol("ForcePortalRootContext");
function Ot() {
  return vue_cjs_prod.inject(Tt, false);
}
var Ne = vue_cjs_prod.defineComponent({ name: "ForcePortalRoot", props: { as: { type: [Object, String], default: "template" }, force: { type: Boolean, default: false } }, setup(t, { slots: n, attrs: u }) {
  return vue_cjs_prod.provide(Tt, t.force), () => {
    let _a2 = t, o = __objRest(_a2, ["force"]);
    return x({ props: o, slot: {}, slots: n, attrs: u, name: "ForcePortalRoot" });
  };
} });
function It() {
  let t = document.getElementById("headlessui-portal-root");
  if (t)
    return t;
  let n = document.createElement("div");
  return n.setAttribute("id", "headlessui-portal-root"), document.body.appendChild(n);
}
var Pt = vue_cjs_prod.defineComponent({ name: "Portal", props: { as: { type: [Object, String], default: "div" } }, setup(t, { slots: n, attrs: u }) {
  let e = Ot(), o = vue_cjs_prod.inject(Dt, null), r = vue_cjs_prod.ref(e === true || o === null ? It() : o.resolveTarget());
  vue_cjs_prod.watchEffect(() => {
    e || o !== null && (r.value = o.resolveTarget());
  });
  let s = vue_cjs_prod.ref(null);
  return Rt(s), vue_cjs_prod.onUnmounted(() => {
    var a;
    let d = document.getElementById("headlessui-portal-root");
    !d || r.value === d && r.value.children.length <= 0 && ((a = r.value.parentElement) == null || a.removeChild(r.value));
  }), Te(), () => {
    if (r.value === null)
      return null;
    let d = { ref: s };
    return vue_cjs_prod.h(vue_cjs_prod.Teleport, { to: r.value }, x({ props: __spreadValues(__spreadValues({}, t), d), slot: {}, attrs: u, slots: n, name: "Portal" }));
  };
} }), Dt = Symbol("PortalGroupContext"), wt = vue_cjs_prod.defineComponent({ name: "PortalGroup", props: { as: { type: [Object, String], default: "template" }, target: { type: Object, default: null } }, setup(t, { attrs: n, slots: u }) {
  let e = vue_cjs_prod.reactive({ resolveTarget() {
    return t.target;
  } });
  return vue_cjs_prod.provide(Dt, e), () => {
    let _a2 = t, r = __objRest(_a2, ["target"]);
    return x({ props: r, slot: {}, attrs: n, slots: u, name: "PortalGroup" });
  };
} });
var Lt = Symbol("DescriptionContext");
function Xo() {
  let t = vue_cjs_prod.inject(Lt, null);
  if (t === null)
    throw new Error("Missing parent");
  return t;
}
function G({ slot: t = vue_cjs_prod.ref({}), name: n = "Description", props: u = {} } = {}) {
  let e = vue_cjs_prod.ref([]);
  function o(r) {
    return e.value.push(r), () => {
      let s = e.value.indexOf(r);
      s !== -1 && e.value.splice(s, 1);
    };
  }
  return vue_cjs_prod.provide(Lt, { register: o, slot: t, name: n, props: u }), vue_cjs_prod.computed(() => e.value.length > 0 ? e.value.join(" ") : void 0);
}
vue_cjs_prod.defineComponent({ name: "Description", props: { as: { type: [Object, String], default: "p" } }, setup(t, { attrs: n, slots: u }) {
  let e = Xo(), o = `headlessui-description-${h()}`;
  return vue_cjs_prod.onMounted(() => vue_cjs_prod.onUnmounted(e.register(o))), () => {
    let { name: r = "Description", slot: s = vue_cjs_prod.ref({}), props: d = {} } = e, a = t, i = __spreadProps(__spreadValues({}, Object.entries(d).reduce((l, [c, p]) => Object.assign(l, { [c]: vue_cjs_prod.unref(p) }), {})), { id: o });
    return x({ props: __spreadValues(__spreadValues({}, a), i), slot: s.value, attrs: n, slots: u, name: r });
  };
} });
var kt = Symbol("DialogContext");
function $e(t) {
  let n = vue_cjs_prod.inject(kt, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <Dialog /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, $e), u;
  }
  return n;
}
var Ee = "DC8F892D-2EBD-447C-A4C8-A03058436FF4";
vue_cjs_prod.defineComponent({ name: "Dialog", inheritAttrs: false, props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, open: { type: [Boolean, String], default: Ee }, initialFocus: { type: Object, default: null } }, emits: { close: (t) => true }, setup(t, { emit: n, attrs: u, slots: e }) {
  let o = vue_cjs_prod.ref(/* @__PURE__ */ new Set()), r = I(), s = vue_cjs_prod.computed(() => t.open === Ee && r !== null ? T(r.value, { [0]: true, [1]: false }) : t.open);
  if (!(t.open !== Ee || r !== null))
    throw new Error("You forgot to provide an `open` prop to the `Dialog`.");
  if (typeof s.value != "boolean")
    throw new Error(`You provided an \`open\` prop to the \`Dialog\`, but the value is not a boolean. Received: ${s.value === Ee ? void 0 : t.open}`);
  let a = vue_cjs_prod.computed(() => t.open ? 0 : 1), i = vue_cjs_prod.computed(() => r !== null ? r.value === 0 : a.value === 0), l = vue_cjs_prod.ref(null), c = vue_cjs_prod.ref(a.value === 0);
  vue_cjs_prod.onUpdated(() => {
    c.value = a.value === 0;
  });
  let p = `headlessui-dialog-${h()}`, f = vue_cjs_prod.computed(() => ({ initialFocus: t.initialFocus }));
  Re(o, c, f), yt(l, c), Te((y, R) => T(y, { [0]() {
    o.value.add(R);
  }, [1]() {
    o.value.delete(R);
  } }));
  let b = G({ name: "DialogDescription", slot: vue_cjs_prod.computed(() => ({ open: s.value })) }), m = vue_cjs_prod.ref(null), g = { titleId: m, dialogState: a, setTitleId(y) {
    m.value !== y && (m.value = y);
  }, close() {
    n("close", false);
  } };
  vue_cjs_prod.provide(kt, g), vue_cjs_prod.watchEffect((y) => {
    if (a.value !== 0)
      return;
    let R = document.documentElement.style.overflow, E = document.documentElement.style.paddingRight, D = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden", document.documentElement.style.paddingRight = `${D}px`, y(() => {
      document.documentElement.style.overflow = R, document.documentElement.style.paddingRight = E;
    });
  }), vue_cjs_prod.watchEffect((y) => {
    if (a.value !== 0)
      return;
    let R = v(l);
    if (!R)
      return;
    let E = new IntersectionObserver((D) => {
      for (let w of D)
        w.boundingClientRect.x === 0 && w.boundingClientRect.y === 0 && w.boundingClientRect.width === 0 && w.boundingClientRect.height === 0 && g.close();
    });
    E.observe(R), y(() => E.disconnect());
  });
  function S(y) {
    y.stopPropagation();
  }
  return () => {
    let y = __spreadProps(__spreadValues({}, u), { ref: l, id: p, role: "dialog", "aria-modal": a.value === 0 ? true : void 0, "aria-labelledby": m.value, "aria-describedby": b.value, onClick: S }), _a2 = t, D = __objRest(_a2, ["open", "initialFocus"]), w = { open: a.value === 0 };
    return vue_cjs_prod.h(Ne, { force: true }, () => vue_cjs_prod.h(Pt, () => vue_cjs_prod.h(wt, { target: l.value }, () => vue_cjs_prod.h(Ne, { force: false }, () => x({ props: __spreadValues(__spreadValues({}, D), y), slot: w, attrs: u, slots: e, visible: i.value, features: 1 | 2, name: "Dialog" })))));
  };
} });
vue_cjs_prod.defineComponent({ name: "DialogOverlay", props: { as: { type: [Object, String], default: "div" } }, setup(t, { attrs: n, slots: u }) {
  let e = $e("DialogOverlay"), o = `headlessui-dialog-overlay-${h()}`;
  function r(s) {
    s.target === s.currentTarget && (s.preventDefault(), s.stopPropagation(), e.close());
  }
  return () => x({ props: __spreadValues(__spreadValues({}, t), { id: o, "aria-hidden": true, onClick: r }), slot: { open: e.dialogState.value === 0 }, attrs: n, slots: u, name: "DialogOverlay" });
} });
vue_cjs_prod.defineComponent({ name: "DialogTitle", props: { as: { type: [Object, String], default: "h2" } }, setup(t, { attrs: n, slots: u }) {
  let e = $e("DialogTitle"), o = `headlessui-dialog-title-${h()}`;
  return vue_cjs_prod.onMounted(() => {
    e.setTitleId(o), vue_cjs_prod.onUnmounted(() => e.setTitleId(null));
  }), () => x({ props: __spreadValues(__spreadValues({}, t), { id: o }), slot: { open: e.dialogState.value === 0 }, attrs: n, slots: u, name: "DialogTitle" });
} });
var At = Symbol("DisclosureContext");
function qe(t) {
  let n = vue_cjs_prod.inject(At, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <Disclosure /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, qe), u;
  }
  return n;
}
var Ht = Symbol("DisclosurePanelContext");
function an() {
  return vue_cjs_prod.inject(Ht, null);
}
vue_cjs_prod.defineComponent({ name: "Disclosure", props: { as: { type: [Object, String], default: "template" }, defaultOpen: { type: [Boolean], default: false } }, setup(t, { slots: n, attrs: u }) {
  let e = `headlessui-disclosure-button-${h()}`, o = `headlessui-disclosure-panel-${h()}`, r = vue_cjs_prod.ref(t.defaultOpen ? 0 : 1), s = vue_cjs_prod.ref(null), d = vue_cjs_prod.ref(null), a = { buttonId: e, panelId: o, disclosureState: r, panel: s, button: d, toggleDisclosure() {
    r.value = T(r.value, { [0]: 1, [1]: 0 });
  }, closeDisclosure() {
    r.value !== 1 && (r.value = 1);
  }, close(i) {
    a.closeDisclosure();
    let l = (() => i ? i instanceof HTMLElement ? i : i.value instanceof HTMLElement ? v(i) : v(a.button) : v(a.button))();
    l == null || l.focus();
  } };
  return vue_cjs_prod.provide(At, a), M(vue_cjs_prod.computed(() => T(r.value, { [0]: 0, [1]: 1 }))), () => {
    let _a2 = t, l = __objRest(_a2, ["defaultOpen"]), c = { open: r.value === 0, close: a.close };
    return x({ props: l, slot: c, slots: n, attrs: u, name: "Disclosure" });
  };
} });
vue_cjs_prod.defineComponent({ name: "DisclosureButton", props: { as: { type: [Object, String], default: "button" }, disabled: { type: [Boolean], default: false } }, setup(t, { attrs: n, slots: u }) {
  let e = qe("DisclosureButton"), o = an(), r = o === null ? false : o === e.panelId, s = vue_cjs_prod.ref(null);
  r || vue_cjs_prod.watchEffect(() => {
    e.button.value = s.value;
  });
  let d = P(vue_cjs_prod.computed(() => ({ as: t.as, type: n.type })), s);
  function a() {
    var c;
    t.disabled || (r ? (e.toggleDisclosure(), (c = v(e.button)) == null || c.focus()) : e.toggleDisclosure());
  }
  function i(c) {
    var p;
    if (!t.disabled)
      if (r)
        switch (c.key) {
          case " ":
          case "Enter":
            c.preventDefault(), c.stopPropagation(), e.toggleDisclosure(), (p = v(e.button)) == null || p.focus();
            break;
        }
      else
        switch (c.key) {
          case " ":
          case "Enter":
            c.preventDefault(), c.stopPropagation(), e.toggleDisclosure();
            break;
        }
  }
  function l(c) {
    switch (c.key) {
      case " ":
        c.preventDefault();
        break;
    }
  }
  return () => {
    let c = { open: e.disclosureState.value === 0 }, p = r ? { ref: s, type: d.value, onClick: a, onKeydown: i } : { id: e.buttonId, ref: s, type: d.value, "aria-expanded": t.disabled ? void 0 : e.disclosureState.value === 0, "aria-controls": v(e.panel) ? e.panelId : void 0, disabled: t.disabled ? true : void 0, onClick: a, onKeydown: i, onKeyup: l };
    return x({ props: __spreadValues(__spreadValues({}, t), p), slot: c, attrs: n, slots: u, name: "DisclosureButton" });
  };
} });
vue_cjs_prod.defineComponent({ name: "DisclosurePanel", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(t, { attrs: n, slots: u }) {
  let e = qe("DisclosurePanel");
  vue_cjs_prod.provide(Ht, e.panelId);
  let o = I(), r = vue_cjs_prod.computed(() => o !== null ? o.value === 0 : e.disclosureState.value === 0);
  return () => {
    let s = { open: e.disclosureState.value === 0, close: e.close }, d = { id: e.panelId, ref: e.panel };
    return x({ props: __spreadValues(__spreadValues({}, t), d), slot: s, attrs: n, slots: u, features: 1 | 2, visible: r.value, name: "DisclosurePanel" });
  };
} });
vue_cjs_prod.defineComponent({ name: "FocusTrap", props: { as: { type: [Object, String], default: "div" }, initialFocus: { type: Object, default: null } }, setup(t, { attrs: n, slots: u }) {
  let e = vue_cjs_prod.ref(/* @__PURE__ */ new Set()), o = vue_cjs_prod.ref(null), r = vue_cjs_prod.ref(true), s = vue_cjs_prod.computed(() => ({ initialFocus: t.initialFocus }));
  return vue_cjs_prod.onMounted(() => {
    !o.value || (e.value.add(o.value), Re(e, r, s));
  }), vue_cjs_prod.onUnmounted(() => {
    r.value = false;
  }), () => {
    let d = {}, a = { ref: o }, _a2 = t, l = __objRest(_a2, ["initialFocus"]);
    return x({ props: __spreadValues(__spreadValues({}, l), a), slot: d, attrs: n, slots: u, name: "FocusTrap" });
  };
} });
function gn(t) {
  requestAnimationFrame(() => requestAnimationFrame(t));
}
var Kt = Symbol("ListboxContext");
function pe(t) {
  let n = vue_cjs_prod.inject(Kt, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <Listbox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, pe), u;
  }
  return n;
}
var Ia = vue_cjs_prod.defineComponent({ name: "Listbox", emits: { "update:modelValue": (t) => true }, props: { as: { type: [Object, String], default: "template" }, disabled: { type: [Boolean], default: false }, horizontal: { type: [Boolean], default: false }, modelValue: { type: [Object, String, Number, Boolean] } }, setup(t, { slots: n, attrs: u, emit: e }) {
  let o = vue_cjs_prod.ref(1), r = vue_cjs_prod.ref(null), s = vue_cjs_prod.ref(null), d = vue_cjs_prod.ref(null), a = vue_cjs_prod.ref([]), i = vue_cjs_prod.ref(""), l = vue_cjs_prod.ref(null), c = vue_cjs_prod.computed(() => t.modelValue), p = { listboxState: o, value: c, orientation: vue_cjs_prod.computed(() => t.horizontal ? "horizontal" : "vertical"), labelRef: r, buttonRef: s, optionsRef: d, disabled: vue_cjs_prod.computed(() => t.disabled), options: a, searchQuery: i, activeOptionIndex: l, closeListbox() {
    t.disabled || o.value !== 1 && (o.value = 1, l.value = null);
  }, openListbox() {
    t.disabled || o.value !== 0 && (o.value = 0);
  }, goToOption(f, b) {
    if (t.disabled || o.value === 1)
      return;
    let m = J(f === 4 ? { focus: 4, id: b } : { focus: f }, { resolveItems: () => a.value, resolveActiveIndex: () => l.value, resolveId: (g) => g.id, resolveDisabled: (g) => g.dataRef.disabled });
    i.value === "" && l.value === m || (i.value = "", l.value = m);
  }, search(f) {
    if (t.disabled || o.value === 1)
      return;
    let m = i.value !== "" ? 0 : 1;
    i.value += f.toLowerCase();
    let S = (l.value !== null ? a.value.slice(l.value + m).concat(a.value.slice(0, l.value + m)) : a.value).find((R) => R.dataRef.textValue.startsWith(i.value) && !R.dataRef.disabled), y = S ? a.value.indexOf(S) : -1;
    y === -1 || y === l.value || (l.value = y);
  }, clearSearch() {
    t.disabled || o.value !== 1 && i.value !== "" && (i.value = "");
  }, registerOption(f, b) {
    var g, S;
    let m = Array.from((S = (g = d.value) == null ? void 0 : g.querySelectorAll('[id^="headlessui-listbox-option-"]')) != null ? S : []).reduce((y, R, E) => Object.assign(y, { [R.id]: E }), {});
    a.value = [...a.value, { id: f, dataRef: b }].sort((y, R) => m[y.id] - m[R.id]);
  }, unregisterOption(f) {
    let b = a.value.slice(), m = l.value !== null ? b[l.value] : null, g = b.findIndex((S) => S.id === f);
    g !== -1 && b.splice(g, 1), a.value = b, l.value = (() => g === l.value || m === null ? null : b.indexOf(m))();
  }, select(f) {
    t.disabled || e("update:modelValue", f);
  } };
  return vue_cjs_prod.provide(Kt, p), M(vue_cjs_prod.computed(() => T(o.value, { [0]: 0, [1]: 1 }))), () => {
    let f = { open: o.value === 0, disabled: t.disabled };
    return x({ props: L(t, ["modelValue", "onUpdate:modelValue", "disabled", "horizontal"]), slot: f, slots: n, attrs: u, name: "Listbox" });
  };
} }), Pa = vue_cjs_prod.defineComponent({ name: "ListboxLabel", props: { as: { type: [Object, String], default: "label" } }, setup(t, { attrs: n, slots: u }) {
  let e = pe("ListboxLabel"), o = `headlessui-listbox-label-${h()}`;
  function r() {
    var s;
    (s = v(e.buttonRef)) == null || s.focus({ preventScroll: true });
  }
  return () => {
    let s = { open: e.listboxState.value === 0, disabled: e.disabled.value }, d = { id: o, ref: e.labelRef, onClick: r };
    return x({ props: __spreadValues(__spreadValues({}, t), d), slot: s, attrs: n, slots: u, name: "ListboxLabel" });
  };
} }), Da = vue_cjs_prod.defineComponent({ name: "ListboxButton", props: { as: { type: [Object, String], default: "button" } }, setup(t, { attrs: n, slots: u }) {
  let e = pe("ListboxButton"), o = `headlessui-listbox-button-${h()}`;
  function r(i) {
    switch (i.key) {
      case " ":
      case "Enter":
      case "ArrowDown":
        i.preventDefault(), e.openListbox(), vue_cjs_prod.nextTick(() => {
          var l;
          (l = v(e.optionsRef)) == null || l.focus({ preventScroll: true }), e.value.value || e.goToOption(0);
        });
        break;
      case "ArrowUp":
        i.preventDefault(), e.openListbox(), vue_cjs_prod.nextTick(() => {
          var l;
          (l = v(e.optionsRef)) == null || l.focus({ preventScroll: true }), e.value.value || e.goToOption(3);
        });
        break;
    }
  }
  function s(i) {
    switch (i.key) {
      case " ":
        i.preventDefault();
        break;
    }
  }
  function d(i) {
    e.disabled.value || (e.listboxState.value === 0 ? (e.closeListbox(), vue_cjs_prod.nextTick(() => {
      var l;
      return (l = v(e.buttonRef)) == null ? void 0 : l.focus({ preventScroll: true });
    })) : (i.preventDefault(), e.openListbox(), gn(() => {
      var l;
      return (l = v(e.optionsRef)) == null ? void 0 : l.focus({ preventScroll: true });
    })));
  }
  let a = P(vue_cjs_prod.computed(() => ({ as: t.as, type: n.type })), e.buttonRef);
  return () => {
    var c, p;
    let i = { open: e.listboxState.value === 0, disabled: e.disabled.value }, l = { ref: e.buttonRef, id: o, type: a.value, "aria-haspopup": true, "aria-controls": (c = v(e.optionsRef)) == null ? void 0 : c.id, "aria-expanded": e.disabled.value ? void 0 : e.listboxState.value === 0, "aria-labelledby": e.labelRef.value ? [(p = v(e.labelRef)) == null ? void 0 : p.id, o].join(" ") : void 0, disabled: e.disabled.value === true ? true : void 0, onKeydown: r, onKeyup: s, onClick: d };
    return x({ props: __spreadValues(__spreadValues({}, t), l), slot: i, attrs: n, slots: u, name: "ListboxButton" });
  };
} }), wa = vue_cjs_prod.defineComponent({ name: "ListboxOptions", props: { as: { type: [Object, String], default: "ul" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(t, { attrs: n, slots: u }) {
  let e = pe("ListboxOptions"), o = `headlessui-listbox-options-${h()}`, r = vue_cjs_prod.ref(null);
  function s(i) {
    switch (r.value && clearTimeout(r.value), i.key) {
      case " ":
        if (e.searchQuery.value !== "")
          return i.preventDefault(), i.stopPropagation(), e.search(i.key);
      case "Enter":
        if (i.preventDefault(), i.stopPropagation(), e.activeOptionIndex.value !== null) {
          let { dataRef: l } = e.options.value[e.activeOptionIndex.value];
          e.select(l.value);
        }
        e.closeListbox(), vue_cjs_prod.nextTick(() => {
          var l;
          return (l = v(e.buttonRef)) == null ? void 0 : l.focus({ preventScroll: true });
        });
        break;
      case T(e.orientation.value, { vertical: "ArrowDown", horizontal: "ArrowRight" }):
        return i.preventDefault(), i.stopPropagation(), e.goToOption(2);
      case T(e.orientation.value, { vertical: "ArrowUp", horizontal: "ArrowLeft" }):
        return i.preventDefault(), i.stopPropagation(), e.goToOption(1);
      case "Home":
      case "PageUp":
        return i.preventDefault(), i.stopPropagation(), e.goToOption(0);
      case "End":
      case "PageDown":
        return i.preventDefault(), i.stopPropagation(), e.goToOption(3);
      case "Escape":
        i.preventDefault(), i.stopPropagation(), e.closeListbox(), vue_cjs_prod.nextTick(() => {
          var l;
          return (l = v(e.buttonRef)) == null ? void 0 : l.focus({ preventScroll: true });
        });
        break;
      case "Tab":
        i.preventDefault(), i.stopPropagation();
        break;
      default:
        i.key.length === 1 && (e.search(i.key), r.value = setTimeout(() => e.clearSearch(), 350));
        break;
    }
  }
  let d = I(), a = vue_cjs_prod.computed(() => d !== null ? d.value === 0 : e.listboxState.value === 0);
  return () => {
    var p, f, b, m;
    let i = { open: e.listboxState.value === 0 }, l = { "aria-activedescendant": e.activeOptionIndex.value === null || (p = e.options.value[e.activeOptionIndex.value]) == null ? void 0 : p.id, "aria-labelledby": (m = (f = v(e.labelRef)) == null ? void 0 : f.id) != null ? m : (b = v(e.buttonRef)) == null ? void 0 : b.id, "aria-orientation": e.orientation.value, id: o, onKeydown: s, role: "listbox", tabIndex: 0, ref: e.optionsRef };
    return x({ props: __spreadValues(__spreadValues({}, t), l), slot: i, attrs: n, slots: u, features: 1 | 2, visible: a.value, name: "ListboxOptions" });
  };
} }), La = vue_cjs_prod.defineComponent({ name: "ListboxOption", props: { as: { type: [Object, String], default: "li" }, value: { type: [Object, String, Number, Boolean] }, disabled: { type: Boolean, default: false } }, setup(t, { slots: n, attrs: u }) {
  let e = pe("ListboxOption"), o = `headlessui-listbox-option-${h()}`, r = vue_cjs_prod.computed(() => e.activeOptionIndex.value !== null ? e.options.value[e.activeOptionIndex.value].id === o : false), s = vue_cjs_prod.computed(() => vue_cjs_prod.toRaw(e.value.value) === vue_cjs_prod.toRaw(t.value)), d = vue_cjs_prod.ref({ disabled: t.disabled, value: t.value, textValue: "" });
  vue_cjs_prod.onMounted(() => {
    var f, b;
    let p = (b = (f = document.getElementById(o)) == null ? void 0 : f.textContent) == null ? void 0 : b.toLowerCase().trim();
    p !== void 0 && (d.value.textValue = p);
  }), vue_cjs_prod.onMounted(() => e.registerOption(o, d)), vue_cjs_prod.onUnmounted(() => e.unregisterOption(o)), vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watch([e.listboxState, s], () => {
      var p, f;
      e.listboxState.value === 0 && (!s.value || (e.goToOption(4, o), (f = (p = document.getElementById(o)) == null ? void 0 : p.focus) == null || f.call(p)));
    }, { immediate: true });
  }), vue_cjs_prod.watchEffect(() => {
    e.listboxState.value === 0 && (!r.value || vue_cjs_prod.nextTick(() => {
      var p, f;
      return (f = (p = document.getElementById(o)) == null ? void 0 : p.scrollIntoView) == null ? void 0 : f.call(p, { block: "nearest" });
    }));
  });
  function a(p) {
    if (t.disabled)
      return p.preventDefault();
    e.select(t.value), e.closeListbox(), vue_cjs_prod.nextTick(() => {
      var f;
      return (f = v(e.buttonRef)) == null ? void 0 : f.focus({ preventScroll: true });
    });
  }
  function i() {
    if (t.disabled)
      return e.goToOption(5);
    e.goToOption(4, o);
  }
  function l() {
    t.disabled || r.value || e.goToOption(4, o);
  }
  function c() {
    t.disabled || !r.value || e.goToOption(5);
  }
  return () => {
    let { disabled: p } = t, f = { active: r.value, selected: s.value, disabled: p }, b = { id: o, role: "option", tabIndex: p === true ? void 0 : -1, "aria-disabled": p === true ? true : void 0, "aria-selected": s.value === true ? s.value : void 0, disabled: void 0, onClick: a, onFocus: i, onPointermove: l, onMousemove: l, onPointerleave: c, onMouseleave: c };
    return x({ props: __spreadValues(__spreadValues({}, t), b), slot: f, attrs: u, slots: n, name: "ListboxOption" });
  };
} });
function Rn(t) {
  requestAnimationFrame(() => requestAnimationFrame(t));
}
var Nt = Symbol("MenuContext");
function De(t) {
  let n = vue_cjs_prod.inject(Nt, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <Menu /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, De), u;
  }
  return n;
}
vue_cjs_prod.defineComponent({ name: "Menu", props: { as: { type: [Object, String], default: "template" } }, setup(t, { slots: n, attrs: u }) {
  let e = vue_cjs_prod.ref(1), o = vue_cjs_prod.ref(null), r = vue_cjs_prod.ref(null), s = vue_cjs_prod.ref([]), d = vue_cjs_prod.ref(""), a = vue_cjs_prod.ref(null), i = { menuState: e, buttonRef: o, itemsRef: r, items: s, searchQuery: d, activeItemIndex: a, closeMenu: () => {
    e.value = 1, a.value = null;
  }, openMenu: () => e.value = 0, goToItem(l, c) {
    let p = J(l === 4 ? { focus: 4, id: c } : { focus: l }, { resolveItems: () => s.value, resolveActiveIndex: () => a.value, resolveId: (f) => f.id, resolveDisabled: (f) => f.dataRef.disabled });
    d.value === "" && a.value === p || (d.value = "", a.value = p);
  }, search(l) {
    let p = d.value !== "" ? 0 : 1;
    d.value += l.toLowerCase();
    let b = (a.value !== null ? s.value.slice(a.value + p).concat(s.value.slice(0, a.value + p)) : s.value).find((g) => g.dataRef.textValue.startsWith(d.value) && !g.dataRef.disabled), m = b ? s.value.indexOf(b) : -1;
    m === -1 || m === a.value || (a.value = m);
  }, clearSearch() {
    d.value = "";
  }, registerItem(l, c) {
    var f, b;
    let p = Array.from((b = (f = r.value) == null ? void 0 : f.querySelectorAll('[id^="headlessui-menu-item-"]')) != null ? b : []).reduce((m, g, S) => Object.assign(m, { [g.id]: S }), {});
    s.value = [...s.value, { id: l, dataRef: c }].sort((m, g) => p[m.id] - p[g.id]);
  }, unregisterItem(l) {
    let c = s.value.slice(), p = a.value !== null ? c[a.value] : null, f = c.findIndex((b) => b.id === l);
    f !== -1 && c.splice(f, 1), s.value = c, a.value = (() => f === a.value || p === null ? null : c.indexOf(p))();
  } };
  return vue_cjs_prod.provide(Nt, i), M(vue_cjs_prod.computed(() => T(e.value, { [0]: 0, [1]: 1 }))), () => {
    let l = { open: e.value === 0 };
    return x({ props: t, slot: l, slots: n, attrs: u, name: "Menu" });
  };
} });
vue_cjs_prod.defineComponent({ name: "MenuButton", props: { disabled: { type: Boolean, default: false }, as: { type: [Object, String], default: "button" } }, setup(t, { attrs: n, slots: u }) {
  let e = De("MenuButton"), o = `headlessui-menu-button-${h()}`;
  function r(i) {
    switch (i.key) {
      case " ":
      case "Enter":
      case "ArrowDown":
        i.preventDefault(), i.stopPropagation(), e.openMenu(), vue_cjs_prod.nextTick(() => {
          var l;
          (l = v(e.itemsRef)) == null || l.focus({ preventScroll: true }), e.goToItem(0);
        });
        break;
      case "ArrowUp":
        i.preventDefault(), i.stopPropagation(), e.openMenu(), vue_cjs_prod.nextTick(() => {
          var l;
          (l = v(e.itemsRef)) == null || l.focus({ preventScroll: true }), e.goToItem(3);
        });
        break;
    }
  }
  function s(i) {
    switch (i.key) {
      case " ":
        i.preventDefault();
        break;
    }
  }
  function d(i) {
    t.disabled || (e.menuState.value === 0 ? (e.closeMenu(), vue_cjs_prod.nextTick(() => {
      var l;
      return (l = v(e.buttonRef)) == null ? void 0 : l.focus({ preventScroll: true });
    })) : (i.preventDefault(), i.stopPropagation(), e.openMenu(), Rn(() => {
      var l;
      return (l = v(e.itemsRef)) == null ? void 0 : l.focus({ preventScroll: true });
    })));
  }
  let a = P(vue_cjs_prod.computed(() => ({ as: t.as, type: n.type })), e.buttonRef);
  return () => {
    var c;
    let i = { open: e.menuState.value === 0 }, l = { ref: e.buttonRef, id: o, type: a.value, "aria-haspopup": true, "aria-controls": (c = v(e.itemsRef)) == null ? void 0 : c.id, "aria-expanded": t.disabled ? void 0 : e.menuState.value === 0, onKeydown: r, onKeyup: s, onClick: d };
    return x({ props: __spreadValues(__spreadValues({}, t), l), slot: i, attrs: n, slots: u, name: "MenuButton" });
  };
} });
vue_cjs_prod.defineComponent({ name: "MenuItems", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(t, { attrs: n, slots: u }) {
  let e = De("MenuItems"), o = `headlessui-menu-items-${h()}`, r = vue_cjs_prod.ref(null);
  Y({ container: vue_cjs_prod.computed(() => v(e.itemsRef)), enabled: vue_cjs_prod.computed(() => e.menuState.value === 0), accept(l) {
    return l.getAttribute("role") === "menuitem" ? NodeFilter.FILTER_REJECT : l.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(l) {
    l.setAttribute("role", "none");
  } });
  function s(l) {
    var c;
    switch (r.value && clearTimeout(r.value), l.key) {
      case " ":
        if (e.searchQuery.value !== "")
          return l.preventDefault(), l.stopPropagation(), e.search(l.key);
      case "Enter":
        if (l.preventDefault(), l.stopPropagation(), e.activeItemIndex.value !== null) {
          let { id: p } = e.items.value[e.activeItemIndex.value];
          (c = document.getElementById(p)) == null || c.click();
        }
        e.closeMenu(), vue_cjs_prod.nextTick(() => {
          var p;
          return (p = v(e.buttonRef)) == null ? void 0 : p.focus({ preventScroll: true });
        });
        break;
      case "ArrowDown":
        return l.preventDefault(), l.stopPropagation(), e.goToItem(2);
      case "ArrowUp":
        return l.preventDefault(), l.stopPropagation(), e.goToItem(1);
      case "Home":
      case "PageUp":
        return l.preventDefault(), l.stopPropagation(), e.goToItem(0);
      case "End":
      case "PageDown":
        return l.preventDefault(), l.stopPropagation(), e.goToItem(3);
      case "Escape":
        l.preventDefault(), l.stopPropagation(), e.closeMenu(), vue_cjs_prod.nextTick(() => {
          var p;
          return (p = v(e.buttonRef)) == null ? void 0 : p.focus({ preventScroll: true });
        });
        break;
      case "Tab":
        l.preventDefault(), l.stopPropagation();
        break;
      default:
        l.key.length === 1 && (e.search(l.key), r.value = setTimeout(() => e.clearSearch(), 350));
        break;
    }
  }
  function d(l) {
    switch (l.key) {
      case " ":
        l.preventDefault();
        break;
    }
  }
  let a = I(), i = vue_cjs_prod.computed(() => a !== null ? a.value === 0 : e.menuState.value === 0);
  return () => {
    var f, b;
    let l = { open: e.menuState.value === 0 }, c = { "aria-activedescendant": e.activeItemIndex.value === null || (f = e.items.value[e.activeItemIndex.value]) == null ? void 0 : f.id, "aria-labelledby": (b = v(e.buttonRef)) == null ? void 0 : b.id, id: o, onKeydown: s, onKeyup: d, role: "menu", tabIndex: 0, ref: e.itemsRef };
    return x({ props: __spreadValues(__spreadValues({}, t), c), slot: l, attrs: n, slots: u, features: 1 | 2, visible: i.value, name: "MenuItems" });
  };
} });
vue_cjs_prod.defineComponent({ name: "MenuItem", props: { as: { type: [Object, String], default: "template" }, disabled: { type: Boolean, default: false } }, setup(t, { slots: n, attrs: u }) {
  let e = De("MenuItem"), o = `headlessui-menu-item-${h()}`, r = vue_cjs_prod.computed(() => e.activeItemIndex.value !== null ? e.items.value[e.activeItemIndex.value].id === o : false), s = vue_cjs_prod.ref({ disabled: t.disabled, textValue: "" });
  vue_cjs_prod.onMounted(() => {
    var p, f;
    let c = (f = (p = document.getElementById(o)) == null ? void 0 : p.textContent) == null ? void 0 : f.toLowerCase().trim();
    c !== void 0 && (s.value.textValue = c);
  }), vue_cjs_prod.onMounted(() => e.registerItem(o, s)), vue_cjs_prod.onUnmounted(() => e.unregisterItem(o)), vue_cjs_prod.watchEffect(() => {
    e.menuState.value === 0 && (!r.value || vue_cjs_prod.nextTick(() => {
      var c, p;
      return (p = (c = document.getElementById(o)) == null ? void 0 : c.scrollIntoView) == null ? void 0 : p.call(c, { block: "nearest" });
    }));
  });
  function d(c) {
    if (t.disabled)
      return c.preventDefault();
    e.closeMenu(), vue_cjs_prod.nextTick(() => {
      var p;
      return (p = v(e.buttonRef)) == null ? void 0 : p.focus({ preventScroll: true });
    });
  }
  function a() {
    if (t.disabled)
      return e.goToItem(5);
    e.goToItem(4, o);
  }
  function i() {
    t.disabled || r.value || e.goToItem(4, o);
  }
  function l() {
    t.disabled || !r.value || e.goToItem(5);
  }
  return () => {
    let { disabled: c } = t, p = { active: r.value, disabled: c };
    return x({ props: __spreadValues(__spreadValues({}, t), { id: o, role: "menuitem", tabIndex: c === true ? void 0 : -1, "aria-disabled": c === true ? true : void 0, onClick: d, onFocus: a, onPointermove: i, onMousemove: i, onPointerleave: l, onMouseleave: l }), slot: p, attrs: u, slots: n, name: "MenuItem" });
  };
} });
var Wt = Symbol("PopoverContext");
function Le(t) {
  let n = vue_cjs_prod.inject(Wt, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <${Cn.name} /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, Le), u;
  }
  return n;
}
var Ut = Symbol("PopoverGroupContext");
function $t() {
  return vue_cjs_prod.inject(Ut, null);
}
var Gt = Symbol("PopoverPanelContext");
function On() {
  return vue_cjs_prod.inject(Gt, null);
}
var Cn = vue_cjs_prod.defineComponent({ name: "Popover", props: { as: { type: [Object, String], default: "div" } }, setup(t, { slots: n, attrs: u }) {
  let e = `headlessui-popover-button-${h()}`, o = `headlessui-popover-panel-${h()}`, r = vue_cjs_prod.ref(1), s = vue_cjs_prod.ref(null), d = vue_cjs_prod.ref(null), a = { popoverState: r, buttonId: e, panelId: o, panel: d, button: s, togglePopover() {
    r.value = T(r.value, { [0]: 1, [1]: 0 });
  }, closePopover() {
    r.value !== 1 && (r.value = 1);
  }, close(f) {
    a.closePopover();
    let b = (() => f ? f instanceof HTMLElement ? f : f.value instanceof HTMLElement ? v(f) : v(a.button) : v(a.button))();
    b == null || b.focus();
  } };
  vue_cjs_prod.provide(Wt, a), M(vue_cjs_prod.computed(() => T(r.value, { [0]: 0, [1]: 1 })));
  let i = { buttonId: e, panelId: o, close() {
    a.closePopover();
  } }, l = $t(), c = l == null ? void 0 : l.registerPopover;
  return vue_cjs_prod.watchEffect(() => c == null ? void 0 : c(i)), () => {
    let f = { open: r.value === 0, close: a.close };
    return x({ props: t, slot: f, slots: n, attrs: u, name: "Popover" });
  };
} });
vue_cjs_prod.defineComponent({ name: "PopoverButton", props: { as: { type: [Object, String], default: "button" }, disabled: { type: [Boolean], default: false } }, setup(t, { attrs: n, slots: u }) {
  let e = Le("PopoverButton"), o = $t(), r = o == null ? void 0 : o.closeOthers, s = On(), d = s === null ? false : s === e.panelId;
  vue_cjs_prod.ref(null);
  let i = vue_cjs_prod.ref(null);
  let l = vue_cjs_prod.ref(null);
  d || vue_cjs_prod.watchEffect(() => {
    e.button.value = l.value;
  });
  let c = P(vue_cjs_prod.computed(() => ({ as: t.as, type: n.type })), l);
  function p(m) {
    var g, S, y, R;
    if (d) {
      if (e.popoverState.value === 1)
        return;
      switch (m.key) {
        case " ":
        case "Enter":
          m.preventDefault(), m.stopPropagation(), e.closePopover(), (g = v(e.button)) == null || g.focus();
          break;
      }
    } else
      switch (m.key) {
        case " ":
        case "Enter":
          m.preventDefault(), m.stopPropagation(), e.popoverState.value === 1 && (r == null || r(e.buttonId)), e.togglePopover();
          break;
        case "Escape":
          if (e.popoverState.value !== 0)
            return r == null ? void 0 : r(e.buttonId);
          if (!v(e.button) || !((S = v(e.button)) == null ? void 0 : S.contains(document.activeElement)))
            return;
          m.preventDefault(), m.stopPropagation(), e.closePopover();
          break;
        case "Tab":
          if (e.popoverState.value !== 0 || !e.panel || !e.button)
            return;
          if (m.shiftKey) {
            if (!i.value || ((y = v(e.button)) == null ? void 0 : y.contains(i.value)) || ((R = v(e.panel)) == null ? void 0 : R.contains(i.value)))
              return;
            let E = ae(), D = E.indexOf(i.value);
            if (E.indexOf(v(e.button)) > D)
              return;
            m.preventDefault(), m.stopPropagation(), O(v(e.panel), 8);
          } else
            m.preventDefault(), m.stopPropagation(), O(v(e.panel), 1);
          break;
      }
  }
  function f(m) {
    var g, S;
    if (!d && (m.key === " " && m.preventDefault(), e.popoverState.value === 0 && !!e.panel && !!e.button))
      switch (m.key) {
        case "Tab":
          if (!i.value || ((g = v(e.button)) == null ? void 0 : g.contains(i.value)) || ((S = v(e.panel)) == null ? void 0 : S.contains(i.value)))
            return;
          let y = ae(), R = y.indexOf(i.value);
          if (y.indexOf(v(e.button)) > R)
            return;
          m.preventDefault(), m.stopPropagation(), O(v(e.panel), 8);
          break;
      }
  }
  function b() {
    var m, g;
    t.disabled || (d ? (e.closePopover(), (m = v(e.button)) == null || m.focus()) : (e.popoverState.value === 1 && (r == null || r(e.buttonId)), (g = v(e.button)) == null || g.focus(), e.togglePopover()));
  }
  return () => {
    let m = { open: e.popoverState.value === 0 }, g = d ? { ref: l, type: c.value, onKeydown: p, onClick: b } : { ref: l, id: e.buttonId, type: c.value, "aria-expanded": t.disabled ? void 0 : e.popoverState.value === 0, "aria-controls": v(e.panel) ? e.panelId : void 0, disabled: t.disabled ? true : void 0, onKeydown: p, onKeyup: f, onClick: b };
    return x({ props: __spreadValues(__spreadValues({}, t), g), slot: m, attrs: n, slots: u, name: "PopoverButton" });
  };
} });
vue_cjs_prod.defineComponent({ name: "PopoverOverlay", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(t, { attrs: n, slots: u }) {
  let e = Le("PopoverOverlay"), o = `headlessui-popover-overlay-${h()}`, r = I(), s = vue_cjs_prod.computed(() => r !== null ? r.value === 0 : e.popoverState.value === 0);
  function d() {
    e.closePopover();
  }
  return () => {
    let a = { open: e.popoverState.value === 0 };
    return x({ props: __spreadValues(__spreadValues({}, t), { id: o, "aria-hidden": true, onClick: d }), slot: a, attrs: n, slots: u, features: 1 | 2, visible: s.value, name: "PopoverOverlay" });
  };
} });
vue_cjs_prod.defineComponent({ name: "PopoverPanel", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true }, focus: { type: Boolean, default: false } }, setup(t, { attrs: n, slots: u }) {
  let { focus: e } = t, o = Le("PopoverPanel");
  vue_cjs_prod.provide(Gt, o.panelId), vue_cjs_prod.onUnmounted(() => {
    o.panel.value = null;
  }), vue_cjs_prod.watchEffect(() => {
    var i;
    if (!e || o.popoverState.value !== 0 || !o.panel)
      return;
    let a = document.activeElement;
    ((i = v(o.panel)) == null ? void 0 : i.contains(a)) || O(v(o.panel), 1);
  });
  let r = I(), s = vue_cjs_prod.computed(() => r !== null ? r.value === 0 : o.popoverState.value === 0);
  function d(a) {
    var i, l;
    switch (a.key) {
      case "Escape":
        if (o.popoverState.value !== 0 || !v(o.panel) || !((i = v(o.panel)) == null ? void 0 : i.contains(document.activeElement)))
          return;
        a.preventDefault(), a.stopPropagation(), o.closePopover(), (l = v(o.button)) == null || l.focus();
        break;
    }
  }
  return () => {
    let a = { open: o.popoverState.value === 0, close: o.close }, i = { ref: o.panel, id: o.panelId, onKeydown: d };
    return x({ props: __spreadValues(__spreadValues({}, t), i), slot: a, attrs: n, slots: u, features: 1 | 2, visible: s.value, name: "PopoverPanel" });
  };
} });
vue_cjs_prod.defineComponent({ name: "PopoverGroup", props: { as: { type: [Object, String], default: "div" } }, setup(t, { attrs: n, slots: u }) {
  let e = vue_cjs_prod.ref(null), o = vue_cjs_prod.ref([]);
  function r(i) {
    let l = o.value.indexOf(i);
    l !== -1 && o.value.splice(l, 1);
  }
  function s(i) {
    return o.value.push(i), () => {
      r(i);
    };
  }
  function d() {
    var l;
    let i = document.activeElement;
    return ((l = v(e)) == null ? void 0 : l.contains(i)) ? true : o.value.some((c) => {
      var p, f;
      return ((p = document.getElementById(c.buttonId)) == null ? void 0 : p.contains(i)) || ((f = document.getElementById(c.panelId)) == null ? void 0 : f.contains(i));
    });
  }
  function a(i) {
    for (let l of o.value)
      l.buttonId !== i && l.close();
  }
  return vue_cjs_prod.provide(Ut, { registerPopover: s, unregisterPopover: r, isFocusWithinPopoverGroup: d, closeOthers: a }), () => x({ props: __spreadValues(__spreadValues({}, t), { ref: e }), slot: {}, attrs: n, slots: u, name: "PopoverGroup" });
} });
var _t = Symbol("LabelContext");
function qt() {
  let t = vue_cjs_prod.inject(_t, null);
  if (t === null) {
    let n = new Error("You used a <Label /> component, but it is not inside a parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(n, qt), n;
  }
  return t;
}
function fe({ slot: t = {}, name: n = "Label", props: u = {} } = {}) {
  let e = vue_cjs_prod.ref([]);
  function o(r) {
    return e.value.push(r), () => {
      let s = e.value.indexOf(r);
      s !== -1 && e.value.splice(s, 1);
    };
  }
  return vue_cjs_prod.provide(_t, { register: o, slot: t, name: n, props: u }), vue_cjs_prod.computed(() => e.value.length > 0 ? e.value.join(" ") : void 0);
}
vue_cjs_prod.defineComponent({ name: "Label", props: { as: { type: [Object, String], default: "label" }, passive: { type: [Boolean], default: false } }, setup(t, { slots: n, attrs: u }) {
  let e = qt(), o = `headlessui-label-${h()}`;
  return vue_cjs_prod.onMounted(() => vue_cjs_prod.onUnmounted(e.register(o))), () => {
    let { name: r = "Label", slot: s = {}, props: d = {} } = e, _a2 = t, { passive: a } = _a2, i = __objRest(_a2, ["passive"]), l = __spreadProps(__spreadValues({}, Object.entries(d).reduce((p, [f, b]) => Object.assign(p, { [f]: vue_cjs_prod.unref(b) }), {})), { id: o }), c = __spreadValues(__spreadValues({}, i), l);
    return a && delete c.onClick, x({ props: c, slot: s, attrs: u, slots: n, name: r });
  };
} });
var Qt = Symbol("RadioGroupContext");
function Jt(t) {
  let n = vue_cjs_prod.inject(Qt, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <RadioGroup /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, Jt), u;
  }
  return n;
}
vue_cjs_prod.defineComponent({ name: "RadioGroup", emits: { "update:modelValue": (t) => true }, props: { as: { type: [Object, String], default: "div" }, disabled: { type: [Boolean], default: false }, modelValue: { type: [Object, String, Number, Boolean] } }, setup(t, { emit: n, attrs: u, slots: e }) {
  let o = vue_cjs_prod.ref(null), r = vue_cjs_prod.ref([]), s = fe({ name: "RadioGroupLabel" }), d = G({ name: "RadioGroupDescription" }), a = vue_cjs_prod.computed(() => t.modelValue), i = { options: r, value: a, disabled: vue_cjs_prod.computed(() => t.disabled), firstOption: vue_cjs_prod.computed(() => r.value.find((p) => !p.propsRef.disabled)), containsCheckedOption: vue_cjs_prod.computed(() => r.value.some((p) => vue_cjs_prod.toRaw(p.propsRef.value) === vue_cjs_prod.toRaw(t.modelValue))), change(p) {
    var b;
    if (t.disabled || a.value === p)
      return false;
    let f = (b = r.value.find((m) => vue_cjs_prod.toRaw(m.propsRef.value) === vue_cjs_prod.toRaw(p))) == null ? void 0 : b.propsRef;
    return (f == null ? void 0 : f.disabled) ? false : (n("update:modelValue", p), true);
  }, registerOption(p) {
    var b;
    let f = Array.from((b = o.value) == null ? void 0 : b.querySelectorAll('[id^="headlessui-radiogroup-option-"]')).reduce((m, g, S) => Object.assign(m, { [g.id]: S }), {});
    r.value.push(p), r.value.sort((m, g) => f[m.id] - f[g.id]);
  }, unregisterOption(p) {
    let f = r.value.findIndex((b) => b.id === p);
    f !== -1 && r.value.splice(f, 1);
  } };
  vue_cjs_prod.provide(Qt, i), Y({ container: vue_cjs_prod.computed(() => v(o)), accept(p) {
    return p.getAttribute("role") === "radio" ? NodeFilter.FILTER_REJECT : p.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(p) {
    p.setAttribute("role", "none");
  } });
  function l(p) {
    if (!o.value || !o.value.contains(p.target))
      return;
    let f = r.value.filter((b) => b.propsRef.disabled === false).map((b) => b.element);
    switch (p.key) {
      case "ArrowLeft":
      case "ArrowUp":
        if (p.preventDefault(), p.stopPropagation(), O(f, 2 | 16) === 2) {
          let m = r.value.find((g) => g.element === document.activeElement);
          m && i.change(m.propsRef.value);
        }
        break;
      case "ArrowRight":
      case "ArrowDown":
        if (p.preventDefault(), p.stopPropagation(), O(f, 4 | 16) === 2) {
          let m = r.value.find((g) => g.element === document.activeElement);
          m && i.change(m.propsRef.value);
        }
        break;
      case " ":
        {
          p.preventDefault(), p.stopPropagation();
          let b = r.value.find((m) => m.element === document.activeElement);
          b && i.change(b.propsRef.value);
        }
        break;
    }
  }
  let c = `headlessui-radiogroup-${h()}`;
  return () => {
    let _a2 = t, b = __objRest(_a2, ["modelValue", "disabled"]), m = { ref: o, id: c, role: "radiogroup", "aria-labelledby": s.value, "aria-describedby": d.value, onKeydown: l };
    return x({ props: __spreadValues(__spreadValues({}, b), m), slot: {}, attrs: u, slots: e, name: "RadioGroup" });
  };
} });
vue_cjs_prod.defineComponent({ name: "RadioGroupOption", props: { as: { type: [Object, String], default: "div" }, value: { type: [Object, String, Number, Boolean] }, disabled: { type: Boolean, default: false } }, setup(t, { attrs: n, slots: u }) {
  let e = Jt("RadioGroupOption"), o = `headlessui-radiogroup-option-${h()}`, r = fe({ name: "RadioGroupLabel" }), s = G({ name: "RadioGroupDescription" }), d = vue_cjs_prod.ref(null), a = vue_cjs_prod.computed(() => ({ value: t.value, disabled: t.disabled })), i = vue_cjs_prod.ref(1);
  vue_cjs_prod.onMounted(() => e.registerOption({ id: o, element: d, propsRef: a })), vue_cjs_prod.onUnmounted(() => e.unregisterOption(o));
  let l = vue_cjs_prod.computed(() => {
    var S;
    return ((S = e.firstOption.value) == null ? void 0 : S.id) === o;
  }), c = vue_cjs_prod.computed(() => e.disabled.value || t.disabled), p = vue_cjs_prod.computed(() => vue_cjs_prod.toRaw(e.value.value) === vue_cjs_prod.toRaw(t.value)), f = vue_cjs_prod.computed(() => c.value ? -1 : p.value || !e.containsCheckedOption.value && l.value ? 0 : -1);
  function b() {
    var S;
    !e.change(t.value) || (i.value |= 2, (S = d.value) == null || S.focus());
  }
  function m() {
    i.value |= 2;
  }
  function g() {
    i.value &= ~2;
  }
  return () => {
    let S = L(t, ["value", "disabled"]), y = { checked: p.value, disabled: c.value, active: Boolean(i.value & 2) }, R = { id: o, ref: d, role: "radio", "aria-checked": p.value ? "true" : "false", "aria-labelledby": r.value, "aria-describedby": s.value, "aria-disabled": c.value ? true : void 0, tabIndex: f.value, onClick: c.value ? void 0 : b, onFocus: c.value ? void 0 : m, onBlur: c.value ? void 0 : g };
    return x({ props: __spreadValues(__spreadValues({}, S), R), slot: y, attrs: n, slots: u, name: "RadioGroupOption" });
  };
} });
var Zt = Symbol("GroupContext");
vue_cjs_prod.defineComponent({ name: "SwitchGroup", props: { as: { type: [Object, String], default: "template" } }, setup(t, { slots: n, attrs: u }) {
  let e = vue_cjs_prod.ref(null), o = fe({ name: "SwitchLabel", props: { onClick() {
    !e.value || (e.value.click(), e.value.focus({ preventScroll: true }));
  } } }), r = G({ name: "SwitchDescription" });
  return vue_cjs_prod.provide(Zt, { switchRef: e, labelledby: o, describedby: r }), () => x({ props: t, slot: {}, slots: n, attrs: u, name: "SwitchGroup" });
} });
vue_cjs_prod.defineComponent({ name: "Switch", emits: { "update:modelValue": (t) => true }, props: { as: { type: [Object, String], default: "button" }, modelValue: { type: Boolean, default: false } }, setup(t, { emit: n, attrs: u, slots: e }) {
  let o = vue_cjs_prod.inject(Zt, null), r = `headlessui-switch-${h()}`;
  function s() {
    n("update:modelValue", !t.modelValue);
  }
  let d = vue_cjs_prod.ref(null), a = o === null ? d : o.switchRef, i = P(vue_cjs_prod.computed(() => ({ as: t.as, type: u.type })), a);
  function l(f) {
    f.preventDefault(), s();
  }
  function c(f) {
    f.key !== "Tab" && f.preventDefault(), f.key === " " && s();
  }
  function p(f) {
    f.preventDefault();
  }
  return () => {
    let f = { checked: t.modelValue }, b = { id: r, ref: a, role: "switch", type: i.value, tabIndex: 0, "aria-checked": t.modelValue, "aria-labelledby": o == null ? void 0 : o.labelledby.value, "aria-describedby": o == null ? void 0 : o.describedby.value, onClick: l, onKeyup: c, onKeypress: p };
    return x({ props: __spreadValues(__spreadValues({}, t), b), slot: f, attrs: u, slots: e, name: "Switch" });
  };
} });
var oo = Symbol("TabsContext");
function ve(t) {
  let n = vue_cjs_prod.inject(oo, null);
  if (n === null) {
    let u = new Error(`<${t} /> is missing a parent <TabGroup /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(u, ve), u;
  }
  return n;
}
vue_cjs_prod.defineComponent({ name: "TabGroup", emits: { change: (t) => true }, props: { as: { type: [Object, String], default: "template" }, selectedIndex: { type: [Number], default: null }, defaultIndex: { type: [Number], default: 0 }, vertical: { type: [Boolean], default: false }, manual: { type: [Boolean], default: false } }, setup(t, { slots: n, attrs: u, emit: e }) {
  let o = vue_cjs_prod.ref(null), r = vue_cjs_prod.ref([]), s = vue_cjs_prod.ref([]), d = { selectedIndex: o, orientation: vue_cjs_prod.computed(() => t.vertical ? "vertical" : "horizontal"), activation: vue_cjs_prod.computed(() => t.manual ? "manual" : "auto"), tabs: r, panels: s, setSelectedIndex(a) {
    o.value !== a && (o.value = a, e("change", a));
  }, registerTab(a) {
    r.value.includes(a) || r.value.push(a);
  }, unregisterTab(a) {
    let i = r.value.indexOf(a);
    i !== -1 && r.value.splice(i, 1);
  }, registerPanel(a) {
    s.value.includes(a) || s.value.push(a);
  }, unregisterPanel(a) {
    let i = s.value.indexOf(a);
    i !== -1 && s.value.splice(i, 1);
  } };
  return vue_cjs_prod.provide(oo, d), vue_cjs_prod.watchEffect(() => {
    var c;
    if (d.tabs.value.length <= 0 || t.selectedIndex === null && o.value !== null)
      return;
    let a = d.tabs.value.map((p) => v(p)).filter(Boolean), i = a.filter((p) => !p.hasAttribute("disabled")), l = (c = t.selectedIndex) != null ? c : t.defaultIndex;
    if (l < 0)
      o.value = a.indexOf(i[0]);
    else if (l > d.tabs.value.length)
      o.value = a.indexOf(i[i.length - 1]);
    else {
      let p = a.slice(0, l), b = [...a.slice(l), ...p].find((m) => i.includes(m));
      if (!b)
        return;
      o.value = a.indexOf(b);
    }
  }), () => {
    let a = { selectedIndex: o.value };
    return x({ props: L(t, ["selectedIndex", "defaultIndex", "manual", "vertical", "onChange"]), slot: a, slots: n, attrs: u, name: "TabGroup" });
  };
} });
vue_cjs_prod.defineComponent({ name: "TabList", props: { as: { type: [Object, String], default: "div" } }, setup(t, { attrs: n, slots: u }) {
  let e = ve("TabList");
  return () => {
    let o = { selectedIndex: e.selectedIndex.value }, r = { role: "tablist", "aria-orientation": e.orientation.value };
    return x({ props: __spreadValues(__spreadValues({}, t), r), slot: o, attrs: n, slots: u, name: "TabList" });
  };
} });
vue_cjs_prod.defineComponent({ name: "Tab", props: { as: { type: [Object, String], default: "button" }, disabled: { type: [Boolean], default: false } }, setup(t, { attrs: n, slots: u }) {
  let e = ve("Tab"), o = `headlessui-tabs-tab-${h()}`, r = vue_cjs_prod.ref();
  vue_cjs_prod.onMounted(() => e.registerTab(r)), vue_cjs_prod.onUnmounted(() => e.unregisterTab(r));
  let s = vue_cjs_prod.computed(() => e.tabs.value.indexOf(r)), d = vue_cjs_prod.computed(() => s.value === e.selectedIndex.value);
  function a(p) {
    let f = e.tabs.value.map((b) => v(b)).filter(Boolean);
    if (p.key === " " || p.key === "Enter") {
      p.preventDefault(), p.stopPropagation(), e.setSelectedIndex(s.value);
      return;
    }
    switch (p.key) {
      case "Home":
      case "PageUp":
        return p.preventDefault(), p.stopPropagation(), O(f, 1);
      case "End":
      case "PageDown":
        return p.preventDefault(), p.stopPropagation(), O(f, 8);
    }
    return T(e.orientation.value, { vertical() {
      if (p.key === "ArrowUp")
        return O(f, 2 | 16);
      if (p.key === "ArrowDown")
        return O(f, 4 | 16);
    }, horizontal() {
      if (p.key === "ArrowLeft")
        return O(f, 2 | 16);
      if (p.key === "ArrowRight")
        return O(f, 4 | 16);
    } });
  }
  function i() {
    var p;
    (p = v(r)) == null || p.focus();
  }
  function l() {
    var p;
    t.disabled || ((p = v(r)) == null || p.focus(), e.setSelectedIndex(s.value));
  }
  let c = P(vue_cjs_prod.computed(() => ({ as: t.as, type: n.type })), r);
  return () => {
    var b, m;
    let p = { selected: d.value }, f = { ref: r, onKeydown: a, onFocus: e.activation.value === "manual" ? i : l, onClick: l, id: o, role: "tab", type: c.value, "aria-controls": (m = (b = e.panels.value[s.value]) == null ? void 0 : b.value) == null ? void 0 : m.id, "aria-selected": d.value, tabIndex: d.value ? 0 : -1, disabled: t.disabled ? true : void 0 };
    return x({ props: __spreadValues(__spreadValues({}, t), f), slot: p, attrs: n, slots: u, name: "Tab" });
  };
} });
vue_cjs_prod.defineComponent({ name: "TabPanels", props: { as: { type: [Object, String], default: "div" } }, setup(t, { slots: n, attrs: u }) {
  let e = ve("TabPanels");
  return () => {
    let o = { selectedIndex: e.selectedIndex.value };
    return x({ props: t, slot: o, attrs: u, slots: n, name: "TabPanels" });
  };
} });
vue_cjs_prod.defineComponent({ name: "TabPanel", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: false }, unmount: { type: Boolean, default: true } }, setup(t, { attrs: n, slots: u }) {
  let e = ve("TabPanel"), o = `headlessui-tabs-panel-${h()}`, r = vue_cjs_prod.ref();
  vue_cjs_prod.onMounted(() => e.registerPanel(r)), vue_cjs_prod.onUnmounted(() => e.unregisterPanel(r));
  let s = vue_cjs_prod.computed(() => e.panels.value.indexOf(r)), d = vue_cjs_prod.computed(() => s.value === e.selectedIndex.value);
  return () => {
    var l, c;
    let a = { selected: d.value }, i = { ref: r, id: o, role: "tabpanel", "aria-labelledby": (c = (l = e.tabs.value[s.value]) == null ? void 0 : l.value) == null ? void 0 : c.id, tabIndex: d.value ? 0 : -1 };
    return x({ props: __spreadValues(__spreadValues({}, t), i), slot: a, attrs: n, slots: u, features: 2 | 1, visible: d.value, name: "TabPanel" });
  };
} });
function no(t) {
  let n = { called: false };
  return (...u) => {
    if (!n.called)
      return n.called = true, t(...u);
  };
}
function Ze() {
  let t = [], n = [], u = { enqueue(e) {
    n.push(e);
  }, requestAnimationFrame(...e) {
    let o = requestAnimationFrame(...e);
    u.add(() => cancelAnimationFrame(o));
  }, nextFrame(...e) {
    u.requestAnimationFrame(() => {
      u.requestAnimationFrame(...e);
    });
  }, setTimeout(...e) {
    let o = setTimeout(...e);
    u.add(() => clearTimeout(o));
  }, add(e) {
    t.push(e);
  }, dispose() {
    for (let e of t.splice(0))
      e();
  }, async workQueue() {
    for (let e of n.splice(0))
      await e();
  } };
  return u;
}
function et(t, ...n) {
  t && n.length > 0 && t.classList.add(...n);
}
function Fe(t, ...n) {
  t && n.length > 0 && t.classList.remove(...n);
}
function $n(t, n) {
  let u = Ze();
  if (!t)
    return u.dispose;
  let { transitionDuration: e, transitionDelay: o } = getComputedStyle(t), [r, s] = [e, o].map((d) => {
    let [a = 0] = d.split(",").filter(Boolean).map((i) => i.includes("ms") ? parseFloat(i) : parseFloat(i) * 1e3).sort((i, l) => l - i);
    return a;
  });
  return r !== 0 ? u.setTimeout(() => n("finished"), r + s) : n("finished"), u.add(() => n("cancelled")), u.dispose;
}
function tt(t, n, u, e, o, r) {
  let s = Ze(), d = r !== void 0 ? no(r) : () => {
  };
  return Fe(t, ...o), et(t, ...n, ...u), s.nextFrame(() => {
    Fe(t, ...u), et(t, ...e), s.add($n(t, (a) => (Fe(t, ...e, ...n), et(t, ...o), d(a))));
  }), s.add(() => Fe(t, ...n, ...u, ...e, ...o)), s.add(() => d("cancelled")), s.dispose;
}
function Q(t = "") {
  return t.split(" ").filter((n) => n.trim().length > 1);
}
var lt = Symbol("TransitionContext");
function _n() {
  return vue_cjs_prod.inject(lt, null) !== null;
}
function qn() {
  let t = vue_cjs_prod.inject(lt, null);
  if (t === null)
    throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");
  return t;
}
function zn() {
  let t = vue_cjs_prod.inject(rt, null);
  if (t === null)
    throw new Error("A <TransitionChild /> is used but it is missing a parent <TransitionRoot />.");
  return t;
}
var rt = Symbol("NestingContext");
function He(t) {
  return "children" in t ? He(t.children) : t.value.filter(({ state: n }) => n === "visible").length > 0;
}
function io(t) {
  let n = vue_cjs_prod.ref([]), u = vue_cjs_prod.ref(false);
  vue_cjs_prod.onMounted(() => u.value = true), vue_cjs_prod.onUnmounted(() => u.value = false);
  function e(r, s = 1) {
    let d = n.value.findIndex(({ id: a }) => a === r);
    d !== -1 && (T(s, { [0]() {
      n.value.splice(d, 1);
    }, [1]() {
      n.value[d].state = "hidden";
    } }), !He(n) && u.value && (t == null || t()));
  }
  function o(r) {
    let s = n.value.find(({ id: d }) => d === r);
    return s ? s.state !== "visible" && (s.state = "visible") : n.value.push({ id: r, state: "visible" }), () => e(r, 0);
  }
  return { children: n, register: o, unregister: e };
}
var uo = 1, Qn = vue_cjs_prod.defineComponent({ props: { as: { type: [Object, String], default: "div" }, show: { type: [Boolean], default: null }, unmount: { type: [Boolean], default: true }, appear: { type: [Boolean], default: false }, enter: { type: [String], default: "" }, enterFrom: { type: [String], default: "" }, enterTo: { type: [String], default: "" }, entered: { type: [String], default: "" }, leave: { type: [String], default: "" }, leaveFrom: { type: [String], default: "" }, leaveTo: { type: [String], default: "" } }, emits: { beforeEnter: () => true, afterEnter: () => true, beforeLeave: () => true, afterLeave: () => true }, setup(t, { emit: n, attrs: u, slots: e }) {
  if (!_n() && it())
    return () => vue_cjs_prod.h(Yn, __spreadProps(__spreadValues({}, t), { onBeforeEnter: () => n("beforeEnter"), onAfterEnter: () => n("afterEnter"), onBeforeLeave: () => n("beforeLeave"), onAfterLeave: () => n("afterLeave") }), e);
  let o = vue_cjs_prod.ref(null), r = vue_cjs_prod.ref("visible"), s = vue_cjs_prod.computed(() => t.unmount ? 0 : 1), { show: d, appear: a } = qn(), { register: i, unregister: l } = zn(), c = { value: true }, p = h(), f = { value: false }, b = io(() => {
    f.value || (r.value = "hidden", l(p), n("afterLeave"));
  });
  vue_cjs_prod.onMounted(() => {
    let F = i(p);
    vue_cjs_prod.onUnmounted(F);
  }), vue_cjs_prod.watchEffect(() => {
    if (s.value === 1 && !!p) {
      if (d && r.value !== "visible") {
        r.value = "visible";
        return;
      }
      T(r.value, { hidden: () => l(p), visible: () => i(p) });
    }
  });
  let m = Q(t.enter), g = Q(t.enterFrom), S = Q(t.enterTo), y = Q(t.entered), R = Q(t.leave), E = Q(t.leaveFrom), D = Q(t.leaveTo);
  vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watchEffect(() => {
      if (r.value === "visible") {
        let F = v(o);
        if (F instanceof Comment && F.data === "")
          throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
      }
    });
  });
  function w(F) {
    let xe = c.value && !a.value, U = v(o);
    !U || !(U instanceof HTMLElement) || xe || (f.value = true, d.value && n("beforeEnter"), d.value || n("beforeLeave"), F(d.value ? tt(U, m, g, S, y, (ye) => {
      f.value = false, ye === "finished" && n("afterEnter");
    }) : tt(U, R, E, D, y, (ye) => {
      f.value = false, ye === "finished" && (He(b) || (r.value = "hidden", l(p), n("afterLeave")));
    })));
  }
  return vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watch([d, a], (F, xe, U) => {
      w(U), c.value = false;
    }, { immediate: true });
  }), vue_cjs_prod.provide(rt, b), M(vue_cjs_prod.computed(() => T(r.value, { visible: 0, hidden: 1 }))), () => {
    let _a2 = t, so = __objRest(_a2, ["appear", "show", "enter", "enterFrom", "enterTo", "entered", "leave", "leaveFrom", "leaveTo"]);
    return x({ props: __spreadValues(__spreadValues({}, so), { ref: o }), slot: {}, slots: e, attrs: u, features: uo, visible: r.value === "visible", name: "TransitionChild" });
  };
} }), Jn = Qn, Yn = vue_cjs_prod.defineComponent({ inheritAttrs: false, props: { as: { type: [Object, String], default: "div" }, show: { type: [Boolean], default: null }, unmount: { type: [Boolean], default: true }, appear: { type: [Boolean], default: false }, enter: { type: [String], default: "" }, enterFrom: { type: [String], default: "" }, enterTo: { type: [String], default: "" }, entered: { type: [String], default: "" }, leave: { type: [String], default: "" }, leaveFrom: { type: [String], default: "" }, leaveTo: { type: [String], default: "" } }, emits: { beforeEnter: () => true, afterEnter: () => true, beforeLeave: () => true, afterLeave: () => true }, setup(t, { emit: n, attrs: u, slots: e }) {
  let o = I(), r = vue_cjs_prod.computed(() => t.show === null && o !== null ? T(o.value, { [0]: true, [1]: false }) : t.show);
  vue_cjs_prod.watchEffect(() => {
    if (![true, false].includes(r.value))
      throw new Error('A <Transition /> is used but it is missing a `:show="true | false"` prop.');
  });
  let s = vue_cjs_prod.ref(r.value ? "visible" : "hidden"), d = io(() => {
    s.value = "hidden";
  }), a = { value: true }, i = { show: r, appear: vue_cjs_prod.computed(() => t.appear || !a.value) };
  return vue_cjs_prod.onMounted(() => {
    vue_cjs_prod.watchEffect(() => {
      a.value = false, r.value ? s.value = "visible" : He(d) || (s.value = "hidden");
    });
  }), vue_cjs_prod.provide(rt, d), vue_cjs_prod.provide(lt, i), () => {
    let l = L(t, ["show", "appear", "unmount"]), c = { unmount: t.unmount };
    return x({ props: __spreadProps(__spreadValues({}, c), { as: "template" }), slot: {}, slots: __spreadProps(__spreadValues({}, e), { default: () => [vue_cjs_prod.h(Jn, __spreadValues(__spreadValues(__spreadValues({ onBeforeEnter: () => n("beforeEnter"), onAfterEnter: () => n("afterEnter"), onBeforeLeave: () => n("beforeLeave"), onAfterLeave: () => n("afterLeave") }, u), c), l), e.default)] }), attrs: {}, features: uo, visible: s.value === "visible", name: "Transition" });
  };
} });
const _sfc_main$y = vue_cjs_prod.defineComponent({
  __name: "Alert",
  __ssrInlineRender: true,
  props: {
    title: {
      type: String,
      default: void 0
    },
    text: {
      type: String,
      default: void 0
    },
    type: {
      type: String,
      default: "primary"
    }
  },
  setup(__props) {
    const props = __props;
    const styles = vue_cjs_prod.reactive({
      primary: "",
      success: "dark:from-green-500/50 via-gray-200 to-gray-200 dark:via-slate-800 dark:to-slate-800",
      warning: "dark:from-yellow-500/50 via-gray-200 to-gray-200 dark:via-slate-800 dark:to-slate-800",
      danger: "dark:from-red-500/50 via-gray-200 to-gray-200 dark:via-slate-800 dark:to-slate-800"
    });
    const textStyles = vue_cjs_prod.reactive({
      primary: "text-white",
      success: "text-green-500",
      warning: "text-orange-500",
      danger: "text-red-500"
    });
    const isDestroyed = vue_cjs_prod.ref(false);
    const selectedType = vue_cjs_prod.computed(() => {
      if (["primary", "success", "warning", "danger"].includes(props.type))
        return props.type;
      return "primary";
    });
    const selectedStyle = vue_cjs_prod.computed(() => styles[selectedType.value]);
    const selectedTextStyle = vue_cjs_prod.computed(() => textStyles[selectedType.value]);
    const close = () => {
      isDestroyed.value = true;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_IconMdi58checkCircle = __unplugin_components_0$6;
      const _component_icon_clarity58times_circle_solid = __unplugin_components_1$2;
      const _component_icon_bi58exclamation_circle_fill = __unplugin_components_2$2;
      const _component_icon_clarity58times_line = __unplugin_components_3$2;
      _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Yn), vue_cjs_prod.mergeProps({
        show: !isDestroyed.value,
        appear: ""
      }, _attrs), {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Qn), {
              as: "template",
              enter: "duration-300 ease-out",
              "enter-from": "opacity-0",
              "enter-to": "opacity-100",
              leave: "duration-300 ease-in",
              "leave-from": "opacity-100",
              "leave-to": "opacity-0"
            }, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="${serverRenderer.exports.ssrRenderClass(`bg-gray-200 dark:bg-slate-800 bg-gradient-to-r shadow-white/50 dark:shadow-slate-900/50 px-6 py-6 rounded-md shadow-lg flex space-x-6 ${vue_cjs_prod.unref(selectedStyle)}`)}"${_scopeId2}><div class="flex items-center justify-center"${_scopeId2}>`);
                  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "icon", {}, () => {
                    if (vue_cjs_prod.unref(selectedType) === "success") {
                      _push3(serverRenderer.exports.ssrRenderComponent(_component_IconMdi58checkCircle, {
                        class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                      }, null, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                    if (vue_cjs_prod.unref(selectedType) === "danger") {
                      _push3(serverRenderer.exports.ssrRenderComponent(_component_icon_clarity58times_circle_solid, {
                        class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                      }, null, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                    if (vue_cjs_prod.unref(selectedType) === "warning") {
                      _push3(serverRenderer.exports.ssrRenderComponent(_component_icon_bi58exclamation_circle_fill, {
                        class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                      }, null, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                  }, _push3, _parent3, _scopeId2);
                  _push3(`</div><div class="flex-1"${_scopeId2}><div class="${serverRenderer.exports.ssrRenderClass(`font-bold text-lg mb-0.5 ${vue_cjs_prod.unref(selectedTextStyle)}`)}"${_scopeId2}>`);
                  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "title", {}, () => {
                    _push3(`${serverRenderer.exports.ssrInterpolate(props.title)}`);
                  }, _push3, _parent3, _scopeId2);
                  _push3(`</div><div class="text-gray-700 dark:text-gray-100"${_scopeId2}>`);
                  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "title", {}, () => {
                    _push3(`${serverRenderer.exports.ssrInterpolate(props.text)}`);
                  }, _push3, _parent3, _scopeId2);
                  _push3(`</div></div><div${_scopeId2}><button class="text-slate-600 hover:text-red-500 dark:text-gray-400 font-bold"${_scopeId2}>`);
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_icon_clarity58times_line, null, null, _parent3, _scopeId2));
                  _push3(`</button></div></div>`);
                } else {
                  return [
                    vue_cjs_prod.createVNode("div", {
                      class: `bg-gray-200 dark:bg-slate-800 bg-gradient-to-r shadow-white/50 dark:shadow-slate-900/50 px-6 py-6 rounded-md shadow-lg flex space-x-6 ${vue_cjs_prod.unref(selectedStyle)}`
                    }, [
                      vue_cjs_prod.createVNode("div", { class: "flex items-center justify-center" }, [
                        vue_cjs_prod.renderSlot(_ctx.$slots, "icon", {}, () => [
                          vue_cjs_prod.unref(selectedType) === "success" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconMdi58checkCircle, {
                            key: 0,
                            class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                          }, null, 8, ["class"])) : vue_cjs_prod.createCommentVNode("", true),
                          vue_cjs_prod.unref(selectedType) === "danger" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_icon_clarity58times_circle_solid, {
                            key: 1,
                            class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                          }, null, 8, ["class"])) : vue_cjs_prod.createCommentVNode("", true),
                          vue_cjs_prod.unref(selectedType) === "warning" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_icon_bi58exclamation_circle_fill, {
                            key: 2,
                            class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                          }, null, 8, ["class"])) : vue_cjs_prod.createCommentVNode("", true)
                        ])
                      ]),
                      vue_cjs_prod.createVNode("div", { class: "flex-1" }, [
                        vue_cjs_prod.createVNode("div", {
                          class: `font-bold text-lg mb-0.5 ${vue_cjs_prod.unref(selectedTextStyle)}`
                        }, [
                          vue_cjs_prod.renderSlot(_ctx.$slots, "title", {}, () => [
                            vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(props.title), 1)
                          ])
                        ], 2),
                        vue_cjs_prod.createVNode("div", { class: "text-gray-700 dark:text-gray-100" }, [
                          vue_cjs_prod.renderSlot(_ctx.$slots, "title", {}, () => [
                            vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(props.text), 1)
                          ])
                        ])
                      ]),
                      vue_cjs_prod.createVNode("div", null, [
                        vue_cjs_prod.createVNode("button", {
                          class: "text-slate-600 hover:text-red-500 dark:text-gray-400 font-bold",
                          onClick: close
                        }, [
                          vue_cjs_prod.createVNode(_component_icon_clarity58times_line)
                        ])
                      ])
                    ], 2)
                  ];
                }
              }),
              _: 3
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(vue_cjs_prod.unref(Qn), {
                as: "template",
                enter: "duration-300 ease-out",
                "enter-from": "opacity-0",
                "enter-to": "opacity-100",
                leave: "duration-300 ease-in",
                "leave-from": "opacity-100",
                "leave-to": "opacity-0"
              }, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode("div", {
                    class: `bg-gray-200 dark:bg-slate-800 bg-gradient-to-r shadow-white/50 dark:shadow-slate-900/50 px-6 py-6 rounded-md shadow-lg flex space-x-6 ${vue_cjs_prod.unref(selectedStyle)}`
                  }, [
                    vue_cjs_prod.createVNode("div", { class: "flex items-center justify-center" }, [
                      vue_cjs_prod.renderSlot(_ctx.$slots, "icon", {}, () => [
                        vue_cjs_prod.unref(selectedType) === "success" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconMdi58checkCircle, {
                          key: 0,
                          class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                        }, null, 8, ["class"])) : vue_cjs_prod.createCommentVNode("", true),
                        vue_cjs_prod.unref(selectedType) === "danger" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_icon_clarity58times_circle_solid, {
                          key: 1,
                          class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                        }, null, 8, ["class"])) : vue_cjs_prod.createCommentVNode("", true),
                        vue_cjs_prod.unref(selectedType) === "warning" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_icon_bi58exclamation_circle_fill, {
                          key: 2,
                          class: `text-2xl ${vue_cjs_prod.unref(selectedTextStyle)}`
                        }, null, 8, ["class"])) : vue_cjs_prod.createCommentVNode("", true)
                      ])
                    ]),
                    vue_cjs_prod.createVNode("div", { class: "flex-1" }, [
                      vue_cjs_prod.createVNode("div", {
                        class: `font-bold text-lg mb-0.5 ${vue_cjs_prod.unref(selectedTextStyle)}`
                      }, [
                        vue_cjs_prod.renderSlot(_ctx.$slots, "title", {}, () => [
                          vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(props.title), 1)
                        ])
                      ], 2),
                      vue_cjs_prod.createVNode("div", { class: "text-gray-700 dark:text-gray-100" }, [
                        vue_cjs_prod.renderSlot(_ctx.$slots, "title", {}, () => [
                          vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(props.text), 1)
                        ])
                      ])
                    ]),
                    vue_cjs_prod.createVNode("div", null, [
                      vue_cjs_prod.createVNode("button", {
                        class: "text-slate-600 hover:text-red-500 dark:text-gray-400 font-bold",
                        onClick: close
                      }, [
                        vue_cjs_prod.createVNode(_component_icon_clarity58times_line)
                      ])
                    ])
                  ], 2)
                ]),
                _: 3
              })
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup$y = _sfc_main$y.setup;
_sfc_main$y.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Alert.vue");
  return _sfc_setup$y ? _sfc_setup$y(props, ctx) : void 0;
};
const _sfc_main$x = {};
function _sfc_ssrRender$8(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "card duration-300 transition-colors w-full relative rounded overflow-hidden bg-white dark:bg-slate-900 border border-gray-900/10 dark:border-gray-50/[0.2]" }, _attrs))}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$x = _sfc_main$x.setup;
_sfc_main$x.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Card/index.vue");
  return _sfc_setup$x ? _sfc_setup$x(props, ctx) : void 0;
};
const __nuxt_component_6$1 = /* @__PURE__ */ _export_sfc(_sfc_main$x, [["ssrRender", _sfc_ssrRender$8]]);
const _sfc_main$w = {};
function _sfc_ssrRender$7(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "card-content px-6 py-6" }, _attrs))}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$w = _sfc_main$w.setup;
_sfc_main$w.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Card/Content.vue");
  return _sfc_setup$w ? _sfc_setup$w(props, ctx) : void 0;
};
const __nuxt_component_7 = /* @__PURE__ */ _export_sfc(_sfc_main$w, [["ssrRender", _sfc_ssrRender$7]]);
const _sfc_main$v = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Title",
  __ssrInlineRender: true,
  props: {
    text: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "text-xl font-semibold mb-2" }, _attrs))}>`);
      serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
        _push(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
      }, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$v = _sfc_main$v.setup;
_sfc_main$v.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Card/Title.vue");
  return _sfc_setup$v ? _sfc_setup$v(props, ctx) : void 0;
};
const useSyncProps = (props, key, emit) => {
  return vue_cjs_prod.computed({
    get() {
      return props[key];
    },
    set(value) {
      emit(`update:${key}`, value);
    }
  });
};
const _sfc_main$u = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "TextInput",
  __ssrInlineRender: true,
  props: {
    modelValue: {
      type: String,
      default: ""
    },
    placeholder: {
      type: String,
      default: ""
    },
    size: {
      type: String,
      default: "md"
    }
  },
  emits: ["update:modelValue"],
  setup(__props, { emit }) {
    const props = __props;
    const slots = vue_cjs_prod.useSlots();
    const defaultStyle = `
  outline-none 
  transition-color duration-300 
  bg-transparent border border-gray-900/10 dark:border-gray-50/[0.2] 
  dark:focus:border-white focus:border-gray-900
`;
    const sizeStyles = vue_cjs_prod.reactive({
      lg: "h-12 px-4 text-lg",
      md: "h-10 px-4 text-base",
      sm: "h-8 px-4 text-sm",
      xs: "h-7 px-4 text-xs"
    });
    const wrapperSizeStyles = vue_cjs_prod.reactive({
      lg: "rounded-lg",
      md: "rounded-lg",
      sm: "rounded-lg",
      xs: "rounded-lg"
    });
    const modelValue = useSyncProps(props, "modelValue", emit);
    const selectedSize = vue_cjs_prod.computed(() => sizeStyles[props.size] || sizeStyles.md);
    const inputRondedStyle = vue_cjs_prod.computed(() => slots.prefix ? "rounded-r" : "rounded");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({
        class: `flex relative overflow-hidden ${wrapperSizeStyles}`
      }, _attrs))}>`);
      if (vue_cjs_prod.unref(slots).prefix) {
        _push(`<div class="${serverRenderer.exports.ssrRenderClass(`px-4 py-2 rounded-l ${defaultStyle} ${vue_cjs_prod.unref(selectedSize)} bg-gray-100 dark:bg-slate-800 text-gray-500`)}">`);
        serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "prefix", {}, null, _push, _parent);
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<input${serverRenderer.exports.ssrRenderAttr("value", vue_cjs_prod.unref(modelValue))} type="text" class="${serverRenderer.exports.ssrRenderClass(`flex-1 block w-full ${vue_cjs_prod.unref(inputRondedStyle)} ${defaultStyle} ${vue_cjs_prod.unref(selectedSize)}`)}"${serverRenderer.exports.ssrRenderAttr("placeholder", __props.placeholder)}></div>`);
    };
  }
});
const _sfc_setup$u = _sfc_main$u.setup;
_sfc_main$u.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Form/TextInput.vue");
  return _sfc_setup$u ? _sfc_setup$u(props, ctx) : void 0;
};
const _sfc_main$t = {};
function _sfc_ssrRender$6(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "card-footer flex items-center px-6 py-2 text-sm bg-white dark:bg-slate-800 border-t border-gray-900/10 dark:border-gray-50/[0.2]" }, _attrs))}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$t = _sfc_main$t.setup;
_sfc_main$t.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Card/Footer.vue");
  return _sfc_setup$t ? _sfc_setup$t(props, ctx) : void 0;
};
const __nuxt_component_10 = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["ssrRender", _sfc_ssrRender$6]]);
const _sfc_main$s = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Anchor",
  __ssrInlineRender: true,
  props: {
    text: {
      type: String,
      default: ""
    },
    to: {
      type: [String, Object],
      default: void 0
    },
    href: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    const props = __props;
    const href = vue_cjs_prod.toRef(props, "href");
    const to = vue_cjs_prod.toRef(props, "to");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$4;
      if (vue_cjs_prod.unref(to)) {
        _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtLink, vue_cjs_prod.mergeProps({
          tag: "a",
          to: vue_cjs_prod.unref(to),
          class: `transition-colors duration-300 dark:hover:text-white hover:text-gray-900 hover:underline`
        }, _attrs), {
          default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
                _push2(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
              }, _push2, _parent2, _scopeId);
            } else {
              return [
                vue_cjs_prod.renderSlot(_ctx.$slots, "default", {}, () => [
                  vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(__props.text), 1)
                ])
              ];
            }
          }),
          _: 3
        }, _parent));
      } else {
        _push(`<a${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({
          class: `transition-colors duration-300 dark:hover:text-white hover:text-gray-900 hover:underline`,
          href: vue_cjs_prod.unref(href)
        }, _attrs))}>`);
        serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
          _push(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
        }, _push, _parent);
        _push(`</a>`);
      }
    };
  }
});
const _sfc_setup$s = _sfc_main$s.setup;
_sfc_main$s.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Anchor.vue");
  return _sfc_setup$s ? _sfc_setup$s(props, ctx) : void 0;
};
const _sfc_main$r = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "setting",
  __ssrInlineRender: true,
  setup(__props) {
    const username = vue_cjs_prod.ref("viandwi24");
    const validate = async () => {
      try {
        const response = await fetch(`https://api.github.com/users/${username.value}`);
        if (response.status !== 200)
          throw new Error(`error when fetching username : ${response.statusText} (${response.status})`);
        const data = await response.json();
        alert(`Found Accout Name ${data.name} with id : ${data.id}`);
      } catch (err) {
        alert(err);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageSection = __nuxt_component_4;
      const _component_Alert = _sfc_main$y;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_Card = __nuxt_component_6$1;
      const _component_CardContent = __nuxt_component_7;
      const _component_CardTitle = _sfc_main$v;
      const _component_FormTextInput = _sfc_main$u;
      const _component_CardFooter = __nuxt_component_10;
      const _component_Anchor = _sfc_main$s;
      const _component_Button = _sfc_main$E;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_Alert, {
                    type: "success",
                    title: "This is a page for testing purposes",
                    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_Alert, {
                      type: "success",
                      title: "This is a page for testing purposes",
                      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.setting.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.setting.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, { class: "flex space-x-4" }, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Card, null, {
                          default: vue_cjs_prod.withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(serverRenderer.exports.ssrRenderComponent(_component_CardContent, null, {
                                default: vue_cjs_prod.withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_CardTitle, {
                                      class: "capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.title")
                                    }, null, _parent6, _scopeId5));
                                    _push6(`<p class="mb-2"${_scopeId5}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.setting.sections.validate_username.description"))}</p><div${_scopeId5}>`);
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_FormTextInput, {
                                      modelValue: username.value,
                                      "onUpdate:modelValue": ($event) => username.value = $event
                                    }, {
                                      prefix: vue_cjs_prod.withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(`<span${_scopeId6}>https://github.com/</span>`);
                                        } else {
                                          return [
                                            vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                    _push6(`</div>`);
                                  } else {
                                    return [
                                      vue_cjs_prod.createVNode(_component_CardTitle, {
                                        class: "capitalize",
                                        text: _ctx.$t("pages.setting.sections.validate_username.title")
                                      }, null, 8, ["text"]),
                                      vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                      vue_cjs_prod.createVNode("div", null, [
                                        vue_cjs_prod.createVNode(_component_FormTextInput, {
                                          modelValue: username.value,
                                          "onUpdate:modelValue": ($event) => username.value = $event
                                        }, {
                                          prefix: vue_cjs_prod.withCtx(() => [
                                            vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                          ]),
                                          _: 1
                                        }, 8, ["modelValue", "onUpdate:modelValue"])
                                      ])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(serverRenderer.exports.ssrRenderComponent(_component_CardFooter, { class: "justify-between" }, {
                                default: vue_cjs_prod.withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(`<p${_scopeId5}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.setting.sections.validate_username.footer"))} `);
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
                                      class: "underline font-bold capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                      href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                    }, null, _parent6, _scopeId5));
                                    _push6(`</p>`);
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                                      class: "capitalize",
                                      size: "sm",
                                      type: "opposite",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                      onClick: validate
                                    }, null, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      vue_cjs_prod.createVNode("p", null, [
                                        vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                        vue_cjs_prod.createVNode(_component_Anchor, {
                                          class: "underline font-bold capitalize",
                                          text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                          href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                        }, null, 8, ["text"])
                                      ]),
                                      vue_cjs_prod.createVNode(_component_Button, {
                                        class: "capitalize",
                                        size: "sm",
                                        type: "opposite",
                                        text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                        onClick: validate
                                      }, null, 8, ["text"])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                            } else {
                              return [
                                vue_cjs_prod.createVNode(_component_CardContent, null, {
                                  default: vue_cjs_prod.withCtx(() => [
                                    vue_cjs_prod.createVNode(_component_CardTitle, {
                                      class: "capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.title")
                                    }, null, 8, ["text"]),
                                    vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                    vue_cjs_prod.createVNode("div", null, [
                                      vue_cjs_prod.createVNode(_component_FormTextInput, {
                                        modelValue: username.value,
                                        "onUpdate:modelValue": ($event) => username.value = $event
                                      }, {
                                        prefix: vue_cjs_prod.withCtx(() => [
                                          vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                        ]),
                                        _: 1
                                      }, 8, ["modelValue", "onUpdate:modelValue"])
                                    ])
                                  ]),
                                  _: 1
                                }),
                                vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                                  default: vue_cjs_prod.withCtx(() => [
                                    vue_cjs_prod.createVNode("p", null, [
                                      vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                      vue_cjs_prod.createVNode(_component_Anchor, {
                                        class: "underline font-bold capitalize",
                                        text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                        href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                      }, null, 8, ["text"])
                                    ]),
                                    vue_cjs_prod.createVNode(_component_Button, {
                                      class: "capitalize",
                                      size: "sm",
                                      type: "opposite",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                      onClick: validate
                                    }, null, 8, ["text"])
                                  ]),
                                  _: 1
                                })
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_Card, null, {
                            default: vue_cjs_prod.withCtx(() => [
                              vue_cjs_prod.createVNode(_component_CardContent, null, {
                                default: vue_cjs_prod.withCtx(() => [
                                  vue_cjs_prod.createVNode(_component_CardTitle, {
                                    class: "capitalize",
                                    text: _ctx.$t("pages.setting.sections.validate_username.title")
                                  }, null, 8, ["text"]),
                                  vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                  vue_cjs_prod.createVNode("div", null, [
                                    vue_cjs_prod.createVNode(_component_FormTextInput, {
                                      modelValue: username.value,
                                      "onUpdate:modelValue": ($event) => username.value = $event
                                    }, {
                                      prefix: vue_cjs_prod.withCtx(() => [
                                        vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue", "onUpdate:modelValue"])
                                  ])
                                ]),
                                _: 1
                              }),
                              vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                                default: vue_cjs_prod.withCtx(() => [
                                  vue_cjs_prod.createVNode("p", null, [
                                    vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                    vue_cjs_prod.createVNode(_component_Anchor, {
                                      class: "underline font-bold capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                      href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                    }, null, 8, ["text"])
                                  ]),
                                  vue_cjs_prod.createVNode(_component_Button, {
                                    class: "capitalize",
                                    size: "sm",
                                    type: "opposite",
                                    text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                    onClick: validate
                                  }, null, 8, ["text"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          })
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, { class: "flex space-x-4" }, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_Card, null, {
                          default: vue_cjs_prod.withCtx(() => [
                            vue_cjs_prod.createVNode(_component_CardContent, null, {
                              default: vue_cjs_prod.withCtx(() => [
                                vue_cjs_prod.createVNode(_component_CardTitle, {
                                  class: "capitalize",
                                  text: _ctx.$t("pages.setting.sections.validate_username.title")
                                }, null, 8, ["text"]),
                                vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                vue_cjs_prod.createVNode("div", null, [
                                  vue_cjs_prod.createVNode(_component_FormTextInput, {
                                    modelValue: username.value,
                                    "onUpdate:modelValue": ($event) => username.value = $event
                                  }, {
                                    prefix: vue_cjs_prod.withCtx(() => [
                                      vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                    ]),
                                    _: 1
                                  }, 8, ["modelValue", "onUpdate:modelValue"])
                                ])
                              ]),
                              _: 1
                            }),
                            vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                              default: vue_cjs_prod.withCtx(() => [
                                vue_cjs_prod.createVNode("p", null, [
                                  vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                  vue_cjs_prod.createVNode(_component_Anchor, {
                                    class: "underline font-bold capitalize",
                                    text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                    href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                  }, null, 8, ["text"])
                                ]),
                                vue_cjs_prod.createVNode(_component_Button, {
                                  class: "capitalize",
                                  size: "sm",
                                  type: "opposite",
                                  text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                  onClick: validate
                                }, null, 8, ["text"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageSection, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_Alert, {
                    type: "success",
                    title: "This is a page for testing purposes",
                    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  })
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.setting.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, { class: "flex space-x-4" }, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_Card, null, {
                        default: vue_cjs_prod.withCtx(() => [
                          vue_cjs_prod.createVNode(_component_CardContent, null, {
                            default: vue_cjs_prod.withCtx(() => [
                              vue_cjs_prod.createVNode(_component_CardTitle, {
                                class: "capitalize",
                                text: _ctx.$t("pages.setting.sections.validate_username.title")
                              }, null, 8, ["text"]),
                              vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                              vue_cjs_prod.createVNode("div", null, [
                                vue_cjs_prod.createVNode(_component_FormTextInput, {
                                  modelValue: username.value,
                                  "onUpdate:modelValue": ($event) => username.value = $event
                                }, {
                                  prefix: vue_cjs_prod.withCtx(() => [
                                    vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                  ]),
                                  _: 1
                                }, 8, ["modelValue", "onUpdate:modelValue"])
                              ])
                            ]),
                            _: 1
                          }),
                          vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                            default: vue_cjs_prod.withCtx(() => [
                              vue_cjs_prod.createVNode("p", null, [
                                vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                vue_cjs_prod.createVNode(_component_Anchor, {
                                  class: "underline font-bold capitalize",
                                  text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                  href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                }, null, 8, ["text"])
                              ]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "capitalize",
                                size: "sm",
                                type: "opposite",
                                text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                onClick: validate
                              }, null, 8, ["text"])
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$r = _sfc_main$r.setup;
_sfc_main$r.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/setting.vue");
  return _sfc_setup$r ? _sfc_setup$r(props, ctx) : void 0;
};
const meta$1 = {
  layout: "page"
};
const _sfc_main$q = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Title",
  __ssrInlineRender: true,
  props: {
    text: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "text-2xl font-semibold mb-2" }, _attrs))}>`);
      serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
        _push(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
      }, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$q = _sfc_main$q.setup;
_sfc_main$q.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Section/Title.vue");
  return _sfc_setup$q ? _sfc_setup$q(props, ctx) : void 0;
};
const useCounter = defineStore("counter", {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
    reset() {
      this.count = 0;
    },
    increment2x() {
      this.count *= 2;
    }
  }
});
const useIdentity = defineStore("identity", {
  state: () => ({
    firstName: "Prince",
    lastName: "Dev"
  }),
  actions: {
    setFirstName(firstName) {
      this.firstName = firstName;
    },
    setLastName(lastName) {
      this.lastName = lastName;
    },
    reset() {
      this.firstName = "Prince";
      this.lastName = "Dev";
    }
  },
  getters: {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
});
const _sfc_main$p = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "test",
  __ssrInlineRender: true,
  setup(__props) {
    const counter = useCounter();
    const identity = useIdentity();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_PageSection = __nuxt_component_4;
      const _component_PageSectionTitle = _sfc_main$q;
      const _component_Button = _sfc_main$E;
      const _component_FormTextInput = _sfc_main$u;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.test.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.test.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.counter"),
                          class: "capitalize"
                        }, null, _parent4, _scopeId3));
                        _push4(`<div class=""${_scopeId3}><div class="mb-2"${_scopeId3}>Counter : ${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(counter).count)}</div><div class="flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2"${_scopeId3}>`);
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto capitalize",
                          type: "secondary",
                          size: "sm",
                          text: _ctx.$t("pages.test.increment"),
                          onClick: vue_cjs_prod.unref(counter).increment
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto",
                          type: "secondary",
                          size: "sm",
                          text: `${_ctx.$t("pages.test.increment")} 2x`,
                          onClick: vue_cjs_prod.unref(counter).increment2x
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto capitalize",
                          type: "secondary",
                          size: "sm",
                          text: _ctx.$t("pages.test.decrement"),
                          onClick: vue_cjs_prod.unref(counter).decrement
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto capitalize",
                          type: "secondary",
                          size: "sm",
                          text: _ctx.$t("pages.test.reset"),
                          onClick: vue_cjs_prod.unref(counter).reset
                        }, null, _parent4, _scopeId3));
                        _push4(`</div></div>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                            text: _ctx.$t("pages.test.counter"),
                            class: "capitalize"
                          }, null, 8, ["text"]),
                          vue_cjs_prod.createVNode("div", { class: "" }, [
                            vue_cjs_prod.createVNode("div", { class: "mb-2" }, "Counter : " + vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(counter).count), 1),
                            vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto capitalize",
                                type: "secondary",
                                size: "sm",
                                text: _ctx.$t("pages.test.increment"),
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment, ["prevent"])
                              }, null, 8, ["text", "onClick"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto",
                                type: "secondary",
                                size: "sm",
                                text: `${_ctx.$t("pages.test.increment")} 2x`,
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment2x, ["prevent"])
                              }, null, 8, ["text", "onClick"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto capitalize",
                                type: "secondary",
                                size: "sm",
                                text: _ctx.$t("pages.test.decrement"),
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).decrement, ["prevent"])
                              }, null, 8, ["text", "onClick"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto capitalize",
                                type: "secondary",
                                size: "sm",
                                text: _ctx.$t("pages.test.reset"),
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).reset, ["prevent"])
                              }, null, 8, ["text", "onClick"])
                            ])
                          ])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.identity"),
                          class: "capitalize"
                        }, null, _parent4, _scopeId3));
                        _push4(`<div class="mb-2"${_scopeId3}><span class="capitalize"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.test.full_name"))} : </span><span${_scopeId3}>${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(identity).fullName)}</span></div><div class=""${_scopeId3}><div class="flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2"${_scopeId3}>`);
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_FormTextInput, {
                          modelValue: vue_cjs_prod.unref(identity).firstName,
                          "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                          size: "sm"
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_FormTextInput, {
                          modelValue: vue_cjs_prod.unref(identity).lastName,
                          "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                          size: "sm"
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full capitalize",
                          text: _ctx.$t("pages.test.reset"),
                          type: "secondary",
                          size: "sm",
                          onClick: vue_cjs_prod.unref(identity).reset
                        }, null, _parent4, _scopeId3));
                        _push4(`</div></div>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                            text: _ctx.$t("pages.test.identity"),
                            class: "capitalize"
                          }, null, 8, ["text"]),
                          vue_cjs_prod.createVNode("div", { class: "mb-2" }, [
                            vue_cjs_prod.createVNode("span", { class: "capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.test.full_name")) + " : ", 1),
                            vue_cjs_prod.createVNode("span", null, vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(identity).fullName), 1)
                          ]),
                          vue_cjs_prod.createVNode("div", { class: "" }, [
                            vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                              vue_cjs_prod.createVNode(_component_FormTextInput, {
                                modelValue: vue_cjs_prod.unref(identity).firstName,
                                "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                                size: "sm"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                              vue_cjs_prod.createVNode(_component_FormTextInput, {
                                modelValue: vue_cjs_prod.unref(identity).lastName,
                                "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                                size: "sm"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full capitalize",
                                text: _ctx.$t("pages.test.reset"),
                                type: "secondary",
                                size: "sm",
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(identity).reset, ["prevent"])
                              }, null, 8, ["text", "onClick"])
                            ])
                          ])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.counter"),
                          class: "capitalize"
                        }, null, 8, ["text"]),
                        vue_cjs_prod.createVNode("div", { class: "" }, [
                          vue_cjs_prod.createVNode("div", { class: "mb-2" }, "Counter : " + vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(counter).count), 1),
                          vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto capitalize",
                              type: "secondary",
                              size: "sm",
                              text: _ctx.$t("pages.test.increment"),
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment, ["prevent"])
                            }, null, 8, ["text", "onClick"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto",
                              type: "secondary",
                              size: "sm",
                              text: `${_ctx.$t("pages.test.increment")} 2x`,
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment2x, ["prevent"])
                            }, null, 8, ["text", "onClick"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto capitalize",
                              type: "secondary",
                              size: "sm",
                              text: _ctx.$t("pages.test.decrement"),
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).decrement, ["prevent"])
                            }, null, 8, ["text", "onClick"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto capitalize",
                              type: "secondary",
                              size: "sm",
                              text: _ctx.$t("pages.test.reset"),
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).reset, ["prevent"])
                            }, null, 8, ["text", "onClick"])
                          ])
                        ])
                      ]),
                      _: 1
                    }),
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.identity"),
                          class: "capitalize"
                        }, null, 8, ["text"]),
                        vue_cjs_prod.createVNode("div", { class: "mb-2" }, [
                          vue_cjs_prod.createVNode("span", { class: "capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.test.full_name")) + " : ", 1),
                          vue_cjs_prod.createVNode("span", null, vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(identity).fullName), 1)
                        ]),
                        vue_cjs_prod.createVNode("div", { class: "" }, [
                          vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                            vue_cjs_prod.createVNode(_component_FormTextInput, {
                              modelValue: vue_cjs_prod.unref(identity).firstName,
                              "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                              size: "sm"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            vue_cjs_prod.createVNode(_component_FormTextInput, {
                              modelValue: vue_cjs_prod.unref(identity).lastName,
                              "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                              size: "sm"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full capitalize",
                              text: _ctx.$t("pages.test.reset"),
                              type: "secondary",
                              size: "sm",
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(identity).reset, ["prevent"])
                            }, null, 8, ["text", "onClick"])
                          ])
                        ])
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.test.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                        text: _ctx.$t("pages.test.counter"),
                        class: "capitalize"
                      }, null, 8, ["text"]),
                      vue_cjs_prod.createVNode("div", { class: "" }, [
                        vue_cjs_prod.createVNode("div", { class: "mb-2" }, "Counter : " + vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(counter).count), 1),
                        vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto capitalize",
                            type: "secondary",
                            size: "sm",
                            text: _ctx.$t("pages.test.increment"),
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment, ["prevent"])
                          }, null, 8, ["text", "onClick"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto",
                            type: "secondary",
                            size: "sm",
                            text: `${_ctx.$t("pages.test.increment")} 2x`,
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment2x, ["prevent"])
                          }, null, 8, ["text", "onClick"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto capitalize",
                            type: "secondary",
                            size: "sm",
                            text: _ctx.$t("pages.test.decrement"),
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).decrement, ["prevent"])
                          }, null, 8, ["text", "onClick"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto capitalize",
                            type: "secondary",
                            size: "sm",
                            text: _ctx.$t("pages.test.reset"),
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).reset, ["prevent"])
                          }, null, 8, ["text", "onClick"])
                        ])
                      ])
                    ]),
                    _: 1
                  }),
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                        text: _ctx.$t("pages.test.identity"),
                        class: "capitalize"
                      }, null, 8, ["text"]),
                      vue_cjs_prod.createVNode("div", { class: "mb-2" }, [
                        vue_cjs_prod.createVNode("span", { class: "capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.test.full_name")) + " : ", 1),
                        vue_cjs_prod.createVNode("span", null, vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(identity).fullName), 1)
                      ]),
                      vue_cjs_prod.createVNode("div", { class: "" }, [
                        vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                          vue_cjs_prod.createVNode(_component_FormTextInput, {
                            modelValue: vue_cjs_prod.unref(identity).firstName,
                            "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                            size: "sm"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          vue_cjs_prod.createVNode(_component_FormTextInput, {
                            modelValue: vue_cjs_prod.unref(identity).lastName,
                            "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                            size: "sm"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full capitalize",
                            text: _ctx.$t("pages.test.reset"),
                            type: "secondary",
                            size: "sm",
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(identity).reset, ["prevent"])
                          }, null, 8, ["text", "onClick"])
                        ])
                      ])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$p = _sfc_main$p.setup;
_sfc_main$p.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test.vue");
  return _sfc_setup$p ? _sfc_setup$p(props, ctx) : void 0;
};
const meta = {
  layout: "page"
};
const routes = [
  {
    name: "about",
    path: "/about",
    file: "F:/p45mjn/pages/about.vue",
    children: [],
    meta: meta$5,
    alias: (meta$5 == null ? void 0 : meta$5.alias) || [],
    component: () => Promise.resolve().then(function() {
      return about;
    })
  },
  {
    name: "blank",
    path: "/blank",
    file: "F:/p45mjn/pages/blank.vue",
    children: [],
    meta: meta$4,
    alias: (meta$4 == null ? void 0 : meta$4.alias) || [],
    component: () => Promise.resolve().then(function() {
      return blank;
    })
  },
  {
    name: "dashboard",
    path: "/dashboard",
    file: "F:/p45mjn/pages/dashboard/index.vue",
    children: [],
    meta: meta$3,
    alias: (meta$3 == null ? void 0 : meta$3.alias) || [],
    component: () => Promise.resolve().then(function() {
      return index$1;
    })
  },
  {
    name: "index",
    path: "/",
    file: "F:/p45mjn/pages/index.vue",
    children: [],
    meta: meta$2,
    alias: (meta$2 == null ? void 0 : meta$2.alias) || [],
    component: () => Promise.resolve().then(function() {
      return index;
    })
  },
  {
    name: "setting",
    path: "/setting",
    file: "F:/p45mjn/pages/setting.vue",
    children: [],
    meta: meta$1,
    alias: (meta$1 == null ? void 0 : meta$1.alias) || [],
    component: () => Promise.resolve().then(function() {
      return setting;
    })
  },
  {
    name: "test",
    path: "/test",
    file: "F:/p45mjn/pages/test.vue",
    children: [],
    meta,
    alias: (meta == null ? void 0 : meta.alias) || [],
    component: () => Promise.resolve().then(function() {
      return test;
    })
  }
];
const configRouterOptions = {};
const routerOptions = __spreadValues({}, configRouterOptions);
const globalMiddleware = [];
const namedMiddleware = {};
const F_58_47p45mjn_47node_modules_47nuxt_47dist_47pages_47runtime_47router = defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.vueApp.component("NuxtPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtNestedPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtChild", NuxtPage);
  const baseURL2 = useRuntimeConfig().app.baseURL;
  const routerHistory = vueRouter_cjs_prod.createMemoryHistory(baseURL2);
  const initialURL = nuxtApp.ssrContext.url;
  const router = vueRouter_cjs_prod.createRouter(__spreadProps(__spreadValues({}, routerOptions), {
    history: routerHistory,
    routes
  }));
  nuxtApp.vueApp.use(router);
  const previousRoute = vue_cjs_prod.shallowRef(router.currentRoute.value);
  router.afterEach((_to, from) => {
    previousRoute.value = from;
  });
  Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
    get: () => previousRoute.value
  });
  const route = {};
  for (const key in router.currentRoute.value) {
    route[key] = vue_cjs_prod.computed(() => router.currentRoute.value[key]);
  }
  const _activeRoute = vue_cjs_prod.shallowRef(router.resolve(initialURL));
  const syncCurrentRoute = () => {
    _activeRoute.value = router.currentRoute.value;
  };
  nuxtApp.hook("page:finish", syncCurrentRoute);
  router.afterEach((to, from) => {
    var _a2, _b2, _c, _d;
    if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d = (_c = from.matched[0]) == null ? void 0 : _c.components) == null ? void 0 : _d.default)) {
      syncCurrentRoute();
    }
  });
  const activeRoute = {};
  for (const key in _activeRoute.value) {
    activeRoute[key] = vue_cjs_prod.computed(() => _activeRoute.value[key]);
  }
  nuxtApp._route = vue_cjs_prod.reactive(route);
  nuxtApp._activeRoute = vue_cjs_prod.reactive(activeRoute);
  nuxtApp._middleware = nuxtApp._middleware || {
    global: [],
    named: {}
  };
  useError();
  try {
    if (true) {
      await router.push(initialURL);
    }
    await router.isReady();
  } catch (error2) {
    callWithNuxt(nuxtApp, throwError, [error2]);
  }
  router.beforeEach(async (to, from) => {
    var _a2;
    to.meta = vue_cjs_prod.reactive(to.meta);
    nuxtApp._processingMiddleware = true;
    const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
    for (const component of to.matched) {
      const componentMiddleware = component.meta.middleware;
      if (!componentMiddleware) {
        continue;
      }
      if (Array.isArray(componentMiddleware)) {
        for (const entry2 of componentMiddleware) {
          middlewareEntries.add(entry2);
        }
      } else {
        middlewareEntries.add(componentMiddleware);
      }
    }
    for (const entry2 of middlewareEntries) {
      const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_a2 = namedMiddleware[entry2]) == null ? void 0 : _a2.call(namedMiddleware).then((r) => r.default || r)) : entry2;
      if (!middleware) {
        throw new Error(`Unknown route middleware: '${entry2}'.`);
      }
      const result = await callWithNuxt(nuxtApp, middleware, [to, from]);
      {
        if (result === false || result instanceof Error) {
          const error2 = result || createError({
            statusMessage: `Route navigation aborted: ${initialURL}`
          });
          return callWithNuxt(nuxtApp, throwError, [error2]);
        }
      }
      if (result || result === false) {
        return result;
      }
    }
  });
  router.afterEach(async (to) => {
    delete nuxtApp._processingMiddleware;
    if (to.matched.length === 0) {
      callWithNuxt(nuxtApp, throwError, [createError({
        statusCode: 404,
        statusMessage: `Page not found: ${to.fullPath}`
      })]);
    } else if (to.matched[0].name === "404" && nuxtApp.ssrContext) {
      nuxtApp.ssrContext.res.statusCode = 404;
    } else {
      const currentURL = to.fullPath || "/";
      if (!isEqual(currentURL, initialURL)) {
        await callWithNuxt(nuxtApp, navigateTo, [currentURL]);
      }
    }
  });
  nuxtApp.hooks.hookOnce("app:created", async () => {
    try {
      await router.replace(__spreadProps(__spreadValues({}, router.resolve(initialURL)), {
        name: void 0,
        force: true
      }));
    } catch (error2) {
      callWithNuxt(nuxtApp, throwError, [error2]);
    }
  });
  return { provide: { router } };
});
const optionsLoader = () => Promise.resolve({ "locale": "en", "fallbackLocale": "en", "availableLocales": ["en", "id", "ja"] });
const locale_en = {
  "components": {
    "language_switcher": {
      "change_language": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["change language"]);
      }
    },
    "theme_switcher": {
      "theme": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["theme"]);
      },
      "change_theme": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["change theme"]);
      }
    }
  },
  "pages": {
    "index": {
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["Glysis,Softwares,Pvt. Ltd."]);
      }
    },
    "blank": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["blank"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["blank page"]);
      },
      "just_blank_page_with_title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["just blank page with title"]);
      }
    },
    "test": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["test"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["testing"]);
      },
      "counter": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["counter"]);
      },
      "increment": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["increment"]);
      },
      "decrement": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["decrement"]);
      },
      "reset": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["reset"]);
      },
      "identity": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["identity"]);
      },
      "full_name": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["fullName"]);
      }
    },
    "about": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["about"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["about"]);
      }
    },
    "setting": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["setting"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["setting"]);
      },
      "sections": {
        "validate_username": {
          "title": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["validate github profile"]);
          },
          "description": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["type your github username and click the button to validate."]);
          },
          "footer": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["Learn more about"]);
          },
          "footer_button": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["validate"]);
          },
          "footer_link": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["github users api"]);
          }
        }
      }
    },
    "dashboard": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["dashboard"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["dashboard"]);
      },
      "index": {
        "nav": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["home"]);
        },
        "title": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["home"]);
        }
      }
    }
  },
  "banners": {
    "welcome": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["We are Hiring ", _interpolate(_named("app_name")), "!"]);
    }
  },
  "others": {
    "learn_more": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["learn more"]);
    }
  }
};
const locale_id = {
  "components": {
    "language_switcher": {
      "change_language": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["ganti bahasa"]);
      }
    },
    "theme_switcher": {
      "theme": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["tema"]);
      },
      "change_theme": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["ganti tema"]);
      }
    }
  },
  "pages": {
    "index": {
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["nuxt 3,permulaan,luar biasa"]);
      }
    },
    "blank": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["kosong"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["halaman kosong"]);
      },
      "just_blank_page_with_title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["hanya halaman kosong dengan judul"]);
      }
    },
    "test": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["pengujian"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["pengujian"]);
      },
      "counter": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["penghitung"]);
      },
      "increment": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["tambah"]);
      },
      "decrement": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["kurang"]);
      },
      "reset": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["reset ulang"]);
      },
      "identity": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["identitas"]);
      },
      "full_name": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["nama lengkap"]);
      }
    },
    "about": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["tentang"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["tentang penulis"]);
      }
    },
    "setting": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["pengaturan"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["pengaturan"]);
      },
      "sections": {
        "validate_username": {
          "title": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["cek profile github anda"]);
          },
          "description": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["ketik username github anda dan klik tombol untuk memvalidasi."]);
          },
          "footer": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["lebih lanjut tentang"]);
          },
          "footer_button": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["validasi"]);
          },
          "footer_link": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["github users api"]);
          }
        }
      }
    },
    "dashboard": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["dashboard"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["dashboard"]);
      },
      "index": {
        "nav": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["beranda"]);
        },
        "title": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["beranda"]);
        }
      }
    }
  },
  "banners": {
    "welcome": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["halo, selamat datang di ", _interpolate(_named("app_name")), "!"]);
    }
  },
  "others": {
    "learn_more": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["lihat selengkapnya"]);
    }
  }
};
const locale_ja = {
  "components": {
    "language_switcher": {
      "change_language": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u8A00\u8A9E\u3092\u5909\u3048\u3066\u304F\u3060\u3055\u3044"]);
      }
    },
    "theme_switcher": {
      "theme": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30C6\u30FC\u30DE"]);
      },
      "change_theme": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30C6\u30FC\u30DE\u3092\u5909\u3048\u3066\u304F\u3060\u3055\u3044"]);
      }
    }
  },
  "pages": {
    "index": {
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["nuxt 3,\u7D20\u6674\u3089\u3057\u3044,\u30B9\u30BF\u30FC\u30BF\u30FC"]);
      }
    },
    "blank": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u7A7A\u767D"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u7A7A\u767D\u30DA\u30FC\u30B8"]);
      },
      "just_blank_page_with_title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u7A7A\u767D\u30DA\u30FC\u30B8\u306E\u307F\u306B\u30BF\u30A4\u30C8\u30EB"]);
      }
    },
    "test": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30C6\u30B9\u30C8"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30C6\u30B9\u30C8"]);
      },
      "counter": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30AB\u30A6\u30F3\u30BF\u30FC"]);
      },
      "increment": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u5897\u52A0"]);
      },
      "decrement": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u6E1B\u5C11"]);
      },
      "reset": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30EA\u30BB\u30C3\u30C8"]);
      },
      "identity": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u8B58\u5225"]);
      },
      "full_name": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u5168\u540D"]);
      }
    },
    "about": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u3053\u306E\u30B5\u30A4\u30C8\u306B\u3064\u3044\u3066"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u3053\u306E\u30B5\u30A4\u30C8\u306B\u3064\u3044\u3066"]);
      }
    },
    "setting": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u8A2D\u5B9A"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u8A2D\u5B9A"]);
      },
      "sections": {
        "validate_username": {
          "title": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["github\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u3092\u691C\u8A3C\u3059\u308B"]);
          },
          "description": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["github\u30E6\u30FC\u30B6\u30FC\u540D\u3092\u5165\u529B\u3057\u3001\u30DC\u30BF\u30F3\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u691C\u8A3C\u3057\u307E\u3059\u3002"]);
          },
          "footer": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["\u8A73\u7D30\u306B\u3064\u3044\u3066\u306F"]);
          },
          "footer_button": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["\u691C\u8A3C"]);
          },
          "footer_link": (ctx) => {
            const { normalize: _normalize } = ctx;
            return _normalize(["github users api"]);
          }
        }
      }
    },
    "dashboard": {
      "nav": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9"]);
      },
      "title": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9"]);
      },
      "index": {
        "nav": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["\u30DB\u30FC\u30E0"]);
        },
        "title": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["\u30DB\u30FC\u30E0"]);
        }
      }
    }
  },
  "banners": {
    "welcome": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["\u3053\u3093\u306B\u3061\u306F, ", _interpolate(_named("app_name")), " \u3078\u3088\u3046\u3053\u305D!"]);
    }
  },
  "others": {
    "learn_more": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u7D9A\u304D\u3092\u8AAD\u3080"]);
    }
  }
};
const messages = { "en": locale_en, "id": locale_id, "ja": locale_ja };
const isEmpty = (obj) => Object.keys(obj).length === 0;
const F_58_47p45mjn_47_46nuxt_47plugin_46mjs = defineNuxtPlugin(async (nuxt) => {
  const { vueApp: app2 } = nuxt;
  const loadedOptions = await optionsLoader();
  if (!isEmpty(messages)) {
    loadedOptions.messages = messages;
  }
  const i18n = createI18n(__spreadValues({
    legacy: false,
    globalInjection: true,
    locale: "en"
  }, loadedOptions));
  app2.use(i18n);
});
const PiniaNuxtPlugin = (context, inject2) => {
  const pinia = createPinia();
  {
    context.vueApp.use(pinia);
  }
  inject2("pinia", pinia);
  context.pinia = pinia;
  setActivePinia(pinia);
  pinia._p.push(({ store }) => {
    Object.defineProperty(store, "$nuxt", { value: context });
  });
  {
    {
      context.nuxtState.pinia = pinia.state.value;
    }
  }
};
const F_58_47p45mjn_47plugins_47navbar_46ts = defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("page:finish", () => {
    const showDrawer = useState("navbar.showDrawer", () => false);
    const showOptions = useState("navbar.showOptions", () => false);
    showDrawer.value = false;
    showOptions.value = false;
  });
});
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey = "__vueuse_ssr_handlers__";
_global[globalKey] = _global[globalKey] || {};
const handlers = _global[globalKey];
function setSSRHandler(key, fn) {
  handlers[key] = fn;
}
const useSticky = (el, offset) => {
  const onScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > offset) {
      el.classList.add("sticky");
    } else {
      el.classList.remove("sticky");
    }
  };
  window.addEventListener("scroll", onScroll);
  vue_cjs_prod.onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
  });
  return {
    onScroll
  };
};
setSSRHandler("getDefaultStorage", () => {
  const cookieMap = /* @__PURE__ */ new Map();
  const get = (key) => {
    if (!cookieMap.get(key))
      cookieMap.set(key, useCookie(key, { maxAge: 2147483646 }));
    return cookieMap.get(key);
  };
  return {
    getItem: (key) => get(key).value,
    setItem: (key, value) => get(key).value = value,
    removeItem: (key) => get(key).value = void 0
  };
});
{
  setSSRHandler("updateHTMLAttrs", (selector, attr, value) => {
    if (selector === "html") {
      useMeta({
        htmlAttrs: {
          [attr]: value
        }
      });
    } else if (selector === "body") {
      useMeta({
        bodyAttrs: {
          [attr]: value
        }
      });
    } else {
      throw new Error(`Unsupported meta selector "${selector}" in SSR`);
    }
  });
}
const F_58_47p45mjn_47node_modules_47_64vueuse_47nuxt_47ssr_45plugin_46mjs = () => {
};
const _plugins = [
  preload,
  F_58_47p45mjn_47_46nuxt_47components_46plugin_46mjs,
  F_58_47p45mjn_47node_modules_47nuxt_47dist_47head_47runtime_47lib_47vueuse_45head_46plugin,
  F_58_47p45mjn_47node_modules_47nuxt_47dist_47head_47runtime_47plugin,
  F_58_47p45mjn_47node_modules_47nuxt_47dist_47pages_47runtime_47router,
  F_58_47p45mjn_47_46nuxt_47plugin_46mjs,
  PiniaNuxtPlugin,
  F_58_47p45mjn_47plugins_47navbar_46ts,
  F_58_47p45mjn_47node_modules_47_64vueuse_47nuxt_47ssr_45plugin_46mjs,
  F_58_47p45mjn_47plugins_47navbar_46ts
];
const _sfc_main$o = {
  __name: "error-404",
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: String,
      default: "404"
    },
    statusMessage: {
      type: String,
      default: "Not Found"
    },
    description: {
      type: String,
      default: "Sorry, the page you are looking for could not be found."
    },
    backHome: {
      type: String,
      default: "Go back home"
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}a{color:inherit;text-decoration:inherit}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$4;
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-011aae6d><div class="fixed left-0 right-0 spotlight z-10" data-v-011aae6d></div><div class="max-w-520px text-center z-20" data-v-011aae6d><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-011aae6d>${serverRenderer.exports.ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-011aae6d>${serverRenderer.exports.ssrInterpolate(__props.description)}</p><div class="w-full flex items-center justify-center" data-v-011aae6d>`);
      _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "gradient-border text-md sm:text-xl py-2 px-4 sm:py-3 sm:px-6 cursor-pointer"
      }, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${serverRenderer.exports.ssrInterpolate(__props.backHome)}`);
          } else {
            return [
              vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(__props.backHome), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$o = _sfc_main$o.setup;
_sfc_main$o.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxt/ui-templates/dist/templates/error-404.vue");
  return _sfc_setup$o ? _sfc_setup$o(props, ctx) : void 0;
};
const Error404 = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["__scopeId", "data-v-011aae6d"]]);
const _sfc_main$n = {
  __name: "error-500",
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: String,
      default: "500"
    },
    statusMessage: {
      type: String,
      default: "Server error"
    },
    description: {
      type: String,
      default: "This page is temporarily unavailable."
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-6aee6495><div class="fixed -bottom-1/2 left-0 right-0 h-1/2 spotlight" data-v-6aee6495></div><div class="max-w-520px text-center" data-v-6aee6495><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-6aee6495>${serverRenderer.exports.ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-6aee6495>${serverRenderer.exports.ssrInterpolate(__props.description)}</p></div></div>`);
    };
  }
};
const _sfc_setup$n = _sfc_main$n.setup;
_sfc_main$n.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxt/ui-templates/dist/templates/error-500.vue");
  return _sfc_setup$n ? _sfc_setup$n(props, ctx) : void 0;
};
const Error500 = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["__scopeId", "data-v-6aee6495"]]);
const _sfc_main$l = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    var _a2;
    const props = __props;
    const error = props.error;
    (error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n");
    const statusCode = String(error.statusCode || 500);
    const is404 = statusCode === "404";
    const statusMessage = (_a2 = error.statusMessage) != null ? _a2 : is404 ? "Page Not Found" : "Internal Server Error";
    const description = error.message || error.toString();
    const stack = void 0;
    const ErrorTemplate = is404 ? Error404 : Error500;
    return (_ctx, _push, _parent, _attrs) => {
      _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(ErrorTemplate), vue_cjs_prod.mergeProps({ statusCode: vue_cjs_prod.unref(statusCode), statusMessage: vue_cjs_prod.unref(statusMessage), description: vue_cjs_prod.unref(description), stack: vue_cjs_prod.unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$l = _sfc_main$l.setup;
_sfc_main$l.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$l ? _sfc_setup$l(props, ctx) : void 0;
};
const _sfc_main$k = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const nuxtApp = useNuxtApp();
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    vue_cjs_prod.onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        callWithNuxt(nuxtApp, throwError, [err]);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_App = vue_cjs_prod.resolveComponent("App");
      serverRenderer.exports.ssrRenderSuspense(_push, {
        default: () => {
          if (vue_cjs_prod.unref(error)) {
            _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(_sfc_main$l), { error: vue_cjs_prod.unref(error) }, null, _parent));
          } else {
            _push(serverRenderer.exports.ssrRenderComponent(_component_App, null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup$k = _sfc_main$k.setup;
_sfc_main$k.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup$k ? _sfc_setup$k(props, ctx) : void 0;
};
const layouts = {
  dashboard: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return dashboard$1;
  })),
  page: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return page$1;
  }))
};
const defaultLayoutTransition = { name: "layout", mode: "out-in" };
const __nuxt_component_0$2 = vue_cjs_prod.defineComponent({
  props: {
    name: {
      type: [String, Boolean, Object],
      default: null
    }
  },
  setup(props, context) {
    const route = useRoute();
    return () => {
      var _a2, _b2, _c;
      const layout = (_b2 = (_a2 = vue_cjs_prod.isRef(props.name) ? props.name.value : props.name) != null ? _a2 : route.meta.layout) != null ? _b2 : "default";
      const hasLayout = layout && layout in layouts;
      return _wrapIf(vue_cjs_prod.Transition, hasLayout && ((_c = route.meta.layoutTransition) != null ? _c : defaultLayoutTransition), _wrapIf(layouts[layout], hasLayout, context.slots)).default();
    };
  }
});
const availableThemes = [
  { key: "light", text: "Light" },
  { key: "dark", text: "Dark" },
  { key: "system", text: "System" },
  { key: "realtime", text: "Realtime" }
];
function ThemeManager() {
  const themeUserSetting = useCookie("theme");
  const getUserSetting = () => themeUserSetting.value || "system";
  const getSystemTheme = () => {
    try {
      return window ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : "dark";
    } catch (error) {
      return "dark";
    }
  };
  const getRealtimeTheme = () => {
    const now2 = new Date();
    const hour = now2.getHours();
    const isNight = hour >= 17 || hour <= 5;
    return isNight ? "dark" : "light";
  };
  const themeSetting = useState("theme.setting", () => getUserSetting());
  const themeCurrent = useState("theme.current", () => "light");
  const onThemeSettingChange = (themeSetting2) => {
    themeUserSetting.value = themeSetting2;
    if (themeSetting2 === "realtime") {
      themeCurrent.value = getRealtimeTheme();
    } else if (themeSetting2 === "system") {
      themeCurrent.value = getSystemTheme();
    } else {
      themeCurrent.value = themeSetting2;
    }
  };
  vue_cjs_prod.watch(themeSetting, (val) => onThemeSettingChange(val));
  const onThemeSystemChange = () => {
    if (themeSetting.value === "system") {
      themeCurrent.value = getSystemTheme();
    }
  };
  const onRealtimeCheck = () => {
    if (themeSetting.value === "realtime") {
      themeCurrent.value = getRealtimeTheme();
    }
  };
  const init = () => {
    themeSetting.value = getUserSetting();
  };
  onThemeSettingChange(themeSetting.value);
  let intervalCheckTime;
  vue_cjs_prod.onBeforeMount(() => init());
  vue_cjs_prod.onMounted(() => {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onThemeSystemChange);
    intervalCheckTime = setInterval(onRealtimeCheck, 1e3);
  });
  vue_cjs_prod.onBeforeUnmount(() => {
    window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", onThemeSystemChange);
    if (intervalCheckTime)
      clearInterval(intervalCheckTime);
  });
  return {
    themeSetting,
    themeCurrent,
    getUserSetting,
    getSystemTheme,
    getRealtimeTheme
  };
}
const availableLocales = {
  en: {
    name: "English",
    iso: "en",
    flag: "\u{1F1FA}\u{1F1F8}"
  },
  id: {
    name: "Bahasa",
    iso: "id",
    flag: "\u{1F1EE}\u{1F1E9}"
  },
  ja: {
    name: "\u65E5\u672C\u8A9E",
    iso: "ja",
    flag: "\u{1F1EF}\u{1F1F5}"
  }
};
function LanguageManager() {
  const { locale } = useI18n();
  const localeUserSetting = useCookie("locale");
  const getSystemLocale = () => {
    try {
      return window ? window.navigator.language.substring(0, 2) : "en";
    } catch (error) {
      return "en";
    }
  };
  const getUserLocale = () => localeUserSetting.value || getSystemLocale();
  const localeSetting = useState("locale.setting", () => getUserLocale());
  vue_cjs_prod.watch(localeSetting, (localeSetting2) => {
    localeUserSetting.value = localeSetting2;
    locale.value = localeSetting2;
  });
  const init = () => {
    localeSetting.value = getUserLocale();
  };
  locale.value = localeSetting.value;
  vue_cjs_prod.onBeforeMount(() => init());
  return {
    localeSetting,
    init
  };
}
function AppSetup() {
  const app2 = {
    name: "Glysis Softwares",
    link: "https://github.com/glysis-softwares",
    author: {
      name: "princedev",
      link: "https://github.com/thisizprincedev"
    }
  };
  useState("app", () => app2);
  const themeManager = ThemeManager();
  const languageManager = LanguageManager();
  return {
    app: app2,
    themeManager,
    languageManager
  };
}
const _sfc_main$j = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    AppSetup();
    const theme = useState("theme.current");
    const locale = useState("locale.setting");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Html = vue_cjs_prod.resolveComponent("Html");
      const _component_Body = vue_cjs_prod.resolveComponent("Body");
      const _component_NuxtLayout = __nuxt_component_0$2;
      const _component_NuxtPage = vue_cjs_prod.resolveComponent("NuxtPage");
      _push(serverRenderer.exports.ssrRenderComponent(_component_Html, vue_cjs_prod.mergeProps({
        class: `${vue_cjs_prod.unref(theme) === "dark" ? "dark" : ""}`,
        lang: vue_cjs_prod.unref(locale)
      }, _attrs), {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_Body, { class: "antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900" }, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_NuxtLayout, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_NuxtPage, null, null, _parent4, _scopeId3));
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_NuxtPage)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_NuxtLayout, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_NuxtPage)
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_Body, { class: "antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900" }, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_NuxtLayout, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_NuxtPage)
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
const plugins = normalizePlugins(_plugins);
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = vue_cjs_prod.createApp(_sfc_main$k);
    vueApp.component("App", _sfc_main$j);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.callHook("app:error", err);
      ssrContext.error = ssrContext.error || err;
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);
const _sfc_main$i = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "about",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_Button = _sfc_main$E;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, vue_cjs_prod.mergeProps({ class: "flex flex-col justify-center items-center" }, _attrs), {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.about.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.about.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex flex-col items-center"${_scopeId2}><img src="https://avatars.githubusercontent.com/u/25566363?v=4" class="inline-block rounded-full" alt="thisizprincedev" width="100" height="100"${_scopeId2}>`);
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                    size: "xs",
                    type: "opposite",
                    text: "Prince Dev (@thisizprincedev)",
                    class: "font-extrabold mt-4",
                    href: "https://github.com/thisizprincedev"
                  }, null, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center" }, [
                      vue_cjs_prod.createVNode("img", {
                        src: "https://avatars.githubusercontent.com/u/25566363?v=4",
                        class: "inline-block rounded-full",
                        alt: "thisizprincedev",
                        width: "100",
                        height: "100"
                      }),
                      vue_cjs_prod.createVNode(_component_Button, {
                        size: "xs",
                        type: "opposite",
                        text: "Prince Dev (@thisizprincedev)",
                        class: "font-extrabold mt-4",
                        href: "https://github.com/thisizprincedev"
                      })
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.about.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center" }, [
                    vue_cjs_prod.createVNode("img", {
                      src: "https://avatars.githubusercontent.com/u/25566363?v=4",
                      class: "inline-block rounded-full",
                      alt: "thisizprincedev",
                      width: "100",
                      height: "100"
                    }),
                    vue_cjs_prod.createVNode(_component_Button, {
                      size: "xs",
                      type: "opposite",
                      text: "Prince Dev (@thisizprincedev)",
                      class: "font-extrabold mt-4",
                      href: "https://github.com/thisizprincedev"
                    })
                  ])
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/about.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
const about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$i
});
const _sfc_main$h = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "blank",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_PageSection = __nuxt_component_4;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.blank.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.blank.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<!--[-->`);
                        serverRenderer.exports.ssrRenderList(30, (i) => {
                          _push4(`<div class="text-6xl uppercase"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.blank.just_blank_page_with_title"))}</div>`);
                        });
                        _push4(`<!--]-->`);
                      } else {
                        return [
                          (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                            return vue_cjs_prod.createVNode("div", {
                              key: i,
                              class: "text-6xl uppercase"
                            }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                          }), 64))
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                          return vue_cjs_prod.createVNode("div", {
                            key: i,
                            class: "text-6xl uppercase"
                          }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                        }), 64))
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.blank.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                        return vue_cjs_prod.createVNode("div", {
                          key: i,
                          class: "text-6xl uppercase"
                        }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                      }), 64))
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/blank.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
const blank = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$h
});
const _sfc_main$g = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_PageSection = __nuxt_component_4;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.dashboard.index.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.dashboard.index.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<p${_scopeId3}> Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? </p>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode("p", null, " Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<!--[-->`);
                        serverRenderer.exports.ssrRenderList(30, (i) => {
                          _push4(`<div class="text-6xl uppercase"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.blank.just_blank_page_with_title"))}</div>`);
                        });
                        _push4(`<!--]-->`);
                      } else {
                        return [
                          (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                            return vue_cjs_prod.createVNode("div", {
                              key: i,
                              class: "text-6xl uppercase"
                            }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                          }), 64))
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode("p", null, " Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? ")
                      ]),
                      _: 1
                    }),
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                          return vue_cjs_prod.createVNode("div", {
                            key: i,
                            class: "text-6xl uppercase"
                          }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                        }), 64))
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.dashboard.index.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode("p", null, " Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia autem debitis ab dolorum tempore placeat possimus perferendis porro sit aut nobis quasi hic consequuntur, atque impedit nihil totam illo odit? ")
                    ]),
                    _: 1
                  }),
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(30, (i) => {
                        return vue_cjs_prod.createVNode("div", {
                          key: i,
                          class: "text-6xl uppercase"
                        }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.blank.just_blank_page_with_title")), 1);
                      }), 64))
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/index.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$g
});
const _sfc_main$f = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useLang();
    const titlesText = vue_cjs_prod.computed(() => t("pages.index.title").split(","));
    const leadingsText = vue_cjs_prod.computed(() => [
      {
        text: titlesText.value[0],
        startColor: "#007CF0",
        endColor: "#00DFD8",
        delay: 0
      },
      {
        text: titlesText.value[1],
        startColor: "#7928CA",
        endColor: "#FF0080",
        delay: 2
      },
      {
        text: titlesText.value[2],
        startColor: "#FF4D4D",
        endColor: "#F9CB28",
        delay: 4
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_Button = _sfc_main$E;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, vue_cjs_prod.mergeProps({ class: "flex justify-center items-center" }, _attrs), {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="background-overlay"${_scopeId}><div class="absolute top-0 left-0 transform translate-x-64 translate-y-4 h-14 w-14 rounded-full bg-gray-900 dark:bg-white"${_scopeId}></div><div class="absolute hidden md:block top-0 left-0 transform translate-x-18 translate-y-20 h-28 w-28 rounded-full bg-blue-600 linear-wipe"${_scopeId}></div><div class="absolute hidden md:block bottom-0 right-0 transform -translate-x-4 -translate-y-40 h-16 w-16 rounded bg-purple-600 linear-wipe"${_scopeId}></div><div class="absolute bottom-0 right-0 triangle-shape"${_scopeId}></div></div><div class="flex flex-col z-10"${_scopeId}><h1 class="text-center"${_scopeId}><!--[-->`);
            serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(leadingsText), (item, i) => {
              _push2(`<span style="${serverRenderer.exports.ssrRenderStyle(`--content: '${item.text}'; --start-color: ${item.startColor}; --end-color: ${item.endColor}; --delay: ${item.delay}s`)}" class="animated-text-bg drop-shadow-xl text-5xl xl:text-8xl 2xl:text-9xl block font-black uppercase"${_scopeId}><span class="animated-text-fg"${_scopeId}>${serverRenderer.exports.ssrInterpolate(item.text)}</span></span>`);
            });
            _push2(`<!--]--></h1><div class="flex space-x-4 justify-center mt-10"${_scopeId}>`);
            _push2(serverRenderer.exports.ssrRenderComponent(_component_Button, {
              size: "lg",
              text: "Explore Glysis",
              class: "font-extrabold",
              href: "https://v3.nuxtjs.org"
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              vue_cjs_prod.createVNode("div", { class: "background-overlay" }, [
                vue_cjs_prod.createVNode("div", { class: "absolute top-0 left-0 transform translate-x-64 translate-y-4 h-14 w-14 rounded-full bg-gray-900 dark:bg-white" }),
                vue_cjs_prod.createVNode("div", { class: "absolute hidden md:block top-0 left-0 transform translate-x-18 translate-y-20 h-28 w-28 rounded-full bg-blue-600 linear-wipe" }),
                vue_cjs_prod.createVNode("div", { class: "absolute hidden md:block bottom-0 right-0 transform -translate-x-4 -translate-y-40 h-16 w-16 rounded bg-purple-600 linear-wipe" }),
                vue_cjs_prod.createVNode("div", { class: "absolute bottom-0 right-0 triangle-shape" })
              ]),
              vue_cjs_prod.createVNode("div", { class: "flex flex-col z-10" }, [
                vue_cjs_prod.createVNode("h1", { class: "text-center" }, [
                  (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(leadingsText), (item, i) => {
                    return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("span", {
                      key: i,
                      style: `--content: '${item.text}'; --start-color: ${item.startColor}; --end-color: ${item.endColor}; --delay: ${item.delay}s`,
                      class: "animated-text-bg drop-shadow-xl text-5xl xl:text-8xl 2xl:text-9xl block font-black uppercase"
                    }, [
                      vue_cjs_prod.createVNode("span", { class: "animated-text-fg" }, vue_cjs_prod.toDisplayString(item.text), 1)
                    ], 4);
                  }), 128))
                ]),
                vue_cjs_prod.createVNode("div", { class: "flex space-x-4 justify-center mt-10" }, [
                  vue_cjs_prod.createVNode(_component_Button, {
                    size: "lg",
                    text: "Explore Glysis",
                    class: "font-extrabold",
                    href: "https://v3.nuxtjs.org"
                  })
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$f
});
const _sfc_main$e = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "setting",
  __ssrInlineRender: true,
  setup(__props) {
    const username = vue_cjs_prod.ref("viandwi24");
    const validate = async () => {
      try {
        const response = await fetch(`https://api.github.com/users/${username.value}`);
        if (response.status !== 200)
          throw new Error(`error when fetching username : ${response.statusText} (${response.status})`);
        const data = await response.json();
        alert(`Found Accout Name ${data.name} with id : ${data.id}`);
      } catch (err) {
        alert(err);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageSection = __nuxt_component_4;
      const _component_Alert = _sfc_main$y;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_Card = __nuxt_component_6$1;
      const _component_CardContent = __nuxt_component_7;
      const _component_CardTitle = _sfc_main$v;
      const _component_FormTextInput = _sfc_main$u;
      const _component_CardFooter = __nuxt_component_10;
      const _component_Anchor = _sfc_main$s;
      const _component_Button = _sfc_main$E;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_Alert, {
                    type: "success",
                    title: "This is a page for testing purposes",
                    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_Alert, {
                      type: "success",
                      title: "This is a page for testing purposes",
                      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.setting.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.setting.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, { class: "flex space-x-4" }, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Card, null, {
                          default: vue_cjs_prod.withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(serverRenderer.exports.ssrRenderComponent(_component_CardContent, null, {
                                default: vue_cjs_prod.withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_CardTitle, {
                                      class: "capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.title")
                                    }, null, _parent6, _scopeId5));
                                    _push6(`<p class="mb-2"${_scopeId5}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.setting.sections.validate_username.description"))}</p><div${_scopeId5}>`);
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_FormTextInput, {
                                      modelValue: username.value,
                                      "onUpdate:modelValue": ($event) => username.value = $event
                                    }, {
                                      prefix: vue_cjs_prod.withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(`<span${_scopeId6}>https://github.com/</span>`);
                                        } else {
                                          return [
                                            vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                    _push6(`</div>`);
                                  } else {
                                    return [
                                      vue_cjs_prod.createVNode(_component_CardTitle, {
                                        class: "capitalize",
                                        text: _ctx.$t("pages.setting.sections.validate_username.title")
                                      }, null, 8, ["text"]),
                                      vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                      vue_cjs_prod.createVNode("div", null, [
                                        vue_cjs_prod.createVNode(_component_FormTextInput, {
                                          modelValue: username.value,
                                          "onUpdate:modelValue": ($event) => username.value = $event
                                        }, {
                                          prefix: vue_cjs_prod.withCtx(() => [
                                            vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                          ]),
                                          _: 1
                                        }, 8, ["modelValue", "onUpdate:modelValue"])
                                      ])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(serverRenderer.exports.ssrRenderComponent(_component_CardFooter, { class: "justify-between" }, {
                                default: vue_cjs_prod.withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(`<p${_scopeId5}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.setting.sections.validate_username.footer"))} `);
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
                                      class: "underline font-bold capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                      href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                    }, null, _parent6, _scopeId5));
                                    _push6(`</p>`);
                                    _push6(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                                      class: "capitalize",
                                      size: "sm",
                                      type: "opposite",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                      onClick: validate
                                    }, null, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      vue_cjs_prod.createVNode("p", null, [
                                        vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                        vue_cjs_prod.createVNode(_component_Anchor, {
                                          class: "underline font-bold capitalize",
                                          text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                          href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                        }, null, 8, ["text"])
                                      ]),
                                      vue_cjs_prod.createVNode(_component_Button, {
                                        class: "capitalize",
                                        size: "sm",
                                        type: "opposite",
                                        text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                        onClick: validate
                                      }, null, 8, ["text"])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                            } else {
                              return [
                                vue_cjs_prod.createVNode(_component_CardContent, null, {
                                  default: vue_cjs_prod.withCtx(() => [
                                    vue_cjs_prod.createVNode(_component_CardTitle, {
                                      class: "capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.title")
                                    }, null, 8, ["text"]),
                                    vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                    vue_cjs_prod.createVNode("div", null, [
                                      vue_cjs_prod.createVNode(_component_FormTextInput, {
                                        modelValue: username.value,
                                        "onUpdate:modelValue": ($event) => username.value = $event
                                      }, {
                                        prefix: vue_cjs_prod.withCtx(() => [
                                          vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                        ]),
                                        _: 1
                                      }, 8, ["modelValue", "onUpdate:modelValue"])
                                    ])
                                  ]),
                                  _: 1
                                }),
                                vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                                  default: vue_cjs_prod.withCtx(() => [
                                    vue_cjs_prod.createVNode("p", null, [
                                      vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                      vue_cjs_prod.createVNode(_component_Anchor, {
                                        class: "underline font-bold capitalize",
                                        text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                        href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                      }, null, 8, ["text"])
                                    ]),
                                    vue_cjs_prod.createVNode(_component_Button, {
                                      class: "capitalize",
                                      size: "sm",
                                      type: "opposite",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                      onClick: validate
                                    }, null, 8, ["text"])
                                  ]),
                                  _: 1
                                })
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_Card, null, {
                            default: vue_cjs_prod.withCtx(() => [
                              vue_cjs_prod.createVNode(_component_CardContent, null, {
                                default: vue_cjs_prod.withCtx(() => [
                                  vue_cjs_prod.createVNode(_component_CardTitle, {
                                    class: "capitalize",
                                    text: _ctx.$t("pages.setting.sections.validate_username.title")
                                  }, null, 8, ["text"]),
                                  vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                  vue_cjs_prod.createVNode("div", null, [
                                    vue_cjs_prod.createVNode(_component_FormTextInput, {
                                      modelValue: username.value,
                                      "onUpdate:modelValue": ($event) => username.value = $event
                                    }, {
                                      prefix: vue_cjs_prod.withCtx(() => [
                                        vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue", "onUpdate:modelValue"])
                                  ])
                                ]),
                                _: 1
                              }),
                              vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                                default: vue_cjs_prod.withCtx(() => [
                                  vue_cjs_prod.createVNode("p", null, [
                                    vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                    vue_cjs_prod.createVNode(_component_Anchor, {
                                      class: "underline font-bold capitalize",
                                      text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                      href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                    }, null, 8, ["text"])
                                  ]),
                                  vue_cjs_prod.createVNode(_component_Button, {
                                    class: "capitalize",
                                    size: "sm",
                                    type: "opposite",
                                    text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                    onClick: validate
                                  }, null, 8, ["text"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          })
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, { class: "flex space-x-4" }, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_Card, null, {
                          default: vue_cjs_prod.withCtx(() => [
                            vue_cjs_prod.createVNode(_component_CardContent, null, {
                              default: vue_cjs_prod.withCtx(() => [
                                vue_cjs_prod.createVNode(_component_CardTitle, {
                                  class: "capitalize",
                                  text: _ctx.$t("pages.setting.sections.validate_username.title")
                                }, null, 8, ["text"]),
                                vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                                vue_cjs_prod.createVNode("div", null, [
                                  vue_cjs_prod.createVNode(_component_FormTextInput, {
                                    modelValue: username.value,
                                    "onUpdate:modelValue": ($event) => username.value = $event
                                  }, {
                                    prefix: vue_cjs_prod.withCtx(() => [
                                      vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                    ]),
                                    _: 1
                                  }, 8, ["modelValue", "onUpdate:modelValue"])
                                ])
                              ]),
                              _: 1
                            }),
                            vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                              default: vue_cjs_prod.withCtx(() => [
                                vue_cjs_prod.createVNode("p", null, [
                                  vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                  vue_cjs_prod.createVNode(_component_Anchor, {
                                    class: "underline font-bold capitalize",
                                    text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                    href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                  }, null, 8, ["text"])
                                ]),
                                vue_cjs_prod.createVNode(_component_Button, {
                                  class: "capitalize",
                                  size: "sm",
                                  type: "opposite",
                                  text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                  onClick: validate
                                }, null, 8, ["text"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageSection, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_Alert, {
                    type: "success",
                    title: "This is a page for testing purposes",
                    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  })
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.setting.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, { class: "flex space-x-4" }, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_Card, null, {
                        default: vue_cjs_prod.withCtx(() => [
                          vue_cjs_prod.createVNode(_component_CardContent, null, {
                            default: vue_cjs_prod.withCtx(() => [
                              vue_cjs_prod.createVNode(_component_CardTitle, {
                                class: "capitalize",
                                text: _ctx.$t("pages.setting.sections.validate_username.title")
                              }, null, 8, ["text"]),
                              vue_cjs_prod.createVNode("p", { class: "mb-2" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.description")), 1),
                              vue_cjs_prod.createVNode("div", null, [
                                vue_cjs_prod.createVNode(_component_FormTextInput, {
                                  modelValue: username.value,
                                  "onUpdate:modelValue": ($event) => username.value = $event
                                }, {
                                  prefix: vue_cjs_prod.withCtx(() => [
                                    vue_cjs_prod.createVNode("span", null, "https://github.com/")
                                  ]),
                                  _: 1
                                }, 8, ["modelValue", "onUpdate:modelValue"])
                              ])
                            ]),
                            _: 1
                          }),
                          vue_cjs_prod.createVNode(_component_CardFooter, { class: "justify-between" }, {
                            default: vue_cjs_prod.withCtx(() => [
                              vue_cjs_prod.createVNode("p", null, [
                                vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("pages.setting.sections.validate_username.footer")) + " ", 1),
                                vue_cjs_prod.createVNode(_component_Anchor, {
                                  class: "underline font-bold capitalize",
                                  text: _ctx.$t("pages.setting.sections.validate_username.footer_link"),
                                  href: "https://docs.github.com/en/rest/users/users#get-a-user"
                                }, null, 8, ["text"])
                              ]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "capitalize",
                                size: "sm",
                                type: "opposite",
                                text: _ctx.$t("pages.setting.sections.validate_username.footer_button"),
                                onClick: validate
                              }, null, 8, ["text"])
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/setting.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const setting = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$e
});
const _sfc_main$d = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "test",
  __ssrInlineRender: true,
  setup(__props) {
    const counter = useCounter();
    const identity = useIdentity();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PageWrapper = __nuxt_component_0$3;
      const _component_PageHeader = __nuxt_component_1$2;
      const _component_PageTitle = _sfc_main$G;
      const _component_PageBody = __nuxt_component_3;
      const _component_PageSection = __nuxt_component_4;
      const _component_PageSectionTitle = _sfc_main$q;
      const _component_Button = _sfc_main$E;
      const _component_FormTextInput = _sfc_main$u;
      _push(serverRenderer.exports.ssrRenderComponent(_component_PageWrapper, _attrs, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageHeader, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageTitle, {
                    text: _ctx.$t("pages.test.title"),
                    class: "capitalize"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageTitle, {
                      text: _ctx.$t("pages.test.title"),
                      class: "capitalize"
                    }, null, 8, ["text"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_PageBody, null, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.counter"),
                          class: "capitalize"
                        }, null, _parent4, _scopeId3));
                        _push4(`<div class=""${_scopeId3}><div class="mb-2"${_scopeId3}>Counter : ${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(counter).count)}</div><div class="flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2"${_scopeId3}>`);
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto capitalize",
                          type: "secondary",
                          size: "sm",
                          text: _ctx.$t("pages.test.increment"),
                          onClick: vue_cjs_prod.unref(counter).increment
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto",
                          type: "secondary",
                          size: "sm",
                          text: `${_ctx.$t("pages.test.increment")} 2x`,
                          onClick: vue_cjs_prod.unref(counter).increment2x
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto capitalize",
                          type: "secondary",
                          size: "sm",
                          text: _ctx.$t("pages.test.decrement"),
                          onClick: vue_cjs_prod.unref(counter).decrement
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full lg:w-auto capitalize",
                          type: "secondary",
                          size: "sm",
                          text: _ctx.$t("pages.test.reset"),
                          onClick: vue_cjs_prod.unref(counter).reset
                        }, null, _parent4, _scopeId3));
                        _push4(`</div></div>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                            text: _ctx.$t("pages.test.counter"),
                            class: "capitalize"
                          }, null, 8, ["text"]),
                          vue_cjs_prod.createVNode("div", { class: "" }, [
                            vue_cjs_prod.createVNode("div", { class: "mb-2" }, "Counter : " + vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(counter).count), 1),
                            vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto capitalize",
                                type: "secondary",
                                size: "sm",
                                text: _ctx.$t("pages.test.increment"),
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment, ["prevent"])
                              }, null, 8, ["text", "onClick"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto",
                                type: "secondary",
                                size: "sm",
                                text: `${_ctx.$t("pages.test.increment")} 2x`,
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment2x, ["prevent"])
                              }, null, 8, ["text", "onClick"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto capitalize",
                                type: "secondary",
                                size: "sm",
                                text: _ctx.$t("pages.test.decrement"),
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).decrement, ["prevent"])
                              }, null, 8, ["text", "onClick"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full lg:w-auto capitalize",
                                type: "secondary",
                                size: "sm",
                                text: _ctx.$t("pages.test.reset"),
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).reset, ["prevent"])
                              }, null, 8, ["text", "onClick"])
                            ])
                          ])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.identity"),
                          class: "capitalize"
                        }, null, _parent4, _scopeId3));
                        _push4(`<div class="mb-2"${_scopeId3}><span class="capitalize"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.test.full_name"))} : </span><span${_scopeId3}>${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(identity).fullName)}</span></div><div class=""${_scopeId3}><div class="flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2"${_scopeId3}>`);
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_FormTextInput, {
                          modelValue: vue_cjs_prod.unref(identity).firstName,
                          "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                          size: "sm"
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_FormTextInput, {
                          modelValue: vue_cjs_prod.unref(identity).lastName,
                          "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                          size: "sm"
                        }, null, _parent4, _scopeId3));
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                          class: "w-full capitalize",
                          text: _ctx.$t("pages.test.reset"),
                          type: "secondary",
                          size: "sm",
                          onClick: vue_cjs_prod.unref(identity).reset
                        }, null, _parent4, _scopeId3));
                        _push4(`</div></div>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                            text: _ctx.$t("pages.test.identity"),
                            class: "capitalize"
                          }, null, 8, ["text"]),
                          vue_cjs_prod.createVNode("div", { class: "mb-2" }, [
                            vue_cjs_prod.createVNode("span", { class: "capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.test.full_name")) + " : ", 1),
                            vue_cjs_prod.createVNode("span", null, vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(identity).fullName), 1)
                          ]),
                          vue_cjs_prod.createVNode("div", { class: "" }, [
                            vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                              vue_cjs_prod.createVNode(_component_FormTextInput, {
                                modelValue: vue_cjs_prod.unref(identity).firstName,
                                "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                                size: "sm"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                              vue_cjs_prod.createVNode(_component_FormTextInput, {
                                modelValue: vue_cjs_prod.unref(identity).lastName,
                                "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                                size: "sm"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                              vue_cjs_prod.createVNode(_component_Button, {
                                class: "w-full capitalize",
                                text: _ctx.$t("pages.test.reset"),
                                type: "secondary",
                                size: "sm",
                                onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(identity).reset, ["prevent"])
                              }, null, 8, ["text", "onClick"])
                            ])
                          ])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.counter"),
                          class: "capitalize"
                        }, null, 8, ["text"]),
                        vue_cjs_prod.createVNode("div", { class: "" }, [
                          vue_cjs_prod.createVNode("div", { class: "mb-2" }, "Counter : " + vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(counter).count), 1),
                          vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto capitalize",
                              type: "secondary",
                              size: "sm",
                              text: _ctx.$t("pages.test.increment"),
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment, ["prevent"])
                            }, null, 8, ["text", "onClick"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto",
                              type: "secondary",
                              size: "sm",
                              text: `${_ctx.$t("pages.test.increment")} 2x`,
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment2x, ["prevent"])
                            }, null, 8, ["text", "onClick"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto capitalize",
                              type: "secondary",
                              size: "sm",
                              text: _ctx.$t("pages.test.decrement"),
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).decrement, ["prevent"])
                            }, null, 8, ["text", "onClick"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full lg:w-auto capitalize",
                              type: "secondary",
                              size: "sm",
                              text: _ctx.$t("pages.test.reset"),
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).reset, ["prevent"])
                            }, null, 8, ["text", "onClick"])
                          ])
                        ])
                      ]),
                      _: 1
                    }),
                    vue_cjs_prod.createVNode(_component_PageSection, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                          text: _ctx.$t("pages.test.identity"),
                          class: "capitalize"
                        }, null, 8, ["text"]),
                        vue_cjs_prod.createVNode("div", { class: "mb-2" }, [
                          vue_cjs_prod.createVNode("span", { class: "capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.test.full_name")) + " : ", 1),
                          vue_cjs_prod.createVNode("span", null, vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(identity).fullName), 1)
                        ]),
                        vue_cjs_prod.createVNode("div", { class: "" }, [
                          vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                            vue_cjs_prod.createVNode(_component_FormTextInput, {
                              modelValue: vue_cjs_prod.unref(identity).firstName,
                              "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                              size: "sm"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            vue_cjs_prod.createVNode(_component_FormTextInput, {
                              modelValue: vue_cjs_prod.unref(identity).lastName,
                              "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                              size: "sm"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            vue_cjs_prod.createVNode(_component_Button, {
                              class: "w-full capitalize",
                              text: _ctx.$t("pages.test.reset"),
                              type: "secondary",
                              size: "sm",
                              onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(identity).reset, ["prevent"])
                            }, null, 8, ["text", "onClick"])
                          ])
                        ])
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_PageHeader, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageTitle, {
                    text: _ctx.$t("pages.test.title"),
                    class: "capitalize"
                  }, null, 8, ["text"])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_PageBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                        text: _ctx.$t("pages.test.counter"),
                        class: "capitalize"
                      }, null, 8, ["text"]),
                      vue_cjs_prod.createVNode("div", { class: "" }, [
                        vue_cjs_prod.createVNode("div", { class: "mb-2" }, "Counter : " + vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(counter).count), 1),
                        vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center justify-items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto capitalize",
                            type: "secondary",
                            size: "sm",
                            text: _ctx.$t("pages.test.increment"),
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment, ["prevent"])
                          }, null, 8, ["text", "onClick"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto",
                            type: "secondary",
                            size: "sm",
                            text: `${_ctx.$t("pages.test.increment")} 2x`,
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).increment2x, ["prevent"])
                          }, null, 8, ["text", "onClick"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto capitalize",
                            type: "secondary",
                            size: "sm",
                            text: _ctx.$t("pages.test.decrement"),
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).decrement, ["prevent"])
                          }, null, 8, ["text", "onClick"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full lg:w-auto capitalize",
                            type: "secondary",
                            size: "sm",
                            text: _ctx.$t("pages.test.reset"),
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(counter).reset, ["prevent"])
                          }, null, 8, ["text", "onClick"])
                        ])
                      ])
                    ]),
                    _: 1
                  }),
                  vue_cjs_prod.createVNode(_component_PageSection, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_PageSectionTitle, {
                        text: _ctx.$t("pages.test.identity"),
                        class: "capitalize"
                      }, null, 8, ["text"]),
                      vue_cjs_prod.createVNode("div", { class: "mb-2" }, [
                        vue_cjs_prod.createVNode("span", { class: "capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.test.full_name")) + " : ", 1),
                        vue_cjs_prod.createVNode("span", null, vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(identity).fullName), 1)
                      ]),
                      vue_cjs_prod.createVNode("div", { class: "" }, [
                        vue_cjs_prod.createVNode("div", { class: "flex flex-col items-center space-y-2 lg:space-y-0 lg:flex-row lg:space-x-2" }, [
                          vue_cjs_prod.createVNode(_component_FormTextInput, {
                            modelValue: vue_cjs_prod.unref(identity).firstName,
                            "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).firstName = $event,
                            size: "sm"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          vue_cjs_prod.createVNode(_component_FormTextInput, {
                            modelValue: vue_cjs_prod.unref(identity).lastName,
                            "onUpdate:modelValue": ($event) => vue_cjs_prod.unref(identity).lastName = $event,
                            size: "sm"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          vue_cjs_prod.createVNode(_component_Button, {
                            class: "w-full capitalize",
                            text: _ctx.$t("pages.test.reset"),
                            type: "secondary",
                            size: "sm",
                            onClick: vue_cjs_prod.withModifiers(vue_cjs_prod.unref(identity).reset, ["prevent"])
                          }, null, 8, ["text", "onClick"])
                        ])
                      ])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const test = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$d
});
const __nuxt_component_1$1 = vue_cjs_prod.defineComponent({
  name: "ClientOnly",
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  setup(_, { slots }) {
    const mounted = vue_cjs_prod.ref(false);
    vue_cjs_prod.onMounted(() => {
      mounted.value = true;
    });
    return (props) => {
      var _a2;
      if (mounted.value) {
        return (_a2 = slots.default) == null ? void 0 : _a2.call(slots);
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return slot();
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return vue_cjs_prod.createElementBlock(fallbackTag, null, fallbackStr);
    };
  }
});
const _hoisted_1$b = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 192 512",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$b = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72s-72-32.2-72-72s32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8S24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72s-32.2-72-72-72s-72 32.2-72 72z"
}, null, -1);
const _hoisted_3$b = [
  _hoisted_2$b
];
function render$b(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$b, _hoisted_3$b);
}
const __unplugin_components_3$1 = { name: "fa-solid-ellipsis-v", render: render$b };
const _hoisted_1$a = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$a = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M9.078 3.965c-.588 0-1.177.289-1.514.867L.236 17.433c-.672 1.156.17 2.601 1.514 2.601h5.72a1.676 1.676 0 0 1-.35-2.117l5.547-9.513l-2.076-3.572a1.734 1.734 0 0 0-1.513-.867zm7.407 2.922c-.487 0-.973.236-1.252.709L9.17 17.906c-.557.945.138 2.13 1.251 2.13h12.13c1.114 0 1.81-1.185 1.253-2.13l-6.067-10.31a1.437 1.437 0 0 0-1.252-.71z"
}, null, -1);
const _hoisted_3$a = [
  _hoisted_2$a
];
function render$a(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$a, _hoisted_3$a);
}
const __unplugin_components_2$1 = { name: "simple-icons-nuxtdotjs", render: render$a };
const _hoisted_1$9 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$9 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "m13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29l-4.3 4.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l4.29-4.3l4.29 4.3a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42Z"
}, null, -1);
const _hoisted_3$9 = [
  _hoisted_2$9
];
function render$9(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$9, _hoisted_3$9);
}
const __unplugin_components_1$1 = { name: "uil-times", render: render$9 };
const _hoisted_1$8 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$8 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M3 8h18a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2Zm18 8H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2Zm0-5H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2Z"
}, null, -1);
const _hoisted_3$8 = [
  _hoisted_2$8
];
function render$8(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$8, _hoisted_3$8);
}
const __unplugin_components_0$5 = { name: "uil-bars", render: render$8 };
const _sfc_main$c = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Navbar",
  __ssrInlineRender: true,
  setup(__props) {
    const app2 = useState("app");
    const navbar = vue_cjs_prod.ref(null);
    const showDrawer = useState("navbar.showDrawer", () => false);
    const showOptions = useState("navbar.showOptions", () => false);
    vue_cjs_prod.onMounted(() => {
      if (!navbar.value)
        return;
      const { onScroll } = useSticky(navbar.value, 0);
      setTimeout(() => onScroll(), 50);
    });
    const toggleDrawer = () => showDrawer.value = !showDrawer.value;
    const toggleOptions = (show) => {
      if (show) {
        showOptions.value = show;
      } else {
        showOptions.value = !showOptions.value;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_IconUil58bars = __unplugin_components_0$5;
      const _component_IconUil58times = __unplugin_components_1$1;
      const _component_NuxtLink = __nuxt_component_0$4;
      const _component_IconSimpleIcons58nuxtdotjs = __unplugin_components_2$1;
      const _component_icon_fa_solid58ellipsis_v = __unplugin_components_3$1;
      const _component_ClientOnly = __nuxt_component_1$1;
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({
        ref_key: "navbar",
        ref: navbar,
        class: "backdrop-filter backdrop-blur-md top-0 z-40 w-full flex-none transition-colors duration-300 lg:z-50 border-b border-gray-900/10 dark:border-gray-50/[0.2] bg-white/[0.5] dark:bg-slate-900/[0.5]"
      }, _attrs))}><div id="navbar-banner" class="banner">`);
      serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "banner", {}, null, _push, _parent);
      _push(`</div><div class="max-w-8xl w-full mx-auto"><div class="py-3 lg:px-8 mx-4 lg:mx-0"><div class="relative flex items-center">`);
      if (_ctx.$slots["drawer"]) {
        _push(`<div class="lg:hidden flex items-center self-center justify-center mr-2"><button class="flex items-center focus:outline-none" aria-label="Toggle Drawer Menu"><span class="flex items-center text-gray-600 dark:text-gray-300 text-lg" aria-hidden="true">`);
        if (!vue_cjs_prod.unref(showDrawer)) {
          _push(serverRenderer.exports.ssrRenderComponent(_component_IconUil58bars, null, null, _parent));
        } else {
          _push(serverRenderer.exports.ssrRenderComponent(_component_IconUil58times, null, null, _parent));
        }
        _push(`</span></button></div>`);
      } else {
        _push(`<!---->`);
      }
      serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "title", {}, () => {
        _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtLink, {
          tag: "a",
          class: "mr-3 flex-none overflow-hidden md:w-auto text-md font-bold text-gray-900 dark:text-gray-200",
          to: { name: "index" }
        }, {
          default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="sr-only"${_scopeId}>home</span><span class="flex items-center"${_scopeId}>`);
              _push2(serverRenderer.exports.ssrRenderComponent(_component_IconSimpleIcons58nuxtdotjs, { class: "inline-block mr-2 text-lg text-green-600" }, null, _parent2, _scopeId));
              _push2(` ${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(app2).name)}</span>`);
            } else {
              return [
                vue_cjs_prod.createVNode("span", { class: "sr-only" }, "home"),
                vue_cjs_prod.createVNode("span", { class: "flex items-center" }, [
                  vue_cjs_prod.createVNode(_component_IconSimpleIcons58nuxtdotjs, { class: "inline-block mr-2 text-lg text-green-600" }),
                  vue_cjs_prod.createTextVNode(" " + vue_cjs_prod.toDisplayString(vue_cjs_prod.unref(app2).name), 1)
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
      }, _push, _parent);
      serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "menu", {}, null, _push, _parent);
      if (_ctx.$slots["options"]) {
        _push(`<div class="flex-1 flex justify-end lg:hidden"><button class="flex items-center focus:outline-none" aria-label="Toggle Options Menu"><span class="flex items-center text-gray-600 dark:text-gray-300 text-sm" aria-hidden="true">`);
        _push(serverRenderer.exports.ssrRenderComponent(_component_icon_fa_solid58ellipsis_v, null, null, _parent));
        _push(`</span></button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
      _push(serverRenderer.exports.ssrRenderComponent(_component_ClientOnly, null, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            serverRenderer.exports.ssrRenderTeleport(_push2, (_push3) => {
              if (vue_cjs_prod.unref(showDrawer) && _ctx.$slots["drawer"]) {
                _push3(`<div class="fixed lg:hidden bg-gray-100 dark:bg-slate-800 pt-12 top-0 left-0 w-screen h-screen z-30 flex flex-col"${_scopeId}><div class="flex-1 flex flex-col relative overflow-y-auto"${_scopeId}>`);
                serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "drawer", { toggleDrawer }, null, _push3, _parent2, _scopeId);
                _push3(`</div></div>`);
              } else {
                _push3(`<!---->`);
              }
              if (vue_cjs_prod.unref(showOptions) && _ctx.$slots["options"]) {
                _push3(`<div${_scopeId}>`);
                serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "options", {
                  toggleOptions,
                  showOptions: vue_cjs_prod.unref(showOptions)
                }, null, _push3, _parent2, _scopeId);
                _push3(`</div>`);
              } else {
                _push3(`<!---->`);
              }
            }, "#app-after", false, _parent2);
          } else {
            return [
              (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.Teleport, { to: "#app-after" }, [
                vue_cjs_prod.createVNode(vue_cjs_prod.Transition, {
                  name: "slide-fade-from-up",
                  mode: "out-in"
                }, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.unref(showDrawer) && _ctx.$slots["drawer"] ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("div", {
                      key: 0,
                      class: "fixed lg:hidden bg-gray-100 dark:bg-slate-800 pt-12 top-0 left-0 w-screen h-screen z-30 flex flex-col"
                    }, [
                      vue_cjs_prod.createVNode("div", { class: "flex-1 flex flex-col relative overflow-y-auto" }, [
                        vue_cjs_prod.renderSlot(_ctx.$slots, "drawer", { toggleDrawer })
                      ])
                    ])) : vue_cjs_prod.createCommentVNode("", true)
                  ]),
                  _: 3
                }),
                vue_cjs_prod.unref(showOptions) && _ctx.$slots["options"] ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("div", { key: 0 }, [
                  vue_cjs_prod.renderSlot(_ctx.$slots, "options", {
                    toggleOptions,
                    showOptions: vue_cjs_prod.unref(showOptions)
                  })
                ])) : vue_cjs_prod.createCommentVNode("", true)
              ]))
            ];
          }
        }),
        _: 3
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Builder/Navbar.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const _hoisted_1$7 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$7 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M4 4v18h6v6h18V10h-6V4zm2 2h14v4.563L10.562 20H6zm5 2v1H8v2h4.938c-.13 1.148-.481 2.055-1.063 2.688a4.544 4.544 0 0 1-.906-.407C10.266 12.863 10 12.418 10 12H8c0 1.191.734 2.184 1.719 2.844A8.267 8.267 0 0 1 8 15v2c1.773 0 3.25-.406 4.375-1.156c.523.09 1.055.156 1.625.156v-1.875c.543-.91.832-1.973.938-3.125H16V9h-3V8zm10.438 4H26v14H12v-4.563zM20 13.844l-.938 2.844l-2 6l-.062.156V24h2v-.875l.031-.125h1.938l.031.125V24h2v-1.156l-.063-.157l-2-6zm0 6.281l.281.875h-.562z"
}, null, -1);
const _hoisted_3$7 = [
  _hoisted_2$7
];
function render$7(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$7, _hoisted_3$7);
}
const __unplugin_components_0$4 = { name: "la-language", render: render$7 };
const _sfc_main$b = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "LanguageSwitcher",
  __ssrInlineRender: true,
  props: {
    type: {
      type: String,
      default: "dropdown-right-top"
    }
  },
  setup(__props) {
    const props = __props;
    const currentStyle = vue_cjs_prod.toRef(props, "type");
    const localeSetting = useState("locale.setting");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_IconLa58language = __unplugin_components_0$4;
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "flex items-center" }, _attrs))}>`);
      if (vue_cjs_prod.unref(currentStyle) === "dropdown-right-top") {
        _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Ia), {
          modelValue: vue_cjs_prod.unref(localeSetting),
          "onUpdate:modelValue": ($event) => vue_cjs_prod.isRef(localeSetting) ? localeSetting.value = $event : null,
          as: "div",
          class: "relative flex items-center"
        }, {
          default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Pa), { class: "sr-only" }, {
                default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Theme`);
                  } else {
                    return [
                      vue_cjs_prod.createTextVNode("Theme")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Da), {
                type: "button",
                title: "Change Language",
                class: "transition-colors duration-300"
              }, {
                default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<span class="justify-center items-center flex"${_scopeId2}>`);
                    _push3(serverRenderer.exports.ssrRenderComponent(_component_IconLa58language, null, null, _parent3, _scopeId2));
                    _push3(`</span>`);
                  } else {
                    return [
                      vue_cjs_prod.createVNode("span", { class: "justify-center items-center flex" }, [
                        vue_cjs_prod.createVNode(_component_IconLa58language)
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(wa), { class: "p-1 absolute z-50 top-full right-0 outline-none bg-white rounded-lg ring-1 ring-gray-900/10 shadow-lg overflow-hidden w-36 py-1 text-sm text-gray-700 font-semibold dark:bg-gray-800 dark:ring-0 dark:highlight-white/5 dark:text-gray-300" }, {
                default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<!--[-->`);
                    serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(availableLocales), (lang) => {
                      _push3(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(La), {
                        key: lang.iso,
                        value: lang.iso,
                        class: {
                          "py-2 px-2 flex items-center cursor-pointer": true,
                          "text-sky-500 bg-gray-100 dark:bg-gray-600/30": vue_cjs_prod.unref(localeSetting) === lang.iso,
                          "hover:bg-gray-50 dark:hover:bg-gray-700/30": vue_cjs_prod.unref(localeSetting) !== lang.iso
                        }
                      }, {
                        default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`<span class="text-sm mr-2"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(lang.flag)}</span><span class="flex-1 truncate"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(lang.name)} <span class="text-xs"${_scopeId3}>(${serverRenderer.exports.ssrInterpolate(lang.iso)})</span></span>`);
                          } else {
                            return [
                              vue_cjs_prod.createVNode("span", { class: "text-sm mr-2" }, vue_cjs_prod.toDisplayString(lang.flag), 1),
                              vue_cjs_prod.createVNode("span", { class: "flex-1 truncate" }, [
                                vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(lang.name) + " ", 1),
                                vue_cjs_prod.createVNode("span", { class: "text-xs" }, "(" + vue_cjs_prod.toDisplayString(lang.iso) + ")", 1)
                              ])
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    });
                    _push3(`<!--]-->`);
                  } else {
                    return [
                      (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(availableLocales), (lang) => {
                        return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.unref(La), {
                          key: lang.iso,
                          value: lang.iso,
                          class: {
                            "py-2 px-2 flex items-center cursor-pointer": true,
                            "text-sky-500 bg-gray-100 dark:bg-gray-600/30": vue_cjs_prod.unref(localeSetting) === lang.iso,
                            "hover:bg-gray-50 dark:hover:bg-gray-700/30": vue_cjs_prod.unref(localeSetting) !== lang.iso
                          }
                        }, {
                          default: vue_cjs_prod.withCtx(() => [
                            vue_cjs_prod.createVNode("span", { class: "text-sm mr-2" }, vue_cjs_prod.toDisplayString(lang.flag), 1),
                            vue_cjs_prod.createVNode("span", { class: "flex-1 truncate" }, [
                              vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(lang.name) + " ", 1),
                              vue_cjs_prod.createVNode("span", { class: "text-xs" }, "(" + vue_cjs_prod.toDisplayString(lang.iso) + ")", 1)
                            ])
                          ]),
                          _: 2
                        }, 1032, ["value", "class"]);
                      }), 128))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                vue_cjs_prod.createVNode(vue_cjs_prod.unref(Pa), { class: "sr-only" }, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createTextVNode("Theme")
                  ]),
                  _: 1
                }),
                vue_cjs_prod.createVNode(vue_cjs_prod.unref(Da), {
                  type: "button",
                  title: "Change Language",
                  class: "transition-colors duration-300"
                }, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createVNode("span", { class: "justify-center items-center flex" }, [
                      vue_cjs_prod.createVNode(_component_IconLa58language)
                    ])
                  ]),
                  _: 1
                }),
                vue_cjs_prod.createVNode(vue_cjs_prod.unref(wa), { class: "p-1 absolute z-50 top-full right-0 outline-none bg-white rounded-lg ring-1 ring-gray-900/10 shadow-lg overflow-hidden w-36 py-1 text-sm text-gray-700 font-semibold dark:bg-gray-800 dark:ring-0 dark:highlight-white/5 dark:text-gray-300" }, {
                  default: vue_cjs_prod.withCtx(() => [
                    (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(availableLocales), (lang) => {
                      return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.unref(La), {
                        key: lang.iso,
                        value: lang.iso,
                        class: {
                          "py-2 px-2 flex items-center cursor-pointer": true,
                          "text-sky-500 bg-gray-100 dark:bg-gray-600/30": vue_cjs_prod.unref(localeSetting) === lang.iso,
                          "hover:bg-gray-50 dark:hover:bg-gray-700/30": vue_cjs_prod.unref(localeSetting) !== lang.iso
                        }
                      }, {
                        default: vue_cjs_prod.withCtx(() => [
                          vue_cjs_prod.createVNode("span", { class: "text-sm mr-2" }, vue_cjs_prod.toDisplayString(lang.flag), 1),
                          vue_cjs_prod.createVNode("span", { class: "flex-1 truncate" }, [
                            vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(lang.name) + " ", 1),
                            vue_cjs_prod.createVNode("span", { class: "text-xs" }, "(" + vue_cjs_prod.toDisplayString(lang.iso) + ")", 1)
                          ])
                        ]),
                        _: 2
                      }, 1032, ["value", "class"]);
                    }), 128))
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (vue_cjs_prod.unref(currentStyle) === "select-box") {
        _push(`<select class="w-full px-2 pr-3 py-1 outline-none rounded border bg-transparent text-gray-700 dark:text-gray-300 border-gray-900/10 dark:border-gray-50/[0.2]"><!--[-->`);
        serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(availableLocales), (lang) => {
          _push(`<option${serverRenderer.exports.ssrRenderAttr("value", lang.iso)} class="flex items-center space-x-2">${serverRenderer.exports.ssrInterpolate(lang.flag)} ${serverRenderer.exports.ssrInterpolate(lang.name)} (${serverRenderer.exports.ssrInterpolate(lang.iso)}) </option>`);
        });
        _push(`<!--]--></select>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/LanguageSwitcher.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const _hoisted_1$6 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$6 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M15.098 12.634L13 11.423V7a1 1 0 0 0-2 0v5a1 1 0 0 0 .5.866l2.598 1.5a1 1 0 1 0 1-1.732ZM12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8a8.01 8.01 0 0 1-8 8Z"
}, null, -1);
const _hoisted_3$6 = [
  _hoisted_2$6
];
function render$6(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$6, _hoisted_3$6);
}
const __unplugin_components_3 = { name: "uil-clock", render: render$6 };
const _hoisted_1$5 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$5 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M21 14h-1V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v7H3a1 1 0 0 0-1 1v2a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-2a1 1 0 0 0-1-1ZM6 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7H6Zm14 10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1h16Z"
}, null, -1);
const _hoisted_3$5 = [
  _hoisted_2$5
];
function render$5(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$5, _hoisted_3$5);
}
const __unplugin_components_2 = { name: "uil-laptop", render: render$5 };
const _hoisted_1$4 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$4 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M21.64 13a1 1 0 0 0-1.05-.14a8.05 8.05 0 0 1-3.37.73a8.15 8.15 0 0 1-8.14-8.1a8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69a1 1 0 0 0-.36-1.05Zm-9.5 6.69A8.14 8.14 0 0 1 7.08 5.22v.27a10.15 10.15 0 0 0 10.14 10.14a9.79 9.79 0 0 0 2.1-.22a8.11 8.11 0 0 1-7.18 4.32Z"
}, null, -1);
const _hoisted_3$4 = [
  _hoisted_2$4
];
function render$4(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$4, _hoisted_3$4);
}
const __unplugin_components_1 = { name: "uil-moon", render: render$4 };
const _hoisted_1$3 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$3 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "m5.64 17l-.71.71a1 1 0 0 0 0 1.41a1 1 0 0 0 1.41 0l.71-.71A1 1 0 0 0 5.64 17ZM5 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1Zm7-7a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1ZM5.64 7.05a1 1 0 0 0 .7.29a1 1 0 0 0 .71-.29a1 1 0 0 0 0-1.41l-.71-.71a1 1 0 0 0-1.41 1.41Zm12 .29a1 1 0 0 0 .7-.29l.71-.71a1 1 0 1 0-1.41-1.41l-.64.71a1 1 0 0 0 0 1.41a1 1 0 0 0 .66.29ZM21 11h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2Zm-9 8a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Zm6.36-2A1 1 0 0 0 17 18.36l.71.71a1 1 0 0 0 1.41 0a1 1 0 0 0 0-1.41ZM12 6.5a5.5 5.5 0 1 0 5.5 5.5A5.51 5.51 0 0 0 12 6.5Zm0 9a3.5 3.5 0 1 1 3.5-3.5a3.5 3.5 0 0 1-3.5 3.5Z"
}, null, -1);
const _hoisted_3$3 = [
  _hoisted_2$3
];
function render$3(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$3, _hoisted_3$3);
}
const __unplugin_components_0$3 = { name: "uil-sun", render: render$3 };
const _sfc_main$a = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "ThemeSwitcher",
  __ssrInlineRender: true,
  props: {
    type: {
      type: String,
      default: "dropdown-right-top"
    }
  },
  setup(__props) {
    const props = __props;
    const themeSetting = useState("theme.setting");
    const currentStyle = vue_cjs_prod.toRef(props, "type");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_IconUil58sun = __unplugin_components_0$3;
      const _component_IconUil58moon = __unplugin_components_1;
      const _component_IconUil58laptop = __unplugin_components_2;
      const _component_IconUil58clock = __unplugin_components_3;
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "flex items-center" }, _attrs))}>`);
      if (vue_cjs_prod.unref(currentStyle) === "dropdown-right-top") {
        _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Ia), {
          modelValue: vue_cjs_prod.unref(themeSetting),
          "onUpdate:modelValue": ($event) => vue_cjs_prod.isRef(themeSetting) ? themeSetting.value = $event : null,
          as: "div",
          class: "relative flex items-center"
        }, {
          default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Pa), { class: "sr-only" }, {
                default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`${serverRenderer.exports.ssrInterpolate(_ctx.$t("components.theme_switcher.theme"))}`);
                  } else {
                    return [
                      vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.theme")), 1)
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Da), {
                type: "button",
                title: _ctx.$t("components.theme_switcher.change_theme"),
                class: "transition-colors duration-300"
              }, {
                default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<span class="flex justify-center items-center dark:hidden"${_scopeId2}>`);
                    _push3(serverRenderer.exports.ssrRenderComponent(_component_IconUil58sun, null, null, _parent3, _scopeId2));
                    _push3(`</span><span class="justify-center items-center hidden dark:flex"${_scopeId2}>`);
                    _push3(serverRenderer.exports.ssrRenderComponent(_component_IconUil58moon, null, null, _parent3, _scopeId2));
                    _push3(`</span>`);
                  } else {
                    return [
                      vue_cjs_prod.createVNode("span", { class: "flex justify-center items-center dark:hidden" }, [
                        vue_cjs_prod.createVNode(_component_IconUil58sun)
                      ]),
                      vue_cjs_prod.createVNode("span", { class: "justify-center items-center hidden dark:flex" }, [
                        vue_cjs_prod.createVNode(_component_IconUil58moon)
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(wa), { class: "p-1 absolute z-50 top-full right-0 outline-none bg-white rounded-lg ring-1 ring-gray-900/10 shadow-lg overflow-hidden w-36 py-1 text-sm text-gray-700 font-semibold dark:bg-gray-800 dark:ring-0 dark:highlight-white/5 dark:text-gray-300" }, {
                default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<!--[-->`);
                    serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(availableThemes), (theme) => {
                      _push3(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(La), {
                        key: theme.key,
                        value: theme.key,
                        class: {
                          "py-2 px-2 flex items-center cursor-pointer": true,
                          "text-sky-500 bg-gray-100 dark:bg-gray-600/30": vue_cjs_prod.unref(themeSetting) === theme.key,
                          "hover:bg-gray-50 dark:hover:bg-gray-700/30": vue_cjs_prod.unref(themeSetting) !== theme.key
                        }
                      }, {
                        default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`<span class="text-sm mr-2 flex items-center"${_scopeId3}>`);
                            if (theme.key === "light") {
                              _push4(serverRenderer.exports.ssrRenderComponent(_component_IconUil58sun, null, null, _parent4, _scopeId3));
                            } else if (theme.key === "dark") {
                              _push4(serverRenderer.exports.ssrRenderComponent(_component_IconUil58moon, null, null, _parent4, _scopeId3));
                            } else if (theme.key === "system") {
                              _push4(serverRenderer.exports.ssrRenderComponent(_component_IconUil58laptop, null, null, _parent4, _scopeId3));
                            } else if (theme.key === "realtime") {
                              _push4(serverRenderer.exports.ssrRenderComponent(_component_IconUil58clock, null, null, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                            _push4(`</span> ${serverRenderer.exports.ssrInterpolate(theme.text)}`);
                          } else {
                            return [
                              vue_cjs_prod.createVNode("span", { class: "text-sm mr-2 flex items-center" }, [
                                theme.key === "light" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58sun, { key: 0 })) : theme.key === "dark" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58moon, { key: 1 })) : theme.key === "system" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58laptop, { key: 2 })) : theme.key === "realtime" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58clock, { key: 3 })) : vue_cjs_prod.createCommentVNode("", true)
                              ]),
                              vue_cjs_prod.createTextVNode(" " + vue_cjs_prod.toDisplayString(theme.text), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    });
                    _push3(`<!--]-->`);
                  } else {
                    return [
                      (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(availableThemes), (theme) => {
                        return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.unref(La), {
                          key: theme.key,
                          value: theme.key,
                          class: {
                            "py-2 px-2 flex items-center cursor-pointer": true,
                            "text-sky-500 bg-gray-100 dark:bg-gray-600/30": vue_cjs_prod.unref(themeSetting) === theme.key,
                            "hover:bg-gray-50 dark:hover:bg-gray-700/30": vue_cjs_prod.unref(themeSetting) !== theme.key
                          }
                        }, {
                          default: vue_cjs_prod.withCtx(() => [
                            vue_cjs_prod.createVNode("span", { class: "text-sm mr-2 flex items-center" }, [
                              theme.key === "light" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58sun, { key: 0 })) : theme.key === "dark" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58moon, { key: 1 })) : theme.key === "system" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58laptop, { key: 2 })) : theme.key === "realtime" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58clock, { key: 3 })) : vue_cjs_prod.createCommentVNode("", true)
                            ]),
                            vue_cjs_prod.createTextVNode(" " + vue_cjs_prod.toDisplayString(theme.text), 1)
                          ]),
                          _: 2
                        }, 1032, ["value", "class"]);
                      }), 128))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                vue_cjs_prod.createVNode(vue_cjs_prod.unref(Pa), { class: "sr-only" }, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.theme")), 1)
                  ]),
                  _: 1
                }),
                vue_cjs_prod.createVNode(vue_cjs_prod.unref(Da), {
                  type: "button",
                  title: _ctx.$t("components.theme_switcher.change_theme"),
                  class: "transition-colors duration-300"
                }, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createVNode("span", { class: "flex justify-center items-center dark:hidden" }, [
                      vue_cjs_prod.createVNode(_component_IconUil58sun)
                    ]),
                    vue_cjs_prod.createVNode("span", { class: "justify-center items-center hidden dark:flex" }, [
                      vue_cjs_prod.createVNode(_component_IconUil58moon)
                    ])
                  ]),
                  _: 1
                }, 8, ["title"]),
                vue_cjs_prod.createVNode(vue_cjs_prod.unref(wa), { class: "p-1 absolute z-50 top-full right-0 outline-none bg-white rounded-lg ring-1 ring-gray-900/10 shadow-lg overflow-hidden w-36 py-1 text-sm text-gray-700 font-semibold dark:bg-gray-800 dark:ring-0 dark:highlight-white/5 dark:text-gray-300" }, {
                  default: vue_cjs_prod.withCtx(() => [
                    (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(availableThemes), (theme) => {
                      return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(vue_cjs_prod.unref(La), {
                        key: theme.key,
                        value: theme.key,
                        class: {
                          "py-2 px-2 flex items-center cursor-pointer": true,
                          "text-sky-500 bg-gray-100 dark:bg-gray-600/30": vue_cjs_prod.unref(themeSetting) === theme.key,
                          "hover:bg-gray-50 dark:hover:bg-gray-700/30": vue_cjs_prod.unref(themeSetting) !== theme.key
                        }
                      }, {
                        default: vue_cjs_prod.withCtx(() => [
                          vue_cjs_prod.createVNode("span", { class: "text-sm mr-2 flex items-center" }, [
                            theme.key === "light" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58sun, { key: 0 })) : theme.key === "dark" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58moon, { key: 1 })) : theme.key === "system" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58laptop, { key: 2 })) : theme.key === "realtime" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_IconUil58clock, { key: 3 })) : vue_cjs_prod.createCommentVNode("", true)
                          ]),
                          vue_cjs_prod.createTextVNode(" " + vue_cjs_prod.toDisplayString(theme.text), 1)
                        ]),
                        _: 2
                      }, 1032, ["value", "class"]);
                    }), 128))
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (vue_cjs_prod.unref(currentStyle) === "select-box") {
        _push(`<select class="w-full px-2 pr-3 py-1 outline-none rounded border bg-transparent text-gray-700 dark:text-gray-300 border-gray-900/10 dark:border-gray-50/[0.2]"><!--[-->`);
        serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(availableThemes), (theme) => {
          _push(`<option${serverRenderer.exports.ssrRenderAttr("value", theme.key)}>${serverRenderer.exports.ssrInterpolate(theme.text)}</option>`);
        });
        _push(`<!--]--></select>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ThemeSwitcher.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const _sfc_main$9 = {};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "fixed bg-black opacity-70 z-50 top-0 left-0 w-screen h-screen" }, _attrs))}></div>`);
}
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ActionSheet/Overlay.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["ssrRender", _sfc_ssrRender$5]]);
const _sfc_main$8 = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  emits: ["onClose"],
  setup(__props, { emit }) {
    const show = vue_cjs_prod.ref(false);
    const close = () => {
      show.value = false;
      setTimeout(() => emit("onClose"), 100);
    };
    vue_cjs_prod.onMounted(() => {
      setTimeout(() => show.value = true, 100);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ActionSheetOverlay = __nuxt_component_0$1;
      serverRenderer.exports.ssrRenderTeleport(_push, (_push2) => {
        _push2(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Yn), {
          show: show.value,
          appear: ""
        }, {
          default: vue_cjs_prod.withCtx((_, _push3, _parent2, _scopeId) => {
            if (_push3) {
              _push3(`<div${_scopeId}>`);
              _push3(serverRenderer.exports.ssrRenderComponent(_component_ActionSheetOverlay, { onClick: close }, null, _parent2, _scopeId));
              _push3(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(Qn), {
                as: "template",
                enter: "duration-300 ease-out",
                "enter-from": "opacity-0",
                "enter-to": "opacity-100",
                leave: "duration-300 ease-in",
                "leave-from": "opacity-100",
                "leave-to": "opacity-0"
              }, {
                default: vue_cjs_prod.withCtx((_2, _push4, _parent3, _scopeId2) => {
                  if (_push4) {
                    _push4(`<div class="fixed bottom-0 w-screen z-50 flex" style="${serverRenderer.exports.ssrRenderStyle({ "max-height": "66.666667%" })}"${_scopeId2}><div class="relative max-w-8xl px-4 pb-4 w-full mx-auto flex flex-col flex-1 space-y-1 overflow-y-auto justify-end"${_scopeId2}>`);
                    serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push4, _parent3, _scopeId2);
                    _push4(`</div></div>`);
                  } else {
                    return [
                      vue_cjs_prod.createVNode("div", {
                        class: "fixed bottom-0 w-screen z-50 flex",
                        style: { "max-height": "66.666667%" }
                      }, [
                        vue_cjs_prod.createVNode("div", { class: "relative max-w-8xl px-4 pb-4 w-full mx-auto flex flex-col flex-1 space-y-1 overflow-y-auto justify-end" }, [
                          vue_cjs_prod.renderSlot(_ctx.$slots, "default")
                        ])
                      ])
                    ];
                  }
                }),
                _: 3
              }, _parent2, _scopeId));
              _push3(`</div>`);
            } else {
              return [
                vue_cjs_prod.createVNode("div", null, [
                  vue_cjs_prod.createVNode(_component_ActionSheetOverlay, { onClick: close }),
                  vue_cjs_prod.createVNode(vue_cjs_prod.unref(Qn), {
                    as: "template",
                    enter: "duration-300 ease-out",
                    "enter-from": "opacity-0",
                    "enter-to": "opacity-100",
                    leave: "duration-300 ease-in",
                    "leave-from": "opacity-100",
                    "leave-to": "opacity-0"
                  }, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode("div", {
                        class: "fixed bottom-0 w-screen z-50 flex",
                        style: { "max-height": "66.666667%" }
                      }, [
                        vue_cjs_prod.createVNode("div", { class: "relative max-w-8xl px-4 pb-4 w-full mx-auto flex flex-col flex-1 space-y-1 overflow-y-auto justify-end" }, [
                          vue_cjs_prod.renderSlot(_ctx.$slots, "default")
                        ])
                      ])
                    ]),
                    _: 3
                  })
                ])
              ];
            }
          }),
          _: 3
        }, _parent));
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ActionSheet/index.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const _sfc_main$7 = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "bg-gray-100/[0.8] dark:bg-slate-800/[0.8] backdrop-blur supports-backdrop-blur:bg-white/60 p-4 rounded overflow-y-auto" }, _attrs))}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ActionSheet/Body.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["ssrRender", _sfc_ssrRender$4]]);
const _sfc_main$6 = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Header",
  __ssrInlineRender: true,
  props: {
    text: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "text-xs font-bold text-center mb-2" }, _attrs))}>`);
      serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
        _push(`${serverRenderer.exports.ssrInterpolate(__props.text)}`);
      }, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ActionSheet/Header.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _hoisted_1$2 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$2 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  d: "M20.38 8.53c.16-.4.68-1.99-.17-4.14c0 0-1.31-.39-4.3 1.61c-1.25-.33-2.58-.38-3.91-.38c-1.32 0-2.66.05-3.91.38c-2.99-2.03-4.3-1.61-4.3-1.61c-.85 2.15-.33 3.74-.16 4.14C2.61 9.62 2 11 2 12.72c0 6.44 4.16 7.89 10 7.89c5.79 0 10-1.45 10-7.89c0-1.72-.61-3.1-1.62-4.19M12 19.38c-4.12 0-7.47-.19-7.47-4.19c0-.95.47-1.85 1.27-2.58c1.34-1.23 3.63-.58 6.2-.58c2.59 0 4.85-.65 6.2.58c.8.73 1.3 1.62 1.3 2.58c0 3.99-3.37 4.19-7.5 4.19m-3.14-6.26c-.82 0-1.5 1-1.5 2.22c0 1.23.68 2.24 1.5 2.24c.83 0 1.5-1 1.5-2.24c0-1.23-.67-2.22-1.5-2.22m6.28 0c-.83 0-1.5.99-1.5 2.22c0 1.24.67 2.24 1.5 2.24c.82 0 1.5-1 1.5-2.24c0-1.23-.64-2.22-1.5-2.22z",
  fill: "currentColor"
}, null, -1);
const _hoisted_3$2 = [
  _hoisted_2$2
];
function render$2(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$2, _hoisted_3$2);
}
const __unplugin_components_0$2 = { name: "mdi-github-face", render: render$2 };
const _hoisted_1$1 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2$1 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M17 9.17a1 1 0 0 0-1.41 0L12 12.71L8.46 9.17a1 1 0 0 0-1.41 0a1 1 0 0 0 0 1.42l4.24 4.24a1 1 0 0 0 1.42 0L17 10.59a1 1 0 0 0 0-1.42Z"
}, null, -1);
const _hoisted_3$1 = [
  _hoisted_2$1
];
function render$1(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1$1, _hoisted_3$1);
}
const __unplugin_components_0$1 = { name: "uil-angle-down", render: render$1 };
const _sfc_main$5 = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  const _component_BuilderNavbar = _sfc_main$c;
  const _component_IconUil58angle_down = __unplugin_components_0$1;
  const _component_LanguageSwitcher = _sfc_main$b;
  const _component_ThemeSwitcher = _sfc_main$a;
  const _component_Anchor = _sfc_main$s;
  const _component_IconMdi58github_face = __unplugin_components_0$2;
  const _component_ActionSheet = _sfc_main$8;
  const _component_ActionSheetBody = __nuxt_component_6;
  const _component_ActionSheetHeader = _sfc_main$6;
  const _component_Button = _sfc_main$E;
  _push(serverRenderer.exports.ssrRenderComponent(_component_BuilderNavbar, _attrs, {
    menu: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`<div class="relative hidden lg:flex items-center ml-auto"${_scopeId}><div class="flex items-center justify-center"${_scopeId}><img class="w-6 h-6 rounded-full" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=634&amp;q=80" alt="Avatar of Jonathan Reinink"${_scopeId}><span class="ml-2 text-sm font-semibold"${_scopeId}>Alfian</span>`);
        _push2(serverRenderer.exports.ssrRenderComponent(_component_IconUil58angle_down, null, null, _parent2, _scopeId));
        _push2(`</div><div class="flex space-x-4 border-l ml-6 pl-6 border-gray-900/10 dark:border-gray-50/[0.2]"${_scopeId}>`);
        _push2(serverRenderer.exports.ssrRenderComponent(_component_LanguageSwitcher, null, null, _parent2, _scopeId));
        _push2(serverRenderer.exports.ssrRenderComponent(_component_ThemeSwitcher, null, null, _parent2, _scopeId));
        _push2(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
          class: "hover:no-underline hover:text-slate-900 hover:dark:text-white text-lg flex self-center items-center",
          href: "https://github.com/viandwi24/nuxt3-awesome-starter",
          title: "Github"
        }, {
          default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(serverRenderer.exports.ssrRenderComponent(_component_IconMdi58github_face, null, null, _parent3, _scopeId2));
            } else {
              return [
                vue_cjs_prod.createVNode(_component_IconMdi58github_face)
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(`</div></div>`);
      } else {
        return [
          vue_cjs_prod.createVNode("div", { class: "relative hidden lg:flex items-center ml-auto" }, [
            vue_cjs_prod.createVNode("div", { class: "flex items-center justify-center" }, [
              vue_cjs_prod.createVNode("img", {
                class: "w-6 h-6 rounded-full",
                src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80",
                alt: "Avatar of Jonathan Reinink"
              }),
              vue_cjs_prod.createVNode("span", { class: "ml-2 text-sm font-semibold" }, "Alfian"),
              vue_cjs_prod.createVNode(_component_IconUil58angle_down)
            ]),
            vue_cjs_prod.createVNode("div", { class: "flex space-x-4 border-l ml-6 pl-6 border-gray-900/10 dark:border-gray-50/[0.2]" }, [
              vue_cjs_prod.createVNode(_component_LanguageSwitcher),
              vue_cjs_prod.createVNode(_component_ThemeSwitcher),
              vue_cjs_prod.createVNode(_component_Anchor, {
                class: "hover:no-underline hover:text-slate-900 hover:dark:text-white text-lg flex self-center items-center",
                href: "https://github.com/viandwi24/nuxt3-awesome-starter",
                title: "Github"
              }, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_IconMdi58github_face)
                ]),
                _: 1
              })
            ])
          ])
        ];
      }
    }),
    options: vue_cjs_prod.withCtx(({ toggleOptions }, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(serverRenderer.exports.ssrRenderComponent(_component_ActionSheet, {
          onOnClose: ($event) => toggleOptions(false)
        }, {
          default: vue_cjs_prod.withCtx((_, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(serverRenderer.exports.ssrRenderComponent(_component_ActionSheetBody, null, {
                default: vue_cjs_prod.withCtx((_2, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(serverRenderer.exports.ssrRenderComponent(_component_ActionSheetHeader, { text: "Menu" }, null, _parent4, _scopeId3));
                    _push4(`<div class="mt-6 text-sm font-bold capitalize"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("components.theme_switcher.change_theme"))}</div><div class="mt-2"${_scopeId3}>`);
                    _push4(serverRenderer.exports.ssrRenderComponent(_component_ThemeSwitcher, { type: "select-box" }, null, _parent4, _scopeId3));
                    _push4(`</div><div class="mt-6 text-sm font-bold capitalize"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("components.language_switcher.change_language"))}</div><div class="mt-2"${_scopeId3}>`);
                    _push4(serverRenderer.exports.ssrRenderComponent(_component_LanguageSwitcher, { type: "select-box" }, null, _parent4, _scopeId3));
                    _push4(`</div>`);
                  } else {
                    return [
                      vue_cjs_prod.createVNode(_component_ActionSheetHeader, { text: "Menu" }),
                      vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.change_theme")), 1),
                      vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                        vue_cjs_prod.createVNode(_component_ThemeSwitcher, { type: "select-box" })
                      ]),
                      vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.language_switcher.change_language")), 1),
                      vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                        vue_cjs_prod.createVNode(_component_LanguageSwitcher, { type: "select-box" })
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent3, _scopeId2));
              _push3(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                type: "secondary",
                title: "Github",
                href: "https://github.com/viandwi24/nuxt3-awesome-starter"
              }, {
                default: vue_cjs_prod.withCtx((_2, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(serverRenderer.exports.ssrRenderComponent(_component_IconMdi58github_face, null, null, _parent4, _scopeId3));
                    _push4(`<span class="ml-1"${_scopeId3}>Github</span>`);
                  } else {
                    return [
                      vue_cjs_prod.createVNode(_component_IconMdi58github_face),
                      vue_cjs_prod.createVNode("span", { class: "ml-1" }, "Github")
                    ];
                  }
                }),
                _: 2
              }, _parent3, _scopeId2));
              _push3(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                text: "Close",
                type: "secondary",
                onClick: ($event) => toggleOptions(false)
              }, null, _parent3, _scopeId2));
            } else {
              return [
                vue_cjs_prod.createVNode(_component_ActionSheetBody, null, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createVNode(_component_ActionSheetHeader, { text: "Menu" }),
                    vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.change_theme")), 1),
                    vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                      vue_cjs_prod.createVNode(_component_ThemeSwitcher, { type: "select-box" })
                    ]),
                    vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.language_switcher.change_language")), 1),
                    vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                      vue_cjs_prod.createVNode(_component_LanguageSwitcher, { type: "select-box" })
                    ])
                  ]),
                  _: 1
                }),
                vue_cjs_prod.createVNode(_component_Button, {
                  type: "secondary",
                  title: "Github",
                  href: "https://github.com/viandwi24/nuxt3-awesome-starter"
                }, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createVNode(_component_IconMdi58github_face),
                    vue_cjs_prod.createVNode("span", { class: "ml-1" }, "Github")
                  ]),
                  _: 1
                }),
                vue_cjs_prod.createVNode(_component_Button, {
                  text: "Close",
                  type: "secondary",
                  onClick: vue_cjs_prod.withModifiers(($event) => toggleOptions(false), ["prevent"])
                }, null, 8, ["onClick"])
              ];
            }
          }),
          _: 2
        }, _parent2, _scopeId));
      } else {
        return [
          vue_cjs_prod.createVNode(_component_ActionSheet, {
            onOnClose: ($event) => toggleOptions(false)
          }, {
            default: vue_cjs_prod.withCtx(() => [
              vue_cjs_prod.createVNode(_component_ActionSheetBody, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_ActionSheetHeader, { text: "Menu" }),
                  vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.change_theme")), 1),
                  vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                    vue_cjs_prod.createVNode(_component_ThemeSwitcher, { type: "select-box" })
                  ]),
                  vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.language_switcher.change_language")), 1),
                  vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                    vue_cjs_prod.createVNode(_component_LanguageSwitcher, { type: "select-box" })
                  ])
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_Button, {
                type: "secondary",
                title: "Github",
                href: "https://github.com/viandwi24/nuxt3-awesome-starter"
              }, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_IconMdi58github_face),
                  vue_cjs_prod.createVNode("span", { class: "ml-1" }, "Github")
                ]),
                _: 1
              }),
              vue_cjs_prod.createVNode(_component_Button, {
                text: "Close",
                type: "secondary",
                onClick: vue_cjs_prod.withModifiers(($event) => toggleOptions(false), ["prevent"])
              }, null, 8, ["onClick"])
            ]),
            _: 2
          }, 1032, ["onOnClose"])
        ];
      }
    }),
    drawer: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "drawer", {}, null, _push2, _parent2, _scopeId);
      } else {
        return [
          vue_cjs_prod.renderSlot(_ctx.$slots, "drawer")
        ];
      }
    }),
    _: 3
  }, _parent));
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Dashboard/Navbar.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$3]]);
const _hoisted_1 = {
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
const _hoisted_2 = /* @__PURE__ */ vue_cjs_prod.createElementVNode("path", {
  fill: "currentColor",
  d: "M10 13H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1Zm-1 7H4v-5h5ZM21 2h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Zm-1 7h-5V4h5Zm1 4h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1Zm-1 7h-5v-5h5ZM10 2H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1ZM9 9H4V4h5Z"
}, null, -1);
const _hoisted_3 = [
  _hoisted_2
];
function render(_ctx, _cache) {
  return vue_cjs_prod.openBlock(), vue_cjs_prod.createElementBlock("svg", _hoisted_1, _hoisted_3);
}
const __unplugin_components_0 = { name: "uil-apps", render };
const _sfc_main$4 = vue_cjs_prod.defineComponent({
  props: {
    mode: {
      type: String,
      default: "normal"
    }
  },
  setup() {
    const sidebar = vue_cjs_prod.ref(null);
    vue_cjs_prod.onMounted(() => {
    });
    return {
      sidebar
    };
  }
});
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_Anchor = _sfc_main$s;
  const _component_IconUil58apps = __unplugin_components_0;
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({
    ref: "sidebar",
    class: {
      "fixed top-0 hidden pt-16 lg:flex lg:w-60 xl:w-80 h-screen": _ctx.mode === "normal",
      "relative flex-1 flex flex-col w-full": _ctx.mode === "mobile"
    }
  }, _attrs))}><div class="flex-1 overflow-y-auto pl-4 lg:pl-0 pr-4 py-4"><ul><!--[-->`);
  serverRenderer.exports.ssrRenderList(29, (i) => {
    _push(`<li>`);
    _push(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
      to: { name: "dashboard" },
      class: "group flex items-center mb-4 hover:no-underline"
    }, {
      default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          _push2(`<div class="${serverRenderer.exports.ssrRenderClass([{
            "text-white dark:text-white group-hover:bg-sky-500 bg-sky-500": i === 1,
            "text-slate-500 dark:text-gray-100 group-hover:bg-gray-200 bg-gray-100 dark:group-hover:bg-slate-600 dark:bg-slate-700": i !== 1
          }, "flex items-center mr-4 px-2 py-2 rounded-md ring-1 ring-slate-900/5 shadow-sm group-hover:shadow group-hover:ring-slate-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 group-hover:shadow-sky-200 dark:highlight-white/10"])}"${_scopeId}>`);
          _push2(serverRenderer.exports.ssrRenderComponent(_component_IconUil58apps, { class: "text-xs" }, null, _parent2, _scopeId));
          _push2(`</div><span class="${serverRenderer.exports.ssrRenderClass([{
            "font-extrabold text-sky-500 dark:text-sky-400": i === 1
          }, "text-sm font-semibold capitalize"])}"${_scopeId}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("pages.dashboard.index.nav"))}</span>`);
        } else {
          return [
            vue_cjs_prod.createVNode("div", {
              class: ["flex items-center mr-4 px-2 py-2 rounded-md ring-1 ring-slate-900/5 shadow-sm group-hover:shadow group-hover:ring-slate-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 group-hover:shadow-sky-200 dark:highlight-white/10", {
                "text-white dark:text-white group-hover:bg-sky-500 bg-sky-500": i === 1,
                "text-slate-500 dark:text-gray-100 group-hover:bg-gray-200 bg-gray-100 dark:group-hover:bg-slate-600 dark:bg-slate-700": i !== 1
              }]
            }, [
              vue_cjs_prod.createVNode(_component_IconUil58apps, { class: "text-xs" })
            ], 2),
            vue_cjs_prod.createVNode("span", {
              class: ["text-sm font-semibold capitalize", {
                "font-extrabold text-sky-500 dark:text-sky-400": i === 1
              }]
            }, vue_cjs_prod.toDisplayString(_ctx.$t("pages.dashboard.index.nav")), 3)
          ];
        }
      }),
      _: 2
    }, _parent));
    _push(`</li>`);
  });
  _push(`<!--]--></ul></div></div>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Dashboard/Sidebar.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$2]]);
const _sfc_main$3 = /* @__PURE__ */ vue_cjs_prod.defineComponent({
  __name: "Footer",
  __ssrInlineRender: true,
  setup(__props) {
    const app2 = useState("app");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<footer${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "border-t lg:border-gray-900/10 dark:border-gray-50/[0.2]" }, _attrs))}><section class="max-w-8xl mx-auto px-4 lg:px-8 flex-1 flex w-full space-x-20"><div class="w-full py-4 text-center md:text-left"><div class="mb-1">${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(app2).name)}</div><div class="text-xs text-gray-600 dark:text-gray-400"> Copyright \xA9 2022 <a${serverRenderer.exports.ssrRenderAttr("href", vue_cjs_prod.unref(app2).link)}>${serverRenderer.exports.ssrInterpolate(vue_cjs_prod.unref(app2).name)}</a>. All rights reserved. Made with <span class="text-red-500">\u2764</span><div class="flex flex-col md:flex-row space-x-2 items-center md:float-right"><span class="text-center md:text-right"> Design by <a href="https://github.com/glysis-softwares">Glysis</a></span></div></div></div></section></footer>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Footer.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  const _component_DashboardNavbar = __nuxt_component_0;
  const _component_DashboardSidebar = __nuxt_component_1;
  const _component_PageFooter = _sfc_main$3;
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(_attrs)}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "app-before", {}, null, _push, _parent);
  _push(`<div id="app-before"></div><div class="flex flex-col min-h-screen">`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "header", {}, () => {
    _push(serverRenderer.exports.ssrRenderComponent(_component_DashboardNavbar, null, {
      drawer: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          _push2(serverRenderer.exports.ssrRenderComponent(_component_DashboardSidebar, { mode: "mobile" }, null, _parent2, _scopeId));
        } else {
          return [
            vue_cjs_prod.createVNode(_component_DashboardSidebar, { mode: "mobile" })
          ];
        }
      }),
      _: 1
    }, _parent));
  }, _push, _parent);
  _push(`<div class="flex-1 w-full flex flex-col"><div class="relative flex-1 flex flex-row mx-auto max-w-8xl w-full h-full"><div class="lg:pl-8 py-4">`);
  _push(serverRenderer.exports.ssrRenderComponent(_component_DashboardSidebar, null, null, _parent));
  _push(`</div><div class="flex flex-col lg:ml-60 xl:ml-80">`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "footer", {}, () => {
    _push(serverRenderer.exports.ssrRenderComponent(_component_PageFooter, null, null, _parent));
  }, _push, _parent);
  _push(`</div></div></div></div>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "app-after", {}, null, _push, _parent);
  _push(`<div id="app-after"></div></div>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/dashboard.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const dashboard = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender$1]]);
const dashboard$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": dashboard
});
const _sfc_main$1 = vue_cjs_prod.defineComponent({
  __name: "Navbar",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useLang();
    const app2 = useState("app");
    const menus = vue_cjs_prod.computed(() => [
      { type: "link", text: t("pages.blank.nav"), route: { name: "blank" } },
      { type: "link", text: t("pages.test.nav"), route: { name: "test" } },
      { type: "link", text: t("pages.about.nav"), route: { name: "about" } },
      { type: "link", text: t("pages.setting.nav"), route: { name: "setting" } },
      {
        type: "button",
        text: t("pages.dashboard.nav"),
        route: { name: "dashboard" }
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_BuilderNavbar = _sfc_main$c;
      const _component_Anchor = _sfc_main$s;
      const _component_Button = _sfc_main$E;
      const _component_LanguageSwitcher = _sfc_main$b;
      const _component_ThemeSwitcher = _sfc_main$a;
      const _component_IconMdi58github_face = __unplugin_components_0$2;
      const _component_ActionSheet = _sfc_main$8;
      const _component_ActionSheetBody = __nuxt_component_6;
      const _component_ActionSheetHeader = _sfc_main$6;
      _push(serverRenderer.exports.ssrRenderComponent(_component_BuilderNavbar, _attrs, {
        banner: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="text-white text-xs text-center py-1 px-4 lg:px-8 bg-primary-500 capitalize"${_scopeId}><span class="mr-1"${_scopeId}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("banners.welcome", { app_name: vue_cjs_prod.unref(app2).name }))}</span>`);
            _push2(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
              class: "underline font-bold",
              text: _ctx.$t("others.learn_more"),
              href: ""
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              vue_cjs_prod.createVNode("div", { class: "text-white text-xs text-center py-1 px-4 lg:px-8 bg-primary-500 capitalize" }, [
                vue_cjs_prod.createVNode("span", { class: "mr-1" }, vue_cjs_prod.toDisplayString(_ctx.$t("banners.welcome", { app_name: vue_cjs_prod.unref(app2).name })), 1),
                vue_cjs_prod.createVNode(_component_Anchor, {
                  class: "underline font-bold",
                  text: _ctx.$t("others.learn_more"),
                  href: ""
                }, null, 8, ["text"])
              ])
            ];
          }
        }),
        menu: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="relative hidden lg:flex items-center ml-auto"${_scopeId}><nav class="text-sm leading-6 font-semibold text-gray-600 dark:text-gray-300" role="navigation"${_scopeId}><ul class="flex items-center space-x-8"${_scopeId}><!--[-->`);
            serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(menus), (item, i) => {
              _push2(`<li${_scopeId}>`);
              if (item.type === "link") {
                _push2(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
                  to: item.route ? item.route : void 0,
                  href: item.href ? item.href : void 0,
                  class: "hover:no-underline hover:text-slate-900 hover:dark:text-white capitalize"
                }, {
                  default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`${serverRenderer.exports.ssrInterpolate(item.text)}`);
                    } else {
                      return [
                        vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(item.text), 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent2, _scopeId));
              } else if (item.type === "button") {
                _push2(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                  text: item.text,
                  size: "xs",
                  class: "font-extrabold capitalize",
                  to: item.route ? item.route : void 0,
                  href: item.href ? item.href : void 0
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(`</li>`);
            });
            _push2(`<!--]--></ul></nav><div class="flex space-x-4 border-l ml-6 pl-6 border-gray-900/10 dark:border-gray-50/[0.2]"${_scopeId}>`);
            _push2(serverRenderer.exports.ssrRenderComponent(_component_LanguageSwitcher, null, null, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_ThemeSwitcher, null, null, _parent2, _scopeId));
            _push2(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
              class: "hover:no-underline hover:text-slate-900 hover:dark:text-white text-lg flex self-center items-center",
              href: "",
              title: "Github"
            }, {
              default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_IconMdi58github_face, null, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_IconMdi58github_face)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              vue_cjs_prod.createVNode("div", { class: "relative hidden lg:flex items-center ml-auto" }, [
                vue_cjs_prod.createVNode("nav", {
                  class: "text-sm leading-6 font-semibold text-gray-600 dark:text-gray-300",
                  role: "navigation"
                }, [
                  vue_cjs_prod.createVNode("ul", { class: "flex items-center space-x-8" }, [
                    (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(menus), (item, i) => {
                      return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("li", { key: i }, [
                        item.type === "link" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Anchor, {
                          key: 0,
                          to: item.route ? item.route : void 0,
                          href: item.href ? item.href : void 0,
                          class: "hover:no-underline hover:text-slate-900 hover:dark:text-white capitalize"
                        }, {
                          default: vue_cjs_prod.withCtx(() => [
                            vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(item.text), 1)
                          ]),
                          _: 2
                        }, 1032, ["to", "href"])) : item.type === "button" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Button, {
                          key: 1,
                          text: item.text,
                          size: "xs",
                          class: "font-extrabold capitalize",
                          to: item.route ? item.route : void 0,
                          href: item.href ? item.href : void 0
                        }, null, 8, ["text", "to", "href"])) : vue_cjs_prod.createCommentVNode("", true)
                      ]);
                    }), 128))
                  ])
                ]),
                vue_cjs_prod.createVNode("div", { class: "flex space-x-4 border-l ml-6 pl-6 border-gray-900/10 dark:border-gray-50/[0.2]" }, [
                  vue_cjs_prod.createVNode(_component_LanguageSwitcher),
                  vue_cjs_prod.createVNode(_component_ThemeSwitcher),
                  vue_cjs_prod.createVNode(_component_Anchor, {
                    class: "hover:no-underline hover:text-slate-900 hover:dark:text-white text-lg flex self-center items-center",
                    href: "",
                    title: "Github"
                  }, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_IconMdi58github_face)
                    ]),
                    _: 1
                  })
                ])
              ])
            ];
          }
        }),
        options: vue_cjs_prod.withCtx(({ toggleOptions }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.exports.ssrRenderComponent(_component_ActionSheet, {
              onOnClose: ($event) => toggleOptions(false)
            }, {
              default: vue_cjs_prod.withCtx((_, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_ActionSheetBody, null, {
                    default: vue_cjs_prod.withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_ActionSheetHeader, { text: "Menu" }, null, _parent4, _scopeId3));
                        _push4(`<nav class="leading-6 font-semibold text-gray-600 dark:text-gray-300"${_scopeId3}><ul class="flex flex-col"${_scopeId3}><!--[-->`);
                        serverRenderer.exports.ssrRenderList(vue_cjs_prod.unref(menus), (item, i) => {
                          _push4(`<li class="${serverRenderer.exports.ssrRenderClass([{
                            "pb-2 mb-2 border-b border-gray-900/10 dark:border-gray-50/[0.2]": item.type === "link"
                          }, "flex w-full"])}"${_scopeId3}>`);
                          if (item.type === "link") {
                            _push4(serverRenderer.exports.ssrRenderComponent(_component_Anchor, {
                              to: item.route ? item.route : void 0,
                              href: item.href ? item.href : void 0,
                              class: "flex-1 hover:no-underline capitalize"
                            }, {
                              default: vue_cjs_prod.withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(`${serverRenderer.exports.ssrInterpolate(item.text)}`);
                                } else {
                                  return [
                                    vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(item.text), 1)
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                          } else if (item.type === "button") {
                            _push4(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                              text: item.text,
                              size: "xs",
                              class: "flex-1 font-extrabold capitalize",
                              to: item.route ? item.route : void 0,
                              href: item.href ? item.href : void 0
                            }, null, _parent4, _scopeId3));
                          } else {
                            _push4(`<!---->`);
                          }
                          _push4(`</li>`);
                        });
                        _push4(`<!--]--></ul></nav><div class="mt-6 text-sm font-bold capitalize"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("components.theme_switcher.change_theme"))}</div><div class="mt-2"${_scopeId3}>`);
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_ThemeSwitcher, { type: "select-box" }, null, _parent4, _scopeId3));
                        _push4(`</div><div class="mt-6 text-sm font-bold capitalize"${_scopeId3}>${serverRenderer.exports.ssrInterpolate(_ctx.$t("components.language_switcher.change_language"))}</div><div class="mt-2"${_scopeId3}>`);
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_LanguageSwitcher, { type: "select-box" }, null, _parent4, _scopeId3));
                        _push4(`</div>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_ActionSheetHeader, { text: "Menu" }),
                          vue_cjs_prod.createVNode("nav", { class: "leading-6 font-semibold text-gray-600 dark:text-gray-300" }, [
                            vue_cjs_prod.createVNode("ul", { class: "flex flex-col" }, [
                              (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(menus), (item, i) => {
                                return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("li", {
                                  key: i,
                                  class: ["flex w-full", {
                                    "pb-2 mb-2 border-b border-gray-900/10 dark:border-gray-50/[0.2]": item.type === "link"
                                  }]
                                }, [
                                  item.type === "link" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Anchor, {
                                    key: 0,
                                    to: item.route ? item.route : void 0,
                                    href: item.href ? item.href : void 0,
                                    class: "flex-1 hover:no-underline capitalize"
                                  }, {
                                    default: vue_cjs_prod.withCtx(() => [
                                      vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(item.text), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["to", "href"])) : item.type === "button" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Button, {
                                    key: 1,
                                    text: item.text,
                                    size: "xs",
                                    class: "flex-1 font-extrabold capitalize",
                                    to: item.route ? item.route : void 0,
                                    href: item.href ? item.href : void 0
                                  }, null, 8, ["text", "to", "href"])) : vue_cjs_prod.createCommentVNode("", true)
                                ], 2);
                              }), 128))
                            ])
                          ]),
                          vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.change_theme")), 1),
                          vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                            vue_cjs_prod.createVNode(_component_ThemeSwitcher, { type: "select-box" })
                          ]),
                          vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.language_switcher.change_language")), 1),
                          vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                            vue_cjs_prod.createVNode(_component_LanguageSwitcher, { type: "select-box" })
                          ])
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                    type: "secondary",
                    title: "Github",
                    href: "https://github.com/glysis-softwares"
                  }, {
                    default: vue_cjs_prod.withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(serverRenderer.exports.ssrRenderComponent(_component_IconMdi58github_face, null, null, _parent4, _scopeId3));
                        _push4(`<span class="ml-1"${_scopeId3}>Github</span>`);
                      } else {
                        return [
                          vue_cjs_prod.createVNode(_component_IconMdi58github_face),
                          vue_cjs_prod.createVNode("span", { class: "ml-1" }, "Github")
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                  _push3(serverRenderer.exports.ssrRenderComponent(_component_Button, {
                    text: "Close",
                    type: "secondary",
                    onClick: ($event) => toggleOptions(false)
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vue_cjs_prod.createVNode(_component_ActionSheetBody, null, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_ActionSheetHeader, { text: "Menu" }),
                        vue_cjs_prod.createVNode("nav", { class: "leading-6 font-semibold text-gray-600 dark:text-gray-300" }, [
                          vue_cjs_prod.createVNode("ul", { class: "flex flex-col" }, [
                            (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(menus), (item, i) => {
                              return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("li", {
                                key: i,
                                class: ["flex w-full", {
                                  "pb-2 mb-2 border-b border-gray-900/10 dark:border-gray-50/[0.2]": item.type === "link"
                                }]
                              }, [
                                item.type === "link" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Anchor, {
                                  key: 0,
                                  to: item.route ? item.route : void 0,
                                  href: item.href ? item.href : void 0,
                                  class: "flex-1 hover:no-underline capitalize"
                                }, {
                                  default: vue_cjs_prod.withCtx(() => [
                                    vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(item.text), 1)
                                  ]),
                                  _: 2
                                }, 1032, ["to", "href"])) : item.type === "button" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Button, {
                                  key: 1,
                                  text: item.text,
                                  size: "xs",
                                  class: "flex-1 font-extrabold capitalize",
                                  to: item.route ? item.route : void 0,
                                  href: item.href ? item.href : void 0
                                }, null, 8, ["text", "to", "href"])) : vue_cjs_prod.createCommentVNode("", true)
                              ], 2);
                            }), 128))
                          ])
                        ]),
                        vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.change_theme")), 1),
                        vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                          vue_cjs_prod.createVNode(_component_ThemeSwitcher, { type: "select-box" })
                        ]),
                        vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.language_switcher.change_language")), 1),
                        vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                          vue_cjs_prod.createVNode(_component_LanguageSwitcher, { type: "select-box" })
                        ])
                      ]),
                      _: 1
                    }),
                    vue_cjs_prod.createVNode(_component_Button, {
                      type: "secondary",
                      title: "Github",
                      href: "https://github.com/glysis-softwares"
                    }, {
                      default: vue_cjs_prod.withCtx(() => [
                        vue_cjs_prod.createVNode(_component_IconMdi58github_face),
                        vue_cjs_prod.createVNode("span", { class: "ml-1" }, "Github")
                      ]),
                      _: 1
                    }),
                    vue_cjs_prod.createVNode(_component_Button, {
                      text: "Close",
                      type: "secondary",
                      onClick: vue_cjs_prod.withModifiers(($event) => toggleOptions(false), ["prevent"])
                    }, null, 8, ["onClick"])
                  ];
                }
              }),
              _: 2
            }, _parent2, _scopeId));
          } else {
            return [
              vue_cjs_prod.createVNode(_component_ActionSheet, {
                onOnClose: ($event) => toggleOptions(false)
              }, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_ActionSheetBody, null, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_ActionSheetHeader, { text: "Menu" }),
                      vue_cjs_prod.createVNode("nav", { class: "leading-6 font-semibold text-gray-600 dark:text-gray-300" }, [
                        vue_cjs_prod.createVNode("ul", { class: "flex flex-col" }, [
                          (vue_cjs_prod.openBlock(true), vue_cjs_prod.createBlock(vue_cjs_prod.Fragment, null, vue_cjs_prod.renderList(vue_cjs_prod.unref(menus), (item, i) => {
                            return vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock("li", {
                              key: i,
                              class: ["flex w-full", {
                                "pb-2 mb-2 border-b border-gray-900/10 dark:border-gray-50/[0.2]": item.type === "link"
                              }]
                            }, [
                              item.type === "link" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Anchor, {
                                key: 0,
                                to: item.route ? item.route : void 0,
                                href: item.href ? item.href : void 0,
                                class: "flex-1 hover:no-underline capitalize"
                              }, {
                                default: vue_cjs_prod.withCtx(() => [
                                  vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(item.text), 1)
                                ]),
                                _: 2
                              }, 1032, ["to", "href"])) : item.type === "button" ? (vue_cjs_prod.openBlock(), vue_cjs_prod.createBlock(_component_Button, {
                                key: 1,
                                text: item.text,
                                size: "xs",
                                class: "flex-1 font-extrabold capitalize",
                                to: item.route ? item.route : void 0,
                                href: item.href ? item.href : void 0
                              }, null, 8, ["text", "to", "href"])) : vue_cjs_prod.createCommentVNode("", true)
                            ], 2);
                          }), 128))
                        ])
                      ]),
                      vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.theme_switcher.change_theme")), 1),
                      vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                        vue_cjs_prod.createVNode(_component_ThemeSwitcher, { type: "select-box" })
                      ]),
                      vue_cjs_prod.createVNode("div", { class: "mt-6 text-sm font-bold capitalize" }, vue_cjs_prod.toDisplayString(_ctx.$t("components.language_switcher.change_language")), 1),
                      vue_cjs_prod.createVNode("div", { class: "mt-2" }, [
                        vue_cjs_prod.createVNode(_component_LanguageSwitcher, { type: "select-box" })
                      ])
                    ]),
                    _: 1
                  }),
                  vue_cjs_prod.createVNode(_component_Button, {
                    type: "secondary",
                    title: "Github",
                    href: "https://github.com/glysis-softwares"
                  }, {
                    default: vue_cjs_prod.withCtx(() => [
                      vue_cjs_prod.createVNode(_component_IconMdi58github_face),
                      vue_cjs_prod.createVNode("span", { class: "ml-1" }, "Github")
                    ]),
                    _: 1
                  }),
                  vue_cjs_prod.createVNode(_component_Button, {
                    text: "Close",
                    type: "secondary",
                    onClick: vue_cjs_prod.withModifiers(($event) => toggleOptions(false), ["prevent"])
                  }, null, 8, ["onClick"])
                ]),
                _: 2
              }, 1032, ["onOnClose"])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Page/Navbar.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_PageNavbar = _sfc_main$1;
  const _component_PageFooter = _sfc_main$3;
  _push(`<div${serverRenderer.exports.ssrRenderAttrs(_attrs)}>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "app-before", {}, null, _push, _parent);
  _push(`<div id="app-before"></div><div class="flex flex-col min-h-screen">`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "header", {}, () => {
    _push(serverRenderer.exports.ssrRenderComponent(_component_PageNavbar, null, null, _parent));
  }, _push, _parent);
  _push(`<div class="flex-1 w-full flex flex-col"><div class="relative flex-1 flex flex-col mx-auto max-w-8xl w-full h-full">`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div></div>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "footer", {}, () => {
    _push(serverRenderer.exports.ssrRenderComponent(_component_PageFooter, null, null, _parent));
  }, _push, _parent);
  _push(`</div>`);
  serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "app-after", {}, null, _push, _parent);
  _push(`<div id="app-after"></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/page.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const page = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
const page$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": page
});

export { entry$1 as default };
//# sourceMappingURL=server.mjs.map
