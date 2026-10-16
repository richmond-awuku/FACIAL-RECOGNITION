import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { defineProdDiagnostics } from 'nostics';
import { ansiFormatter } from 'nostics/formatters/ansi';
import { getCurrentScope, ref, watchEffect, getCurrentInstance, onBeforeUnmount, onDeactivated, onActivated, createApp, provide, onErrorCaptured, onServerPrefetch, unref, createVNode, resolveDynamicComponent, shallowReactive, reactive, effectScope, hasInjectionContext, inject, defineAsyncComponent, mergeProps, defineComponent, withCtx, renderSlot, openBlock, createBlock, createTextVNode, createCommentVNode, toRef, computed, readonly, shallowRef, isRef, withDirectives, vModelText, vModelSelect, watch, toDisplayString, h, isReadonly, Suspense, nextTick, useSSRContext, createElementBlock, cloneVNode, isShallow, isReactive, toRaw, resolveComponent, toValue, queuePostFlushCb } from 'vue';
import { h as createError, m as defu, $ as $fetch, n as isEqual, s as stringifyParsedURL, o as stringifyQuery, p as parseQuery, q as hasProtocol, l as joinURL, w as withQuery, r as sanitizeStatusCode, v as parseURL, e as encodePath, x as decodePath, y as isScriptProtocol, z as withTrailingSlash, A as withoutTrailingSlash } from '../_/nitro.mjs';
import { i as injectHead$1, V as VueResolver, b as baseURL, h as headSymbol } from '../routes/renderer.mjs';
import { ssrRenderSuspense, ssrRenderComponent, ssrRenderVNode, ssrRenderSlot, ssrRenderAttrs, ssrRenderStyle, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrRenderList, ssrRenderClass, ssrLooseEqual, ssrRenderTeleport } from 'vue/server-renderer';
import { isPlainObject } from '@vue/shared';
import { walkResolver } from 'unhead/utils';

function useHead(input, options = {}) {
  const head = options.head || injectHead$1();
  return head.ssr ? head.push(input || {}, options) : clientUseHead(head, input, options);
}
function clientUseHead(head, input, options = {}) {
  const scope = getCurrentScope();
  if (scope && !scope.active) {
    return { patch() {
    }, dispose() {
    }, _i: -1 };
  }
  const deactivated = ref(false);
  if (options.onRendered && scope) {
    const _onRendered = options.onRendered;
    options = { ...options, onRendered: (ctx) => scope.run(() => _onRendered(ctx)) };
  }
  let entry;
  watchEffect(() => {
    const i = deactivated.value ? {} : walkResolver(input, VueResolver);
    if (entry) {
      entry.patch(i);
    } else {
      entry = head.push(i, options);
    }
  });
  const vm = getCurrentInstance();
  if (vm) {
    onBeforeUnmount(() => {
      entry.dispose();
    });
    onDeactivated(() => {
      deactivated.value = true;
    });
    onActivated(() => {
      deactivated.value = false;
    });
  }
  return entry;
}

function flatHooks(configHooks, hooks = {}, parentName) {
	for (const key in configHooks) {
		const subHook = configHooks[key];
		const name = parentName ? `${parentName}:${key}` : key;
		if (typeof subHook === "object" && subHook !== null) flatHooks(subHook, hooks, name);
		else if (typeof subHook === "function") hooks[name] = subHook;
	}
	return hooks;
}
const createTask = /* @__PURE__ */ (() => {
	if (console.createTask) return console.createTask;
	const defaultTask = { run: (fn) => fn() };
	return () => defaultTask;
})();
function callHooks(hooks, args, startIndex, task) {
	for (let i = startIndex; i < hooks.length; i += 1) try {
		const result = task ? task.run(() => hooks[i](...args)) : hooks[i](...args);
		if (result && typeof result.then === "function") return Promise.resolve(result).then(() => callHooks(hooks, args, i + 1, task));
	} catch (error) {
		return Promise.reject(error);
	}
}
function serialTaskCaller(hooks, args, name) {
	if (hooks.length > 0) return callHooks(hooks, args, 0, createTask(name));
}
function parallelTaskCaller(hooks, args, name) {
	if (hooks.length > 0) {
		const task = createTask(name);
		return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
	}
}
function callEachWith(callbacks, arg0) {
	for (const callback of [...callbacks]) callback(arg0);
}
var Hookable = class {
	_hooks;
	_before;
	_after;
	_deprecatedHooks;
	_deprecatedMessages;
	constructor() {
		this._hooks = {};
		this._before = void 0;
		this._after = void 0;
		this._deprecatedMessages = void 0;
		this._deprecatedHooks = {};
		this.hook = this.hook.bind(this);
		this.callHook = this.callHook.bind(this);
		this.callHookWith = this.callHookWith.bind(this);
	}
	hook(name, function_, options = {}) {
		if (!name || typeof function_ !== "function") return () => {};
		const originalName = name;
		let dep;
		while (this._deprecatedHooks[name]) {
			dep = this._deprecatedHooks[name];
			name = dep.to;
		}
		if (dep && !options.allowDeprecated) {
			let message = dep.message;
			if (!message) message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
			if (!this._deprecatedMessages) this._deprecatedMessages = /* @__PURE__ */ new Set();
			if (!this._deprecatedMessages.has(message)) {
				console.warn(message);
				this._deprecatedMessages.add(message);
			}
		}
		if (!function_.name) try {
			Object.defineProperty(function_, "name", {
				get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
				configurable: true
			});
		} catch {}
		this._hooks[name] = this._hooks[name] || [];
		this._hooks[name].push(function_);
		return () => {
			if (function_) {
				this.removeHook(name, function_);
				function_ = void 0;
			}
		};
	}
	hookOnce(name, function_) {
		let _unreg;
		let _function = (...arguments_) => {
			if (typeof _unreg === "function") _unreg();
			_unreg = void 0;
			_function = void 0;
			return function_(...arguments_);
		};
		_unreg = this.hook(name, _function);
		return _unreg;
	}
	removeHook(name, function_) {
		const hooks = this._hooks[name];
		if (hooks) {
			const index = hooks.indexOf(function_);
			if (index !== -1) hooks.splice(index, 1);
			if (hooks.length === 0) this._hooks[name] = void 0;
		}
	}
	clearHook(name) {
		this._hooks[name] = void 0;
	}
	deprecateHook(name, deprecated) {
		this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
		const _hooks = this._hooks[name] || [];
		this._hooks[name] = void 0;
		for (const hook of _hooks) this.hook(name, hook);
	}
	deprecateHooks(deprecatedHooks) {
		for (const name in deprecatedHooks) this.deprecateHook(name, deprecatedHooks[name]);
	}
	addHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
		return () => {
			for (const unreg of removeFns) unreg();
			removeFns.length = 0;
		};
	}
	removeHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		for (const key in hooks) this.removeHook(key, hooks[key]);
	}
	removeAllHooks() {
		this._hooks = {};
	}
	callHook(name, ...args) {
		return this.callHookWith(serialTaskCaller, name, args);
	}
	callHookParallel(name, ...args) {
		return this.callHookWith(parallelTaskCaller, name, args);
	}
	callHookWith(caller, name, args) {
		const event = this._before || this._after ? {
			name,
			args,
			context: {}
		} : void 0;
		if (this._before) callEachWith(this._before, event);
		const result = caller(this._hooks[name] ? [...this._hooks[name]] : [], args, name);
		if (result instanceof Promise) return result.finally(() => {
			if (this._after && event) callEachWith(this._after, event);
		});
		if (this._after && event) callEachWith(this._after, event);
		return result;
	}
	beforeEach(function_) {
		this._before = this._before || [];
		this._before.push(function_);
		return () => {
			if (this._before !== void 0) {
				const index = this._before.indexOf(function_);
				if (index !== -1) this._before.splice(index, 1);
			}
		};
	}
	afterEach(function_) {
		this._after = this._after || [];
		this._after.push(function_);
		return () => {
			if (this._after !== void 0) {
				const index = this._after.indexOf(function_);
				if (index !== -1) this._after.splice(index, 1);
			}
		};
	}
};
function createHooks() {
	return new Hookable();
}

function _getAsyncLocalStorage() {
	return globalThis.AsyncLocalStorage || globalThis.process?.getBuiltinModule?.("node:async_hooks")?.AsyncLocalStorage;
}
const _WeakRef = globalThis.WeakRef || class StrongRef {
	#value;
	constructor(value) {
		this.#value = value;
	}
	deref() {
		return this.#value;
	}
};
function createContext(opts = {}) {
	let currentInstance;
	let isSingleton = false;
	const checkConflict = (instance) => {
		if (currentInstance && currentInstance !== instance) throw new Error("Context conflict");
	};
	let als;
	if (opts.asyncContext) {
		const _AsyncLocalStorage = opts.AsyncLocalStorage || _getAsyncLocalStorage();
		if (_AsyncLocalStorage) als = new _AsyncLocalStorage();
		else console.warn("[unctx] `AsyncLocalStorage` is not provided.");
	}
	const _wrapInstance = (instance) => als && instance !== null && typeof instance === "object" ? { __unctx_weak: new _WeakRef(instance) } : instance;
	const _unwrapInstance = (store) => store && store.__unctx_weak ? store.__unctx_weak.deref() : store;
	const _getCurrentInstance = () => {
		if (als) {
			const store = als.getStore();
			if (store !== void 0) return _unwrapInstance(store);
		}
		return currentInstance;
	};
	return {
		use: () => {
			const _instance = _getCurrentInstance();
			if (_instance === void 0) throw new Error("Context is not available");
			return _instance;
		},
		tryUse: () => {
			return _getCurrentInstance() ?? null;
		},
		set: (instance, replace) => {
			if (!replace) checkConflict(instance);
			currentInstance = instance;
			isSingleton = true;
		},
		unset: () => {
			currentInstance = void 0;
			isSingleton = false;
		},
		call: (instance, callback) => {
			checkConflict(instance);
			currentInstance = instance;
			try {
				return als ? als.run(_wrapInstance(instance), callback) : callback();
			} finally {
				if (!isSingleton) currentInstance = void 0;
			}
		},
		async callAsync(instance, callback) {
			currentInstance = instance;
			const onRestore = () => {
				currentInstance = instance;
			};
			const onLeave = () => currentInstance === instance ? onRestore : void 0;
			asyncHandlers.add(onLeave);
			try {
				const r = als ? als.run(_wrapInstance(instance), callback) : callback();
				if (!isSingleton) currentInstance = void 0;
				return await r;
			} finally {
				asyncHandlers.delete(onLeave);
			}
		}
	};
}
function createNamespace(defaultOpts = {}) {
	const contexts = {};
	return { get(key, opts = {}) {
		if (!contexts[key]) contexts[key] = createContext({
			...defaultOpts,
			...opts
		});
		return contexts[key];
	} };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());

//#region src/index.ts
/**
* Compute the 64-bit FNV-1a hash of a string as two 32-bit lanes.
*
* This is the fast core: no BigInt, no allocations, plain `Math.imul`-free
* 32-bit arithmetic. Prefer {@link fnv1a64Hex} or {@link fnv1a64Base36} for a
* usable key; use this directly only when you want to avoid string formatting.
*
* The hash is computed over UTF-16 code units (`str.charCodeAt(i)`), not UTF-8
* bytes. For ASCII input this matches a canonical FNV-1a-64; for non-ASCII it
* does not. See the README for details.
*
* @param str - The string to hash.
* @returns The `{ high, low }` 32-bit lanes of the 64-bit hash.
*/
function fnv1a64(str) {
	const len = str.length;
	let i = 0;
	let t0 = 0;
	let v0 = 8997;
	let t1 = 0;
	let v1 = 33826;
	let t2 = 0;
	let v2 = 40164;
	let t3 = 0;
	let v3 = 52210;
	while (i < len) {
		v0 ^= str.charCodeAt(i++);
		t0 = v0 * 435;
		t1 = v1 * 435;
		t2 = v2 * 435;
		t3 = v3 * 435;
		t2 += v0 << 8;
		t3 += v1 << 8;
		t1 += t0 >>> 16;
		v0 = t0 & 65535;
		t2 += t1 >>> 16;
		v1 = t1 & 65535;
		v3 = t3 + (t2 >>> 16) & 65535;
		v2 = t2 & 65535;
	}
	return {
		high: (v3 << 16 | v2) >>> 0,
		low: (v1 << 16 | v0) >>> 0
	};
}
/**
* Compute the 64-bit FNV-1a hash of a string as a `bigint`.
*
* Ergonomic and comparable, at the cost of composing the two lanes into a
* `bigint`. For a compact string key, prefer {@link fnv1a64Base36}.
*
* @param str - The string to hash.
* @returns The 64-bit hash as an unsigned `bigint`.
*/
function fnv1a64BigInt(str) {
	const { high, low } = fnv1a64(str);
	return BigInt(high) << 32n | BigInt(low);
}
const hexDigits = "0123456789abcdef";
/**
* Every byte value rendered as its two hex digits, so a 32-bit lane formats in
* 4 lookups instead of `toString(16)` plus a `padStart`. Leading zeros are
* intrinsic to the table, which is what makes the padding free.
*/
Array.from({ length: 256 }, (_, i) => hexDigits.charAt(i >> 4) + hexDigits.charAt(i & 15));
/**
* Compute the 64-bit FNV-1a hash of a string as a base36 string.
*
* This is the shortest textual form (up to 13 characters) and is ideal for
* cache keys. The length varies with the value; it is not zero-padded. Equal
* inputs always produce identical strings.
*
* @param str - The string to hash.
* @returns A base36 string of the 64-bit hash.
*/
function fnv1a64Base36(str) {
	return fnv1a64BigInt(str).toString(36);
}

function walk(input, seen) {
	if (input === null) return "L";
	let out, i = 0, keys = input, tmp = typeof input;
	if (tmp !== "object") {
		if (tmp === "number") return input - input === 0 ? "n" + input : "L";
		if (tmp === "string") return "s" + input;
		if (tmp === "bigint") return "n" + input;
		if (tmp === "boolean") return input ? "T" : "F";
		return;
	}
	let is_arr = Array.isArray(input);
	if (!is_arr) {
		if (input instanceof Date) return "d" + +input;
		if (input instanceof RegExp) return "r" + input.source + input.flags;
	}
	tmp = seen.indexOf(input);
	if (~tmp) return "~" + (tmp + 1);
	if (typeof input.toJSON === "function" && !ArrayBuffer.isView(input)) {
		input = input.toJSON();
		if (input === null || typeof input !== "object") return walk(input, seen);
		tmp = seen.indexOf(input);
		if (~tmp) return "~" + (tmp + 1);
		is_arr = Array.isArray(input);
	}
	seen.push(keys);
	if (is_arr) {
		for (out = "a"; i < input.length; out += (tmp = walk(input[i++], seen)) === undefined ? "L" : tmp);
	} else if (input instanceof Set) {
		out = "e";
		for (let value of input) out += (tmp = walk(value, seen)) === undefined ? "L" : tmp;
	} else if (input instanceof Map) {
		keys = [...input.keys()];
		if (keys.length > 1) keys.sort();
		for (out = "o"; i < keys.length; i++) {
			if ((tmp = walk(input.get(keys[i]), seen)) !== undefined) out += keys[i] + tmp;
		}
	} else if (input[Symbol.toStringTag] === undefined || ArrayBuffer.isView(input)) {
		keys = Object.keys(input);
		if (keys.length > 1) keys.sort();
		for (out = "o"; i < keys.length; i++) {
			if ((tmp = walk(input[keys[i]], seen)) !== undefined) out += keys[i] + tmp;
		}
	} else {
		throw new Error("Unsupported value");
	}
	seen.pop();
	return out;
}
/**
* Canonicalize a value into a stable identity string. Two structurally-equal
* inputs return the same id, regardless of key order.
*
* @example
* ```ts
* identify({ a: 1, b: 2 }) === identify({ b: 2, a: 1 }); // true
* ```
*/
function identify(input) {
	return walk(input, []) ?? "U";
}

//#region node_modules/nuxt/dist/app/diagnostics/_shared.js
/**
* Shared configuration for the runtime (E<N>xxx) diagnostics catalogs.
*
* Catalogs are split by domain and imported directly where used (no barrel),
* so the browser bundle only pulls in the codes a module references. Pair the
* pure-call annotations on each `defineDiagnostics()` with dev-guarded,
* statement-level report calls so report-only diagnostics strip from production.
*
* Codes are stable, fully-qualified `NUXT_E<NNNN>` identifiers. Codes with a
* dedicated docs page resolve a `see:` URL via {@link docsBase}; the rest opt
* out with `docs: false`.
*/
function docsBase(code) {
	return `https://nuxt.com/docs/4.x/errors/${code.replace("NUXT_", "").toLowerCase()}`;
}
var ansi = (open, close) => (s) => `\x1B[${open}m${s}\x1B[${close}m`;
var colors = {
	red: ansi(31, 39),
	yellow: ansi(33, 39),
	cyan: ansi(36, 39),
	gray: ansi(90, 39),
	bold: ansi(1, 22),
	dim: ansi(2, 22)
};
ansiFormatter(colors);
var prodReporter = (diagnostic) => {
	console.error(`[${diagnostic.name}]`);
};
var prodReporters = [prodReporter];
//#endregion
//#region node_modules/nuxt/dist/app/diagnostics/core.js
/**
* E1xxx
* Core / Nuxt-instance / lifecycle runtime diagnostics.
*/
var appDiagnostics = /* #__PURE__ */ defineProdDiagnostics({
	docsBase,
	reporters: prodReporters
});
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Fnuxt.config.mjs
var nuxtLinkDefaults = {
	"componentName": "NuxtLink"};
var asyncDataDefaults = { "deep": false };
var fetchDefaults = {};
//#endregion
//#region node_modules/nuxt/dist/app/nuxt.js
function getNuxtAppCtx(id = "nuxt-app") {
	return getContext(id, { asyncContext: false });
}
var NuxtPluginIndicator = "__nuxt_plugin";
/** @since 3.0.0 */
function createNuxtApp(options) {
	let hydratingCount = 0;
	const nuxtApp = {
		_id: options.id || "nuxt-app",
		_scope: effectScope(),
		provide: void 0,
		versions: {
			get nuxt() {
				return "4.5.2";
			},
			get vue() {
				return nuxtApp.vueApp.version;
			}
		},
		payload: shallowReactive({
			...options.ssrContext?.payload || {},
			data: shallowReactive({}),
			state: reactive({}),
			once: /* @__PURE__ */ new Set(),
			_errors: shallowReactive({})
		}),
		static: { data: {} },
		runWithContext(fn) {
			if (nuxtApp._scope.active && !getCurrentScope()) return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
			return callWithNuxt(nuxtApp, fn);
		},
		isHydrating: false,
		deferHydration() {
			if (!nuxtApp.isHydrating) return () => {};
			hydratingCount++;
			let called = false;
			return () => {
				if (called) return;
				called = true;
				hydratingCount--;
				if (hydratingCount === 0) {
					nuxtApp.isHydrating = false;
					return nuxtApp.callHook("app:suspense:resolve");
				}
			};
		},
		_asyncDataPromises: {},
		_asyncData: shallowReactive({}),
		_state: shallowReactive({}),
		_payloadRevivers: {},
		...options
	};
	nuxtApp.payload.serverRendered = true;
	if (nuxtApp.ssrContext) {
		nuxtApp.payload.path = nuxtApp.ssrContext.url;
		nuxtApp.ssrContext.nuxt = nuxtApp;
		nuxtApp.ssrContext.payload = nuxtApp.payload;
		nuxtApp.ssrContext.config = {
			public: nuxtApp.ssrContext.runtimeConfig.public,
			app: nuxtApp.ssrContext.runtimeConfig.app
		};
	}
	nuxtApp.hooks = createHooks();
	nuxtApp.hook = nuxtApp.hooks.hook;
	{
		const contextCaller = async function(hooks, args) {
			for (const hook of hooks) await nuxtApp.runWithContext(() => hook(...args));
		};
		nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, args);
	}
	nuxtApp.callHook = nuxtApp.hooks.callHook;
	nuxtApp.provide = (name, value) => {
		const $name = "$" + name;
		defineGetter(nuxtApp, $name, value);
		defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
	};
	defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
	defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
	const runtimeConfig = options.ssrContext.runtimeConfig;
	nuxtApp.provide("config", runtimeConfig);
	return nuxtApp;
}
/** @since 3.0.0 */
async function applyPlugin(nuxtApp, plugin) {
	if (typeof plugin === "function") {
		const run = () => nuxtApp.runWithContext(() => plugin(nuxtApp));
		const { provide } = await run() || {};
		if (provide && typeof provide === "object") for (const key in provide) nuxtApp.provide(key, provide[key]);
	}
}
/** @since 3.0.0 */
async function applyPlugins(nuxtApp, plugins) {
	let error;
	for (const plugin of plugins) try {
		await applyPlugin(nuxtApp, plugin);
	} catch (e) {
		if (!nuxtApp.payload.error) throw e;
		error ||= e;
	}
	if (error) throw nuxtApp.payload.error || error;
}
/** @since 3.0.0 */
/* @__NO_SIDE_EFFECTS__ */
function defineNuxtPlugin(plugin) {
	if (typeof plugin === "function") return plugin;
	const _name = plugin._name || plugin.name;
	delete plugin.name;
	return Object.assign(plugin.setup || (() => {}), plugin, {
		[NuxtPluginIndicator]: true,
		_name
	});
}
/**
* Ensures that the setup function passed in has access to the Nuxt instance via `useNuxtApp`.
* @param nuxt A Nuxt instance
* @param setup The function to call
* @since 3.0.0
*/
function callWithNuxt(nuxt, setup, args) {
	const fn = () => setup();
	const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
	return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
}
function tryUseNuxtApp(id) {
	let nuxtAppInstance;
	if (hasInjectionContext()) nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
	nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
	return nuxtAppInstance || null;
}
function useNuxtApp(id) {
	const nuxtAppInstance = tryUseNuxtApp(id);
	if (!nuxtAppInstance) throw appDiagnostics.NUXT_E1001();
	return nuxtAppInstance;
}
/** @since 3.0.0 */
/* @__NO_SIDE_EFFECTS__ */
function useRuntimeConfig(_event) {
	return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
	Object.defineProperty(obj, key, { get: () => val });
}
//#endregion
//#region node_modules/nuxt/dist/app/utils.js
globalThis._importMeta_.url.replace(/\/app\/.*$/, "/");
//#endregion
//#region node_modules/nuxt/dist/app/components/injections.js
var LayoutMetaSymbol = Symbol("layout-meta");
var LayoutSymbol = Symbol("layout");
var PageRouteSymbol = Symbol("route");
//#endregion
//#region node_modules/nuxt/dist/app/diagnostics/navigation.js
/**
* E2xxx
* Navigation / routing / middleware runtime diagnostics.
*/
var navigationDiagnostics = /* #__PURE__ */ defineProdDiagnostics({
	docsBase,
	reporters: prodReporters
});
//#endregion
//#region node_modules/nuxt/dist/app/composables/router.js
/** @since 3.0.0 */
var useRouter = () => {
	return useNuxtApp()?.$router;
};
/**
* Whether the current effect scope is (a descendant of) the component instance's scope.
* A detached scope (e.g. `createSharedComposable`) outlives the component, so the
* per-page route injected there would freeze after navigation (#18903).
*/
function isScopeWithinInstance(instance) {
	const instanceScope = instance.scope;
	let scope = getCurrentScope();
	while (scope) {
		if (scope === instanceScope) return true;
		scope = scope.parent;
	}
	return false;
}
/** @since 3.0.0 */
var useRoute = (() => {
	if (hasInjectionContext()) {
		const instance = getCurrentInstance();
		if (!instance || isScopeWithinInstance(instance)) return inject(PageRouteSymbol, useNuxtApp()._route);
	}
	return useNuxtApp()._route;
});
/** @since 3.0.0 */
/* @__NO_SIDE_EFFECTS__ */
function defineNuxtRouteMiddleware(middleware) {
	return middleware;
}
/** @since 3.0.0 */
var isProcessingMiddleware = () => {
	try {
		if (useNuxtApp()._processingMiddleware) return true;
	} catch {
		return false;
	}
	return false;
};
var HTML_ATTR_UNSAFE_RE = /[&"'<>]/g;
var HTML_ATTR_ENCODE_MAP = {
	"&": "&amp;",
	"\"": "&quot;",
	"'": "&#x27;",
	"<": "&lt;",
	">": "&gt;"
};
function encodeForHtmlAttr(value) {
	return value.replace(HTML_ATTR_UNSAFE_RE, (c) => HTML_ATTR_ENCODE_MAP[c]);
}
/**
* A helper that aids in programmatic navigation within your Nuxt application.
*
* Can be called on the server and on the client, within pages, route middleware, plugins, and more.
* @param {RouteLocationRaw | undefined | null} [to] - The route to navigate to. Accepts a route object, string path, `undefined`, or `null`. Defaults to '/'.
* @param {NavigateToOptions} [options] - Optional customization for controlling the behavior of the navigation.
* @returns {Promise<void | NavigationFailure | false> | false | void | RouteLocationRaw} The navigation result, which varies depending on context and options.
* @see https://nuxt.com/docs/4.x/api/utils/navigate-to
* @since 3.0.0
*/
var navigateTo = (to, options) => {
	to ||= "/";
	const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
	const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
	const isExternal = options?.external || isExternalHost;
	if (isExternal) {
		if (!options?.external) throw navigationDiagnostics.NUXT_E2001({ toPath });
		const { protocol } = new URL(toPath, "http://localhost");
		if (protocol && isScriptProtocol(protocol)) throw navigationDiagnostics.NUXT_E2002({
			toPath,
			protocol
		});
	}
	const inMiddleware = isProcessingMiddleware();
	const router = useRouter();
	const nuxtApp = useNuxtApp();
	if (nuxtApp.ssrContext) {
		const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
		const location = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
		const redirect = async function(response) {
			await nuxtApp.callHook("app:redirected");
			const encodedHeader = encodeURL(location, isExternalHost);
			const encodedLoc = encodeForHtmlAttr(encodedHeader);
			nuxtApp.ssrContext["~renderResponse"] = {
				statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
				body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
				headers: { location: encodedHeader }
			};
			return response;
		};
		if (!isExternal && inMiddleware) {
			router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
			return to;
		}
		return redirect(!inMiddleware ? void 0 : false);
	}
	if (isExternal) {
		nuxtApp._scope.stop();
		if (options?.replace) (void 0).replace(toPath);
		else (void 0).href = toPath;
		if (inMiddleware) {
			if (!nuxtApp.isHydrating) return false;
			return new Promise(() => {});
		}
		return Promise.resolve();
	}
	const encodedTo = typeof to === "string" ? encodeRoutePath(to) : to;
	return options?.replace ? router.replace(encodedTo) : router.push(encodedTo);
};
/**
* @internal
*/
function resolveRouteObject(to) {
	return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
/**
* @internal
*/
function encodeURL(location, isExternalHost = false) {
	const url = new URL(location, "http://localhost");
	if (!isExternalHost) return url.pathname.replace(/^\/{2,}/, "/") + url.search + url.hash;
	if (location.startsWith("//")) return url.toString().replace(url.protocol, "");
	return url.toString();
}
/**
* Encode the pathname of a route location string. Ensures decoded paths like
* `/café` are percent-encoded to match vue-router's encoded route records.
* Already-encoded paths are not double-encoded.
* @internal
*/
function encodeRoutePath(url) {
	const parsed = parseURL(url);
	return encodePath(decodePath(parsed.pathname)) + parsed.search + parsed.hash;
}
//#endregion
//#region node_modules/nuxt/dist/app/composables/error.js
var NUXT_ERROR_SIGNATURE = "__nuxt_error";
/** @since 3.0.0 */
var useError = /* @__NO_SIDE_EFFECTS__ */ () => toRef(useNuxtApp().payload, "error");
/** @since 3.0.0 */
var showError = (error) => {
	const nuxtError = createError$1(error);
	try {
		const error = /* @__PURE__ */ useError();
		error.value ||= nuxtError;
	} catch {
		throw nuxtError;
	}
	return nuxtError;
};
/** @since 3.0.0 */
var isNuxtError = (error) => !!error && typeof error === "object" && "__nuxt_error" in error;
/** @since 3.0.0 */
var createError$1 = (error) => {
	if (typeof error !== "string" && error.statusText) error.message ??= error.statusText;
	const nuxtError = createError(error);
	Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
		value: true,
		configurable: false,
		writable: false
	});
	Object.defineProperty(nuxtError, "status", {
		get: () => nuxtError.statusCode,
		configurable: true
	});
	Object.defineProperty(nuxtError, "statusText", {
		get: () => nuxtError.statusMessage,
		configurable: true
	});
	return nuxtError;
};
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Ffetch.mjs
if (!globalThis.$fetch) globalThis.$fetch = $fetch.create({ baseURL: baseURL() });
var $fetch$2 = globalThis.$fetch;
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Fglobal-polyfills.mjs
if (!("global" in globalThis)) globalThis.global = globalThis;
//#endregion
//#region node_modules/nuxt/dist/head/runtime/island-head.js
/**
* No-op `head.push` until the returned `unfreeze` runs. Plugin/transformer
* augmentations on the same head are unaffected.
*/
function freezeHead(head) {
	const realPush = head.push;
	head.push = () => ({
		dispose: () => {},
		patch: () => {},
		_i: 0
	});
	return () => {
		head.push = realPush;
	};
}
//#endregion
//#region node_modules/nuxt/dist/head/runtime/plugins/unhead.server.js
var plugin$2 = /* @__PURE__ */ defineNuxtPlugin({
	name: "nuxt:head",
	enforce: "pre",
	setup(nuxtApp) {
		const head = nuxtApp.ssrContext.head;
		if (nuxtApp.ssrContext.islandContext) {
			const unfreeze = freezeHead(head);
			nuxtApp.hooks.hookOnce("app:created", unfreeze);
		}
		nuxtApp.vueApp.use(head);
	}
});
//#endregion
//#region node_modules/nuxt/dist/app/diagnostics/manifest.js
/**
* E5xxx
* App manifest / route-rules runtime diagnostics.
*/
var manifestDiagnostics = /* #__PURE__ */ defineProdDiagnostics({
	docsBase,
	reporters: prodReporters
});
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Frouter.options.mjs
var virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Frouter_options_default = {};
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Froute-rules.mjs
var sensitiveMatcher = (m, p) => {
	return [];
};
var foldedMatcher = sensitiveMatcher;
var decodeRoutePath = function decodeRoutePath(path) {
	if (!path.includes("%")) return path;
	const queryIndex = path.indexOf("?");
	const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
	try {
		return queryIndex === -1 ? decodeURI(pathname) : decodeURI(pathname) + path.slice(queryIndex);
	} catch {
		return path;
	}
};
var normalizePath = (path, fold) => {
	if (typeof path !== "string") return path;
	const decoded = decodeRoutePath(path);
	return fold ? decoded.toLowerCase() : decoded;
};
var virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Froute_rules_default = (path) => virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Frouter_options_default.sensitive ? defu({}, ...sensitiveMatcher("", normalizePath(path, false)).map((r) => r.data).reverse()) : defu({}, ...foldedMatcher("", normalizePath(path, true)).map((r) => r.data).reverse());
//#endregion
//#region node_modules/nuxt/dist/app/composables/manifest.js
var routeRulesMatcher$1 = virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Froute_rules_default;
function getRouteRules(arg) {
	const path = typeof arg === "string" ? arg : arg.path;
	try {
		return routeRulesMatcher$1(path);
	} catch (e) {
		manifestDiagnostics.NUXT_E5003({
			path,
			cause: e
		});
		return {};
	}
}
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Fmiddleware.mjs
var globalMiddleware = [/* @__PURE__ */ defineNuxtRouteMiddleware((to) => {})];
//#endregion
//#region node_modules/nuxt/dist/app/plugins/router.js
function getRouteFromPath(fullPath) {
	const route = fullPath && typeof fullPath === "object" ? fullPath : {};
	if (typeof fullPath === "object") fullPath = stringifyParsedURL({
		pathname: fullPath.path || "",
		search: stringifyQuery(fullPath.query || {}),
		hash: fullPath.hash || ""
	});
	const url = new URL(fullPath.toString(), "http://localhost");
	return {
		path: url.pathname,
		fullPath,
		query: parseQuery(url.search),
		hash: url.hash,
		params: route.params || {},
		name: void 0,
		matched: route.matched || [],
		redirectedFrom: void 0,
		meta: route.meta || {},
		href: fullPath
	};
}
var plugin$1 = /* @__PURE__ */ defineNuxtPlugin({
	name: "nuxt:router",
	enforce: "pre",
	setup(nuxtApp) {
		const initialURL = nuxtApp.ssrContext.url;
		const routes = [];
		const hooks = {
			"navigate:before": [],
			"resolve:before": [],
			"navigate:after": [],
			"error": []
		};
		const registerHook = (hook, guard) => {
			hooks[hook].push(guard);
			return () => {
				const index = hooks[hook].indexOf(guard);
				if (index !== -1) hooks[hook].splice(index, 1);
			};
		};
		(/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
		const route = reactive(getRouteFromPath(initialURL));
		let navigationCounter = 0;
		async function handleNavigation(url, replace) {
			const navigationId = ++navigationCounter;
			try {
				const to = getRouteFromPath(url);
				for (const middleware of hooks["navigate:before"]) {
					const result = await middleware(to, route);
					if (navigationId !== navigationCounter) return;
					if (result === false || result instanceof Error) return;
					if (typeof result === "string" && result.length) return await handleNavigation(result, true);
				}
				for (const handler of hooks["resolve:before"]) {
					await handler(to, route);
					if (navigationId !== navigationCounter) return;
				}
				Object.assign(route, to);
				for (const middleware of hooks["navigate:after"]) await middleware(to, route);
			} catch (err) {
				for (const handler of hooks.error) await handler(err);
			}
		}
		const router = {
			currentRoute: computed(() => route),
			isReady: () => Promise.resolve(),
			options: {},
			install: () => Promise.resolve(),
			push: (url) => handleNavigation(url),
			replace: (url) => handleNavigation(url),
			back: () => (void 0).history.go(-1),
			go: (delta) => (void 0).history.go(delta),
			forward: () => (void 0).history.go(1),
			beforeResolve: (guard) => registerHook("resolve:before", guard),
			beforeEach: (guard) => registerHook("navigate:before", guard),
			afterEach: (guard) => registerHook("navigate:after", guard),
			onError: (handler) => registerHook("error", handler),
			resolve: getRouteFromPath,
			addRoute: (parentName, route) => {
				routes.push(route);
			},
			getRoutes: () => routes,
			hasRoute: (name) => routes.some((route) => route.name === name),
			removeRoute: (name) => {
				const index = routes.findIndex((route) => route.name === name);
				if (index !== -1) routes.splice(index, 1);
			}
		};
		nuxtApp.vueApp.component("RouterLink", defineComponent({
			functional: true,
			props: {
				to: {
					type: String,
					required: true
				},
				custom: Boolean,
				replace: Boolean,
				activeClass: String,
				exactActiveClass: String,
				ariaCurrentValue: String
			},
			setup: (props, { slots }) => {
				const navigate = () => handleNavigation(props.to, props.replace);
				return () => {
					const route = router.resolve(props.to);
					return props.custom ? slots.default?.({
						href: props.to,
						navigate,
						route
					}) : h("a", {
						href: props.to,
						onClick: (e) => {
							e.preventDefault();
							return navigate();
						}
					}, slots);
				};
			}
		}));
		nuxtApp._route = route;
		nuxtApp._middleware ||= {
			global: [],
			named: {}
		};
		const initialLayout = nuxtApp.payload.state._layout;
		const initialLayoutProps = nuxtApp.payload.state._layoutProps;
		nuxtApp.hooks.hookOnce("app:created", async () => {
			router.beforeEach(async (to, from) => {
				to.meta = reactive(to.meta || {});
				if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
					to.meta.layout = initialLayout;
					to.meta.layoutProps = initialLayoutProps;
				}
				nuxtApp._processingMiddleware = true;
				nuxtApp._middlewareTo = to;
				if (!nuxtApp.ssrContext?.islandContext) {
					const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
					const routeRules = getRouteRules({ path: to.path });
					if (routeRules.appMiddleware) for (const key in routeRules.appMiddleware) {
						const guard = nuxtApp._middleware.named[key];
						if (!guard) continue;
						if (routeRules.appMiddleware[key]) middlewareEntries.add(guard);
						else middlewareEntries.delete(guard);
					}
					for (const middleware of middlewareEntries) {
						const result = await nuxtApp.runWithContext(() => middleware(to, from));
						if (result === false || result instanceof Error) {
							const error = result || createError({
								status: 404,
								statusText: `Page Not Found: ${initialURL}`,
								data: { path: initialURL }
							});
							delete nuxtApp._processingMiddleware;
							delete nuxtApp._middlewareTo;
							return nuxtApp.runWithContext(() => showError(error));
						}
						if (result === true) continue;
						if (result || result === false) return result;
					}
				}
			});
			router.afterEach(() => {
				delete nuxtApp._processingMiddleware;
				delete nuxtApp._middlewareTo;
			});
			await router.replace(initialURL);
			if (!isEqual(route.fullPath, initialURL)) await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
		});
		return { provide: {
			route,
			router
		} };
	}
});
//#endregion
//#region node_modules/nuxt/dist/app/diagnostics/head.js
/**
* E6xxx
* Head / unhead runtime diagnostics.
*/
var unheadDiagnostics = /* #__PURE__ */ defineProdDiagnostics({
	docsBase,
	reporters: prodReporters
});
//#endregion
//#region node_modules/nuxt/dist/head/runtime/composables.js
/**
* Injects the head client from the Nuxt context or Vue inject.
*/
function injectHead(nuxtApp) {
	const nuxt = nuxtApp || useNuxtApp();
	return nuxt.ssrContext?.head || nuxt.runWithContext(() => {
		if (hasInjectionContext()) {
			const head = inject(headSymbol);
			if (!head) throw unheadDiagnostics.NUXT_E6001();
			return head;
		}
	});
}
function useHead$1(input, options = {}) {
	const head = options.head || injectHead(options.nuxt);
	return useHead(input, {
		head,
		...options
	});
}
//#endregion
//#region node_modules/nuxt/dist/app/diagnostics/state.js
/**
* E7xxx
* Payload / state / cookie runtime diagnostics.
*/
var stateDiagnostics = /* #__PURE__ */ defineProdDiagnostics({
	docsBase,
	reporters: prodReporters
});
//#endregion
//#region node_modules/nuxt/dist/app/composables/payload.js
/**
* This is an experimental function for configuring passing rich data from server -> client.
* @since 3.4.0
*/
function definePayloadReducer(name, reduce) {
	useNuxtApp().ssrContext["~payloadReducers"][name] = reduce;
}
//#endregion
//#region node_modules/nuxt/dist/app/plugins/revive-payload.server.js
var reducers = [
	["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
	["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
	["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
	["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
	["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
	["Ref", (data) => isRef(data) && data.value],
	["Reactive", (data) => isReactive(data) && toRaw(data)]
];
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Fplugins.server.mjs
var virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Fplugins_server_default = [
	plugin$2,
	plugin$1,
	/* @__PURE__ */ defineNuxtPlugin({
		name: "nuxt:revive-payload:server",
		setup() {
			for (const [reducer, fn] of reducers) definePayloadReducer(reducer, fn);
		}
	}),
	/* @__PURE__ */ defineNuxtPlugin({ name: "nuxt:global-components" })
];
//#endregion
//#region node_modules/nuxt/dist/app/components/utils.js
/**
* Internal utility
* @private
*/
var _wrapInTransition = (props, children) => {
	return { default: () => children.default?.() };
};
var VALID_TAG_RE = /^[a-z][a-z0-9-]*$/i;
/** Return `tag` if it is a safe HTML tag name, otherwise `fallback`. */
function sanitizeTag(tag, fallback) {
	return tag && VALID_TAG_RE.test(tag) ? tag : fallback;
}
function toArray(value) {
	return Array.isArray(value) ? value : [value];
}
/**
* Internal utility
* @private
*/
function _mergeTransitionProps(routeProps) {
	const _props = [];
	for (const prop of routeProps) {
		if (!prop) continue;
		_props.push({
			...prop,
			onAfterLeave: prop.onAfterLeave ? toArray(prop.onAfterLeave) : void 0,
			onBeforeLeave: prop.onBeforeLeave ? toArray(prop.onBeforeLeave) : void 0
		});
	}
	return defu(..._props);
}
//#endregion
//#region node_modules/nuxt/dist/app/composables/layout.js
var routeRulesMatcher = virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Froute_rules_default;
function resolveLayoutName(route, name) {
	return unref(name) ?? route?.meta.layout ?? routeRulesMatcher(route?.path ?? "/").appLayout ?? "default";
}
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Flayouts.mjs
var virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Flayouts_default = { default: defineAsyncComponent(() => import('../build/default-DM1eZmtw.mjs').then((m) => m.default || m)) };
//#endregion
//#region node_modules/nuxt/dist/app/components/nuxt-layout.js
var LayoutLoader = defineComponent({
	name: "LayoutLoader",
	inheritAttrs: false,
	props: {
		name: String,
		layoutProps: Object
	},
	setup(props, context) {
		return () => h(virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Flayouts_default[props.name], props.layoutProps, context.slots);
	}
});
var nuxt_layout_default = defineComponent({
	name: "NuxtLayout",
	inheritAttrs: false,
	props: {
		name: {
			type: [
				String,
				Boolean,
				Object
			],
			default: null
		},
		fallback: {
			type: [String, Object],
			default: null
		}
	},
	setup(props, context) {
		const nuxtApp = useNuxtApp();
		const injectedRoute = inject(PageRouteSymbol);
		const route = !injectedRoute || injectedRoute === useRoute() ? useRoute() : injectedRoute;
		const layout = computed(() => {
			let layout = resolveLayoutName(route, props.name);
			if (layout && !(layout in virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Flayouts_default)) {
				if (props.fallback) layout = unref(props.fallback);
			}
			return layout;
		});
		provide(LayoutSymbol, layout);
		const layoutRef = shallowRef();
		context.expose({ layoutRef });
		const done = nuxtApp.deferHydration();
		let lastLayout;
		return () => {
			const hasTransition = !!layout.value && layout.value in virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Flayouts_default && !!(route?.meta.layoutTransition ?? false);
			const transitionProps = hasTransition && _mergeTransitionProps([
				route?.meta.layoutTransition,
				false,
				{
					onBeforeLeave() {
						nuxtApp["~transitionPromise"] = new Promise((resolve) => {
							nuxtApp["~transitionFinish"] = resolve;
						});
					},
					onAfterLeave() {
						nuxtApp["~transitionFinish"]?.();
						delete nuxtApp["~transitionFinish"];
						delete nuxtApp["~transitionPromise"];
					}
				}
			]);
			const previouslyRenderedLayout = lastLayout;
			lastLayout = layout.value;
			return _wrapInTransition(transitionProps, { default: () => h(Suspense, {
				suspensible: true,
				onResolve: async () => {
					await nextTick(done);
				}
			}, { default: () => h(LayoutProvider, {
				layoutProps: mergeProps(context.attrs, route.meta.layoutProps ?? {}, { ref: layoutRef }),
				key: layout.value || void 0,
				name: layout.value,
				shouldProvide: !props.name,
				isRenderingNewLayout: (name) => {
					return name !== previouslyRenderedLayout && name === layout.value;
				},
				hasTransition
			}, context.slots) }) }).default();
		};
	}
});
var LayoutProvider = defineComponent({
	name: "NuxtLayoutProvider",
	inheritAttrs: false,
	props: {
		name: { type: [String, Boolean] },
		layoutProps: { type: Object },
		hasTransition: { type: Boolean },
		shouldProvide: { type: Boolean },
		isRenderingNewLayout: {
			type: Function,
			required: true
		}
	},
	setup(props, context) {
		const name = props.name;
		if (props.shouldProvide) provide(LayoutMetaSymbol, { isCurrent: (route) => name === false || name === resolveLayoutName(route) });
		const injectedRoute = inject(PageRouteSymbol);
		const isNotWithinNuxtPage = injectedRoute && injectedRoute === useRoute();
		const enclosingLayout = inject(LayoutMetaSymbol, null);
		if (isNotWithinNuxtPage) {
			const vueRouterRoute = useRoute();
			const reactiveChildRoute = {};
			for (const _key in vueRouterRoute) {
				const key = _key;
				Object.defineProperty(reactiveChildRoute, key, {
					enumerable: true,
					get: () => {
						return props.isRenderingNewLayout(props.name) && (!enclosingLayout || enclosingLayout.isCurrent(vueRouterRoute)) ? vueRouterRoute[key] : injectedRoute[key];
					}
				});
			}
			provide(PageRouteSymbol, shallowReactive(reactiveChildRoute));
		}
		return () => {
			if (!name || typeof name === "string" && !(name in virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Flayouts_default)) return context.slots.default?.();
			return h(LayoutLoader, {
				key: name,
				layoutProps: props.layoutProps,
				name
			}, context.slots);
		};
	}
});
//#endregion
//#region components/PasswordInput.vue?vue&type=script&setup=true&lang.ts
var PasswordInput_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "PasswordInput",
	__ssrInlineRender: true,
	props: {
		modelValue: {},
		placeholder: { default: "••••••••" },
		autocomplete: { default: "current-password" },
		required: {
			type: Boolean,
			default: false
		},
		id: {}
	},
	emits: ["update:modelValue"],
	setup(__props) {
		const visible = ref(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "relative" }, _attrs))}><input${ssrRenderAttr("id", __props.id)}${ssrRenderAttr("type", visible.value ? "text" : "password")}${ssrRenderAttr("value", __props.modelValue)}${ssrRenderAttr("placeholder", __props.placeholder)}${ssrRenderAttr("autocomplete", __props.autocomplete)}${ssrIncludeBooleanAttr(__props.required) ? " required" : ""} class="input-field pr-11"><button type="button" tabindex="-1" class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-cyan-dark transition-colors"${ssrRenderAttr("aria-label", visible.value ? "Hide password" : "Show password")}${ssrRenderAttr("aria-pressed", visible.value)}>`);
			if (!visible.value) _push(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`);
			else _push(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.5 18.5 0 0 0 2 12s3.5 7 10 7a9.12 9.12 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`);
			_push(`</button></div>`);
		};
	}
});
//#endregion
//#region components/PasswordInput.vue
var _sfc_setup$27 = PasswordInput_vue_vue_type_script_setup_true_lang_default.setup;
PasswordInput_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PasswordInput.vue");
	return _sfc_setup$27 ? _sfc_setup$27(props, ctx) : void 0;
};
var PasswordInput_default = Object.assign(PasswordInput_vue_vue_type_script_setup_true_lang_default, { __name: "PasswordInput" });
//#endregion
//#region node_modules/nuxt/dist/app/composables/state.js
var useStateKeyPrefix = "$s";
function useState(...args) {
	const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
	if (typeof args[0] !== "string") args.unshift(autoKey);
	const [_key, init] = args;
	if (!_key || typeof _key !== "string") throw stateDiagnostics.NUXT_E7009({ key: _key });
	if (init !== void 0 && typeof init !== "function") throw stateDiagnostics.NUXT_E7007({ type: typeof init });
	const key = useStateKeyPrefix + _key;
	const nuxtApp = useNuxtApp();
	const state = toRef(nuxtApp.payload.state, key);
	if (init) nuxtApp._state[key] ??= { _default: init };
	if (state.value === void 0 && init) {
		const initialValue = init();
		if (isRef(initialValue)) {
			nuxtApp.payload.state[key] = initialValue;
			return initialValue;
		}
		state.value = initialValue;
	}
	return state;
}
//#endregion
//#region node_modules/nuxt/dist/app/utils/hash.js
/**
* Hash an arbitrary value into a short, stable string key.
*
* Values are serialized to a canonical, locale-independent representation
* (equal structures hash equally regardless of key order or runtime locale),
* then digested with a fast non-cryptographic hash. This is what `useFetch` and
* `useAsyncData` use internally to derive their cache keys, so it is safe to use
* for the same purpose in your own code.
*
* The digest is non-cryptographic and must not be used for integrity checks.
*
* @since 4.5.0
*/
function hashKey(value) {
	return fnv1a64Base36(identify(value));
}
//#endregion
//#region node_modules/nuxt/dist/app/utils/debounce-tick.js
/**
* Debounce an async function so that repeated calls within the same tick are
* collapsed into a single call (plus a trailing call if arguments arrived
* while the debounced call was still pending).
*
* Adapted from https://github.com/unjs/perfect-debounce with the timeout
* replaced by Vue's post-flush callback queue.
*/
function debounceTick(fn, options = {}) {
	let leadingValue;
	let active = false;
	let resolveList = [];
	let currentPromise;
	let trailingArgs;
	const applyFn = (_this, args) => {
		const promise = _applyPromised(fn, _this, args);
		currentPromise = promise;
		promise.finally(() => {
			currentPromise = void 0;
			if (trailingArgs && !active) {
				const args = trailingArgs;
				trailingArgs = void 0;
				applyFn(_this, args);
			}
		});
		return promise;
	};
	return function(...args) {
		trailingArgs = args;
		if (currentPromise) return currentPromise;
		return new Promise((resolve) => {
			const shouldCallNow = options.leading && !active;
			if (!active) {
				active = true;
				queuePostFlushCb(() => {
					active = false;
					const flushArgs = trailingArgs ?? args;
					trailingArgs = void 0;
					const promise = options.leading ? leadingValue : applyFn(this, flushArgs);
					for (const _resolve of resolveList) _resolve(promise);
					resolveList = [];
				});
			}
			if (shouldCallNow) {
				leadingValue = applyFn(this, args);
				resolve(leadingValue);
			} else resolveList.push(resolve);
		});
	};
}
async function _applyPromised(fn, _this, args) {
	return await fn.apply(_this, args);
}
defineComponent({
	name: "ServerPlaceholder",
	render() {
		return createElementBlock("div");
	}
});
//#endregion
//#region node_modules/nuxt/dist/app/components/client-only.js
var clientOnlySymbol = Symbol.for("nuxt:client-only");
defineComponent({
	name: "ClientOnly",
	inheritAttrs: false,
	props: [
		"fallback",
		"placeholder",
		"placeholderTag",
		"fallbackTag"
	],
	setup(props, { slots, attrs }) {
		const mounted = shallowRef(false);
		const vm = getCurrentInstance();
		if (vm) vm._nuxtClientOnly = true;
		provide(clientOnlySymbol, true);
		return () => {
			if (mounted.value) {
				const vnodes = slots.default?.();
				if (vnodes && vnodes.length === 1) return [cloneVNode(vnodes[0], attrs)];
				return vnodes;
			}
			const slot = slots.fallback || slots.placeholder;
			if (slot) return h(slot);
			const fallbackStr = props.fallback || props.placeholder || "";
			const fallbackTag = sanitizeTag(props.fallbackTag || props.placeholderTag, "span");
			return createElementBlock(fallbackTag, attrs, fallbackStr);
		};
	}
});
//#endregion
//#region node_modules/nuxt/dist/compiler/runtime/index.js
/**
* Define a factory for a function that should be registered for automatic key injection.
* @since 4.2.0
* @param factory
*/
function defineKeyedFunctionFactory(factory) {
	const placeholder = function() {
		throw appDiagnostics.NUXT_E1007({ name: factory.name });
	};
	return Object.defineProperty(placeholder, "__nuxt_factory", {
		enumerable: false,
		get: () => factory.factory
	});
}
//#endregion
//#region node_modules/nuxt/dist/app/diagnostics/data.js
/**
* E3xxx
* Data fetching (useFetch / useAsyncData) runtime diagnostics.
*/
var dataDiagnostics = /* #__PURE__ */ defineProdDiagnostics({
	docsBase,
	reporters: prodReporters
});
//#endregion
//#region node_modules/nuxt/dist/app/composables/asyncData.js
var createUseAsyncData = defineKeyedFunctionFactory({
	name: "createUseAsyncData",
	factory(options = {}) {
		function useAsyncData(...args) {
			const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
			if (_isAutoKeyNeeded(args[0], args[1])) args.unshift(autoKey);
			let [_key, _handler, opts = {}] = args;
			const key = isRef(_key) || typeof _key === "function" ? computed(() => toValue(_key)) : { value: _key };
			if (!key.value || typeof key.value !== "string") throw dataDiagnostics.NUXT_E3008();
			if (typeof _handler !== "function") throw dataDiagnostics.NUXT_E3009();
			const shouldFactoryOptionsOverride = typeof options === "function";
			const nuxtApp = useNuxtApp();
			const factoryOptions = shouldFactoryOptionsOverride ? options(opts) : options;
			if (!shouldFactoryOptionsOverride) for (const key in factoryOptions) {
				if (factoryOptions[key] === void 0) continue;
				if (opts[key] !== void 0) continue;
				opts[key] = factoryOptions[key];
			}
			opts.server ??= true;
			opts.default ??= getDefault;
			opts.getCachedData ??= getDefaultCachedData;
			opts.lazy ??= false;
			opts.immediate ??= true;
			opts.deep ??= asyncDataDefaults.deep;
			opts.dedupe ??= "cancel";
			opts.enabled ??= true;
			if (shouldFactoryOptionsOverride) for (const key in factoryOptions) {
				if (factoryOptions[key] === void 0) continue;
				opts[key] = factoryOptions[key];
			}
			nuxtApp._asyncData[key.value];
			function createInitialFetch() {
				const initialFetchOptions = {
					cause: "initial",
					dedupe: opts.dedupe
				};
				const existing = nuxtApp._asyncData[key.value];
				if (!existing?._init) {
					initialFetchOptions.cachedData = opts.getCachedData(key.value, nuxtApp, { cause: "initial" });
					nuxtApp._asyncData[key.value] = buildAsyncData(nuxtApp, key.value, _handler, opts, initialFetchOptions.cachedData);
					nuxtApp._asyncData[key.value]._initialCachedData = initialFetchOptions.cachedData;
				} else if (nuxtApp._asyncDataPromises[key.value]) initialFetchOptions.cachedData = existing._initialCachedData;
				return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
			}
			const initialFetch = createInitialFetch();
			const asyncData = nuxtApp._asyncData[key.value];
			asyncData._deps++;
			if (opts.server !== false && nuxtApp.payload.serverRendered && opts.immediate) {
				const promise = initialFetch();
				if (getCurrentInstance()) onServerPrefetch(() => promise);
				else nuxtApp.hook("app:created", async () => {
					await promise;
				});
			}
			const asyncReturn = {
				data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
				pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
				status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
				error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
				refresh: (...args) => {
					if (!nuxtApp._asyncData[key.value]?._init) return createInitialFetch()();
					return nuxtApp._asyncData[key.value].execute(...args);
				},
				execute: (...args) => asyncReturn.refresh(...args),
				clear: () => {
					const entry = nuxtApp._asyncData[key.value];
					if (entry?._abortController) try {
						entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
					} finally {
						entry._abortController = void 0;
					}
					clearNuxtDataByKey(nuxtApp, key.value);
				}
			};
			const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
			Object.assign(asyncDataPromise, asyncReturn);
			Object.defineProperties(asyncDataPromise, {
				then: {
					enumerable: true,
					value: asyncDataPromise.then.bind(asyncDataPromise)
				},
				catch: {
					enumerable: true,
					value: asyncDataPromise.catch.bind(asyncDataPromise)
				},
				finally: {
					enumerable: true,
					value: asyncDataPromise.finally.bind(asyncDataPromise)
				}
			});
			return asyncDataPromise;
		}
		return useAsyncData;
	}
});
var useAsyncData = createUseAsyncData.__nuxt_factory();
createUseAsyncData.__nuxt_factory({
	lazy: true,
	_functionName: "useLazyAsyncData"
});
function writableComputedRef(getter) {
	return computed({
		get() {
			return getter()?.value;
		},
		set(value) {
			const ref = getter();
			if (ref) ref.value = value;
		}
	});
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
	if (typeof keyOrFetcher === "string") return false;
	if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) return false;
	if (typeof keyOrFetcher === "function" && typeof fetcher === "function") return false;
	return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
	delete nuxtApp.payload.data[key];
	delete nuxtApp.payload._errors[key];
	if (nuxtApp._asyncData[key]) {
		nuxtApp._asyncData[key].data.value = unref(nuxtApp._asyncData[key]._default());
		nuxtApp._asyncData[key].error.value = void 0;
		nuxtApp._asyncData[key].status.value = "idle";
		nuxtApp._asyncData[key]._initialCachedData = void 0;
	}
	delete nuxtApp._asyncDataPromises[key];
}
function pick(obj, keys) {
	const newObj = {};
	for (const key of keys) newObj[key] = obj[key];
	return newObj;
}
function buildAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
	nuxtApp.payload._errors[key] ??= void 0;
	const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
	const handler = _handler ;
	const _ref = options.deep ? ref : shallowRef;
	const hasCachedData = initialCachedData !== void 0;
	const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
		if (!keys || keys.includes(key)) await asyncData.execute({ cause: "refresh:hook" });
	});
	const asyncData = {
		data: _ref(hasCachedData ? initialCachedData : options.default()),
		pending: computed(() => asyncData.status.value === "pending"),
		error: toRef(nuxtApp.payload._errors, key),
		status: shallowRef("idle"),
		execute: (...args) => {
			const [_opts, newValue = void 0] = args;
			const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
			if (nuxtApp._asyncDataPromises[key]) {
				if ((opts.dedupe ?? options.dedupe) === "defer") return nuxtApp._asyncDataPromises[key];
			}
			{
				const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
				if (cachedData !== void 0) {
					nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
					asyncData.error.value = void 0;
					asyncData.status.value = "success";
					return Promise.resolve(cachedData);
				}
			}
			if (toValue(options.enabled) === false) return Promise.resolve(asyncData.data.value);
			if (asyncData._abortController) asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
			asyncData._abortController = new AbortController();
			asyncData.status.value = "pending";
			const cleanupController = new AbortController();
			const promise = new Promise((resolve, reject) => {
				try {
					const timeout = opts.timeout ?? options.timeout;
					const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
					if (mergedSignal.aborted) {
						const reason = mergedSignal.reason;
						reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
						return;
					}
					mergedSignal.addEventListener("abort", () => {
						const reason = mergedSignal.reason;
						reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
					}, {
						once: true,
						signal: cleanupController.signal
					});
					return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
				} catch (err) {
					reject(err);
				}
			}).then(async (_result) => {
				if (nuxtApp._asyncDataPromises[key] !== promise) return;
				let result = _result;
				if (options.transform) result = await options.transform(_result);
				if (options.pick) result = pick(result, options.pick);
				nuxtApp.payload.data[key] = result;
				asyncData.data.value = result;
				asyncData.error.value = void 0;
				asyncData.status.value = "success";
			}).catch((error) => {
				if (nuxtApp._asyncDataPromises[key] !== promise) return nuxtApp._asyncDataPromises[key];
				if (asyncData._abortController?.signal.aborted) return nuxtApp._asyncDataPromises[key];
				if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
					asyncData.status.value = "idle";
					return nuxtApp._asyncDataPromises[key];
				}
				asyncData.error.value = createError$1(error);
				asyncData.data.value = unref(options.default());
				asyncData.status.value = "error";
			}).finally(() => {
				cleanupController.abort();
				if (nuxtApp._asyncDataPromises[key] === promise) delete nuxtApp._asyncDataPromises[key];
			});
			nuxtApp._asyncDataPromises[key] = promise;
			return nuxtApp._asyncDataPromises[key];
		},
		_execute: debounceTick((...args) => asyncData.execute(...args)),
		_default: options.default,
		_deps: 0,
		_init: true,
		_hash: void 0,
		_off: () => {
			unsubRefreshAsyncData();
			if (nuxtApp._asyncData[key]?._init) nuxtApp._asyncData[key]._init = false;
			if (nuxtApp._asyncDataPromises[key]) {
				asyncData._abortController?.abort(new DOMException("AsyncData request cancelled by unmount", "AbortError"));
				delete nuxtApp._asyncDataPromises[key];
				if (asyncData.status.value === "pending") asyncData.status.value = "idle";
			}
			if (!hasCustomGetCachedData) nextTick(() => {
				if (!nuxtApp._asyncData[key]?._init) {
					clearNuxtDataByKey(nuxtApp, key);
					asyncData.execute = () => Promise.resolve();
				}
			});
		}
	};
	return asyncData;
}
var getDefault = () => void 0;
var getDefaultCachedData = (key, nuxtApp, ctx) => {
	if (nuxtApp.isHydrating) return nuxtApp.payload.data[key];
	if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") return nuxtApp.static.data[key];
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
	const list = signals.filter((s) => !!s);
	if (typeof timeout === "number" && timeout >= 0) {
		const timeoutSignal = AbortSignal.timeout?.(timeout);
		if (timeoutSignal) list.push(timeoutSignal);
	}
	if (AbortSignal.any) return AbortSignal.any(list);
	const controller = new AbortController();
	for (const sig of list) if (sig.aborted) {
		const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
		try {
			controller.abort(reason);
		} catch {
			controller.abort();
		}
		return controller.signal;
	}
	const onAbort = () => {
		const reason = list.find((s) => s.aborted)?.reason ?? new DOMException("Aborted", "AbortError");
		try {
			controller.abort(reason);
		} catch {
			controller.abort();
		}
	};
	for (const sig of list) sig.addEventListener?.("abort", onAbort, {
		once: true,
		signal: cleanupSignal
	});
	return controller.signal;
}
//#endregion
//#region node_modules/nuxt/dist/app/composables/ssr.js
var $fetch$1$1 = $fetch$2;
/** @since 3.0.0 */
function useRequestEvent(nuxtApp) {
	nuxtApp ||= useNuxtApp();
	return nuxtApp.ssrContext?.event;
}
/** @since 3.2.0 */
function useRequestFetch() {
	return useRequestEvent()?.$fetch || $fetch$1$1;
}
//#endregion
//#region node_modules/nuxt/dist/app/composables/fetch.js
var $fetch$1 = $fetch$2;
var MAYBE_REF_OR_GETTER_OPTION_KEYS = [
	"method",
	"baseURL",
	"query",
	"params",
	"body",
	"headers"
];
function generateOptionSegments(opts) {
	const segments = [toValue(opts.method)?.toUpperCase() || "GET", toValue(opts.baseURL)];
	for (const _obj of [opts.query || opts.params]) {
		const obj = toValue(_obj);
		if (!obj) continue;
		const unwrapped = {};
		for (const [key, value] of Object.entries(obj)) unwrapped[toValue(key)] = toValue(value);
		segments.push(unwrapped);
	}
	if (opts.body) {
		const value = toValue(opts.body);
		if (!value) segments.push(hashKey(value));
		else if (value instanceof ArrayBuffer) segments.push(hashKey(Object.fromEntries([...new Uint8Array(value).entries()].map(([k, v]) => [k, v.toString()]))));
		else if (value instanceof FormData) {
			const entries = [];
			for (const entry of value.entries()) {
				const [key, val] = entry;
				entries.push([key, val instanceof File ? `${val.name}:${val.size}:${val.lastModified}` : val]);
			}
			segments.push(hashKey(entries));
		} else if (isPlainObject(value)) segments.push(hashKey(reactive(value)));
		else try {
			segments.push(hashKey(value));
		} catch {
			dataDiagnostics.NUXT_E3002({ cause: value });
		}
	}
	return segments;
}
/**
* A factory function to create a custom `useFetch` composable with pre-defined default options.
* @since 4.2.0
*/
var createUseFetch = defineKeyedFunctionFactory({
	name: "createUseFetch",
	factory(options = {}) {
		function useFetch(request, arg1, arg2) {
			const [opts = {}, autoKey] = typeof arg1 === "string" ? [{}, arg1] : [arg1, arg2];
			const factoryOptions = typeof options === "function" ? options(opts) : options;
			const { server, lazy, default: defaultFn, transform, pick, watch: watchSources, immediate, getCachedData, deep, dedupe, timeout, enabled, ...fetchOptions } = {
				...typeof options === "function" ? {} : factoryOptions,
				...opts,
				...typeof options === "function" ? factoryOptions : {}
			};
			const _request = computed(() => toValue(request));
			const key = computed(() => toValue(fetchOptions.key) || "$f" + hashKey([
				autoKey,
				typeof _request.value === "string" ? _request.value : "",
				...generateOptionSegments(fetchOptions)
			]));
			if (!fetchOptions.baseURL && typeof _request.value === "string" && _request.value[0] === "/" && _request.value[1] === "/") throw dataDiagnostics.NUXT_E3001({ url: _request.value });
			const _fetchOptions = reactive({
				...fetchDefaults,
				...fetchOptions,
				cache: typeof fetchOptions.cache === "boolean" ? void 0 : fetchOptions.cache
			});
			const _asyncDataOptions = {
				server,
				lazy,
				default: defaultFn,
				transform,
				pick,
				immediate,
				getCachedData,
				deep,
				dedupe,
				timeout,
				enabled,
				watch: watchSources === false ? [] : [...watchSources || [], _fetchOptions]
			};
			if (watchSources === false) _asyncDataOptions._keyTriggersExecute = false;
			return useAsyncData(key, (_, { signal }) => {
				let _$fetch = fetchOptions.$fetch || $fetch$1;
				if (!fetchOptions.$fetch) {
					if (typeof _request.value === "string" && _request.value[0] === "/" && (!toValue(fetchOptions.baseURL) || toValue(fetchOptions.baseURL)[0] === "/")) _$fetch = useRequestFetch();
				}
				const resolvedOptions = {
					signal,
					..._fetchOptions
				};
				for (const key of MAYBE_REF_OR_GETTER_OPTION_KEYS) if (typeof resolvedOptions[key] === "function") resolvedOptions[key] = toValue(resolvedOptions[key]);
				return _$fetch(_request.value, resolvedOptions);
			}, _asyncDataOptions);
		}
		return useFetch;
	}
});
createUseFetch.__nuxt_factory();
createUseFetch.__nuxt_factory({
	lazy: true,
	_functionName: "useLazyFetch"
});
//#endregion
//#region node_modules/nuxt/dist/app/components/nuxt-link.js
var firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
/**
* Reject URL strings that would resolve to a script-capable protocol when used as the
* `href` of an anchor element. Returns the value unchanged when safe, or `null`.
*
* The denylist is delegated to `ufo`'s `isScriptProtocol` so it stays in sync with the
* check used by `navigateTo` (currently `javascript:`, `data:`, `vbscript:`, `blob:`).
* ASCII whitespace and control characters are stripped first because browser URL
* parsers tolerate them before the scheme, and `view-source:` is peeled recursively
* because Chromium resolves it transparently to the inner URL.
*/
function sanitizeExternalHref(value) {
	let candidate = value.replace(/[\u0000-\u001F\s]+/g, "");
	while (candidate.toLowerCase().startsWith("view-source:")) candidate = candidate.slice(12);
	const colon = candidate.indexOf(":");
	if (colon > 0 && isScriptProtocol(candidate.slice(0, colon + 1))) return null;
	return value;
}
/* @__NO_SIDE_EFFECTS__ */
function defineNuxtLink(options) {
	const componentName = options.componentName || "NuxtLink";
	function isHashLinkWithoutHashMode(link) {
		return typeof link === "string" && link.startsWith("#");
	}
	function resolveTrailingSlashBehavior(to, resolve, trailingSlash) {
		const effectiveTrailingSlash = trailingSlash ?? options.trailingSlash;
		if (!to || effectiveTrailingSlash !== "append" && effectiveTrailingSlash !== "remove") return to;
		if (typeof to === "string") return applyTrailingSlashBehavior(to, effectiveTrailingSlash);
		const path = "path" in to && to.path !== void 0 ? to.path : resolve(to).path;
		return {
			...to,
			name: void 0,
			path: applyTrailingSlashBehavior(path, effectiveTrailingSlash)
		};
	}
	function useNuxtLink(props) {
		const router = useRouter();
		const config = /* @__PURE__ */ useRuntimeConfig();
		const hasTarget = computed(() => !!unref(props.target) && unref(props.target) !== "_self");
		const isAbsoluteUrl = computed(() => {
			const path = unref(props.to) || unref(props.href) || "";
			return typeof path === "string" && hasProtocol(path, { acceptRelative: true });
		});
		const builtinRouterLink = resolveComponent("RouterLink");
		const useBuiltinLink = builtinRouterLink && typeof builtinRouterLink !== "string" ? builtinRouterLink.useLink : void 0;
		const isExternal = computed(() => {
			if (unref(props.external)) return true;
			const path = unref(props.to) || unref(props.href) || "";
			if (typeof path === "object") return false;
			return path === "" || isAbsoluteUrl.value;
		});
		const to = computed(() => {
			const path = unref(props.to) || unref(props.href) || "";
			if (isExternal.value) return path;
			return resolveTrailingSlashBehavior(path, router.resolve, unref(props.trailingSlash));
		});
		const link = isExternal.value ? void 0 : useBuiltinLink?.({
			...props,
			to,
			viewTransition: unref(props.viewTransition)
		});
		const href = computed(() => {
			const effectiveTrailingSlash = unref(props.trailingSlash) ?? options.trailingSlash;
			if (!to.value || isAbsoluteUrl.value || isHashLinkWithoutHashMode(to.value)) {
				const raw = to.value;
				return typeof raw === "string" ? sanitizeExternalHref(raw) : raw;
			}
			if (isExternal.value) {
				const path = typeof to.value === "object" && "path" in to.value ? resolveRouteObject(to.value) : to.value;
				const href = typeof path === "object" ? router.resolve(path).href : path;
				const safe = typeof href === "string" ? sanitizeExternalHref(href) : href;
				return safe === null ? null : applyTrailingSlashBehavior(safe, effectiveTrailingSlash);
			}
			if (typeof to.value === "object") return router.resolve(to.value)?.href ?? null;
			return applyTrailingSlashBehavior(joinURL(config.app.baseURL, to.value), effectiveTrailingSlash);
		});
		return {
			to,
			hasTarget,
			isAbsoluteUrl,
			isExternal,
			href,
			isActive: link?.isActive ?? computed(() => to.value === router.currentRoute.value.path),
			isExactActive: link?.isExactActive ?? computed(() => to.value === router.currentRoute.value.path),
			route: link?.route ?? computed(() => router.resolve(to.value)),
			async navigate(_e) {
				if (href.value === null) return;
				await navigateTo(href.value, {
					replace: unref(props.replace),
					external: isExternal.value || hasTarget.value
				});
			}
		};
	}
	return defineComponent({
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
			prefetch: {
				type: Boolean,
				default: void 0,
				required: false
			},
			prefetchOn: {
				type: [String, Object],
				default: void 0,
				required: false
			},
			noPrefetch: {
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
			prefetchedClass: {
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
			},
			trailingSlash: {
				type: String,
				default: void 0,
				required: false
			}
		},
		useLink: useNuxtLink,
		setup(props, { slots }) {
			const router = useRouter();
			const { to, href, navigate, isExternal, hasTarget, isAbsoluteUrl } = useNuxtLink(props);
			const prefetched = shallowRef(false);
			const el = void 0;
			const elRef = void 0;
			function shouldPrefetch(mode) {
				return false;
			}
			async function prefetch(nuxtApp = useNuxtApp()) {}
			return () => {
				const target = props.target || null;
				const rel = firstNonUndefined(props.noRel ? "" : props.rel, options.externalRelAttribute, isAbsoluteUrl.value || hasTarget.value ? "noopener noreferrer" : "") || null;
				const getCustomSlotProps = (routerLinkSlotProps) => ({
					href: href.value,
					navigate,
					get route() {
						if (!href.value) return;
						const url = new URL(href.value, "http://localhost");
						return {
							path: url.pathname,
							fullPath: url.pathname,
							get query() {
								return parseQuery(url.search);
							},
							hash: url.hash,
							params: {},
							name: void 0,
							matched: [],
							redirectedFrom: void 0,
							meta: {},
							href: href.value
						};
					},
					rel,
					target,
					isExternal: isExternal.value || hasTarget.value,
					isActive: false,
					isExactActive: false,
					...routerLinkSlotProps,
					prefetch,
					prefetched: prefetched.value,
					shouldPrefetch
				});
				if (!isExternal.value && !hasTarget.value && !isHashLinkWithoutHashMode(to.value)) {
					const routerLinkProps = {
						ref: elRef,
						to: to.value,
						activeClass: props.activeClass || options.activeClass,
						exactActiveClass: props.exactActiveClass || options.exactActiveClass,
						replace: props.replace,
						ariaCurrentValue: props.ariaCurrentValue,
						custom: props.custom
					};
					if (!props.custom) routerLinkProps.rel = props.rel || void 0;
					return h(resolveComponent("RouterLink"), routerLinkProps, props.custom && slots.default ? { default: (slotProps) => slots.default(getCustomSlotProps(slotProps)) } : slots.default);
				}
				if (props.custom) {
					if (!slots.default) return null;
					return slots.default(getCustomSlotProps());
				}
				return h("a", {
					ref: el,
					href: href.value || null,
					rel,
					target,
					onClick: async (event) => {
						if (isExternal.value || hasTarget.value) return;
						event.preventDefault();
						try {
							const encodedHref = encodeRoutePath(href.value ?? "");
							return await (props.replace ? router.replace(encodedHref) : router.push(encodedHref));
						} finally {}
					}
				}, slots.default?.());
			};
		}
	});
}
var NuxtLink = /* @__PURE__ */ defineNuxtLink(nuxtLinkDefaults);
function applyTrailingSlashBehavior(to, trailingSlash) {
	if (trailingSlash !== "append" && trailingSlash !== "remove") return to;
	const normalizeFn = trailingSlash === "append" ? withTrailingSlash : withoutTrailingSlash;
	if (hasProtocol(to) && !to.startsWith("http")) return to;
	return normalizeFn(to, true);
}
//#endregion
//#region composables/useApi.ts
function authHeaders() {
	try {
		const access = localStorage.getItem("access");
		return access ? { Authorization: `Bearer ${access}` } : {};
	} catch {
		return {};
	}
}
function setTokens(tokens) {
	try {
		if (!tokens) {
			localStorage.removeItem("access");
			localStorage.removeItem("refresh");
			return;
		}
		if (tokens.access) localStorage.setItem("access", tokens.access);
		if (tokens.refresh) localStorage.setItem("refresh", tokens.refresh);
	} catch {}
}
var ENROLL_STATUS = {
	VERIFIED: "Verified",
	PENDING: "Pending",
	FLAGGED: "Flagged"
};
var SESSION_STATUS = {
	SCHEDULED: "scheduled",
	ACTIVE: "live",
	ENDED: "completed",
	CANCELLED: "completed"
};
var ATTENDANCE_STATUS = {
	PRESENT: "Present",
	ABSENT: "Absent",
	EXCUSED: "Excused",
	LATE: "Late"
};
var REVIEW_STATUS = {
	OPEN: "Open",
	APPROVED: "Approved",
	DISMISSED: "Dismissed"
};
var TICKET_STATUS = {
	OPEN: "Open",
	IN_REVIEW: "In Review",
	APPROVED: "Resolved",
	REJECTED: "Rejected",
	RESOLVED: "Resolved",
	CLOSED: "Closed"
};
var CATEGORY_LABEL = {
	ATTENDANCE_DISPUTE: "Attendance Dispute",
	TECHNICAL_ISSUE: "Technical Issue",
	ACCOUNT_ACCESS: "Account Access",
	BIOMETRIC_REENROLLMENT: "Biometric Re-enrollment",
	OTHER: "Other"
};
var CATEGORY_ENUM = {
	"Missed Attendance": "ATTENDANCE_DISPUTE",
	"Incorrect Identification": "ATTENDANCE_DISPUTE",
	"Biometric Enrollment": "BIOMETRIC_REENROLLMENT",
	"Biometric Re-enrollment": "BIOMETRIC_REENROLLMENT",
	"Technical Issue": "TECHNICAL_ISSUE",
	"Account Access": "ACCOUNT_ACCESS",
	Other: "OTHER"
};
function toCategoryEnum(c) {
	if (!c) return "OTHER";
	if (CATEGORY_ENUM[c]) return CATEGORY_ENUM[c];
	const up = c.toUpperCase().replace(/[^A-Z]+/g, "_");
	return [
		"ATTENDANCE_DISPUTE",
		"TECHNICAL_ISSUE",
		"ACCOUNT_ACCESS",
		"BIOMETRIC_REENROLLMENT",
		"OTHER"
	].includes(up) ? up : "OTHER";
}
function fullName(s) {
	return s?.full_name || [s?.first_name, s?.last_name].filter(Boolean).join(" ").trim() || s?.name || "";
}
function asArray(d) {
	if (Array.isArray(d)) return d;
	if (d && Array.isArray(d.results)) return d.results;
	return d ? [d] : [];
}
function normStudent(s) {
	if (!s || typeof s !== "object") return s;
	return {
		...s,
		id: s.id,
		student_id: s.student_id ?? s.student_id_number ?? "",
		full_name: fullName(s),
		email: s.email ?? "",
		department: s.department ?? "",
		enrollment_status: ENROLL_STATUS[s.enrollment_status] ?? s.enrollment_status ?? "Pending",
		face_enrolled: s.is_enrolled ?? s.face_enrolled ?? false,
		last_seen: s.last_seen ?? null,
		attendance_rate: Number(s.attendance_rate ?? 0),
		created_at: s.created_at ?? null
	};
}
function normCourse(c) {
	if (!c || typeof c !== "object") return c;
	return {
		...c,
		id: c.id ?? c.course ?? c.code ?? c.course_code,
		course_code: c.course_code ?? c.code ?? "",
		course_name: c.course_name ?? c.name ?? "",
		credits: c.credits ?? 0,
		professor: c.professor ?? (c.lecturer != null ? `Lecturer #${c.lecturer}` : ""),
		department: c.department ?? "",
		semester: c.semester ?? "",
		room: c.room ?? c.schedule_slots?.[0]?.room ?? "TBD",
		created_at: c.created_at ?? null
	};
}
function normSession(s) {
	if (!s || typeof s !== "object") return s;
	const courses = normCourse({
		id: s.course,
		course_code: s.course_code,
		course_name: s.course_name,
		room: s.room
	});
	return {
		...s,
		id: s.id,
		session_code: s.session_code ?? (s.id != null ? `SES-${s.id}` : ""),
		course_id: s.course ?? null,
		room: s.room ?? "TBD",
		status: SESSION_STATUS[s.status] ?? String(s.status ?? "").toLowerCase(),
		total_expected: s.total_expected ?? s.roster_size ?? 0,
		total_present: s.total_present ?? s.present_count ?? 0,
		avg_confidence: s.avg_confidence ?? s.average_confidence ?? 0,
		started_at: s.started_at ?? null,
		ended_at: s.ended_at ?? null,
		created_at: s.created_at ?? null,
		courses
	};
}
function normAttendance(r) {
	if (!r || typeof r !== "object") return r;
	const studentObj = r.student && typeof r.student === "object";
	const sessionObj = r.session && typeof r.session === "object";
	const students = studentObj ? normStudent(r.student) : r.student_name || r.student_id_number ? normStudent({
		id: r.student,
		first_name: r.student_name,
		student_id: r.student_id_number
	}) : void 0;
	const sessions = sessionObj ? normSession(r.session) : r.course_name || r.course_code ? { courses: normCourse({
		id: r.course,
		course_name: r.course_name,
		course_code: r.course_code
	}) } : void 0;
	return {
		...r,
		id: r.id,
		student_id: studentObj ? r.student.id : r.student,
		session_id: sessionObj ? r.session.id : r.session,
		status: ATTENDANCE_STATUS[String(r.status ?? "PRESENT").toUpperCase()] ?? r.status ?? "Present",
		confidence_score: r.confidence_score ?? null,
		check_in_time: r.check_in_time ?? r.timestamp ?? r.created_at ?? null,
		created_at: r.created_at ?? r.timestamp ?? null,
		students,
		sessions
	};
}
function normReviewItem(r) {
	if (!r || typeof r !== "object") return r;
	return {
		...r,
		id: r.id,
		session_id: r.session,
		student_id: r.student,
		reason: r.reason ?? "",
		confidence_score: r.confidence_score ?? null,
		status: REVIEW_STATUS[r.status] ?? r.status ?? "Open",
		students: r.student_name || r.student_id_number ? normStudent({
			id: r.student,
			first_name: r.student_name,
			student_id: r.student_id_number
		}) : void 0,
		created_at: r.created_at ?? null
	};
}
function normTicket(t) {
	if (!t || typeof t !== "object") return t;
	return {
		...t,
		id: t.id,
		student_id: t.student ?? null,
		category: CATEGORY_LABEL[t.category] ?? t.category ?? "",
		reference_id: t.reference_id ?? "",
		description: t.message ?? t.description ?? "",
		status: TICKET_STATUS[t.status] ?? t.status ?? "Open",
		created_at: t.created_at ?? null,
		updated_at: t.resolved_at ?? t.updated_at ?? t.created_at ?? null
	};
}
function useApi() {
	const base = (/* @__PURE__ */ useRuntimeConfig()).public.backendUrl || "http://localhost:8000";
	async function rawFetch(path, opts = {}) {
		const url = `${base}${path}`;
		const headers = { ...authHeaders() };
		const isForm = opts.body instanceof FormData;
		if (opts.body && !isForm) headers["Content-Type"] = "application/json";
		return fetch(url, {
			method: opts.method || "GET",
			headers,
			body: opts.body && !isForm ? JSON.stringify(opts.body) : opts.body
		});
	}
	async function tryRefresh() {
		const refresh = localStorage.getItem("refresh");
		if (!refresh) throw new Error("No refresh token");
		const res = await fetch(`${base}/api/auth/token/refresh/`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refresh })
		});
		if (!res.ok) throw new Error("Refresh failed");
		const data = await res.json();
		setTokens({
			access: data.access,
			refresh: data.refresh
		});
		return data;
	}
	async function call(path, opts = {}) {
		let res = await rawFetch(path, opts);
		if (res.status === 401) try {
			await tryRefresh();
			res = await rawFetch(path, opts);
		} catch {
			setTokens(null);
			const err = /* @__PURE__ */ new Error("Unauthorized");
			err.status = 401;
			throw err;
		}
		const contentType = res.headers.get("content-type") || "";
		if (!res.ok) {
			let payload = null;
			if (contentType.includes("application/json")) payload = await res.json().catch(() => null);
			let message = payload?.detail || res.statusText;
			if (!payload?.detail && payload && typeof payload === "object") {
				const first = Object.values(payload)[0];
				if (Array.isArray(first) && first.length) message = String(first[0]);
			}
			const err = new Error(message);
			err.status = res.status;
			err.payload = payload;
			throw err;
		}
		if (res.status === 204 || res.status === 205) return null;
		if (contentType.includes("application/json")) return res.json();
		return res;
	}
	async function callSafe(path, opts = {}) {
		try {
			return await call(path, opts);
		} catch (e) {
			if (e?.status === 404) return null;
			throw e;
		}
	}
	async function login(identifier, password, opts = {}) {
		const data = await call("/api/auth/login/", {
			method: "POST",
			body: {
				[opts.as === "email" ? "email" : "username"]: identifier,
				password
			}
		});
		setTokens({
			access: data.access,
			refresh: data.refresh
		});
		return data;
	}
	async function refreshToken() {
		return tryRefresh();
	}
	async function logout() {
		let refresh = null;
		try {
			refresh = localStorage.getItem("refresh");
		} catch {}
		try {
			if (refresh) await call("/api/auth/logout/", {
				method: "POST",
				body: { refresh }
			});
		} catch {}
		setTokens(null);
	}
	async function getMe() {
		return call("/api/auth/me/");
	}
	async function createUser(payload) {
		return call("/api/auth/users/", {
			method: "POST",
			body: payload
		});
	}
	async function getUsers(params = {}) {
		const query = new URLSearchParams();
		if (params.search?.trim()) query.set("search", params.search.trim());
		if (params.role) query.set("role", params.role);
		if (params.is_active !== "" && params.is_active !== void 0) query.set("is_active", String(params.is_active));
		const queryString = query.toString();
		return asArray(await call(`/api/auth/users/${queryString ? `?${queryString}` : ""}`));
	}
	async function changePassword(oldPassword, newPassword) {
		return call("/api/auth/change-password/", {
			method: "POST",
			body: {
				old_password: oldPassword,
				new_password: newPassword
			}
		});
	}
	async function getStudents() {
		return asArray(await call("/api/students/")).map(normStudent);
	}
	async function getStudentByStudentId(studentId) {
		const arr = asArray(await call(`/api/students/?search=${encodeURIComponent(studentId)}`)).map(normStudent);
		return arr.find((s) => s.student_id === studentId) ?? arr[0] ?? null;
	}
	async function getMyStudentProfile() {
		return normStudent(await call("/api/students/me/"));
	}
	async function createStudent(payload) {
		const [first, ...rest] = String(payload.full_name ?? "").trim().split(/\s+/);
		const body = {
			student_id: payload.student_id,
			first_name: payload.first_name ?? first ?? "",
			last_name: payload.last_name ?? rest.join(" "),
			email: payload.email,
			department: payload.department
		};
		if (payload.user != null) body.user = payload.user;
		if (payload.guardian_phone) body.guardian_phone = payload.guardian_phone;
		if (payload.guardian_email) body.guardian_email = payload.guardian_email;
		return normStudent(await call("/api/students/", {
			method: "POST",
			body
		}));
	}
	async function updateStudent(id, updates) {
		if (updates?.enrollment_status === "Flagged") return flagStudent(id);
		const body = {};
		if (updates.full_name != null) {
			const [first, ...rest] = String(updates.full_name).trim().split(/\s+/);
			body.first_name = first;
			body.last_name = rest.join(" ");
		}
		if (updates.first_name != null) body.first_name = updates.first_name;
		if (updates.last_name != null) body.last_name = updates.last_name;
		if (updates.email != null) body.email = updates.email;
		if (updates.department != null) body.department = updates.department;
		if (updates.guardian_phone != null) body.guardian_phone = updates.guardian_phone;
		if (updates.guardian_email != null) body.guardian_email = updates.guardian_email;
		if (updates.is_active != null) body.is_active = updates.is_active;
		if (Object.keys(body).length === 0) return null;
		return normStudent(await call(`/api/students/${id}/`, {
			method: "PATCH",
			body
		}));
	}
	async function deleteStudent(id) {
		return call(`/api/students/${id}/`, { method: "DELETE" });
	}
	async function flagStudent(id) {
		return normStudent(await call(`/api/students/${id}/flag/`, { method: "POST" }));
	}
	async function unflagStudent(id) {
		return normStudent(await call(`/api/students/${id}/unflag/`, { method: "POST" }));
	}
	async function enrollStudentFace(id, formData) {
		return call(`/api/students/${id}/enroll/`, {
			method: "POST",
			body: formData
		});
	}
	async function enrollMyFace(formData) {
		return call("/api/students/me/enroll/", {
			method: "POST",
			body: formData
		});
	}
	async function getCourses(params = {}) {
		const query = new URLSearchParams();
		if (params.search?.trim()) query.set("search", params.search.trim());
		if (params.department) query.set("department", params.department);
		if (params.semester) query.set("semester", params.semester);
		if (params.lecturer) query.set("lecturer", params.lecturer);
		const queryString = query.toString();
		return asArray(await call(`/api/classes/courses/${queryString ? `?${queryString}` : ""}`)).map(normCourse);
	}
	async function getCourse(id) {
		return normCourse(await call(`/api/classes/courses/${id}/`));
	}
	async function createCourse(payload) {
		const body = {
			code: payload.code ?? payload.course_code,
			name: payload.name ?? payload.course_name,
			credits: payload.credits ?? 3
		};
		if (payload.department != null) body.department = payload.department;
		if (payload.semester != null) body.semester = payload.semester;
		if (payload.lecturer != null && payload.lecturer !== "") body.lecturer = Number(payload.lecturer);
		if (Array.isArray(payload.students)) body.students = payload.students;
		return normCourse(await call("/api/classes/courses/", {
			method: "POST",
			body
		}));
	}
	async function updateCourse(id, updates) {
		const body = {};
		if (updates.code ?? updates.course_code) body.code = updates.code ?? updates.course_code;
		if (updates.name ?? updates.course_name) body.name = updates.name ?? updates.course_name;
		if (updates.credits != null) body.credits = updates.credits;
		if (updates.department !== void 0) body.department = updates.department;
		if (updates.semester !== void 0) body.semester = updates.semester;
		if (updates.lecturer !== void 0) body.lecturer = updates.lecturer === "" || updates.lecturer == null ? null : Number(updates.lecturer);
		if (Array.isArray(updates.students)) body.students = updates.students;
		return normCourse(await call(`/api/classes/courses/${id}/`, {
			method: "PATCH",
			body
		}));
	}
	async function deleteCourse(id) {
		return call(`/api/classes/courses/${id}/`, { method: "DELETE" });
	}
	async function setCourseStudents(id, studentIds) {
		return updateCourse(id, { students: studentIds.map((n) => Number(n)) });
	}
	async function searchCourseStudents(courseId, search) {
		return asArray(await call(`/api/classes/courses/${courseId}/students/${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`)).map(normStudent);
	}
	async function addCourseStudents(courseId, studentIds) {
		return call(`/api/classes/courses/${courseId}/students/`, {
			method: "POST",
			body: { student_ids: studentIds }
		});
	}
	async function getScheduleSlots(courseId) {
		const rows = asArray(await call("/api/classes/schedule-slots/"));
		return courseId != null ? rows.filter((s) => String(s.course) === String(courseId)) : rows;
	}
	async function createScheduleSlot(payload) {
		return call("/api/classes/schedule-slots/", {
			method: "POST",
			body: {
				course: payload.course,
				day_of_week: Number(payload.day_of_week),
				start_time: payload.start_time,
				end_time: payload.end_time,
				room: payload.room
			}
		});
	}
	async function deleteScheduleSlot(id) {
		return call(`/api/classes/schedule-slots/${id}/`, { method: "DELETE" });
	}
	async function getStudentCourses(_studentDbId) {
		try {
			return asArray(await call("/api/classes/courses/")).map(normCourse);
		} catch (e) {
			if (e?.status !== 403) throw e;
			const slots = asArray(await call("/api/classes/my-schedule/"));
			const seen = /* @__PURE__ */ new Map();
			for (const s of slots) {
				const key = s.course_code ?? String(s.session_id);
				if (!seen.has(key)) seen.set(key, normCourse({
					id: key,
					course_code: s.course_code,
					course_name: s.course_name,
					room: s.room
				}));
			}
			return [...seen.values()];
		}
	}
	async function getAllSessions() {
		return asArray(await call("/api/classes/sessions/")).map(normSession);
	}
	async function getActiveSessions() {
		return asArray(await call("/api/classes/sessions/")).map(normSession).filter((s) => s.status === "live");
	}
	async function getCompletedSessions() {
		return asArray(await call("/api/classes/sessions/")).map(normSession).filter((s) => s.status === "completed");
	}
	async function startSession(courseId, room, _expected) {
		const created = await call("/api/classes/sessions/", {
			method: "POST",
			body: {
				course: courseId,
				room,
				scheduled_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
			}
		});
		try {
			await call(`/api/classes/sessions/${created.id}/start/`, { method: "POST" });
		} catch {}
		return normSession(created);
	}
	async function stopSession(sessionId) {
		return normSession(await call(`/api/classes/sessions/${sessionId}/stop/`, { method: "POST" }));
	}
	async function generateSessions(date) {
		return asArray(await call("/api/classes/schedule/generate/", {
			method: "POST",
			body: date ? { date } : {}
		})).map(normSession);
	}
	async function getMySchedule(weekStart) {
		return asArray(await call(`/api/classes/my-schedule/${weekStart ? `?week_start=${weekStart}` : ""}`));
	}
	async function getAttendanceBySession(sessionId) {
		return asArray(await call(`/api/attendance/records/?session=${sessionId}`)).map(normAttendance);
	}
	async function getAttendanceRecords() {
		return asArray(await call("/api/attendance/records/")).map(normAttendance);
	}
	async function getAttendanceByStudent(_studentDbId) {
		return asArray(await call("/api/attendance/my-records/")).map(normAttendance);
	}
	async function recordAttendance(payload) {
		const body = { student: payload.student_id };
		if (payload.status) body.status = payload.status;
		return call(`/api/attendance/sessions/${payload.session_id}/manual/`, {
			method: "POST",
			body
		});
	}
	async function getSessionSummary(sessionId) {
		return call(`/api/attendance/sessions/${sessionId}/summary/`);
	}
	async function updateSessionStats(sessionId) {
		return getSessionSummary(sessionId);
	}
	async function scanClassroom(sessionId, formData) {
		return call(`/api/attendance/sessions/${sessionId}/scan-classroom/`, {
			method: "POST",
			body: formData
		});
	}
	async function checkIn(sessionId, formData) {
		return call(`/api/attendance/sessions/${sessionId}/checkin/`, {
			method: "POST",
			body: formData
		});
	}
	async function getAuditLogs() {
		return asArray(await call("/api/attendance/audit-logs/"));
	}
	async function getSessionReviewItems(sessionId) {
		return asArray(await call(`/api/attendance/review-items/?session=${sessionId}`)).map(normReviewItem);
	}
	async function getReviewItems(params = {}) {
		const qs = new URLSearchParams(params).toString();
		return asArray(await call(`/api/attendance/review-items/${qs ? `?${qs}` : ""}`)).map(normReviewItem);
	}
	async function updateSessionReviewItem(itemId, updates) {
		if (updates?.status === "Approved") return normReviewItem(await call(`/api/attendance/review-items/${itemId}/approve/`, { method: "POST" }));
		if (updates?.status === "Dismissed") return normReviewItem(await call(`/api/attendance/review-items/${itemId}/dismiss/`, { method: "POST" }));
		return null;
	}
	async function getSystemSetting(key) {
		const row = await callSafe(`/api/settings/${encodeURIComponent(key)}/`);
		if (!row) return null;
		const raw = row.value ?? row;
		if (typeof raw !== "string") return raw;
		try {
			return JSON.parse(raw);
		} catch {
			return raw;
		}
	}
	async function saveSystemSetting(key, value) {
		return call("/api/settings/", {
			method: "POST",
			body: {
				key,
				value: typeof value === "string" ? value : JSON.stringify(value)
			}
		});
	}
	async function getStudentSettings(studentDbId) {
		return callSafe(`/api/students/${studentDbId}/settings/`);
	}
	async function saveStudentSettings(studentDbId, settings) {
		return call(`/api/students/${studentDbId}/settings/`, {
			method: "PATCH",
			body: settings
		});
	}
	async function getMyStudentSettings() {
		return callSafe("/api/students/me/settings/");
	}
	async function saveMyStudentSettings(settings) {
		return call("/api/students/me/settings/", {
			method: "PATCH",
			body: settings
		});
	}
	async function getSupportTickets(studentDbId) {
		return asArray(await call(studentDbId ? "/api/support/requests/mine/" : "/api/support/requests/")).map(normTicket);
	}
	async function createSupportTicket(ticket) {
		const body = {
			request_type: ticket.request_type ?? (ticket.session ? "OVERRIDE" : "ISSUE"),
			category: ticket.category_enum ?? toCategoryEnum(ticket.category),
			message: ticket.message ?? ticket.description ?? ""
		};
		if (ticket.reference_id) body.reference_id = ticket.reference_id;
		if (ticket.session) body.session = ticket.session;
		return normTicket(await call("/api/support/requests/", {
			method: "POST",
			body
		}));
	}
	async function updateSupportTicket(id, updates) {
		if (updates?.status === "In Review") return normTicket(await call(`/api/support/requests/${id}/mark-in-review/`, { method: "POST" }));
		if (updates?.status === "Resolved" || updates?.status === "Rejected") return normTicket(await call(`/api/support/requests/${id}/resolve/`, {
			method: "POST",
			body: {
				approved: updates.approved ?? updates.status !== "Rejected",
				note: updates.note ?? ""
			}
		}));
		if (updates?.status === "Closed") return normTicket(await call(`/api/support/requests/${id}/close/`, {
			method: "POST",
			body: { note: updates.note ?? "" }
		}));
		return null;
	}
	async function getDashboardOverview() {
		return call("/api/dashboard/overview/");
	}
	async function getSystemHealth() {
		return call("/api/settings/health/");
	}
	async function getAttendanceTrends(months = 6) {
		return asArray(await call(`/api/analytics/trends/?months=${months}`));
	}
	async function getAttendanceByDepartment() {
		return asArray(await call("/api/analytics/by-department/"));
	}
	async function getAtRiskStudents(threshold = 15) {
		return asArray(await call(`/api/analytics/at-risk/?threshold=${threshold}`));
	}
	function subscribeToSessionAttendance(sessionId, callback, opts = {}) {
		const interval = opts.intervalMs ?? 5e3;
		let stopped = false;
		let timer = null;
		let primed = false;
		let lastPresent = -1;
		const seen = /* @__PURE__ */ new Set();
		async function tick() {
			if (stopped) return;
			try {
				const summary = await getSessionSummary(sessionId);
				const checkins = Array.isArray(summary?.recent_checkins) ? summary.recent_checkins : [];
				let firedForNew = false;
				for (const raw of [...checkins].reverse()) {
					const rec = normAttendance(raw);
					if (rec.id == null || seen.has(rec.id)) continue;
					seen.add(rec.id);
					if (primed) {
						callback({
							new: rec,
							summary
						});
						firedForNew = true;
					}
				}
				const present = Number(summary?.present_count ?? NaN);
				if (primed && !firedForNew && Number.isFinite(present) && lastPresent >= 0 && present !== lastPresent) callback({ summary });
				if (Number.isFinite(present)) lastPresent = present;
				primed = true;
			} catch {}
			if (!stopped) timer = setTimeout(tick, interval);
		}
		tick();
		return { close: () => {
			stopped = true;
			if (timer) clearTimeout(timer);
		} };
	}
	return {
		login,
		refreshToken,
		logout,
		getMe,
		createUser,
		getUsers,
		changePassword,
		getStudents,
		getStudentByStudentId,
		getMyStudentProfile,
		createStudent,
		updateStudent,
		deleteStudent,
		flagStudent,
		unflagStudent,
		enrollStudentFace,
		enrollMyFace,
		getCourses,
		getCourse,
		createCourse,
		updateCourse,
		deleteCourse,
		setCourseStudents,
		searchCourseStudents,
		addCourseStudents,
		getStudentCourses,
		getScheduleSlots,
		createScheduleSlot,
		deleteScheduleSlot,
		getAllSessions,
		getActiveSessions,
		getCompletedSessions,
		startSession,
		stopSession,
		generateSessions,
		getMySchedule,
		getAttendanceBySession,
		getAttendanceRecords,
		getAttendanceByStudent,
		recordAttendance,
		getSessionSummary,
		updateSessionStats,
		scanClassroom,
		checkIn,
		getAuditLogs,
		getSessionReviewItems,
		getReviewItems,
		updateSessionReviewItem,
		getSystemSetting,
		saveSystemSetting,
		getStudentSettings,
		saveStudentSettings,
		getMyStudentSettings,
		saveMyStudentSettings,
		getSupportTickets,
		createSupportTicket,
		updateSupportTicket,
		getDashboardOverview,
		getSystemHealth,
		getAttendanceTrends,
		getAttendanceByDepartment,
		getAtRiskStudents,
		subscribeToSessionAttendance
	};
}
//#endregion
//#region composables/usePortal.ts
function mapAdminUser(me) {
	const rawRole = (me.role || "").toString().toUpperCase();
	return {
		name: me.first_name ? `${me.first_name} ${me.last_name}` : me.full_name || me.username,
		role: rawRole === "ADMIN" ? "System Admin" : rawRole === "LECTURER" ? "Lecturer" : me.role,
		rawRole,
		id: (me.id ?? "").toString().slice(0, 8),
		email: me.email
	};
}
function mapStudent(data) {
	return {
		id: data.id,
		student_id: data.student_id,
		full_name: data.full_name || `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
		department: data.department,
		face_enrolled: data.face_enrolled ?? data.is_enrolled ?? false,
		attendance_rate: Number(data.attendance_rate || 0)
	};
}
function usePortal() {
	const api = useApi();
	const portal = useState("portal", () => "admin");
	const isAuthed = useState("portal-is-authed", () => false);
	const authReady = useState("portal-auth-ready", () => false);
	const mustChangePassword = useState("portal-must-change-password", () => false);
	const heldPassword = useState("portal-held-password", () => null);
	const currentUser = useState("portal-current-user", () => null);
	const currentStudent = useState("portal-current-student", () => null);
	const gateForcedChange = (me, p) => {
		isAuthed.value = true;
		mustChangePassword.value = true;
		portal.value = p;
		currentUser.value = {
			name: me.first_name ? `${me.first_name} ${me.last_name}` : me.username,
			role: p === "student" ? "Student" : mapAdminUser(me).role,
			rawRole: p === "student" ? "STUDENT" : mapAdminUser(me).rawRole,
			id: (me.id ?? "").toString().slice(0, 8),
			email: me.email
		};
		currentStudent.value = null;
	};
	const setPortal = (p) => {
		portal.value = p;
	};
	const hydrateStudent = async (me) => {
		portal.value = "student";
		const data = await api.getMyStudentProfile().catch(() => null);
		if (data) currentStudent.value = mapStudent(data);
		currentUser.value = {
			name: me.first_name ? `${me.first_name} ${me.last_name}` : me.username || data?.full_name,
			role: "Student",
			rawRole: "STUDENT",
			id: String(currentStudent.value?.student_id || me.username || "").slice(-2)
		};
		return data;
	};
	const adminLogin = async (email, password) => {
		try {
			await api.login(email, password, { as: "email" });
			heldPassword.value = password;
			const me = await api.getMe();
			if (me?.must_change_password) {
				gateForcedChange(me, "admin");
				return { success: true };
			}
			isAuthed.value = true;
			portal.value = "admin";
			currentUser.value = mapAdminUser(me);
			return { success: true };
		} catch (err) {
			return {
				success: false,
				error: err?.payload?.detail || err?.message || "Login failed"
			};
		}
	};
	const adminSignUp = async (email, fullName, role = "ADMIN") => {
		try {
			return {
				success: true,
				info: (await api.createUser({
					username: email,
					email,
					first_name: fullName.split(" ")[0] || fullName,
					last_name: fullName.split(" ").slice(1).join(" ") || "",
					role: role.toUpperCase()
				}))?.credentials_email_sent === false ? "Account created, but the temporary-password email could not be sent. Contact the system administrator." : "Account created. Check your email for a temporary password, then sign in."
			};
		} catch (err) {
			return {
				success: false,
				error: err?.payload?.detail || err?.message || "Signup failed"
			};
		}
	};
	const studentLogin = async (username, password) => {
		try {
			await api.login(username, password);
			heldPassword.value = password;
			const me = await api.getMe();
			if (me?.must_change_password) {
				gateForcedChange(me, "student");
				return { success: true };
			}
			if (!await hydrateStudent(me)) return {
				success: false,
				error: "No student profile is linked to this account."
			};
			isAuthed.value = true;
			return { success: true };
		} catch (err) {
			return {
				success: false,
				error: err?.payload?.detail || err?.message || "Student login failed"
			};
		}
	};
	const completePasswordChange = async (newPassword, currentPassword) => {
		const oldPw = currentPassword || heldPassword.value;
		if (!oldPw) return {
			success: false,
			error: "Enter your current password."
		};
		if (!newPassword) return {
			success: false,
			error: "Enter a new password."
		};
		try {
			await api.changePassword(oldPw, newPassword);
			heldPassword.value = null;
			mustChangePassword.value = false;
			const me = await api.getMe();
			if (me?.role === "STUDENT") await hydrateStudent(me);
			else {
				portal.value = "admin";
				currentUser.value = mapAdminUser(me);
			}
			isAuthed.value = true;
			return { success: true };
		} catch (err) {
			const p = err?.payload;
			return {
				success: false,
				error: p?.old_password?.[0] || p?.old_password || p?.new_password?.[0] || p?.new_password || err?.message || "Unable to change password."
			};
		}
	};
	const refreshCurrentStudent = async () => {
		try {
			const data = await api.getMyStudentProfile();
			if (data) currentStudent.value = mapStudent(data);
		} catch {}
	};
	const restoreSession = async () => {
		if (authReady.value) return;
		try {
			let hasToken = false;
			try {
				hasToken = !!(localStorage.getItem("access") || localStorage.getItem("refresh"));
			} catch {
				hasToken = false;
			}
			if (!hasToken) return;
			const me = await api.getMe();
			if (!me) return;
			isAuthed.value = true;
			if (me.must_change_password) {
				gateForcedChange(me, me.role === "STUDENT" ? "student" : "admin");
				return;
			}
			if (me.role === "STUDENT") await hydrateStudent(me);
			else {
				portal.value = "admin";
				currentUser.value = mapAdminUser(me);
			}
		} catch {
			isAuthed.value = false;
			currentUser.value = null;
			currentStudent.value = null;
			mustChangePassword.value = false;
		} finally {
			authReady.value = true;
		}
	};
	const logout = () => {
		try {
			api.logout();
		} catch (e) {}
		isAuthed.value = false;
		currentUser.value = null;
		currentStudent.value = null;
		mustChangePassword.value = false;
		heldPassword.value = null;
	};
	return {
		portal: readonly(portal),
		isAuthed: readonly(isAuthed),
		authReady: readonly(authReady),
		mustChangePassword: readonly(mustChangePassword),
		needsCurrentPassword: computed(() => !heldPassword.value),
		currentUser: readonly(currentUser),
		currentStudent: readonly(currentStudent),
		isAdmin: computed(() => currentUser.value?.rawRole === "ADMIN"),
		isLecturer: computed(() => currentUser.value?.rawRole === "LECTURER"),
		setPortal,
		adminLogin,
		adminSignUp,
		studentLogin,
		completePasswordChange,
		refreshCurrentStudent,
		restoreSession,
		logout
	};
}
//#endregion
//#region components/AdminLogin.vue?vue&type=script&setup=true&lang.ts
var AdminLogin_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminLogin",
	__ssrInlineRender: true,
	emits: ["login", "switchToStudent"],
	setup(__props, { emit: __emit }) {
		usePortal();
		const email = ref("");
		const password = ref("");
		const remember = ref(false);
		const loading = ref(false);
		const errorMsg = ref("");
		return (_ctx, _push, _parent, _attrs) => {
			const _component_PasswordInput = PasswordInput_default;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "relative grid min-h-screen place-items-center bg-navy p-4 sm:p-8" }, _attrs))}><div class="fixed inset-0 opacity-15 pointer-events-none" style="${ssrRenderStyle({
				"background-image": "radial-gradient(#1680a3 1px, transparent 1px)",
				"background-size": "34px 34px"
			})}"></div><div class="relative z-10 flex w-full max-w-[1028px] shadow-2xl rounded-xl overflow-hidden"><div class="hidden w-[430px] min-h-[645px] p-14 flex-col justify-between text-white lg:flex" style="${ssrRenderStyle({ "background": "linear-gradient(150deg, #0b355a, #02172c 72%)" })}"><div class="relative z-10"><div class="flex items-center gap-3"><span class="text-3xl text-cyan">♢</span><strong class="text-2xl">SecureCheck AI</strong></div><small class="block mt-1 font-mono text-xs tracking-widest text-cyan">STAFF PORTAL</small></div><p class="relative z-10 text-gray-200 leading-relaxed max-w-[310px]"> Authorized personnel only. All access attempts are logged and monitored by the Aegis security framework. </p><button class="relative z-10 self-start text-white border border-navy-300 rounded px-4 py-3 font-mono text-xs hover:bg-navy-700 transition-colors"> ♧ Login as Student </button></div><form class="min-h-[600px] w-full bg-surface p-6 pt-8 sm:p-10 lg:w-[598px] lg:p-16 lg:pt-14"><div class="flex items-center gap-3 mb-2"><span class="text-3xl text-cyan">♢</span><strong class="text-2xl">SecureCheck AI</strong></div><div class="mt-12 mb-8"><h1 class="text-4xl tracking-tight">Sign In</h1><p class="text-gray-600 mt-2 text-base">Enter your staff credentials to continue.</p></div><label class="block text-ink font-mono text-[11px] tracking-wide mt-5"> STAFF EMAIL <input${ssrRenderAttr("value", email.value)} type="email" required class="input-field mt-2" placeholder="you@institution.edu"></label><label class="block text-ink font-mono text-[11px] tracking-wide mt-5"> PASSWORD `);
			_push(ssrRenderComponent(_component_PasswordInput, {
				modelValue: password.value,
				"onUpdate:modelValue": ($event) => password.value = $event,
				class: "mt-2",
				autocomplete: "current-password",
				required: true
			}, null, _parent));
			_push(`</label>`);
			if (errorMsg.value) _push(`<p class="mt-4 text-sm text-danger">${ssrInterpolate(errorMsg.value)}</p>`);
			else _push(`<!---->`);
			_push(`<label class="flex items-center gap-2.5 mt-5 text-sm text-ink"><input${ssrIncludeBooleanAttr(Array.isArray(remember.value) ? ssrLooseContain(remember.value, null) : remember.value) ? " checked" : ""} type="checkbox" class="w-[18px] h-[18px] accent-cyan"> Remember Me on this device </label><button type="submit"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""} class="w-full bg-navy-light text-white rounded-md py-3.5 mt-8 text-lg font-bold hover:bg-navy transition-colors disabled:opacity-50">${ssrInterpolate(loading.value ? "Working..." : "Authenticate")} <span class="text-cyan ml-4">→</span></button><p class="mt-4 text-center text-xs text-gray-500"> Need an account? Ask a system administrator to add you under Settings → Staff Accounts. </p></form></div></div>`);
		};
	}
});
//#endregion
//#region components/AdminLogin.vue
var _sfc_setup$26 = AdminLogin_vue_vue_type_script_setup_true_lang_default.setup;
AdminLogin_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminLogin.vue");
	return _sfc_setup$26 ? _sfc_setup$26(props, ctx) : void 0;
};
var AdminLogin_default = Object.assign(AdminLogin_vue_vue_type_script_setup_true_lang_default, { __name: "AdminLogin" });
//#endregion
//#region components/StudentLogin.vue?vue&type=script&setup=true&lang.ts
var StudentLogin_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "StudentLogin",
	__ssrInlineRender: true,
	emits: ["login", "switchToAdmin"],
	setup(__props, { emit: __emit }) {
		usePortal();
		const matricNumber = ref("");
		const password = ref("");
		const loading = ref(false);
		const errorMsg = ref("");
		return (_ctx, _push, _parent, _attrs) => {
			const _component_PasswordInput = PasswordInput_default;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "relative grid min-h-screen place-items-center bg-navy p-4 sm:p-8" }, _attrs))}><div class="fixed inset-0 opacity-15 pointer-events-none" style="${ssrRenderStyle({
				"background-image": "radial-gradient(#1680a3 1px, transparent 1px)",
				"background-size": "34px 34px"
			})}"></div><div class="relative z-10 flex w-full max-w-[1028px] shadow-2xl rounded-xl overflow-hidden"><div class="relative hidden w-[430px] min-h-[645px] p-14 flex-col items-center justify-center gap-5 text-navy lg:flex" style="${ssrRenderStyle({ "background": "linear-gradient(135deg, #dcecf7, #aacce3)" })}"><div class="text-7xl text-navy relative z-10">⬡</div><h2 class="text-4xl text-center relative z-10 font-bold">Seamless Campus Flow</h2><p class="relative z-10 max-w-[400px] leading-relaxed text-lg text-navy text-center"> Your Aegis ID provides secure, frictionless access to university facilities, attendance tracking, and essential student services. </p></div><form class="min-h-[600px] w-full bg-surface p-6 pt-8 sm:p-10 lg:w-[598px] lg:p-16 lg:pt-12"><div class="flex items-center gap-3"><span class="text-3xl text-cyan">♢</span><strong class="text-2xl">Aegis ID</strong></div><div class="mt-12 mb-8 lg:mt-24"><h1 class="text-4xl tracking-tight">Student Portal</h1><p class="text-gray-600 mt-2">Enter your Student ID and password to access your secure dashboard.</p></div><label class="block text-ink font-mono text-[11px] tracking-wide mt-6"> STUDENT ID <input${ssrRenderAttr("value", matricNumber.value)} type="text" required class="input-field mt-2" placeholder="e.g. STU-8943-AI"></label><label class="block text-ink font-mono text-[11px] tracking-wide mt-5"> PASSWORD `);
			_push(ssrRenderComponent(_component_PasswordInput, {
				modelValue: password.value,
				"onUpdate:modelValue": ($event) => password.value = $event,
				class: "mt-2",
				autocomplete: "current-password",
				required: true
			}, null, _parent));
			_push(`</label>`);
			if (errorMsg.value) _push(`<p class="mt-4 text-sm text-danger">${ssrInterpolate(errorMsg.value)}</p>`);
			else _push(`<!---->`);
			_push(`<button type="submit"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""} class="w-full bg-navy text-white rounded-md py-3.5 mt-8 font-mono text-xs uppercase tracking-wider hover:bg-navy-light transition-colors disabled:opacity-50">${ssrInterpolate(loading.value ? "Verifying..." : "Sign In")} <span class="text-cyan ml-4">→</span></button><div class="flex items-center gap-4 mt-10 mb-7 text-gray-500 font-mono text-[11px]"><div class="h-px bg-gray-300 flex-1"></div><span>OR</span><div class="h-px bg-gray-300 flex-1"></div></div><button type="button" class="w-full border border-gray-300 bg-white py-3 rounded-md font-mono text-xs hover:bg-gray-50 transition-colors"> ♙ Admin / Staff Login </button></form></div></div>`);
		};
	}
});
//#endregion
//#region components/StudentLogin.vue
var _sfc_setup$25 = StudentLogin_vue_vue_type_script_setup_true_lang_default.setup;
StudentLogin_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StudentLogin.vue");
	return _sfc_setup$25 ? _sfc_setup$25(props, ctx) : void 0;
};
var StudentLogin_default = Object.assign(StudentLogin_vue_vue_type_script_setup_true_lang_default, { __name: "StudentLogin" });
//#endregion
//#region components/ForcePasswordChange.vue?vue&type=script&setup=true&lang.ts
var ForcePasswordChange_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "ForcePasswordChange",
	__ssrInlineRender: true,
	emits: ["signOut"],
	setup(__props, { emit: __emit }) {
		const { needsCurrentPassword, currentUser } = usePortal();
		const currentPassword = ref("");
		const newPassword = ref("");
		const confirmPassword = ref("");
		const loading = ref(false);
		const errorMsg = ref("");
		return (_ctx, _push, _parent, _attrs) => {
			const _component_PasswordInput = PasswordInput_default;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen grid place-items-center p-10 bg-navy relative" }, _attrs))}><div class="fixed inset-0 opacity-15 pointer-events-none" style="${ssrRenderStyle({
				"background-image": "radial-gradient(#1680a3 1px, transparent 1px)",
				"background-size": "34px 34px"
			})}"></div><form class="relative z-10 w-full max-w-[440px] bg-surface rounded-xl shadow-2xl p-12"><div class="flex items-center gap-3"><span class="text-3xl text-cyan">♢</span><strong class="text-2xl">SecureCheck AI</strong></div><div class="mt-10 mb-6"><h1 class="text-3xl tracking-tight">Set a new password</h1><p class="text-gray-600 mt-2 text-sm"> Your account was created with a temporary password. Choose a new one to continue${ssrInterpolate(unref(currentUser)?.name ? `, ${unref(currentUser).name}` : "")}. </p></div>`);
			if (unref(needsCurrentPassword)) {
				_push(`<label class="block text-ink font-mono text-[11px] tracking-wide mt-5"> CURRENT / TEMPORARY PASSWORD `);
				_push(ssrRenderComponent(_component_PasswordInput, {
					modelValue: currentPassword.value,
					"onUpdate:modelValue": ($event) => currentPassword.value = $event,
					class: "mt-2",
					autocomplete: "current-password",
					required: true
				}, null, _parent));
				_push(`</label>`);
			} else _push(`<!---->`);
			_push(`<label class="block text-ink font-mono text-[11px] tracking-wide mt-5"> NEW PASSWORD `);
			_push(ssrRenderComponent(_component_PasswordInput, {
				modelValue: newPassword.value,
				"onUpdate:modelValue": ($event) => newPassword.value = $event,
				class: "mt-2",
				autocomplete: "new-password",
				required: true
			}, null, _parent));
			_push(`</label><label class="block text-ink font-mono text-[11px] tracking-wide mt-5"> CONFIRM NEW PASSWORD `);
			_push(ssrRenderComponent(_component_PasswordInput, {
				modelValue: confirmPassword.value,
				"onUpdate:modelValue": ($event) => confirmPassword.value = $event,
				class: "mt-2",
				autocomplete: "new-password",
				required: true
			}, null, _parent));
			_push(`</label>`);
			if (errorMsg.value) _push(`<p class="mt-4 text-sm text-danger">${ssrInterpolate(errorMsg.value)}</p>`);
			else _push(`<!---->`);
			_push(`<button type="submit"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""} class="w-full bg-navy-light text-white rounded-md py-3.5 mt-8 text-lg font-bold hover:bg-navy transition-colors disabled:opacity-50">${ssrInterpolate(loading.value ? "Updating…" : "Update Password")} <span class="text-cyan ml-3">→</span></button><button type="button" class="w-full text-center mt-4 text-sm text-gray-600 hover:text-cyan transition-colors"> Sign out instead </button></form></div>`);
		};
	}
});
//#endregion
//#region components/ForcePasswordChange.vue
var _sfc_setup$24 = ForcePasswordChange_vue_vue_type_script_setup_true_lang_default.setup;
ForcePasswordChange_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ForcePasswordChange.vue");
	return _sfc_setup$24 ? _sfc_setup$24(props, ctx) : void 0;
};
var ForcePasswordChange_default = Object.assign(ForcePasswordChange_vue_vue_type_script_setup_true_lang_default, { __name: "ForcePasswordChange" });
//#endregion
//#region components/AppSidebar.vue?vue&type=script&setup=true&lang.ts
var AppSidebar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AppSidebar",
	__ssrInlineRender: true,
	props: { activeView: {} },
	emits: ["navigate", "signOut"],
	setup(__props, { emit: __emit }) {
		const { portal, currentUser, isLecturer} = usePortal();
		const userInitials = computed(() => currentUser.value?.name?.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "U");
		const adminNav = [
			{
				id: "overview",
				label: "Overview",
				icon: "▦"
			},
			{
				id: "user-management",
				label: "User Management",
				icon: "♙"
			},
			{
				id: "class-management",
				label: "Class Management",
				icon: "❏"
			},
			{
				id: "roster",
				label: "Student Roster",
				icon: "♙"
			},
			{
				id: "analytics",
				label: "Analytics",
				icon: "⌁"
			},
			{
				id: "logs",
				label: "Logs",
				icon: "▤"
			},
			{
				id: "reports",
				label: "Reports",
				icon: "▥"
			}
		];
		const lecturerNav = [
			{
				id: "overview",
				label: "Overview",
				icon: "▦"
			},
			{
				id: "sessions",
				label: "Sessions",
				icon: "▣"
			},
			{
				id: "courses",
				label: "Courses",
				icon: "❏"
			},
			{
				id: "roster",
				label: "Student Roster",
				icon: "♙"
			},
			{
				id: "analytics",
				label: "Analytics",
				icon: "⌁"
			}
		];
		const studentNav = [
			{
				id: "overview",
				label: "Overview",
				icon: "▦"
			},
			{
				id: "attendance",
				label: "My Attendance",
				icon: "♢"
			},
			{
				id: "schedule",
				label: "Schedule",
				icon: "□"
			},
			{
				id: "support",
				label: "Support",
				icon: "✦"
			}
		];
		const navItems = computed(() => {
			if (portal.value === "student") return studentNav;
			return isLecturer.value ? lecturerNav : adminNav;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<aside${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen w-[64px] flex-shrink-0 flex-col bg-navy text-white sm:w-[220px] lg:w-[266px]" }, _attrs))}>`);
			if (unref(portal) === "admin") _push(`<div class="border-b border-navy-600 px-2 py-5 sm:px-6 sm:py-7"><strong class="hidden text-3xl leading-tight tracking-tight sm:block">SecureCheck<br>AI</strong><span class="hidden text-sm text-gray-400 sm:mt-1.5 sm:block">${ssrInterpolate(unref(isLecturer) ? "Lecturer Dashboard" : "Admin Dashboard")}</span><strong class="block text-center text-xl text-cyan sm:hidden">SC</strong></div>`);
			else _push(`<div class="border-b border-navy-600 px-2 py-5 sm:px-6 sm:py-7"><strong class="hidden text-2xl tracking-tight text-cyan sm:block"><span class="mr-1 text-2xl">♢</span> Aegis ID </strong><strong class="block text-center text-xl text-cyan sm:hidden">♢</strong><span class="hidden text-sm text-gray-400 sm:mt-1.5 sm:block">Secure Campus Access</span></div>`);
			_push(`<nav class="py-4"><!--[-->`);
			ssrRenderList(navItems.value, (item) => {
				_push(`<button class="${ssrRenderClass(["w-full border-l-4 py-4 text-center text-base transition-colors sm:px-5 sm:text-left", __props.activeView === item.id ? "bg-navy-700 text-cyan border-cyan" : "border-transparent text-gray-300 hover:bg-navy-700 hover:text-cyan"])}"><span class="w-full text-center text-xl sm:w-5">${ssrInterpolate(item.icon)}</span><span class="hidden sm:inline">${ssrInterpolate(item.label)}</span></button>`);
			});
			_push(`<!--]--><button class="${ssrRenderClass(["w-full border-l-4 py-4 text-center text-base transition-colors sm:px-5 sm:text-left", __props.activeView === "settings" ? "bg-navy-700 text-cyan border-cyan" : "border-transparent text-gray-300 hover:bg-navy-700 hover:text-cyan"])}"><span class="w-full text-center text-xl sm:w-5">⚙</span><span class="hidden sm:inline">Settings</span></button></nav><div class="mt-auto px-1 pb-4 sm:px-5 sm:pb-6">`);
			ssrRenderSlot(_ctx.$slots, "sidebar-action", {}, null, _push, _parent);
			_push(`<button class="mt-4 w-full py-2.5 text-center font-mono text-xs uppercase text-gray-300 transition-colors hover:text-cyan sm:text-left"${ssrRenderAttr("title", "Sign out")}> ⇥ <span class="hidden sm:inline">Sign Out</span></button><div class="mt-5 flex items-center justify-center gap-3 border-t border-navy-600 pt-4 sm:justify-start"><div class="w-8 h-8 rounded-full bg-cyan-light flex items-center justify-center text-[10px] font-bold text-navy">${ssrInterpolate(userInitials.value)}</div><div class="hidden min-w-0 sm:block"><strong class="block truncate text-sm">${ssrInterpolate(unref(currentUser)?.name || unref(currentUser)?.email || "User")}</strong><small class="mt-0.5 block truncate font-mono text-[10px] text-gray-400">${ssrInterpolate(unref(currentUser)?.role || "")}</small></div></div></div></aside>`);
		};
	}
});
//#endregion
//#region components/AppSidebar.vue
var _sfc_setup$23 = AppSidebar_vue_vue_type_script_setup_true_lang_default.setup;
AppSidebar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppSidebar.vue");
	return _sfc_setup$23 ? _sfc_setup$23(props, ctx) : void 0;
};
var AppSidebar_default = Object.assign(AppSidebar_vue_vue_type_script_setup_true_lang_default, { __name: "AppSidebar" });
//#endregion
//#region components/AppTopbar.vue?vue&type=script&setup=true&lang.ts
var AppTopbar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AppTopbar",
	__ssrInlineRender: true,
	setup(__props) {
		const { portal, currentUser } = usePortal();
		const displayName = computed(() => currentUser.value?.name || currentUser.value?.email || "");
		const initials = computed(() => displayName.value.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase());
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<header${ssrRenderAttrs(mergeProps({ class: "flex min-h-[72px] items-center justify-end border-b border-[#dfe5eb] bg-[#f8fafb] px-4 sm:px-7" }, _attrs))}>`);
			if (displayName.value) _push(`<div class="flex min-w-0 items-center gap-3"><span class="hidden truncate text-sm text-[#475569] sm:block">${ssrInterpolate(displayName.value)}</span><span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#dfe8f3] bg-[#e8f2ff] text-[10px] font-bold text-[#1f2d3d]">${ssrInterpolate(initials.value || (unref(portal) === "student" ? "ST" : "AU"))}</span></div>`);
			else _push(`<!---->`);
			_push(`</header>`);
		};
	}
});
//#endregion
//#region components/AppTopbar.vue
var _sfc_setup$22 = AppTopbar_vue_vue_type_script_setup_true_lang_default.setup;
AppTopbar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppTopbar.vue");
	return _sfc_setup$22 ? _sfc_setup$22(props, ctx) : void 0;
};
var AppTopbar_default = Object.assign(AppTopbar_vue_vue_type_script_setup_true_lang_default, { __name: "AppTopbar" });
//#endregion
//#region components/AdminSystemOverview.vue?vue&type=script&setup=true&lang.ts
var AdminSystemOverview_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminSystemOverview",
	__ssrInlineRender: true,
	emits: ["navigate"],
	setup(__props, { emit: __emit }) {
		useApi();
		const dashboard = ref({});
		const attendance = ref([]);
		const todayRecords = ref(null);
		const activity = ref([]);
		const health = ref(null);
		const loading = ref(true);
		const error = ref("");
		const healthError = ref("");
		const trendError = ref("");
		const activityError = ref("");
		const recordsError = ref("");
		const updatedAt = ref("");
		const metric = (...keys) => {
			for (const key of keys) {
				const value = dashboard.value?.[key] ?? dashboard.value?.metrics?.[key];
				if (value !== void 0 && value !== null) return value;
			}
			return "—";
		};
		const summary = computed(() => dashboard.value?.attendance_today_summary || dashboard.value?.attendance_summary || {});
		const todayStatusCounts = computed(() => {
			const counts = {
				present: 0,
				absent: 0,
				late: 0
			};
			for (const record of todayRecords.value || []) {
				const status = String(record.status || "").toUpperCase();
				if (status === "LATE" || record.is_late === true || record.late === true) counts.late++;
				else if (status === "PRESENT") counts.present++;
				else if (status === "ABSENT") counts.absent++;
			}
			return counts;
		});
		const todayStatus = (key) => {
			const serverCount = summary.value?.[key] ?? summary.value?.[`${key}_count`];
			if (serverCount !== void 0 && serverCount !== null) return serverCount;
			return todayRecords.value ? todayStatusCounts.value[key] : "—";
		};
		const formatUptime = (value) => {
			const uptime = Number(value);
			if (!Number.isFinite(uptime)) return "—";
			const seconds = Math.max(0, Math.floor(uptime));
			const days = Math.floor(seconds / 86400);
			const hours = Math.floor(seconds % 86400 / 3600);
			const minutes = Math.floor(seconds % 3600 / 60);
			return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
		};
		const healthComponents = computed(() => {
			if (!health.value) return [];
			return [
				{
					name: "Database",
					...health.value.database
				},
				{
					name: "Email",
					...health.value.email
				},
				{
					name: "Face recognition model",
					...health.value.face_recognition_model
				}
			];
		});
		const healthTone = (status) => {
			const normalized = status.toLowerCase();
			return ["ok", "healthy"].includes(normalized) ? "bg-success" : normalized === "unknown" || !normalized ? "bg-gray-400" : "bg-danger";
		};
		const chartPoints = computed(() => attendance.value.map((point, index) => ({
			...point,
			x: attendance.value.length > 1 ? 28 + index * (560 / (attendance.value.length - 1)) : 308,
			y: 208 - point.attendanceRate / 100 * 150
		})));
		const chartPath = computed(() => chartPoints.value.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" "));
		const chartArea = computed(() => chartPath.value ? `${chartPath.value} L588 208 L28 208 Z` : "");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-end justify-between"><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Overview</h1><p class="mt-1.5 text-[15px] text-[#64748b]">System status and key metrics from the backend.</p></div><div class="text-right text-xs text-gray-500"><span class="block">${ssrInterpolate(loading.value ? "Loading status…" : error.value ? "Status unavailable" : health.value?.status || "Health status unavailable")}</span>`);
			if (updatedAt.value) _push(`<span class="mt-2 block">Checked ${ssrInterpolate(new Date(updatedAt.value).toLocaleString())}</span>`);
			else _push(`<!---->`);
			_push(`</div></div>`);
			if (loading.value) _push(`<p class="text-sm text-gray-500">Loading overview...</p>`);
			else if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><!--[-->`);
			ssrRenderList([
				{
					label: "Total Roster",
					value: metric("total_roster", "total_students"),
					tone: "border-blue-200 bg-blue-50/20"
				},
				{
					label: "Total Users",
					value: metric("total_users"),
					tone: "border-green-200 bg-green-50/20"
				},
				{
					label: "Total Classes",
					value: metric("total_classes"),
					tone: "border-purple-200 bg-purple-50/20"
				},
				{
					label: "Attendance Today",
					value: metric("total_attendance_today", "attendance_today"),
					tone: "border-orange-200 bg-orange-50/20"
				},
				{
					label: "Active Sessions",
					value: metric("active_sessions"),
					tone: "border-cyan-200 bg-cyan-50/20"
				},
				{
					label: "Attendance Rate Today",
					value: metric("todays_attendance_rate") === "—" ? "—" : `${metric("todays_attendance_rate")}%`,
					tone: "border-teal-200 bg-teal-50/20"
				},
				{
					label: "System Uptime",
					value: formatUptime(health.value?.uptime_seconds),
					tone: "border-gray-200 bg-gray-50/20"
				}
			], (card) => {
				_push(`<article class="${ssrRenderClass([card.tone, "overview-card min-h-[145px] border"])}"><span class="font-mono text-xs text-[#64748b]">${ssrInterpolate(card.label)}</span><strong class="overview-stat text-4xl">${ssrInterpolate(card.value)}</strong></article>`);
			});
			_push(`<!--]--></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><!--[-->`);
			ssrRenderList([
				{
					label: "Manage Users",
					detail: "Add, edit or deactivate users",
					view: "user-management",
					icon: "♙"
				},
				{
					label: "Manage Classes",
					detail: "Create and organize classes",
					view: "class-management",
					icon: "❏"
				},
				{
					label: "View Reports",
					detail: "Attendance and system reports",
					view: "reports",
					icon: "▤"
				},
				{
					label: "System Settings",
					detail: "Configure system preferences",
					view: "settings",
					icon: "⚙"
				}
			], (action) => {
				_push(`<button class="panel-surface flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"><span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f2ff] text-lg text-[#287bd4]">${ssrInterpolate(action.icon)}</span><span><strong class="block text-sm text-[#1f2d3d]">${ssrInterpolate(action.label)}</strong><small class="mt-1 block text-[11px] text-gray-500">${ssrInterpolate(action.detail)}</small></span><span class="ml-auto text-xl text-gray-400">›</span></button>`);
			});
			_push(`<!--]--></div><div class="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]"><article class="panel-surface overflow-hidden"><div class="border-b border-line px-5 py-4"><h2 class="text-lg font-semibold">Attendance Overview</h2></div><div class="p-5">`);
			if (chartPath.value) {
				_push(`<svg viewBox="0 0 600 240" preserveAspectRatio="none" class="h-[235px] w-full"><path d="M28 208 H588 M28 158 H588 M28 108 H588 M28 58 H588" stroke="#e5e7eb"></path><path${ssrRenderAttr("d", chartArea.value)} fill="#e8f3ff"></path><path${ssrRenderAttr("d", chartPath.value)} fill="none" stroke="#287bd4" stroke-width="3"></path><!--[-->`);
				ssrRenderList(chartPoints.value, (point) => {
					_push(`<circle${ssrRenderAttr("cx", point.x)}${ssrRenderAttr("cy", point.y)} r="4" fill="#287bd4"></circle>`);
				});
				_push(`<!--]--></svg>`);
			} else _push(`<p class="${ssrRenderClass([trendError.value ? "text-danger" : "text-gray-500", "py-20 text-center text-sm"])}">${ssrInterpolate(trendError.value || "No attendance trend data returned.")}</p>`);
			if (chartPath.value) _push(`<p class="mb-2 text-right font-mono text-[10px] text-gray-500">ATTENDANCE RATE (%)</p>`);
			else _push(`<!---->`);
			_push(`<div class="flex justify-between gap-2 font-mono text-[10px] text-gray-500"><!--[-->`);
			ssrRenderList(attendance.value, (point) => {
				_push(`<span>${ssrInterpolate(point.period)}</span>`);
			});
			_push(`<!--]--></div><div class="mt-5 grid grid-cols-1 border-t border-line pt-4 text-sm sm:grid-cols-3"><div><span class="text-success">Present</span><strong class="mt-1 block text-lg">${ssrInterpolate(todayStatus("present"))}</strong></div><div class="border-l border-line pl-4"><span class="text-danger">Absent</span><strong class="mt-1 block text-lg">${ssrInterpolate(todayStatus("absent"))}</strong></div><div class="border-l border-line pl-4"><span class="text-warning">Late</span><strong class="mt-1 block text-lg">${ssrInterpolate(todayStatus("late"))}</strong></div></div>`);
			if (recordsError.value && !summary.value.present && !summary.value.absent && !summary.value.late) _push(`<p class="mt-3 text-xs text-danger">${ssrInterpolate(recordsError.value)}</p>`);
			else if (todayRecords.value?.length === 0) _push(`<p class="mt-3 text-xs text-gray-500"> No attendance records have been returned for today. </p>`);
			else _push(`<!---->`);
			_push(`</div></article><article class="panel-surface overflow-hidden"><div class="flex items-center justify-between border-b border-line px-5 py-4"><h2 class="text-lg font-semibold">Recent Activity</h2><button class="text-sm text-cyan-dark">View All →</button></div><!--[-->`);
			ssrRenderList(activity.value, (item) => {
				_push(`<div class="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-light/30 text-cyan-dark">•</span><span class="min-w-0 flex-1"><strong class="block truncate text-xs">${ssrInterpolate(item.title)}</strong><small class="block truncate text-[11px] text-gray-500">${ssrInterpolate(item.detail)}</small></span><span class="text-[10px] text-gray-500">${ssrInterpolate(item.time)}</span></div>`);
			});
			_push(`<!--]-->`);
			if (activityError.value) _push(`<p class="p-5 text-sm text-danger">${ssrInterpolate(activityError.value)}</p>`);
			else if (!activity.value.length) _push(`<p class="p-5 text-sm text-gray-500">No scan or check-in attempts have been recorded.</p>`);
			else _push(`<!---->`);
			_push(`</article></div><article class="panel-surface p-5"><h2 class="mb-4 text-lg font-semibold">System Health</h2>`);
			if (healthError.value) _push(`<p class="mb-3 text-sm text-danger">${ssrInterpolate(healthError.value)}</p>`);
			else _push(`<!---->`);
			if (health.value) {
				_push(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><!--[-->`);
				ssrRenderList(healthComponents.value, (system) => {
					_push(`<div class="flex items-center gap-3 rounded-lg border border-line p-3"><span class="${ssrRenderClass([healthTone(String(system.status || "unknown")), "h-3 w-3 rounded-full"])}"></span><span><strong class="block text-xs">${ssrInterpolate(system.name)}</strong><small class="text-xs text-gray-500">${ssrInterpolate(system.status || "unknown")}`);
					if (system.detail) _push(`<!--[--> · ${ssrInterpolate(system.detail)}<!--]-->`);
					else _push(`<!---->`);
					if (system.backend) _push(`<!--[--> · ${ssrInterpolate(system.backend)}<!--]-->`);
					else _push(`<!---->`);
					if (system.configured !== void 0) _push(`<!--[--> · ${ssrInterpolate(system.configured ? "configured" : "not configured")}<!--]-->`);
					else _push(`<!---->`);
					if (system.model_name) _push(`<!--[--> · ${ssrInterpolate(system.model_name)}${ssrInterpolate(system.loaded === false ? " (loads on first use)" : "")}<!--]-->`);
					else _push(`<!---->`);
					_push(`</small></span></div>`);
				});
				_push(`<!--]--><div class="rounded-lg border border-line p-3"><strong class="block text-xs">Uptime</strong><small class="text-xs text-gray-500">${ssrInterpolate(Number(health.value.uptime_seconds || 0).toFixed(0))} seconds</small></div></div>`);
			} else if (!healthError.value) _push(`<p class="text-sm text-gray-500">System health checks are unavailable.</p>`);
			else _push(`<!---->`);
			_push(`</article></section>`);
		};
	}
});
//#endregion
//#region components/AdminSystemOverview.vue
var _sfc_setup$21 = AdminSystemOverview_vue_vue_type_script_setup_true_lang_default.setup;
AdminSystemOverview_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminSystemOverview.vue");
	return _sfc_setup$21 ? _sfc_setup$21(props, ctx) : void 0;
};
var AdminSystemOverview_default = Object.assign(AdminSystemOverview_vue_vue_type_script_setup_true_lang_default, { __name: "AdminSystemOverview" });
//#endregion
//#region components/AdminOverview.vue?vue&type=script&setup=true&lang.ts
var AdminOverview_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminOverview",
	__ssrInlineRender: true,
	emits: ["startSession", "viewLog"],
	setup(__props, { emit: __emit }) {
		useApi();
		const students = ref([]);
		const activeSessions = ref([]);
		const recentRecords = ref([]);
		const todayCheckIns = ref(0);
		const loading = ref(true);
		const error = ref("");
		const totalRoster = computed(() => students.value.length);
		const activeCount = computed(() => activeSessions.value.length);
		const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
		const formatTime = (iso) => {
			if (!iso) return "—";
			const d = new Date(iso);
			if (Number.isNaN(d.getTime())) return "—";
			return d.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false
			});
		};
		const formatConfidence = (score) => {
			if (score === null) return "N/A";
			return `${Number(score).toFixed(1)}%`;
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-end justify-between gap-5"><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Overview</h1><p class="mt-1.5 text-[#64748b] text-[15px]"> System status and live metrics for today. </p></div><span class="font-mono text-[11px] uppercase tracking-[0.18em] text-[#4b5563]">${ssrInterpolate(loading.value ? "Loading live data" : error.value ? "Live data unavailable" : "Live data loaded")}</span></div>`);
			if (loading.value) _push(`<p class="text-gray-500">Loading system data...</p>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (!loading.value) {
				_push(`<!--[--><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1.1fr_1.35fr] xl:gap-5"><article class="overview-card"><div class="flex items-start justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]"><span>Total roster</span><span class="text-lg text-[#94a3b8]">▣</span></div><div><div class="overview-stat">${ssrInterpolate(totalRoster.value)}</div><p class="mt-2 text-[15px] text-[#64748b]">Enrolled across all sessions</p></div></article><article class="overview-card"><div class="flex items-start justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]"><span>Today&#39;s check-ins</span><span class="text-lg text-[#2fb3d4]">↗</span></div><div><div class="overview-stat flex items-end gap-2"><span>${ssrInterpolate(todayCheckIns.value)}</span></div><p class="mt-2 text-[15px] text-[#64748b]">Attendance records returned today</p></div></article><article class="overview-card"><div class="flex items-start justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]"><span>Active sessions</span><span class="text-lg text-[#94a3b8]">◌</span></div><div><div class="overview-stat">${ssrInterpolate(String(activeCount.value).padStart(2, "0"))}</div><p class="mt-2 text-[15px] text-[#64748b]">Currently scanning</p></div></article><article class="col-span-1 rounded-[18px] bg-[#0e1f31] p-6 text-white shadow-inner shadow-[#0e1f31]"><div class="mb-8 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#88dff3]"><span class="text-lg">▣</span><span>Sentinel Engine</span></div><div class="space-y-3"><h3 class="text-[32px] font-semibold tracking-[-0.06em]">Initialize Scanner</h3><p class="text-[15px] leading-relaxed text-[#d7ebf4]"> Connect to lecture hall camera feeds to begin attendance verification. </p><button class="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[#6dd5ee] bg-transparent px-4 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#6dd5ee] transition hover:bg-[#1a2e44]"><span>ϟ</span> Connect Feed </button></div></article></div><article class="panel-surface overflow-hidden"><div class="flex h-16 items-center justify-between border-b border-[#e5e7eb] px-6"><h2 class="text-[31px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Recent Activity</h2><button class="text-[14px] font-medium text-[#1f2d3d] hover:text-[#2fb3d4]"> View Log → </button></div><div class="overflow-x-auto"><table class="activity-table min-w-[680px]"><thead><tr><th class="w-[11%]">Status</th><th class="w-[30%]">Student Profile</th><th class="w-[18%]">System ID</th><th class="w-[18%]">Timestamp</th><th class="w-[12%]">Confidence</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(recentRecords.value, (record) => {
					_push(`<tr class="activity-row"><td><span class="${ssrRenderClass([record.status === "Present" ? "bg-[#2fb3d4]" : "bg-[#94a3b8]", "inline-block h-2.5 w-2.5 rounded-full"])}"></span></td><td><div class="flex items-center gap-3"><span class="avatar-pill">${ssrInterpolate(initials(record.students?.full_name || "?"))}</span><span class="text-[15px] font-medium text-[#1f2d3d]">${ssrInterpolate(record.students?.full_name || "Unknown")}</span></div></td><td class="font-mono text-[13px] text-[#334155]">${ssrInterpolate(record.students?.student_id || "N/A")}</td><td class="font-mono text-[13px] text-[#64748b]">${ssrInterpolate(formatTime(record.check_in_time))}</td><td><span class="inline-flex rounded border border-[#cbe6f1] bg-[#e9f8ff] px-2 py-1 text-[11px] font-mono text-[#1a6f8f]">${ssrInterpolate(formatConfidence(record.confidence_score))}</span></td></tr>`);
				});
				_push(`<!--]--></tbody></table></div>`);
				if (recentRecords.value.length === 0) _push(`<p class="p-6 text-center text-gray-400"> No recent activity. </p>`);
				else _push(`<!---->`);
				_push(`</article><!--]-->`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/AdminOverview.vue
var _sfc_setup$20 = AdminOverview_vue_vue_type_script_setup_true_lang_default.setup;
AdminOverview_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminOverview.vue");
	return _sfc_setup$20 ? _sfc_setup$20(props, ctx) : void 0;
};
var AdminOverview_default = Object.assign(AdminOverview_vue_vue_type_script_setup_true_lang_default, { __name: "AdminOverview" });
//#endregion
//#region components/BaseModal.vue?vue&type=script&setup=true&lang.ts
var BaseModal_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BaseModal",
	__ssrInlineRender: true,
	props: {
		show: { type: Boolean },
		title: {},
		message: {},
		icon: {},
		buttonText: {}
	},
	emits: ["close", "confirm"],
	setup(__props, { emit: __emit }) {
		return (_ctx, _push, _parent, _attrs) => {
			ssrRenderTeleport(_push, (_push) => {
				if (__props.show) {
					_push(`<div class="fixed inset-0 bg-navy/80 grid place-items-center z-50"><div class="bg-white w-full max-w-md rounded-lg p-8 relative text-center mx-4"><button class="absolute top-2.5 right-3.5 text-2xl border-0 bg-transparent">×</button><span class="text-4xl text-cyan block mb-2">${ssrInterpolate(__props.icon || "⌾")}</span><h2 class="text-xl font-bold mb-2">${ssrInterpolate(__props.title)}</h2><p class="text-muted leading-relaxed mb-4">${ssrInterpolate(__props.message)}</p>`);
					ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
					_push(`<button class="btn-primary w-full mt-4">${ssrInterpolate(__props.buttonText || "Confirm")}</button></div></div>`);
				} else _push(`<!---->`);
			}, "body", false, _parent);
		};
	}
});
//#endregion
//#region components/BaseModal.vue
var _sfc_setup$19 = BaseModal_vue_vue_type_script_setup_true_lang_default.setup;
BaseModal_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/BaseModal.vue");
	return _sfc_setup$19 ? _sfc_setup$19(props, ctx) : void 0;
};
var BaseModal_default = Object.assign(BaseModal_vue_vue_type_script_setup_true_lang_default, { __name: "BaseModal" });
//#endregion
//#region components/SessionSummaryModal.vue?vue&type=script&setup=true&lang.ts
var SessionSummaryModal_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "SessionSummaryModal",
	__ssrInlineRender: true,
	props: {
		session: {},
		attendance: {},
		reviewItems: {}
	},
	emits: ["close"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const durationMinutes = computed(() => {
			if (!props.session.started_at || !props.session.ended_at) return 0;
			const ms = new Date(props.session.ended_at).getTime() - new Date(props.session.started_at).getTime();
			return Math.max(1, Math.round(ms / 6e4));
		});
		const presentCount = computed(() => props.attendance.filter((r) => r.status === "Present").length);
		const attendanceRate = computed(() => {
			if (!props.session.total_expected) return 0;
			return Math.round(presentCount.value / props.session.total_expected * 100);
		});
		const avgConfidence = computed(() => {
			const present = props.attendance.filter((r) => r.status === "Present" && r.confidence_score != null);
			if (present.length === 0) return props.session.avg_confidence || 0;
			return Math.round(present.reduce((sum, r) => sum + Number(r.confidence_score || 0), 0) / present.length * 10) / 10;
		});
		const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		}) : "—";
		const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString([], {
			month: "short",
			day: "numeric",
			year: "numeric"
		}) : "—";
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-6" }, _attrs))}><div class="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="px-8 py-6 border-b border-line flex items-start justify-between"><div><p class="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-dark"> Session Summary </p><h2 class="text-3xl font-semibold mt-1">${ssrInterpolate(__props.session.courses?.course_code || __props.session.session_code)}</h2><p class="text-gray-500 mt-1">${ssrInterpolate(__props.session.courses?.course_name || "Session")} · ${ssrInterpolate(formatDate(__props.session.ended_at))}</p></div><button class="text-gray-400 hover:text-ink text-2xl leading-none"> × </button></div><div class="px-8 py-6"><div class="grid grid-cols-2 sm:grid-cols-4 gap-4"><div class="card p-4 text-center"><p class="font-mono text-[10px] uppercase text-gray-500"> Duration </p><p class="text-2xl font-semibold mt-1">${ssrInterpolate(durationMinutes.value)}<span class="text-sm text-gray-500 ml-1">min</span></p></div><div class="card p-4 text-center"><p class="font-mono text-[10px] uppercase text-gray-500">Present</p><p class="text-2xl font-semibold mt-1 text-cyan-dark">${ssrInterpolate(presentCount.value)}<span class="text-sm text-gray-500 ml-1">/ ${ssrInterpolate(__props.session.total_expected)}</span></p></div><div class="card p-4 text-center"><p class="font-mono text-[10px] uppercase text-gray-500"> Attendance </p><p class="text-2xl font-semibold mt-1">${ssrInterpolate(attendanceRate.value)}%</p></div><div class="card p-4 text-center"><p class="font-mono text-[10px] uppercase text-gray-500"> Avg Confidence </p><p class="text-2xl font-semibold mt-1">${ssrInterpolate(avgConfidence.value)}%</p></div></div>`);
			if (__props.reviewItems.length > 0) {
				_push(`<div class="mt-6"><h3 class="font-semibold mb-3"> Flagged for Review (${ssrInterpolate(__props.reviewItems.length)}) </h3><div class="card overflow-hidden"><div class="table-head grid-cols-[2fr_1.5fr_0.8fr]"><span>Student</span><span>Reason</span><span>Confidence</span></div><!--[-->`);
				ssrRenderList(__props.reviewItems, (item) => {
					_push(`<div class="table-row grid-cols-[2fr_1.5fr_0.8fr]"><span class="font-medium truncate">${ssrInterpolate(item.students?.full_name || "Unknown")}</span><span class="text-gray-500 truncate">${ssrInterpolate(item.reason)}</span><span class="font-mono text-sm flex-shrink-0">${ssrInterpolate(item.confidence_score != null ? item.confidence_score + "%" : "—")}</span></div>`);
				});
				_push(`<!--]--></div></div>`);
			} else _push(`<!---->`);
			_push(`<h3 class="font-semibold mt-6 mb-3">Check-in Log</h3>`);
			if (__props.attendance.length === 0) _push(`<div class="card p-6 text-center text-gray-500"> No attendance records for this session. </div>`);
			else {
				_push(`<div class="card overflow-hidden"><div class="overflow-x-auto"><table class="data-table min-w-[640px]"><thead><tr><th class="w-[30%]">Student</th><th class="w-[22%]">Student ID</th><th class="w-[16%]">Status</th><th class="w-[18%]">Check-in</th><th class="w-[14%] text-right">Confidence</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(__props.attendance, (r) => {
					_push(`<tr><td class="font-medium">${ssrInterpolate(r.students?.full_name || "Unknown")}</td><td class="font-mono text-xs text-gray-600">${ssrInterpolate(r.students?.student_id || "—")}</td><td><span class="${ssrRenderClass(["status-tag inline-block", r.status === "Present" ? "status-verified" : r.status === "Excused" ? "status-pending" : "status-flagged"])}">${ssrInterpolate(r.status)}</span></td><td class="whitespace-nowrap font-mono text-xs text-gray-500">${ssrInterpolate(formatTime(r.check_in_time))}</td><td class="text-right font-mono text-xs text-gray-600">${ssrInterpolate(r.confidence_score != null ? `${Number(r.confidence_score).toFixed(1)}%` : "—")}</td></tr>`);
				});
				_push(`<!--]--></tbody></table></div></div>`);
			}
			_push(`</div><div class="px-8 py-5 border-t border-line flex justify-end gap-3"><button class="btn-outline"> Export Report </button><button class="btn-dark">Close</button></div></div></div>`);
		};
	}
});
//#endregion
//#region components/SessionSummaryModal.vue
var _sfc_setup$18 = SessionSummaryModal_vue_vue_type_script_setup_true_lang_default.setup;
SessionSummaryModal_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SessionSummaryModal.vue");
	return _sfc_setup$18 ? _sfc_setup$18(props, ctx) : void 0;
};
var SessionSummaryModal_default = Object.assign(SessionSummaryModal_vue_vue_type_script_setup_true_lang_default, { __name: "SessionSummaryModal" });
//#endregion
//#region components/AdminSessions.vue?vue&type=script&setup=true&lang.ts
var AdminSessions_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminSessions",
	__ssrInlineRender: true,
	emits: ["notify", "viewRoster"],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		const api = useApi();
		const showSummary = ref(false);
		const summarySession = ref(null);
		const summaryAttendance = ref([]);
		const summaryReviewItems = ref([]);
		const session = ref(null);
		const attendance = ref([]);
		const courses = ref([]);
		const students = ref([]);
		const loading = ref(true);
		const error = ref("");
		ref(null);
		const cameraActive = ref(false);
		const cameraError = ref("");
		ref(false);
		const selectedCourse = ref("");
		const sessionRoom = ref("");
		const expectedCount = ref(0);
		const startingSession = ref(false);
		const showManualEntry = ref(false);
		const manualStudentId = ref("");
		const manualAttendanceStatus = ref("PRESENT");
		const scanMatch = ref(null);
		const scanning = ref(false);
		const presentPct = computed(() => {
			if (!session.value || !session.value.total_expected) return 0;
			return Math.round(session.value.total_present / session.value.total_expected * 100);
		});
		const formatTime = (iso) => {
			return new Date(iso).toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false
			});
		};
		async function handleManualEntry() {
			if (!session.value || !manualStudentId.value.trim()) {
				emit("notify", "Please enter a student ID.");
				return;
			}
			try {
				const student = students.value.find((s) => s.student_id === manualStudentId.value.trim());
				if (!student) {
					emit("notify", `Student ${manualStudentId.value} not found in roster.`);
					return;
				}
				const markedStatus = manualAttendanceStatus.value;
				await api.recordAttendance({
					student_id: student.id,
					session_id: session.value.id,
					status: markedStatus
				});
				await api.updateSessionStats(session.value.id);
				attendance.value = await api.getAttendanceBySession(session.value.id);
				const sessions = await api.getActiveSessions();
				if (sessions.length > 0) session.value = sessions[0];
				showManualEntry.value = false;
				manualStudentId.value = "";
				manualAttendanceStatus.value = "PRESENT";
				emit("notify", `${student.full_name}'s attendance was marked ${markedStatus.toLowerCase()}.`);
			} catch (e) {
				emit("notify", `Error: ${e.message}`);
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_BaseModal = BaseModal_default;
			_push(`<section${ssrRenderAttrs(_attrs)}>`);
			if (!loading.value && !session.value) _push(`<div class="flex items-end justify-between gap-5 mb-6"><div><h1 class="text-3xl tracking-tight">Sessions</h1><p class="mt-2 text-gray-500"> No active session. Start a new attendance scanning session below. </p></div></div>`);
			else _push(`<!---->`);
			if (loading.value) _push(`<div class="text-gray-500">Loading session data...</div>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (!loading.value && !session.value) {
				_push(`<article class="card p-8 max-w-2xl"><h2 class="text-xl mb-6">Start New Session</h2><label class="block font-mono text-[11px] tracking-wide mt-4"> COURSE <select class="input-field mt-2"><option value="" disabled${ssrIncludeBooleanAttr(Array.isArray(selectedCourse.value) ? ssrLooseContain(selectedCourse.value, "") : ssrLooseEqual(selectedCourse.value, "")) ? " selected" : ""}>Select a course...</option><!--[-->`);
				ssrRenderList(courses.value, (c) => {
					_push(`<option${ssrRenderAttr("value", c.id)}${ssrIncludeBooleanAttr(Array.isArray(selectedCourse.value) ? ssrLooseContain(selectedCourse.value, c.id) : ssrLooseEqual(selectedCourse.value, c.id)) ? " selected" : ""}>${ssrInterpolate(c.course_code)}: ${ssrInterpolate(c.course_name)}</option>`);
				});
				_push(`<!--]--></select></label><label class="block font-mono text-[11px] tracking-wide mt-4"> ROOM <input${ssrRenderAttr("value", sessionRoom.value)} type="text" class="input-field mt-2" placeholder="e.g. Turing Theater"></label><label class="block font-mono text-[11px] tracking-wide mt-4"> EXPECTED STUDENTS <input${ssrRenderAttr("value", expectedCount.value)} type="number" min="0" class="input-field mt-2" placeholder="e.g. 150"></label><button class="btn-dark mt-6"${ssrIncludeBooleanAttr(startingSession.value) ? " disabled" : ""}>${ssrInterpolate(startingSession.value ? "Starting..." : "▶ Start Session")}</button></article>`);
			} else _push(`<!---->`);
			if (!loading.value && session.value) {
				_push(`<!--[--><div class="flex items-end justify-between gap-5 mb-6"><div><h1 class="text-3xl tracking-tight">${ssrInterpolate(session.value.courses?.course_name || "Session")}</h1><p class="mt-2 font-mono text-sm text-gray-500"> ID: ${ssrInterpolate(session.value.session_code)}  •  ROOM: ${ssrInterpolate(session.value.room)}  •  <span class="text-cyan">● LIVE</span></p></div><div class="flex gap-2.5"><button class="btn-outline"> ≡ Manual Entry </button><button class="btn-danger">■ Stop Session</button></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_0.8fr]"><article class="rounded-lg bg-[#001319] overflow-hidden"><div class="h-[42px] px-4 flex justify-between items-center bg-gray-100 text-gray-700 font-mono text-xs"><span>CAMERA FEED : ${ssrInterpolate(session.value.room.toUpperCase().replace(/\s/g, "_"))}_CAM_1</span><span>${ssrInterpolate(cameraActive.value ? "● LIVE" : "○ OFFLINE")} | 1080p</span></div><div class="h-[530px] relative border border-gray-700 overflow-hidden"><video class="${ssrRenderClass([{
					"opacity-100": cameraActive.value,
					"opacity-0": !cameraActive.value
				}, "w-full h-full object-cover"])}" autoplay muted playsinline></video>`);
				if (!cameraActive.value) {
					_push(`<div class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-500"><span class="text-6xl">⬡</span><p class="font-mono text-sm">Camera feed inactive</p>`);
					if (cameraError.value) _push(`<p class="text-danger text-xs max-w-xs text-center">${ssrInterpolate(cameraError.value)}</p>`);
					else _push(`<!---->`);
					_push(`<button class="btn-outline text-white border-cyan"> ▶ Activate Camera </button></div>`);
				} else _push(`<!---->`);
				if (cameraActive.value) {
					_push(`<!--[--><i class="absolute w-9 h-9 border-cyan border-solid border-t-4 border-l-4 left-5 top-5 z-10"></i><i class="absolute w-9 h-9 border-cyan border-solid border-t-4 border-r-4 right-5 top-5 z-10"></i><i class="absolute w-9 h-9 border-cyan border-solid border-b-4 border-l-4 left-5 bottom-5 z-10"></i><i class="absolute w-9 h-9 border-cyan border-solid border-b-4 border-r-4 right-5 bottom-5 z-10"></i>`);
					if (scanMatch.value) _push(`<div class="absolute left-[40%] top-[30%] w-[140px] h-[160px] border-2 border-cyan z-10"><div class="absolute top-[164px] -left-4 w-[200px] p-2.5 bg-gray-200 text-ink rounded flex flex-col gap-1 z-10"><b class="font-mono text-xs">MATCH FOUND <span class="text-cyan float-right">${ssrInterpolate(scanMatch.value.confidence == null ? "—" : `${scanMatch.value.confidence}%`)}</span></b><strong class="text-sm">${ssrInterpolate(scanMatch.value.name)}</strong><small class="text-gray-500 font-mono">ID: ${ssrInterpolate(scanMatch.value.id)}</small></div></div>`);
					else _push(`<!---->`);
					if (!scanMatch.value) _push(`<button class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-cyan text-navy px-6 py-2.5 rounded font-mono text-xs font-bold z-10 hover:bg-cyan/80 transition-colors disabled:cursor-not-allowed disabled:opacity-60"${ssrIncludeBooleanAttr(scanning.value) ? " disabled" : ""}>${ssrInterpolate(scanning.value ? "Processing frame..." : "Scan Classroom Frame")}</button>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				_push(`</div></article><aside class="flex flex-col gap-6"><article class="rounded-lg bg-navy-light text-white p-6 min-h-[170px]"><small class="text-gray-300 font-mono text-[11px]">SESSION METRICS</small><div class="flex justify-between my-4"><strong class="text-5xl leading-none">${ssrInterpolate(session.value.total_present)}<em class="block text-gray-300 font-mono text-[11px] mt-2 not-italic">/ ${ssrInterpolate(session.value.total_expected)} PRESENT</em></strong><b class="text-cyan text-3xl leading-none">${ssrInterpolate(Number(session.value.avg_confidence).toFixed(1))}%<em class="block text-gray-300 font-mono text-[11px] mt-2 not-italic">AVG CONFIDENCE</em></b></div><div class="h-1 bg-navy-400 rounded"><i class="block h-full bg-cyan rounded" style="${ssrRenderStyle({ width: presentPct.value + "%" })}"></i></div></article><article class="card overflow-hidden flex-1"><div class="h-16 border-b border-line px-6 flex items-center justify-between"><h3 class="font-mono text-xs uppercase">Recent Check-ins</h3><span class="bg-cyan-light/30 px-2 py-1 font-mono text-[11px]">LIVE LOG</span></div><div class="table-head grid-cols-[38px_1.8fr_0.9fr]"><span>#</span><span>Student</span><span>Time</span></div><!--[-->`);
				ssrRenderList(attendance.value, (record, index) => {
					_push(`<div class="table-row grid-cols-[38px_1.8fr_0.9fr] text-xs"><span class="font-mono">${ssrInterpolate(attendance.value.length - index)}</span><strong>${ssrInterpolate(record.students?.full_name || "Unknown")}</strong><time class="font-mono text-[11px] text-gray-500">${ssrInterpolate(formatTime(record.check_in_time))}</time></div>`);
				});
				_push(`<!--]-->`);
				if (attendance.value.length === 0) _push(`<p class="p-6 text-center text-gray-400"> No check-ins yet. </p>`);
				else _push(`<!---->`);
				_push(`<button class="w-full border-t border-line bg-gray-50 px-4 py-3.5 font-mono text-[11px] uppercase hover:bg-gray-100 transition-colors"> View Full Roster </button></article></aside></div><!--]-->`);
			} else _push(`<!---->`);
			if (showSummary.value && summarySession.value) _push(ssrRenderComponent(SessionSummaryModal_default, {
				session: summarySession.value,
				attendance: summaryAttendance.value,
				"review-items": summaryReviewItems.value,
				onClose: ($event) => showSummary.value = false
			}, null, _parent));
			else _push(`<!---->`);
			_push(ssrRenderComponent(_component_BaseModal, {
				show: showManualEntry.value,
				title: "Manual Attendance Entry",
				message: "Set or correct this student's attendance status for the active session.",
				"button-text": "Save Attendance",
				onClose: ($event) => showManualEntry.value = false,
				onConfirm: handleManualEntry
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="text-left"${_scopeId}><label class="block font-mono text-[11px] tracking-wide mt-4"${_scopeId}> STUDENT ID <input${ssrRenderAttr("value", manualStudentId.value)} type="text" class="input-field mt-2" placeholder="e.g. STU-8829-XR"${_scopeId}></label><label class="block font-mono text-[11px] tracking-wide mt-4"${_scopeId}> ATTENDANCE STATUS <select class="input-field mt-2"${_scopeId}><option value="PRESENT"${ssrIncludeBooleanAttr(Array.isArray(manualAttendanceStatus.value) ? ssrLooseContain(manualAttendanceStatus.value, "PRESENT") : ssrLooseEqual(manualAttendanceStatus.value, "PRESENT")) ? " selected" : ""}${_scopeId}>Present</option><option value="ABSENT"${ssrIncludeBooleanAttr(Array.isArray(manualAttendanceStatus.value) ? ssrLooseContain(manualAttendanceStatus.value, "ABSENT") : ssrLooseEqual(manualAttendanceStatus.value, "ABSENT")) ? " selected" : ""}${_scopeId}>Absent</option><option value="EXCUSED"${ssrIncludeBooleanAttr(Array.isArray(manualAttendanceStatus.value) ? ssrLooseContain(manualAttendanceStatus.value, "EXCUSED") : ssrLooseEqual(manualAttendanceStatus.value, "EXCUSED")) ? " selected" : ""}${_scopeId}>Excused</option></select></label></div>`);
					else return [createVNode("div", { class: "text-left" }, [createVNode("label", { class: "block font-mono text-[11px] tracking-wide mt-4" }, [createTextVNode(" STUDENT ID "), withDirectives(createVNode("input", {
						"onUpdate:modelValue": ($event) => manualStudentId.value = $event,
						type: "text",
						class: "input-field mt-2",
						placeholder: "e.g. STU-8829-XR"
					}, null, 8, ["onUpdate:modelValue"]), [[vModelText, manualStudentId.value]])]), createVNode("label", { class: "block font-mono text-[11px] tracking-wide mt-4" }, [createTextVNode(" ATTENDANCE STATUS "), withDirectives(createVNode("select", {
						"onUpdate:modelValue": ($event) => manualAttendanceStatus.value = $event,
						class: "input-field mt-2"
					}, [
						createVNode("option", { value: "PRESENT" }, "Present"),
						createVNode("option", { value: "ABSENT" }, "Absent"),
						createVNode("option", { value: "EXCUSED" }, "Excused")
					], 8, ["onUpdate:modelValue"]), [[vModelSelect, manualAttendanceStatus.value]])])])];
				}),
				_: 1
			}, _parent));
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/AdminSessions.vue
var _sfc_setup$17 = AdminSessions_vue_vue_type_script_setup_true_lang_default.setup;
AdminSessions_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminSessions.vue");
	return _sfc_setup$17 ? _sfc_setup$17(props, ctx) : void 0;
};
var AdminSessions_default = Object.assign(AdminSessions_vue_vue_type_script_setup_true_lang_default, { __name: "AdminSessions" });
//#endregion
//#region components/AdminLogs.vue?vue&type=script&setup=true&lang.ts
var AdminLogs_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminLogs",
	__ssrInlineRender: true,
	setup(__props) {
		useApi();
		const logs = ref([]);
		const loading = ref(true);
		const error = ref("");
		function actor(log) {
			return log.user_name || log.username || log.user?.full_name || log.user?.email || "System";
		}
		function eventName(log) {
			return log.action || log.event || log.message || log.module || "Audit event";
		}
		function eventTime(log) {
			const value = log.created_at || log.timestamp;
			if (!value) return "—";
			const date = new Date(value);
			return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">System Logs</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Face-recognition scan and check-in attempts recorded by the backend.</p></div>`);
			if (loading.value) _push(`<p class="text-sm text-gray-500">Loading audit logs...</p>`);
			else if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else {
				_push(`<article class="panel-surface overflow-x-auto"><table class="data-table min-w-[680px]"><thead><tr><th>Event</th><th>Actor</th><th>Details</th><th>Date</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(logs.value, (log, index) => {
					_push(`<tr><td class="font-medium">${ssrInterpolate(eventName(log))}</td><td>${ssrInterpolate(actor(log))}</td><td>${ssrInterpolate(log.details || log.description || log.module || "—")}</td><td class="font-mono text-xs text-gray-500">${ssrInterpolate(eventTime(log))}</td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
				if (!logs.value.length) _push(`<p class="p-6 text-center text-sm text-gray-500">No scan or check-in attempts are available in this audit-log scope.</p>`);
				else _push(`<!---->`);
				_push(`</article>`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/AdminLogs.vue
var _sfc_setup$16 = AdminLogs_vue_vue_type_script_setup_true_lang_default.setup;
AdminLogs_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminLogs.vue");
	return _sfc_setup$16 ? _sfc_setup$16(props, ctx) : void 0;
};
var AdminLogs_default = Object.assign(AdminLogs_vue_vue_type_script_setup_true_lang_default, { __name: "AdminLogs" });
//#endregion
//#region components/UserManagement.vue?vue&type=script&setup=true&lang.ts
var UserManagement_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "UserManagement",
	__ssrInlineRender: true,
	setup(__props) {
		const api = useApi();
		const query = ref("");
		const roleFilter = ref("");
		const statusFilter = ref("");
		const users = ref([]);
		const loading = ref(true);
		const error = ref("");
		let searchTimer = null;
		let requestSequence = 0;
		const showAddUser = ref(false);
		const addingUser = ref(false);
		const addUserError = ref("");
		const newUser = ref({
			fullName: "",
			email: "",
			role: "LECTURER",
			department: ""
		});
		function mapUser(user) {
			const rawRole = String(user.role || user.user_role || "").toUpperCase();
			return {
				id: user.id,
				name: user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Unnamed user",
				username: user.username || "",
				email: user.email || "",
				role: rawRole === "ADMIN" ? "Administrator" : rawRole === "LECTURER" ? "Lecturer" : rawRole === "STUDENT" ? "Student" : rawRole || "Unknown",
				department: user.department || user.student?.department || "",
				status: user.is_active === false ? "Inactive" : "Active",
				lastLogin: user.last_login ? new Date(user.last_login).toLocaleString() : "Never"
			};
		}
		async function loadUsers() {
			const sequence = ++requestSequence;
			loading.value = true;
			error.value = "";
			try {
				const rows = await api.getUsers({
					search: query.value,
					role: roleFilter.value,
					is_active: statusFilter.value === "" ? "" : statusFilter.value === "Active"
				});
				if (sequence === requestSequence) users.value = rows.map(mapUser);
			} catch (e) {
				if (sequence === requestSequence) error.value = e?.message || "Unable to load users.";
			} finally {
				if (sequence === requestSequence) loading.value = false;
			}
		}
		watch([
			query,
			roleFilter,
			statusFilter
		], () => {
			if (searchTimer) clearTimeout(searchTimer);
			searchTimer = setTimeout(loadUsers, query.value.trim() ? 300 : 0);
		});
		const roleCounts = computed(() => ({
			Student: users.value.filter((user) => user.role === "Student").length,
			Lecturer: users.value.filter((user) => user.role === "Lecturer").length,
			Administrator: users.value.filter((user) => user.role === "Administrator").length
		}));
		const initials = (name) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
		async function addUser() {
			addUserError.value = "";
			if (!newUser.value.fullName.trim() || !newUser.value.email.trim()) {
				addUserError.value = "Full name and email are required.";
				return;
			}
			addingUser.value = true;
			try {
				const parts = newUser.value.fullName.trim().split(/\s+/);
				await api.createUser({
					username: newUser.value.email.trim(),
					email: newUser.value.email.trim(),
					first_name: parts.shift() || "",
					last_name: parts.join(" "),
					role: newUser.value.role,
					department: newUser.value.department.trim() || void 0
				});
				showAddUser.value = false;
				newUser.value = {
					fullName: "",
					email: "",
					role: "LECTURER",
					department: ""
				};
				await loadUsers();
			} catch (e) {
				addUserError.value = e?.payload?.detail || e?.message || "Unable to create user.";
			} finally {
				addingUser.value = false;
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_BaseModal = BaseModal_default;
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-end justify-between gap-5 max-md:flex-col max-md:items-start"><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">User Management</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Manage students, lecturers and administrators.</p></div><button class="btn-primary">＋ Add User</button></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><!--[-->`);
			ssrRenderList([
				{
					label: "Total Users",
					value: users.value.length,
					color: "text-cyan"
				},
				{
					label: "Students",
					value: roleCounts.value.Student,
					color: "text-cyan"
				},
				{
					label: "Lecturers",
					value: roleCounts.value.Lecturer,
					color: "text-danger"
				},
				{
					label: "Administrators",
					value: roleCounts.value.Administrator,
					color: "text-purple-500"
				}
			], (stat) => {
				_push(`<article class="overview-card min-h-[120px]"><span class="font-mono text-xs text-gray-500">${ssrInterpolate(stat.label)}</span><strong class="overview-stat text-4xl">${ssrInterpolate(stat.value)}</strong></article>`);
			});
			_push(`<!--]--></div><article class="panel-surface overflow-x-auto"><div class="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4"><input${ssrRenderAttr("value", query.value)} class="input-field min-w-[220px] max-w-[440px] flex-1" placeholder="Search name, username, or email..."><select class="btn-outline"><option value=""${ssrIncludeBooleanAttr(Array.isArray(roleFilter.value) ? ssrLooseContain(roleFilter.value, "") : ssrLooseEqual(roleFilter.value, "")) ? " selected" : ""}>All Roles</option><option value="STUDENT"${ssrIncludeBooleanAttr(Array.isArray(roleFilter.value) ? ssrLooseContain(roleFilter.value, "STUDENT") : ssrLooseEqual(roleFilter.value, "STUDENT")) ? " selected" : ""}>Student</option><option value="LECTURER"${ssrIncludeBooleanAttr(Array.isArray(roleFilter.value) ? ssrLooseContain(roleFilter.value, "LECTURER") : ssrLooseEqual(roleFilter.value, "LECTURER")) ? " selected" : ""}>Lecturer</option><option value="ADMIN"${ssrIncludeBooleanAttr(Array.isArray(roleFilter.value) ? ssrLooseContain(roleFilter.value, "ADMIN") : ssrLooseEqual(roleFilter.value, "ADMIN")) ? " selected" : ""}>Administrator</option></select><select class="btn-outline"><option value=""${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "") : ssrLooseEqual(statusFilter.value, "")) ? " selected" : ""}>All Statuses</option><option value="Active"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "Active") : ssrLooseEqual(statusFilter.value, "Active")) ? " selected" : ""}>Active</option><option value="Inactive"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "Inactive") : ssrLooseEqual(statusFilter.value, "Inactive")) ? " selected" : ""}>Inactive</option></select></div>`);
			if (loading.value) _push(`<p class="p-6 text-sm text-gray-500">Loading users...</p>`);
			else if (error.value) _push(`<p class="p-6 text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else {
				_push(`<!--[--><div class="overflow-x-auto"><table class="data-table"><thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Last Login</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(users.value, (user) => {
					_push(`<tr><td><div class="flex items-center gap-3"><span class="avatar-pill">${ssrInterpolate(initials(user.name))}</span><strong>${ssrInterpolate(user.name)}</strong></div></td><td>${ssrInterpolate(user.username || "—")}</td><td class="text-gray-500">${ssrInterpolate(user.email || "—")}</td><td><span class="mini-pill">${ssrInterpolate(user.role)}</span></td><td>${ssrInterpolate(user.department || "—")}</td><td><span class="${ssrRenderClass([user.status === "Active" ? "status-verified" : "status-pending", "status-tag"])}">${ssrInterpolate(user.status)}</span></td><td class="font-mono text-xs text-gray-500">${ssrInterpolate(user.lastLogin)}</td></tr>`);
				});
				_push(`<!--]-->`);
				if (users.value.length === 0) _push(`<tr><td colspan="7" class="text-center text-gray-500">No users match these filters.</td></tr>`);
				else _push(`<!---->`);
				_push(`</tbody></table></div><div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing ${ssrInterpolate(users.value.length)} users</div><!--]-->`);
			}
			_push(`</article>`);
			_push(ssrRenderComponent(_component_BaseModal, {
				show: showAddUser.value,
				title: "Add User",
				message: "Create a lecturer or administrator account. The backend provisions the account and credentials.",
				"button-text": addingUser.value ? "Creating..." : "Create User",
				onClose: ($event) => showAddUser.value = false,
				onConfirm: addUser
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="space-y-4 text-left"${_scopeId}>`);
						if (addUserError.value) _push(`<p class="text-sm text-danger"${_scopeId}>${ssrInterpolate(addUserError.value)}</p>`);
						else _push(`<!---->`);
						_push(`<label class="block font-mono text-[11px]"${_scopeId}>FULL NAME<input${ssrRenderAttr("value", newUser.value.fullName)} class="input-field mt-2" required${_scopeId}></label><label class="block font-mono text-[11px]"${_scopeId}>EMAIL<input${ssrRenderAttr("value", newUser.value.email)} type="email" class="input-field mt-2" required${_scopeId}></label><div class="grid grid-cols-2 gap-3"${_scopeId}><label class="block font-mono text-[11px]"${_scopeId}>ROLE<select class="input-field mt-2"${_scopeId}><option value="LECTURER"${ssrIncludeBooleanAttr(Array.isArray(newUser.value.role) ? ssrLooseContain(newUser.value.role, "LECTURER") : ssrLooseEqual(newUser.value.role, "LECTURER")) ? " selected" : ""}${_scopeId}>Lecturer</option><option value="ADMIN"${ssrIncludeBooleanAttr(Array.isArray(newUser.value.role) ? ssrLooseContain(newUser.value.role, "ADMIN") : ssrLooseEqual(newUser.value.role, "ADMIN")) ? " selected" : ""}${_scopeId}>Administrator</option></select></label><label class="block font-mono text-[11px]"${_scopeId}>DEPARTMENT<input${ssrRenderAttr("value", newUser.value.department)} class="input-field mt-2"${_scopeId}></label></div></div>`);
					} else return [createVNode("div", { class: "space-y-4 text-left" }, [
						addUserError.value ? (openBlock(), createBlock("p", {
							key: 0,
							class: "text-sm text-danger"
						}, toDisplayString(addUserError.value), 1)) : createCommentVNode("", true),
						createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("FULL NAME"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newUser.value.fullName = $event,
							class: "input-field mt-2",
							required: ""
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newUser.value.fullName]])]),
						createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("EMAIL"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newUser.value.email = $event,
							type: "email",
							class: "input-field mt-2",
							required: ""
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newUser.value.email]])]),
						createVNode("div", { class: "grid grid-cols-2 gap-3" }, [createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("ROLE"), withDirectives(createVNode("select", {
							"onUpdate:modelValue": ($event) => newUser.value.role = $event,
							class: "input-field mt-2"
						}, [createVNode("option", { value: "LECTURER" }, "Lecturer"), createVNode("option", { value: "ADMIN" }, "Administrator")], 8, ["onUpdate:modelValue"]), [[vModelSelect, newUser.value.role]])]), createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("DEPARTMENT"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newUser.value.department = $event,
							class: "input-field mt-2"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newUser.value.department]])])])
					])];
				}),
				_: 1
			}, _parent));
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/UserManagement.vue
var _sfc_setup$15 = UserManagement_vue_vue_type_script_setup_true_lang_default.setup;
UserManagement_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/UserManagement.vue");
	return _sfc_setup$15 ? _sfc_setup$15(props, ctx) : void 0;
};
var UserManagement_default = Object.assign(UserManagement_vue_vue_type_script_setup_true_lang_default, { __name: "UserManagement" });
//#endregion
//#region components/ClassManagement.vue?vue&type=script&setup=true&lang.ts
var ClassManagement_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "ClassManagement",
	__ssrInlineRender: true,
	setup(__props) {
		const api = useApi();
		const query = ref("");
		const departmentFilter = ref("");
		const semesterFilter = ref("");
		const loading = ref(true);
		const saving = ref(false);
		const error = ref("");
		const classes = ref([]);
		const departmentOptions = ref([]);
		const semesterOptions = ref([]);
		const showAdd = ref(false);
		const addError = ref("");
		const newClass = ref({
			code: "",
			name: "",
			department: "",
			semester: "",
			credits: 3,
			lecturer: ""
		});
		let filterTimer = null;
		let loadSequence = 0;
		function mapCourse(course) {
			return {
				id: course.id,
				name: course.course_name || course.name || "Unnamed course",
				code: course.course_code || course.code || "",
				department: course.department || "",
				lecturer: course.professor || course.lecturer_name || (course.lecturer ? `Lecturer #${course.lecturer}` : "Unassigned"),
				students: Array.isArray(course.student_roster) ? course.student_roster.length : Array.isArray(course.students) ? course.students.length : Number(course.student_count ?? 0),
				semester: course.semester || "",
				status: course.is_active === false ? "Inactive" : "Active"
			};
		}
		async function loadClasses() {
			const sequence = ++loadSequence;
			loading.value = true;
			error.value = "";
			try {
				const courses = await api.getCourses({
					search: query.value,
					department: departmentFilter.value,
					semester: semesterFilter.value
				});
				if (sequence === loadSequence) {
					classes.value = courses.map(mapCourse);
					departmentOptions.value = [.../* @__PURE__ */ new Set([...departmentOptions.value, ...classes.value.map((item) => item.department).filter(Boolean)])].sort();
					semesterOptions.value = [.../* @__PURE__ */ new Set([...semesterOptions.value, ...classes.value.map((item) => item.semester).filter(Boolean)])].sort();
				}
			} catch (e) {
				if (sequence === loadSequence) error.value = e?.message || "Unable to load classes.";
			} finally {
				if (sequence === loadSequence) loading.value = false;
			}
		}
		watch([
			query,
			departmentFilter,
			semesterFilter
		], () => {
			if (filterTimer) clearTimeout(filterTimer);
			filterTimer = setTimeout(loadClasses, query.value.trim() ? 300 : 0);
		});
		const filteredClasses = computed(() => classes.value);
		const activeClasses = computed(() => classes.value.filter((item) => item.status === "Active").length);
		const studentCount = computed(() => classes.value.reduce((total, item) => total + item.students, 0));
		async function createClass() {
			addError.value = "";
			if (!newClass.value.code.trim() || !newClass.value.name.trim()) {
				addError.value = "Course code and name are required.";
				return;
			}
			saving.value = true;
			try {
				await api.createCourse({
					code: newClass.value.code.trim(),
					name: newClass.value.name.trim(),
					credits: Number(newClass.value.credits) || 3,
					lecturer: newClass.value.lecturer.trim(),
					department: newClass.value.department.trim(),
					semester: newClass.value.semester.trim()
				});
				showAdd.value = false;
				newClass.value = {
					code: "",
					name: "",
					department: "",
					semester: "",
					credits: 3,
					lecturer: ""
				};
				query.value = "";
				departmentFilter.value = "";
				semesterFilter.value = "";
				await loadClasses();
			} catch (e) {
				addError.value = e?.payload?.detail || e?.message || "Unable to create class.";
			} finally {
				saving.value = false;
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_BaseModal = BaseModal_default;
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-end justify-between gap-5 max-md:flex-col max-md:items-start"><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Class Management</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Create and manage classes, sections and schedules.</p></div><button class="btn-primary">＋ Add Class</button></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><!--[-->`);
			ssrRenderList([
				{
					label: "Matching Classes",
					value: classes.value.length
				},
				{
					label: "Total Sections",
					value: "—"
				},
				{
					label: "Students in Results",
					value: studentCount.value
				},
				{
					label: "Active Classes in Results",
					value: activeClasses.value
				}
			], (stat) => {
				_push(`<article class="overview-card min-h-[120px]"><span class="font-mono text-xs text-gray-500">${ssrInterpolate(stat.label)}</span><strong class="overview-stat text-4xl">${ssrInterpolate(stat.value)}</strong></article>`);
			});
			_push(`<!--]--></div><article class="panel-surface overflow-x-auto">`);
			if (loading.value) _push(`<p class="p-6 text-sm text-gray-500">Loading classes...</p>`);
			else if (error.value) _push(`<p class="p-6 text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else {
				_push(`<!--[--><div class="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4"><input${ssrRenderAttr("value", query.value)} class="input-field min-w-[220px] flex-1" placeholder="Search code, name, department, semester, lecturer..."><select class="btn-outline"><option value=""${ssrIncludeBooleanAttr(Array.isArray(departmentFilter.value) ? ssrLooseContain(departmentFilter.value, "") : ssrLooseEqual(departmentFilter.value, "")) ? " selected" : ""}>All Departments</option><!--[-->`);
				ssrRenderList(departmentOptions.value, (department) => {
					_push(`<option${ssrRenderAttr("value", department)}${ssrIncludeBooleanAttr(Array.isArray(departmentFilter.value) ? ssrLooseContain(departmentFilter.value, department) : ssrLooseEqual(departmentFilter.value, department)) ? " selected" : ""}>${ssrInterpolate(department)}</option>`);
				});
				_push(`<!--]--></select><select class="btn-outline"><option value=""${ssrIncludeBooleanAttr(Array.isArray(semesterFilter.value) ? ssrLooseContain(semesterFilter.value, "") : ssrLooseEqual(semesterFilter.value, "")) ? " selected" : ""}>All Semesters</option><!--[-->`);
				ssrRenderList(semesterOptions.value, (semester) => {
					_push(`<option${ssrRenderAttr("value", semester)}${ssrIncludeBooleanAttr(Array.isArray(semesterFilter.value) ? ssrLooseContain(semesterFilter.value, semester) : ssrLooseEqual(semesterFilter.value, semester)) ? " selected" : ""}>${ssrInterpolate(semester)}</option>`);
				});
				_push(`<!--]--></select></div><div class="overflow-x-auto"><table class="data-table"><thead><tr><th>Class Name</th><th>Course Code</th><th>Department</th><th>Lecturer</th><th>Students</th><th>Semester</th><th>Status</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(filteredClasses.value, (item) => {
					_push(`<tr><td class="font-medium">${ssrInterpolate(item.name)}</td><td class="font-mono text-xs">${ssrInterpolate(item.code)}</td><td>${ssrInterpolate(item.department || "—")}</td><td>${ssrInterpolate(item.lecturer)}</td><td>${ssrInterpolate(item.students)}</td><td>${ssrInterpolate(item.semester || "—")}</td><td><span class="${ssrRenderClass([item.status === "Active" ? "status-verified" : "status-pending", "status-tag"])}">${ssrInterpolate(item.status)}</span></td></tr>`);
				});
				_push(`<!--]-->`);
				if (filteredClasses.value.length === 0) _push(`<tr><td colspan="7" class="text-center text-gray-500">No classes match these filters.</td></tr>`);
				else _push(`<!---->`);
				_push(`</tbody></table></div><div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing ${ssrInterpolate(filteredClasses.value.length)} of ${ssrInterpolate(classes.value.length)} classes</div><!--]-->`);
			}
			_push(`</article>`);
			_push(ssrRenderComponent(_component_BaseModal, {
				show: showAdd.value,
				title: "Add Class",
				message: "Create a class with its department and semester.",
				"button-text": saving.value ? "Creating..." : "Create Class",
				onClose: ($event) => showAdd.value = false,
				onConfirm: createClass
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="space-y-4 text-left"${_scopeId}>`);
						if (addError.value) _push(`<p class="text-sm text-danger"${_scopeId}>${ssrInterpolate(addError.value)}</p>`);
						else _push(`<!---->`);
						_push(`<label class="block font-mono text-[11px]"${_scopeId}>CLASS NAME<input${ssrRenderAttr("value", newClass.value.name)} class="input-field mt-2" required${_scopeId}></label><label class="block font-mono text-[11px]"${_scopeId}>COURSE CODE<input${ssrRenderAttr("value", newClass.value.code)} class="input-field mt-2" required${_scopeId}></label><div class="grid grid-cols-2 gap-3"${_scopeId}><label class="block font-mono text-[11px]"${_scopeId}>DEPARTMENT<input${ssrRenderAttr("value", newClass.value.department)} class="input-field mt-2"${_scopeId}></label><label class="block font-mono text-[11px]"${_scopeId}>SEMESTER<input${ssrRenderAttr("value", newClass.value.semester)} class="input-field mt-2"${_scopeId}></label></div><div class="grid grid-cols-2 gap-3"${_scopeId}><label class="block font-mono text-[11px]"${_scopeId}>CREDITS<input${ssrRenderAttr("value", newClass.value.credits)} type="number" min="1" class="input-field mt-2"${_scopeId}></label><label class="block font-mono text-[11px]"${_scopeId}>LECTURER USER ID<input${ssrRenderAttr("value", newClass.value.lecturer)} class="input-field mt-2"${_scopeId}></label></div></div>`);
					} else return [createVNode("div", { class: "space-y-4 text-left" }, [
						addError.value ? (openBlock(), createBlock("p", {
							key: 0,
							class: "text-sm text-danger"
						}, toDisplayString(addError.value), 1)) : createCommentVNode("", true),
						createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("CLASS NAME"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newClass.value.name = $event,
							class: "input-field mt-2",
							required: ""
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newClass.value.name]])]),
						createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("COURSE CODE"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newClass.value.code = $event,
							class: "input-field mt-2",
							required: ""
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newClass.value.code]])]),
						createVNode("div", { class: "grid grid-cols-2 gap-3" }, [createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("DEPARTMENT"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newClass.value.department = $event,
							class: "input-field mt-2"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newClass.value.department]])]), createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("SEMESTER"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newClass.value.semester = $event,
							class: "input-field mt-2"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newClass.value.semester]])])]),
						createVNode("div", { class: "grid grid-cols-2 gap-3" }, [createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("CREDITS"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newClass.value.credits = $event,
							type: "number",
							min: "1",
							class: "input-field mt-2"
						}, null, 8, ["onUpdate:modelValue"]), [[
							vModelText,
							newClass.value.credits,
							void 0,
							{ number: true }
						]])]), createVNode("label", { class: "block font-mono text-[11px]" }, [createTextVNode("LECTURER USER ID"), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newClass.value.lecturer = $event,
							class: "input-field mt-2"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newClass.value.lecturer]])])])
					])];
				}),
				_: 1
			}, _parent));
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/ClassManagement.vue
var _sfc_setup$14 = ClassManagement_vue_vue_type_script_setup_true_lang_default.setup;
ClassManagement_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ClassManagement.vue");
	return _sfc_setup$14 ? _sfc_setup$14(props, ctx) : void 0;
};
var ClassManagement_default = Object.assign(ClassManagement_vue_vue_type_script_setup_true_lang_default, { __name: "ClassManagement" });
//#endregion
//#region components/AdminCourses.vue?vue&type=script&setup=true&lang.ts
var AdminCourses_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminCourses",
	__ssrInlineRender: true,
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		const api = useApi();
		const { isAdmin } = usePortal();
		const courses = ref([]);
		const loading = ref(true);
		const error = ref("");
		const expandedId = ref(null);
		const studentFilter = ref("");
		const matchingStudents = ref([]);
		const selectedStudentIds = ref(/* @__PURE__ */ new Set());
		const searchingStudents = ref(false);
		const addingStudents = ref(false);
		const studentSearchError = ref("");
		let studentSearchTimer = null;
		let studentSearchSequence = 0;
		const showAdd = ref(false);
		const adding = ref(false);
		const newCourse = ref({
			code: "",
			name: "",
			credits: 3,
			lecturer: "",
			department: "",
			semester: ""
		});
		const slots = ref([]);
		const slotsLoading = ref(false);
		const newSlot = ref({
			day_of_week: 1,
			start_time: "09:00",
			end_time: "10:30",
			room: ""
		});
		const addingSlot = ref(false);
		const DAYS = [
			{
				v: 1,
				label: "Monday"
			},
			{
				v: 2,
				label: "Tuesday"
			},
			{
				v: 3,
				label: "Wednesday"
			},
			{
				v: 4,
				label: "Thursday"
			},
			{
				v: 5,
				label: "Friday"
			},
			{
				v: 6,
				label: "Saturday"
			},
			{
				v: 7,
				label: "Sunday"
			}
		];
		const dayLabel = (v) => DAYS.find((d) => d.v === v)?.label || `Day ${v}`;
		async function load() {
			loading.value = true;
			error.value = "";
			try {
				const c = await api.getCourses();
				courses.value = c;
			} catch (e) {
				error.value = e?.message || "Unable to load courses.";
			} finally {
				loading.value = false;
			}
		}
		watch(studentFilter, (search) => {
			if (studentSearchTimer) clearTimeout(studentSearchTimer);
			const courseId = expandedId.value;
			const sequence = ++studentSearchSequence;
			studentSearchError.value = "";
			matchingStudents.value = [];
			if (search.trim().length < 2 || courseId == null) {
				searchingStudents.value = false;
				return;
			}
			searchingStudents.value = true;
			studentSearchTimer = setTimeout(async () => {
				try {
					const results = await api.searchCourseStudents(courseId, search);
					if (sequence === studentSearchSequence) matchingStudents.value = results;
				} catch (e) {
					if (sequence === studentSearchSequence) studentSearchError.value = e?.message || "Unable to search students.";
				} finally {
					if (sequence === studentSearchSequence) searchingStudents.value = false;
				}
			}, 300);
		});
		async function handleAdd() {
			if (!newCourse.value.code.trim() || !newCourse.value.name.trim()) {
				emit("notify", "Course code and name are required.");
				return;
			}
			adding.value = true;
			try {
				await api.createCourse({
					code: newCourse.value.code.trim(),
					name: newCourse.value.name.trim(),
					credits: Number(newCourse.value.credits) || 3,
					lecturer: newCourse.value.lecturer,
					department: newCourse.value.department.trim(),
					semester: newCourse.value.semester.trim()
				});
				showAdd.value = false;
				newCourse.value = {
					code: "",
					name: "",
					credits: 3,
					lecturer: "",
					department: "",
					semester: ""
				};
				await load();
				emit("notify", "Course created.");
			} catch (e) {
				emit("notify", `Error creating course: ${e?.message || "failed"}`);
			} finally {
				adding.value = false;
			}
		}
		const fmtTime = (t) => t ? String(t).slice(0, 5) : "";
		return (_ctx, _push, _parent, _attrs) => {
			const _component_BaseModal = BaseModal_default;
			_push(`<section${ssrRenderAttrs(_attrs)}><div class="flex items-end justify-between gap-5 mb-6"><div><h1 class="text-3xl tracking-tight">Courses</h1><p class="mt-1.5 text-gray-500">Create courses, enrol students, and define weekly schedule slots.</p></div><button class="btn-dark">＋ New Course</button></div>`);
			if (loading.value) _push(`<p class="text-gray-500">Loading courses...</p>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (!loading.value) {
				_push(`<div class="space-y-4">`);
				if (courses.value.length === 0) _push(`<p class="card p-10 text-center text-gray-400"> No courses yet. Use “New Course” to add one. </p>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				ssrRenderList(courses.value, (course) => {
					_push(`<article class="card overflow-hidden"><div class="p-5 flex items-center gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-3"><strong class="text-lg">${ssrInterpolate(course.course_code)}</strong><span class="text-gray-500 truncate">${ssrInterpolate(course.course_name)}</span></div><p class="font-mono text-[11px] text-gray-500 mt-1">${ssrInterpolate(course.credits)} CR · ${ssrInterpolate(course.student_roster?.length || course.students?.length || course.student_count || 0)} student${ssrInterpolate((course.student_roster?.length || course.students?.length || course.student_count || 0) === 1 ? "" : "s")} · ${ssrInterpolate(course.schedule_slots?.length || 0)} slot${ssrInterpolate((course.schedule_slots?.length || 0) === 1 ? "" : "s")} `);
					if (course.professor) _push(`<!--[--> · ${ssrInterpolate(course.professor)}<!--]-->`);
					else _push(`<!---->`);
					if (course.department) _push(`<!--[--> · ${ssrInterpolate(course.department)}<!--]-->`);
					else _push(`<!---->`);
					if (course.semester) _push(`<!--[--> · ${ssrInterpolate(course.semester)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</p></div><button class="btn-outline">${ssrInterpolate(expandedId.value === course.id ? "Close" : "Manage")}</button>`);
					if (unref(isAdmin)) _push(`<button class="font-mono text-[11px] uppercase text-danger hover:underline">Delete</button>`);
					else _push(`<!---->`);
					_push(`</div>`);
					if (expandedId.value === course.id) {
						_push(`<div class="border-t border-line bg-gray-50 p-5 grid lg:grid-cols-2 gap-6"><div><div class="flex items-center justify-between"><h3 class="font-semibold">Enrolled students</h3><span class="font-mono text-xs text-gray-500">${ssrInterpolate((course.student_roster || []).length)} enrolled</span></div>`);
						if (course.student_roster?.length) {
							_push(`<div class="mt-3 max-h-32 overflow-y-auto rounded-md border border-line bg-white divide-y divide-line"><!--[-->`);
							ssrRenderList(course.student_roster, (student) => {
								_push(`<div class="px-3 py-2 text-sm"><strong>${ssrInterpolate(student.full_name || [student.first_name, student.last_name].filter(Boolean).join(" "))}</strong><small class="ml-2 text-gray-500">${ssrInterpolate(student.student_id)} · ${ssrInterpolate(student.department)}</small></div>`);
							});
							_push(`<!--]--></div>`);
						} else _push(`<p class="mt-2 text-sm text-gray-500">No enrolled students in the roster payload.</p>`);
						_push(`<input${ssrRenderAttr("value", studentFilter.value)} class="input-field mt-3" placeholder="Search student ID, name, or department..."><p class="mt-2 text-xs text-gray-500">Enter at least 2 characters. Students already enrolled are excluded.</p>`);
						if (selectedStudentIds.value.size) _push(`<p class="mt-2 text-sm text-gray-600">${ssrInterpolate(selectedStudentIds.value.size)} selected to add</p>`);
						else _push(`<!---->`);
						if (searchingStudents.value) _push(`<p class="mt-2 text-sm text-gray-500">Searching...</p>`);
						else _push(`<!---->`);
						if (studentSearchError.value) _push(`<p class="mt-2 text-sm text-danger">${ssrInterpolate(studentSearchError.value)}</p>`);
						else _push(`<!---->`);
						_push(`<div class="mt-3 border border-line rounded-md bg-white max-h-64 overflow-y-auto divide-y divide-line"><!--[-->`);
						ssrRenderList(matchingStudents.value, (s) => {
							_push(`<label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"><input type="checkbox" class="accent-cyan"${ssrIncludeBooleanAttr(selectedStudentIds.value.has(s.id)) ? " checked" : ""}><span class="min-w-0"><strong class="block text-sm truncate">${ssrInterpolate(s.full_name)}</strong><small class="font-mono text-[11px] text-gray-500">${ssrInterpolate(s.student_id)} · ${ssrInterpolate(s.department)}</small></span></label>`);
						});
						_push(`<!--]-->`);
						if (!searchingStudents.value && studentFilter.value.trim().length >= 2 && matchingStudents.value.length === 0 && !studentSearchError.value) _push(`<p class="px-3 py-4 text-center text-sm text-gray-400">No available matching students.</p>`);
						else _push(`<!---->`);
						_push(`</div><button class="btn-dark mt-3"${ssrIncludeBooleanAttr(addingStudents.value || selectedStudentIds.value.size === 0) ? " disabled" : ""}>${ssrInterpolate(addingStudents.value ? "Adding..." : "Add selected students")}</button></div><div><h3 class="font-semibold">Weekly schedule</h3>`);
						if (slotsLoading.value) _push(`<p class="text-sm text-gray-500 mt-3">Loading slots...</p>`);
						else {
							_push(`<div class="mt-3 space-y-2"><!--[-->`);
							ssrRenderList(slots.value, (slot) => {
								_push(`<div class="flex items-center gap-3 bg-white border border-line rounded-md px-3 py-2 text-sm"><span class="font-medium w-24">${ssrInterpolate(slot.day_of_week_display || dayLabel(slot.day_of_week))}</span><span class="font-mono text-xs text-gray-600">${ssrInterpolate(fmtTime(slot.start_time))}–${ssrInterpolate(fmtTime(slot.end_time))}</span><span class="text-gray-500 flex-1 truncate">${ssrInterpolate(slot.room)}</span><button class="text-danger text-[11px] font-mono uppercase hover:underline">Remove</button></div>`);
							});
							_push(`<!--]-->`);
							if (slots.value.length === 0) _push(`<p class="text-sm text-gray-400">No slots defined.</p>`);
							else _push(`<!---->`);
							_push(`</div>`);
						}
						_push(`<div class="mt-4 bg-white border border-line rounded-md p-3 grid grid-cols-2 gap-2"><label class="text-[10px] font-mono uppercase text-gray-500">Day <select class="input-field mt-1"><!--[-->`);
						ssrRenderList(DAYS, (d) => {
							_push(`<option${ssrRenderAttr("value", d.v)}${ssrIncludeBooleanAttr(Array.isArray(newSlot.value.day_of_week) ? ssrLooseContain(newSlot.value.day_of_week, d.v) : ssrLooseEqual(newSlot.value.day_of_week, d.v)) ? " selected" : ""}>${ssrInterpolate(d.label)}</option>`);
						});
						_push(`<!--]--></select></label><label class="text-[10px] font-mono uppercase text-gray-500">Room <input${ssrRenderAttr("value", newSlot.value.room)} class="input-field mt-1" placeholder="Room A1"></label><label class="text-[10px] font-mono uppercase text-gray-500">Start <input${ssrRenderAttr("value", newSlot.value.start_time)} type="time" class="input-field mt-1"></label><label class="text-[10px] font-mono uppercase text-gray-500">End <input${ssrRenderAttr("value", newSlot.value.end_time)} type="time" class="input-field mt-1"></label><button class="btn-outline col-span-2 mt-1"${ssrIncludeBooleanAttr(addingSlot.value) ? " disabled" : ""}>${ssrInterpolate(addingSlot.value ? "Adding..." : "＋ Add slot")}</button></div></div></div>`);
					} else _push(`<!---->`);
					_push(`</article>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			_push(ssrRenderComponent(_component_BaseModal, {
				show: showAdd.value,
				title: "New Course",
				message: "Define the course. You can enrol students and add schedule slots after it is created.",
				"button-text": adding.value ? "Creating..." : "Create Course",
				onClose: ($event) => showAdd.value = false,
				onConfirm: handleAdd
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="text-left space-y-4"${_scopeId}><label class="block font-mono text-[11px] tracking-wide"${_scopeId}> COURSE CODE <input${ssrRenderAttr("value", newCourse.value.code)} class="input-field mt-2" placeholder="e.g. CS401"${_scopeId}></label><label class="block font-mono text-[11px] tracking-wide"${_scopeId}> COURSE NAME <input${ssrRenderAttr("value", newCourse.value.name)} class="input-field mt-2" placeholder="e.g. Advanced Machine Learning"${_scopeId}></label><div class="grid grid-cols-2 gap-3"${_scopeId}><label class="block font-mono text-[11px] tracking-wide"${_scopeId}> DEPARTMENT <input${ssrRenderAttr("value", newCourse.value.department)} class="input-field mt-2" placeholder="e.g. Computer Science"${_scopeId}></label><label class="block font-mono text-[11px] tracking-wide"${_scopeId}> SEMESTER <input${ssrRenderAttr("value", newCourse.value.semester)} class="input-field mt-2" placeholder="e.g. Fall 2026"${_scopeId}></label></div><div class="grid grid-cols-2 gap-3"${_scopeId}><label class="block font-mono text-[11px] tracking-wide"${_scopeId}> CREDITS <input${ssrRenderAttr("value", newCourse.value.credits)} type="number" min="1" max="12" class="input-field mt-2"${_scopeId}></label><label class="block font-mono text-[11px] tracking-wide"${_scopeId}> LECTURER USER ID <span class="text-gray-400"${_scopeId}>(optional)</span><input${ssrRenderAttr("value", newCourse.value.lecturer)} class="input-field mt-2" placeholder="e.g. 2"${_scopeId}></label></div></div>`);
					else return [createVNode("div", { class: "text-left space-y-4" }, [
						createVNode("label", { class: "block font-mono text-[11px] tracking-wide" }, [createTextVNode(" COURSE CODE "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newCourse.value.code = $event,
							class: "input-field mt-2",
							placeholder: "e.g. CS401"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newCourse.value.code]])]),
						createVNode("label", { class: "block font-mono text-[11px] tracking-wide" }, [createTextVNode(" COURSE NAME "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newCourse.value.name = $event,
							class: "input-field mt-2",
							placeholder: "e.g. Advanced Machine Learning"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newCourse.value.name]])]),
						createVNode("div", { class: "grid grid-cols-2 gap-3" }, [createVNode("label", { class: "block font-mono text-[11px] tracking-wide" }, [createTextVNode(" DEPARTMENT "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newCourse.value.department = $event,
							class: "input-field mt-2",
							placeholder: "e.g. Computer Science"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newCourse.value.department]])]), createVNode("label", { class: "block font-mono text-[11px] tracking-wide" }, [createTextVNode(" SEMESTER "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newCourse.value.semester = $event,
							class: "input-field mt-2",
							placeholder: "e.g. Fall 2026"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newCourse.value.semester]])])]),
						createVNode("div", { class: "grid grid-cols-2 gap-3" }, [createVNode("label", { class: "block font-mono text-[11px] tracking-wide" }, [createTextVNode(" CREDITS "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newCourse.value.credits = $event,
							type: "number",
							min: "1",
							max: "12",
							class: "input-field mt-2"
						}, null, 8, ["onUpdate:modelValue"]), [[
							vModelText,
							newCourse.value.credits,
							void 0,
							{ number: true }
						]])]), createVNode("label", { class: "block font-mono text-[11px] tracking-wide" }, [
							createTextVNode(" LECTURER USER ID "),
							createVNode("span", { class: "text-gray-400" }, "(optional)"),
							withDirectives(createVNode("input", {
								"onUpdate:modelValue": ($event) => newCourse.value.lecturer = $event,
								class: "input-field mt-2",
								placeholder: "e.g. 2"
							}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newCourse.value.lecturer]])
						])])
					])];
				}),
				_: 1
			}, _parent));
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/AdminCourses.vue
var _sfc_setup$13 = AdminCourses_vue_vue_type_script_setup_true_lang_default.setup;
AdminCourses_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminCourses.vue");
	return _sfc_setup$13 ? _sfc_setup$13(props, ctx) : void 0;
};
var AdminCourses_default = Object.assign(AdminCourses_vue_vue_type_script_setup_true_lang_default, { __name: "AdminCourses" });
//#endregion
//#region composables/useCamera.ts
function useCamera() {
	const videoRef = ref(null);
	const ready = ref(false);
	const cameraError = ref("");
	let stream = null;
	function getStream(constraints) {
		return Promise.reject(/* @__PURE__ */ new Error("NO_MEDIA_DEVICES"));
	}
	async function open() {
		cameraError.value = "";
		ready.value = false;
		try {
			stream = await getStream({ video: {
				width: 640,
				height: 480,
				facingMode: "user"
			} });
			if (videoRef.value) {
				videoRef.value.srcObject = stream;
				await videoRef.value.play();
			}
			ready.value = true;
		} catch (e) {
			if (e?.message === "NO_MEDIA_DEVICES" || true) cameraError.value = "Camera needs a secure page. Open the app at http://localhost (not a LAN IP) or over HTTPS.";
		}
	}
	function close() {
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
		ready.value = false;
	}
	function grabFrame(quality = .9) {
		return new Promise((resolve) => {
			const v = videoRef.value;
			if (!v || !v.videoWidth) return resolve(null);
			const canvas = (void 0).createElement("canvas");
			canvas.width = v.videoWidth;
			canvas.height = v.videoHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) return resolve(null);
			ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
			canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
		});
	}
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	return {
		videoRef,
		ready,
		cameraError,
		open,
		close,
		grabFrame,
		wait
	};
}
//#endregion
//#region components/AdminRoster.vue?vue&type=script&setup=true&lang.ts
var pageSize = 10;
var AdminRoster_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminRoster",
	__ssrInlineRender: true,
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		const api = useApi();
		const cam = useCamera();
		cam.videoRef;
		const { isAdmin } = usePortal();
		const students = ref([]);
		const openActionStudentId = ref(null);
		const searchQuery = ref("");
		const departmentFilter = ref("All Departments");
		const currentPage = ref(1);
		const loading = ref(true);
		const error = ref("");
		const showAddForm = ref(false);
		const newStudent = ref({
			full_name: "",
			email: "",
			department: "Computer Science"
		});
		const addingStudent = ref(false);
		const viewStudent = ref(null);
		const verifyTarget = ref(null);
		const verifying = ref(false);
		const verifyError = ref("");
		async function loadStudents() {
			loading.value = true;
			error.value = "";
			try {
				students.value = await api.getStudents();
			} catch (e) {
				error.value = e.message;
			} finally {
				loading.value = false;
			}
		}
		const departments = computed(() => {
			const depts = new Set(students.value.map((s) => s.department));
			return ["All Departments", ...Array.from(depts)];
		});
		const filteredStudents = computed(() => {
			return students.value.filter((s) => {
				const q = searchQuery.value.toLowerCase();
				const matchesSearch = !q || `${s.full_name} ${s.student_id} ${s.department}`.toLowerCase().includes(q);
				const matchesDept = departmentFilter.value === "All Departments" || s.department === departmentFilter.value;
				return matchesSearch && matchesDept;
			});
		});
		const pageCount = computed(() => Math.max(1, Math.ceil(filteredStudents.value.length / pageSize)));
		const pageStudents = computed(() => filteredStudents.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
		const firstVisible = computed(() => filteredStudents.value.length ? (currentPage.value - 1) * pageSize + 1 : 0);
		const lastVisible = computed(() => Math.min(currentPage.value * pageSize, filteredStudents.value.length));
		watch([searchQuery, departmentFilter], () => {
			currentPage.value = 1;
		});
		watch(pageCount, (count) => {
			if (currentPage.value > count) currentPage.value = count;
		});
		const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
		const statusClass = (status) => {
			if (status === "Verified") return "status-verified";
			if (status === "Pending") return "status-pending";
			return "status-flagged";
		};
		const formatDate = (iso) => {
			if (!iso) return "Never";
			const d = new Date(iso);
			return d.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric"
			}) + " " + d.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit"
			});
		};
		async function handleAddStudent() {
			if (!newStudent.value.full_name.trim() || !newStudent.value.email.trim()) {
				emit("notify", "Please fill in name and email.");
				return;
			}
			addingStudent.value = true;
			try {
				const created = await api.createStudent({
					full_name: newStudent.value.full_name,
					email: newStudent.value.email,
					department: newStudent.value.department
				});
				await loadStudents();
				showAddForm.value = false;
				newStudent.value = {
					full_name: "",
					email: "",
					department: "Computer Science"
				};
				emit("notify", created?.login_provisioned === false ? "Student added, but a login could not be created (the ID may already be in use). Set one up manually." : created?.credentials_email_sent === false ? "Student added — no email on file, so login credentials were not sent." : "Student added. A login and temporary password were emailed to the student.");
			} catch (e) {
				emit("notify", `Error adding student: ${e.message}`);
			} finally {
				addingStudent.value = false;
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_BaseModal = BaseModal_default;
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-end justify-between gap-5"><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Student Roster</h1><p class="mt-1.5 text-[15px] text-[#64748b]"> Manage global enrollment, verify identities, and monitor facility access telemetry. </p></div><button class="inline-flex items-center gap-2 rounded-md bg-[#0d2337] px-4 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-white shadow-sm hover:bg-[#18304d]"><span>✚</span> Add Student </button></div>`);
			if (loading.value) _push(`<p class="text-gray-500">Loading roster...</p>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (!loading.value) {
				_push(`<article class="panel-surface overflow-hidden"><div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] bg-[#f8fafb] p-4"><div class="flex w-full max-w-[440px] min-w-0 items-center gap-3 rounded-md border border-[#dfe5eb] bg-white px-3 py-2.5 text-[#64748b] shadow-[0_1px_0_rgba(15,23,42,0.02)]"><span>⌕</span><input${ssrRenderAttr("value", searchQuery.value)} class="w-full border-0 bg-transparent text-[14px] text-[#1f2d3d] placeholder:text-[#94a3b8] outline-none" placeholder="Filter by Name, ID, or Department..."></div><div class="flex items-center gap-3"><select class="rounded-md border border-[#dfe5eb] bg-white px-3 py-2 text-[11px] font-mono uppercase tracking-[0.12em] text-[#475569]"><!--[-->`);
				ssrRenderList(departments.value, (department) => {
					_push(`<option${ssrRenderAttr("value", department)}${ssrIncludeBooleanAttr(Array.isArray(departmentFilter.value) ? ssrLooseContain(departmentFilter.value, department) : ssrLooseEqual(departmentFilter.value, department)) ? " selected" : ""}>${ssrInterpolate(department)}</option>`);
				});
				_push(`<!--]--></select><button class="inline-flex items-center gap-2 rounded-md border border-[#dfe5eb] bg-white px-3 py-2 text-[11px] font-mono uppercase tracking-[0.12em] text-[#475569] hover:bg-[#f8fafb]"><span>⇩</span> Export CSV </button></div></div><div class="overflow-x-auto"><table class="min-w-[760px] w-full border-collapse"><thead><tr><th class="border-b border-[#e5e7eb] bg-[#f3f5f7] px-4 py-3 text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">Student name</th><th class="border-b border-[#e5e7eb] bg-[#f3f5f7] px-4 py-3 text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">Student ID</th><th class="border-b border-[#e5e7eb] bg-[#f3f5f7] px-4 py-3 text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">Department</th><th class="border-b border-[#e5e7eb] bg-[#f3f5f7] px-4 py-3 text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">Enrollment status</th><th class="border-b border-[#e5e7eb] bg-[#f3f5f7] px-4 py-3 text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">Last seen</th><th class="border-b border-[#e5e7eb] bg-[#f3f5f7] px-4 py-3 text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">Action</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(pageStudents.value, (student) => {
					_push(`<tr class="border-b border-[#edf1f5] bg-white text-[#1f2d3d]"><td class="px-4 py-4"><div class="flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#f2f6f8] text-[10px] font-bold text-[#1f2d3d]">${ssrInterpolate(initials(student.full_name))}</span><span class="text-[15px] font-medium">${ssrInterpolate(student.full_name)}</span></div></td><td class="px-4 py-4 font-mono text-[13px] text-[#334155]">${ssrInterpolate(student.student_id)}</td><td class="px-4 py-4 text-[14px] text-[#334155]">${ssrInterpolate(student.department)}</td><td class="px-4 py-4"><span class="${ssrRenderClass([statusClass(student.enrollment_status), "inline-flex items-center gap-2 rounded border px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.08em]"])}"><span class="${ssrRenderClass([student.enrollment_status === "Verified" ? "bg-[#2fb3d4]" : student.enrollment_status === "Pending" ? "bg-[#94a3b8]" : "bg-[#f87171]", "inline-block h-2 w-2 rounded-full"])}"></span> ${ssrInterpolate(student.enrollment_status)}</span></td><td class="px-4 py-4 font-mono text-[13px] text-[#64748b]">${ssrInterpolate(formatDate(student.last_seen))}</td><td class="px-4 py-4"><div class="roster-actions relative flex justify-end"><button type="button" class="flex h-9 w-9 items-center justify-center rounded-md text-[#475569] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan"${ssrRenderAttr("aria-label", `Actions for ${student.full_name}`)} aria-haspopup="menu"${ssrRenderAttr("aria-expanded", openActionStudentId.value === String(student.id))}><svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 fill-current"><circle cx="5" cy="12" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="19" cy="12" r="1.8"></circle></svg></button>`);
					if (openActionStudentId.value === String(student.id)) {
						_push(`<div role="menu" class="absolute right-0 top-full z-20 mt-1 min-w-36 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg"><button type="button" role="menuitem" class="block w-full px-4 py-2 text-left text-sm text-[#334155] hover:bg-gray-50">View</button>`);
						if (student.enrollment_status !== "Verified") _push(`<button type="button" role="menuitem" class="block w-full px-4 py-2 text-left text-sm text-cyan-dark hover:bg-gray-50">Verify</button>`);
						else _push(`<!---->`);
						if (unref(isAdmin)) _push(`<button type="button" role="menuitem" class="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50">Delete</button>`);
						else _push(`<!---->`);
						_push(`</div>`);
					} else _push(`<!---->`);
					_push(`</div></td></tr>`);
				});
				_push(`<!--]--></tbody></table></div>`);
				if (filteredStudents.value.length === 0) _push(`<p class="p-6 text-center text-gray-400">No students found.</p>`);
				else _push(`<!---->`);
				_push(`<div class="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f8fafb] px-4 py-4 text-[14px] text-[#64748b]"><span>Showing ${ssrInterpolate(firstVisible.value)} to ${ssrInterpolate(lastVisible.value)} of ${ssrInterpolate(filteredStudents.value.length)} entries</span><div class="flex items-center gap-2"><button class="flex h-9 w-9 items-center justify-center rounded border border-[#dfe5eb] bg-white text-[#64748b] disabled:opacity-40"${ssrIncludeBooleanAttr(currentPage.value <= 1) ? " disabled" : ""}>‹</button><span class="px-2 font-mono text-xs">${ssrInterpolate(currentPage.value)} / ${ssrInterpolate(pageCount.value)}</span><button class="flex h-9 w-9 items-center justify-center rounded border border-[#dfe5eb] bg-white text-[#64748b] disabled:opacity-40"${ssrIncludeBooleanAttr(currentPage.value >= pageCount.value) ? " disabled" : ""}>›</button></div></div></article>`);
			} else _push(`<!---->`);
			_push(ssrRenderComponent(_component_BaseModal, {
				show: showAddForm.value,
				title: "Add New Student",
				message: "Enter the student's details to enroll them in the system.",
				"button-text": addingStudent.value ? "Adding..." : "Add Student",
				onClose: ($event) => showAddForm.value = false,
				onConfirm: handleAddStudent
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="text-left"${_scopeId}><label class="block font-mono text-[11px] tracking-wide mt-4"${_scopeId}> FULL NAME <input${ssrRenderAttr("value", newStudent.value.full_name)} type="text" class="input-field mt-2" placeholder="e.g. Jane Doe"${_scopeId}></label><label class="block font-mono text-[11px] tracking-wide mt-4"${_scopeId}> EMAIL <input${ssrRenderAttr("value", newStudent.value.email)} type="email" class="input-field mt-2" placeholder="e.g. jane@university.edu"${_scopeId}></label><label class="block font-mono text-[11px] tracking-wide mt-4"${_scopeId}> DEPARTMENT <input${ssrRenderAttr("value", newStudent.value.department)} type="text" class="input-field mt-2" placeholder="e.g. Computer Science"${_scopeId}></label></div>`);
					else return [createVNode("div", { class: "text-left" }, [
						createVNode("label", { class: "block font-mono text-[11px] tracking-wide mt-4" }, [createTextVNode(" FULL NAME "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newStudent.value.full_name = $event,
							type: "text",
							class: "input-field mt-2",
							placeholder: "e.g. Jane Doe"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newStudent.value.full_name]])]),
						createVNode("label", { class: "block font-mono text-[11px] tracking-wide mt-4" }, [createTextVNode(" EMAIL "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newStudent.value.email = $event,
							type: "email",
							class: "input-field mt-2",
							placeholder: "e.g. jane@university.edu"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newStudent.value.email]])]),
						createVNode("label", { class: "block font-mono text-[11px] tracking-wide mt-4" }, [createTextVNode(" DEPARTMENT "), withDirectives(createVNode("input", {
							"onUpdate:modelValue": ($event) => newStudent.value.department = $event,
							type: "text",
							class: "input-field mt-2",
							placeholder: "e.g. Computer Science"
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, newStudent.value.department]])])
					])];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_BaseModal, {
				show: !!viewStudent.value,
				title: viewStudent.value?.full_name || "Student",
				message: `ID: ${viewStudent.value?.student_id || ""} • ${viewStudent.value?.department || ""} • Status: ${viewStudent.value?.enrollment_status || ""}`,
				"button-text": "Close",
				onClose: ($event) => viewStudent.value = null,
				onConfirm: ($event) => viewStudent.value = null
			}, null, _parent));
			if (verifyTarget.value) {
				_push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-6"><div class="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden"><div class="px-6 py-5 border-b border-line flex items-center justify-between"><div><h2 class="text-xl font-semibold">Enroll &amp; Verify</h2><p class="text-sm text-gray-500 mt-0.5">${ssrInterpolate(verifyTarget.value.full_name)} · ${ssrInterpolate(verifyTarget.value.student_id)}</p></div><button class="text-gray-400 hover:text-ink text-2xl leading-none"> × </button></div><div class="p-6 space-y-4"><p class="text-sm text-gray-600"> Position the student facing the camera in good lighting, then capture a single reference frame. This registers their face and marks them Verified. </p><div class="relative rounded-md overflow-hidden bg-black aspect-[4/3]"><video autoplay playsinline muted class="w-full h-full object-cover"></video></div>`);
				if (verifyError.value) _push(`<p class="border border-red-200 bg-red-50 text-danger rounded-md px-3 py-2 text-sm">${ssrInterpolate(verifyError.value)}</p>`);
				else _push(`<!---->`);
				_push(`<div class="flex gap-3"><button class="btn-outline flex-1"${ssrIncludeBooleanAttr(verifying.value) ? " disabled" : ""}> Cancel </button><button class="btn-dark flex-1"${ssrIncludeBooleanAttr(verifying.value || !unref(cam).ready.value) ? " disabled" : ""}>${ssrInterpolate(verifying.value ? "Enrolling…" : "Capture & Verify")}</button></div></div></div></div>`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/AdminRoster.vue
var _sfc_setup$12 = AdminRoster_vue_vue_type_script_setup_true_lang_default.setup;
AdminRoster_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminRoster.vue");
	return _sfc_setup$12 ? _sfc_setup$12(props, ctx) : void 0;
};
var AdminRoster_default = Object.assign(AdminRoster_vue_vue_type_script_setup_true_lang_default, { __name: "AdminRoster" });
//#endregion
//#region components/AdminAnalytics.vue?vue&type=script&setup=true&lang.ts
var AdminAnalytics_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminAnalytics",
	__ssrInlineRender: true,
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		useApi();
		const students = ref([]);
		const allSessions = ref([]);
		const allRecords = ref([]);
		const attendanceTrends = ref([]);
		const searchQuery = ref("");
		const departmentFilter = ref("All Departments");
		const loading = ref(true);
		const error = ref("");
		const allAtRiskStudents = computed(() => {
			return students.value.filter((s) => Number(s.attendance_rate) < 70).filter((s) => departmentFilter.value === "All Departments" || s.department === departmentFilter.value).filter((s) => !searchQuery.value || s.student_id.toLowerCase().includes(searchQuery.value.toLowerCase()));
		});
		const atRiskStudents = computed(() => allAtRiskStudents.value.slice(0, 10));
		const absenteeismRate = (rate) => `${(100 - Number(rate)).toFixed(1)}%`;
		const departments = computed(() => {
			const depts = new Set(students.value.map((s) => s.department));
			return ["All Departments", ...Array.from(depts)];
		});
		const deptData = computed(() => {
			const deptMap = {};
			for (const s of students.value) {
				const department = s.department || "Unknown";
				if (!deptMap[department]) deptMap[department] = {
					total: 0,
					count: 0
				};
				deptMap[department].total += Number(s.attendance_rate);
				deptMap[department].count++;
			}
			return Object.entries(deptMap).map(([label, { total, count }]) => ({
				label: label.slice(0, 3).toUpperCase(),
				value: count > 0 ? Math.round(total / count) : 0
			}));
		});
		const trendData = computed(() => {
			return attendanceTrends.value.map(({ period, attendance_rate }) => ({
				period,
				attendanceRate: attendance_rate
			}));
		});
		const trendPath = computed(() => {
			if (trendData.value.length < 2) return "";
			const points = trendData.value.map((d, i) => ({
				x: 24 + i * (576 / Math.max(trendData.value.length - 1, 1)),
				y: 230 - d.attendanceRate / 100 * 180
			}));
			let path = `M${points[0].x} ${points[0].y}`;
			for (let i = 1; i < points.length; i++) {
				const prev = points[i - 1];
				const curr = points[i];
				const cp1x = prev.x + (curr.x - prev.x) / 2;
				const cp1y = prev.y;
				path += ` C${cp1x} ${cp1y} ${cp1x} ${curr.y} ${curr.x} ${curr.y}`;
			}
			return path;
		});
		const trendAreaPath = computed(() => {
			if (!trendPath.value) return "";
			return trendPath.value + ` L576 230 L24 230 Z`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(_attrs)}><div class="flex items-center justify-between gap-5 mb-6"><div><h1 class="text-3xl tracking-tight">Attendance Analytics</h1><p class="mt-1.5 text-gray-500"> Attendance rates returned by the backend over the last six months. </p></div><div class="flex gap-2.5 items-center"><label class="font-mono text-[10px] uppercase flex flex-col gap-1.5"> Department <select class="border border-gray-300 bg-white px-2 py-2 rounded-md min-w-[130px] text-ink"><!--[-->`);
			ssrRenderList(departments.value, (d) => {
				_push(`<option${ssrRenderAttr("value", d)}${ssrIncludeBooleanAttr(Array.isArray(departmentFilter.value) ? ssrLooseContain(departmentFilter.value, d) : ssrLooseEqual(departmentFilter.value, d)) ? " selected" : ""}>${ssrInterpolate(d)}</option>`);
			});
			_push(`<!--]--></select></label></div></div>`);
			if (loading.value) _push(`<p class="text-gray-500">Loading analytics...</p>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (!loading.value) {
				_push(`<!--[--><div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"><article class="card p-6 flex flex-col justify-between min-h-[120px]"><small class="font-mono text-xs text-gray-500">ATTENDANCE CHECK-INS</small><strong class="text-4xl">${ssrInterpolate(allRecords.value.length)}</strong></article><article class="card p-6 flex flex-col justify-between min-h-[120px]"><small class="font-mono text-xs text-gray-500">TOTAL SESSIONS</small><strong class="text-4xl">${ssrInterpolate(allSessions.value.length)}</strong></article><article class="card p-6 flex flex-col justify-between min-h-[120px]"><small class="font-mono text-xs text-gray-500">AT-RISK STUDENTS</small><strong class="text-4xl text-danger">${ssrInterpolate(allAtRiskStudents.value.length)}</strong></article></div><div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.85fr]"><article class="card p-6 h-[377px]"><div class="flex justify-between items-center"><h2 class="text-xl">Attendance Trends</h2><span class="bg-gray-100 px-2 py-1 font-mono text-[11px]">ATTENDANCE RATE (%)</span></div><div class="h-[280px] relative pt-6 pb-6 pl-9"><div class="absolute inset-6 left-9 bottom-10 flex flex-col justify-between"><!--[-->`);
				ssrRenderList(5, (i) => {
					_push(`<i class="border-t border-gray-200"></i>`);
				});
				_push(`<!--]--></div>`);
				if (trendPath.value) _push(`<svg viewBox="0 0 600 260" preserveAspectRatio="none" class="w-full h-[235px] relative z-10 overflow-visible"><path${ssrRenderAttr("d", trendAreaPath.value)} fill="#dff8fb" stroke="none"></path><path${ssrRenderAttr("d", trendPath.value)} fill="none" stroke="#08c5ec" stroke-width="2"></path></svg>`);
				else _push(`<p class="text-center text-gray-400 pt-20"> No trend data available yet. </p>`);
				if (trendData.value.length > 0) {
					_push(`<div class="flex justify-between font-mono text-[11px] text-gray-600 px-0.5"><!--[-->`);
					ssrRenderList(trendData.value, (d) => {
						_push(`<span>${ssrInterpolate(d.period)}</span>`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				_push(`</div></article><article class="card p-6 h-[377px]"><div class="flex justify-between items-center"><h2 class="text-xl">By Department</h2><span class="bg-gray-100 px-2 py-1 font-mono text-[11px]">AVG %</span></div><div class="h-[280px] pt-10 px-2 flex items-end justify-around border-b border-gray-300" style="${ssrRenderStyle({ "background": "repeating-linear-gradient(\r\n                to bottom,\r\n                transparent 0,\r\n                transparent 40px,\r\n                #e1e5e8 41px\r\n              )" })}"><!--[-->`);
				ssrRenderList(deptData.value, (item) => {
					_push(`<div class="h-[225px] flex flex-col items-center justify-end gap-2"><div class="w-8 bg-navy-light rounded-t" style="${ssrRenderStyle({ height: item.value * 2.1 + "px" })}"></div><span class="font-mono text-[11px]">${ssrInterpolate(item.label)}</span></div>`);
				});
				_push(`<!--]--></div></article></div><article class="card overflow-hidden"><div class="min-h-[94px] border-b border-line px-6 flex items-center justify-between"><div><h2 class="text-xl">⚠ At-Risk Students</h2><p class="mt-1 text-gray-500 text-sm"> Students with attendance rate below 70% </p></div><div class="w-[230px] h-9 border border-gray-300 rounded bg-white flex items-center gap-2.5 px-3 text-gray-500"><span>⌕</span><input${ssrRenderAttr("value", searchQuery.value)} class="border-0 outline-none w-full text-ink" placeholder="Search student ID..."></div></div><table class="data-table"><thead><tr><th class="w-[18%]">Student ID</th><th class="w-[24%]">Name</th><th class="w-[24%]">Department</th><th class="w-[16%]">Attendance</th><th class="w-[18%]">Absenteeism</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(atRiskStudents.value, (student) => {
					_push(`<tr><td class="font-mono text-[13px] text-[#334155]">${ssrInterpolate(student.student_id)}</td><td class="font-medium text-[#1f2d3d]">${ssrInterpolate(student.full_name)}</td><td class="text-[#334155]">${ssrInterpolate(student.department)}</td><td class="font-mono text-[13px] text-[#334155]">${ssrInterpolate(Number(student.attendance_rate).toFixed(1))}% </td><td><span class="inline-flex rounded bg-red-100 px-2.5 py-1 text-[11px] font-mono text-[#d92d47]">${ssrInterpolate(absenteeismRate(Number(student.attendance_rate)))}</span></td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
				if (atRiskStudents.value.length === 0) _push(`<p class="p-6 text-center text-gray-400"> No at-risk students found. </p>`);
				else _push(`<!---->`);
				_push(`</article><!--]-->`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/AdminAnalytics.vue
var _sfc_setup$11 = AdminAnalytics_vue_vue_type_script_setup_true_lang_default.setup;
AdminAnalytics_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminAnalytics.vue");
	return _sfc_setup$11 ? _sfc_setup$11(props, ctx) : void 0;
};
var AdminAnalytics_default = Object.assign(AdminAnalytics_vue_vue_type_script_setup_true_lang_default, { __name: "AdminAnalytics" });
//#endregion
//#region components/Reports.vue?vue&type=script&setup=true&lang.ts
var Reports_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "Reports",
	__ssrInlineRender: true,
	setup(__props) {
		useApi();
		const definitions = [
			{
				name: "Attendance Summary",
				description: "Attendance records from the backend",
				dataset: "attendance"
			},
			{
				name: "Student Attendance",
				description: "Student-level attendance records",
				dataset: "attendance"
			},
			{
				name: "Class Attendance",
				description: "Course and session attendance records",
				dataset: "attendance"
			},
			{
				name: "User Directory",
				description: "User records returned by the backend",
				dataset: "users"
			},
			{
				name: "Class Directory",
				description: "Course records returned by the backend",
				dataset: "classes"
			},
			{
				name: "System Activity",
				description: "Audit events returned by the backend",
				dataset: "logs"
			}
		];
		const datasets = ref({
			attendance: [],
			users: [],
			classes: [],
			logs: []
		});
		const loading = ref(true);
		const error = ref("");
		const exporting = ref("");
		const loadedAt = ref("");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex flex-wrap items-end justify-between gap-4"><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Reports</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Export current records fetched from the backend.</p></div>`);
			if (loadedAt.value) _push(`<span class="text-xs text-gray-500">Data loaded ${ssrInterpolate(loadedAt.value)}</span>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (loading.value) _push(`<p class="text-sm text-gray-500">Loading report data...</p>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p role="alert" class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"><!--[-->`);
			ssrRenderList(definitions, (report) => {
				_push(`<article class="panel-surface p-5"><div class="mb-5 text-2xl text-cyan">▧</div><h2 class="font-semibold">${ssrInterpolate(report.name)}</h2><p class="mt-1 text-sm text-gray-500">${ssrInterpolate(report.description)}</p><p class="mt-3 text-xs text-gray-500">${ssrInterpolate(datasets.value[report.dataset].length)} records loaded</p><button class="btn-outline mt-5 w-full"${ssrIncludeBooleanAttr(loading.value || !!exporting.value) ? " disabled" : ""}>${ssrInterpolate(exporting.value === report.name ? "Preparing..." : "Download CSV")}</button></article>`);
			});
			_push(`<!--]--></div><article class="panel-surface p-5"><h2 class="text-lg font-semibold">Report history</h2><p class="mt-2 text-sm text-gray-500">Report downloads are generated in this browser from live API data. Persisted report jobs and download history are not available in the current backend contract.</p></article></section>`);
		};
	}
});
//#endregion
//#region components/Reports.vue
var _sfc_setup$10 = Reports_vue_vue_type_script_setup_true_lang_default.setup;
Reports_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Reports.vue");
	return _sfc_setup$10 ? _sfc_setup$10(props, ctx) : void 0;
};
var Reports_default = Object.assign(Reports_vue_vue_type_script_setup_true_lang_default, { __name: "Reports" });
//#endregion
//#region components/AdminSettings.vue?vue&type=script&setup=true&lang.ts
var AdminSettings_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "AdminSettings",
	__ssrInlineRender: true,
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		useApi();
		const { isAdmin} = usePortal();
		const loading = ref(true);
		const saving = ref(false);
		const error = ref("");
		const profile = reactive({
			full_name: "",
			department: "",
			admin_id: ""
		});
		const notifications = reactive({
			session_starts: true,
			system_health: true,
			at_risk_summaries: true,
			real_time_intervention: false
		});
		const biometrics = reactive({
			confidence_threshold: 85,
			anti_spoofing_sensitivity: "Standard",
			auto_schedule_enabled: false,
			archival_days: 90,
			telemetry_sharing: false
		});
		const nodes = ref([]);
		const showNodeForm = ref(false);
		const nodeDraft = ref({
			name: "",
			location: "",
			firmware: ""
		});
		const oldPassword = ref("");
		const newPassword = ref("");
		const changingPw = ref(false);
		const pwError = ref("");
		const newStaffName = ref("");
		const newStaffEmail = ref("");
		const newStaffRole = ref("LECTURER");
		const creatingStaff = ref(false);
		const staffError = ref("");
		const staffInfo = ref("");
		return (_ctx, _push, _parent, _attrs) => {
			const _component_PasswordInput = PasswordInput_default;
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-start justify-between gap-6"><div><p class="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-dark"> System configuration </p><h1 class="text-4xl font-semibold tracking-tight mt-2">Settings</h1><p class="text-gray-500 mt-2"> Manage institutional alerts, biometric safeguards, and data retention. </p></div><button class="btn-dark"${ssrIncludeBooleanAttr(saving.value || loading.value) ? " disabled" : ""}>${ssrInterpolate(saving.value ? "Saving..." : "Save Changes")}</button></div>`);
			if (error.value) _push(`<p class="border border-red-200 bg-red-50 text-danger rounded-md px-4 py-3 text-sm">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (loading.value) _push(`<div class="card p-8 text-gray-500"> Loading system settings... </div>`);
			else {
				_push(`<div class="grid lg:grid-cols-[280px_1fr] gap-6"><div class="space-y-6"><div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4"> Personal Information </h2><label class="block mt-5 text-xs font-mono uppercase text-gray-500">Full name<input${ssrRenderAttr("value", profile.full_name)} class="input-field mt-2"></label><label class="block mt-4 text-xs font-mono uppercase text-gray-500">Department<input${ssrRenderAttr("value", profile.department)} class="input-field mt-2"></label><label class="block mt-4 text-xs font-mono uppercase text-gray-500">Administrator ID<input${ssrRenderAttr("value", profile.admin_id)} class="input-field mt-2"></label></div><div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4"> Password </h2><label class="block mt-5 text-xs font-mono uppercase text-gray-500">Current password`);
				_push(ssrRenderComponent(_component_PasswordInput, {
					modelValue: oldPassword.value,
					"onUpdate:modelValue": ($event) => oldPassword.value = $event,
					class: "mt-2",
					autocomplete: "current-password"
				}, null, _parent));
				_push(`</label><label class="block mt-4 text-xs font-mono uppercase text-gray-500">New password`);
				_push(ssrRenderComponent(_component_PasswordInput, {
					modelValue: newPassword.value,
					"onUpdate:modelValue": ($event) => newPassword.value = $event,
					class: "mt-2",
					autocomplete: "new-password"
				}, null, _parent));
				_push(`</label>`);
				if (pwError.value) _push(`<p class="mt-3 text-sm text-danger">${ssrInterpolate(pwError.value)}</p>`);
				else _push(`<!---->`);
				_push(`<button class="btn-outline mt-3"${ssrIncludeBooleanAttr(changingPw.value) ? " disabled" : ""}>${ssrInterpolate(changingPw.value ? "Updating…" : "Update Password")}</button></div>`);
				if (unref(isAdmin)) _push(`<div class="card p-6 bg-cyan-light/10"><h2 class="text-xl font-semibold border-b border-line pb-4"> Biometric Security </h2><div class="mt-5 rounded-md border border-cyan-light bg-white p-4"><div class="flex justify-between font-medium"><span>Recognition threshold</span><strong>${ssrInterpolate(biometrics.confidence_threshold)}%</strong></div><input${ssrRenderAttr("value", biometrics.confidence_threshold)} type="range" min="60" max="99" class="w-full mt-4 accent-cyan"><p class="text-xs text-gray-500 mt-2"> Matches below this confidence are sent for manual review. </p></div><label class="block mt-5 text-xs font-mono uppercase text-gray-500">Anti-spoofing sensitivity<select class="input-field mt-2"><option${ssrIncludeBooleanAttr(Array.isArray(biometrics.anti_spoofing_sensitivity) ? ssrLooseContain(biometrics.anti_spoofing_sensitivity, null) : ssrLooseEqual(biometrics.anti_spoofing_sensitivity, null)) ? " selected" : ""}>Low</option><option${ssrIncludeBooleanAttr(Array.isArray(biometrics.anti_spoofing_sensitivity) ? ssrLooseContain(biometrics.anti_spoofing_sensitivity, null) : ssrLooseEqual(biometrics.anti_spoofing_sensitivity, null)) ? " selected" : ""}>Standard</option><option${ssrIncludeBooleanAttr(Array.isArray(biometrics.anti_spoofing_sensitivity) ? ssrLooseContain(biometrics.anti_spoofing_sensitivity, null) : ssrLooseEqual(biometrics.anti_spoofing_sensitivity, null)) ? " selected" : ""}>High</option></select></label></div>`);
				else _push(`<!---->`);
				_push(`</div><div class="space-y-6"><div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4"> Notification Preferences </h2><div class="grid sm:grid-cols-2 gap-4 mt-5"><!--[-->`);
				ssrRenderList([
					{
						key: "session_starts",
						label: "Session Starts",
						desc: "Notify when scheduled classes begin."
					},
					{
						key: "system_health",
						label: "System Health",
						desc: "Alerts for hardware or network degradation."
					},
					{
						key: "at_risk_summaries",
						label: "At-Risk Summaries",
						desc: "Weekly digests for students below threshold."
					},
					{
						key: "real_time_intervention",
						label: "Real-time Intervention",
						desc: "Urgent alerts during active sessions."
					}
				], (item) => {
					_push(`<label class="flex items-start gap-3 border border-line rounded-md p-4 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(notifications[item.key]) ? ssrLooseContain(notifications[item.key], null) : notifications[item.key]) ? " checked" : ""} type="checkbox" class="mt-1 accent-cyan"><span><strong class="block">${ssrInterpolate(item.label)}</strong><small class="text-gray-500">${ssrInterpolate(item.desc)}</small></span></label>`);
				});
				_push(`<!--]--></div></div>`);
				if (unref(isAdmin)) _push(`<div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4"> Data Privacy &amp; Archival </h2><div class="grid sm:grid-cols-2 gap-4 mt-5"><label class="flex items-center justify-between rounded-md border border-line p-4"><span><strong class="block">Auto-schedule</strong><small class="text-gray-500">Use timetable start and stop times.</small></span><input${ssrIncludeBooleanAttr(Array.isArray(biometrics.auto_schedule_enabled) ? ssrLooseContain(biometrics.auto_schedule_enabled, null) : biometrics.auto_schedule_enabled) ? " checked" : ""} type="checkbox" class="accent-cyan"></label><label class="rounded-md border border-line p-4"><strong class="block">Archive duration</strong><small class="text-gray-500 block mb-2">Raw logs before automatic purge.</small><select class="input-field"><option${ssrRenderAttr("value", 30)}${ssrIncludeBooleanAttr(Array.isArray(biometrics.archival_days) ? ssrLooseContain(biometrics.archival_days, 30) : ssrLooseEqual(biometrics.archival_days, 30)) ? " selected" : ""}>30 days</option><option${ssrRenderAttr("value", 90)}${ssrIncludeBooleanAttr(Array.isArray(biometrics.archival_days) ? ssrLooseContain(biometrics.archival_days, 90) : ssrLooseEqual(biometrics.archival_days, 90)) ? " selected" : ""}>90 days</option><option${ssrRenderAttr("value", 180)}${ssrIncludeBooleanAttr(Array.isArray(biometrics.archival_days) ? ssrLooseContain(biometrics.archival_days, 180) : ssrLooseEqual(biometrics.archival_days, 180)) ? " selected" : ""}>180 days</option></select></label></div><label class="flex items-center gap-3 mt-5 text-sm"><input${ssrIncludeBooleanAttr(Array.isArray(biometrics.telemetry_sharing) ? ssrLooseContain(biometrics.telemetry_sharing, null) : biometrics.telemetry_sharing) ? " checked" : ""} type="checkbox" class="accent-cyan"> Share anonymized telemetry for institutional analytics</label></div>`);
				else _push(`<!---->`);
				if (unref(isAdmin)) {
					_push(`<div class="card p-6 overflow-hidden"><div class="flex items-center justify-between border-b border-line pb-4"><div><h2 class="text-xl font-semibold">Camera Node Configuration</h2><p class="mt-1 text-xs text-gray-500">Saved settings only; live connectivity requires a backend device-health integration.</p></div><button class="btn-outline">+ Add Node</button></div>`);
					if (showNodeForm.value) _push(`<div class="grid gap-3 border-b border-line py-4 sm:grid-cols-2"><input${ssrRenderAttr("value", nodeDraft.value.name)} class="input-field" placeholder="Node name" aria-label="Node name"><input${ssrRenderAttr("value", nodeDraft.value.location)} class="input-field" placeholder="Location" aria-label="Node location"><input${ssrRenderAttr("value", nodeDraft.value.firmware)} class="input-field sm:col-span-2" placeholder="Firmware version (optional)" aria-label="Firmware version"><button class="btn-dark sm:col-span-2">Add to saved settings</button></div>`);
					else _push(`<!---->`);
					if (nodes.value.length === 0) _push(`<div class="p-6 text-center text-gray-400"> No camera nodes configured. </div>`);
					else {
						_push(`<div><div class="table-head grid-cols-[2fr_1.5fr_1fr_0.8fr]"><span>Name</span><span>Location</span><span>Firmware</span><span>Configuration</span></div><!--[-->`);
						ssrRenderList(nodes.value, (node, i) => {
							_push(`<div class="table-row grid-cols-[2fr_1.5fr_1fr_0.8fr] text-sm"><strong>${ssrInterpolate(node.name)}</strong><span class="text-gray-500">${ssrInterpolate(node.location)}</span><span class="font-mono text-xs">${ssrInterpolate(node.firmware || "—")}</span><div class="flex gap-2"><span class="text-xs text-gray-500">Saved</span><button class="text-danger text-xs font-mono uppercase hover:underline"> Remove </button></div></div>`);
						});
						_push(`<!--]--></div>`);
					}
					_push(`</div>`);
				} else _push(`<!---->`);
				if (unref(isAdmin)) {
					_push(`<div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4"> Staff Accounts </h2><p class="text-sm text-gray-500 mt-4"> Add a new admin or lecturer. They receive a one-time password by email and choose their own on first sign-in. </p><div class="grid sm:grid-cols-2 gap-4 mt-4"><label class="block text-xs font-mono uppercase text-gray-500">Full name<input${ssrRenderAttr("value", newStaffName.value)} class="input-field mt-2" placeholder="Jane Doe"></label><label class="block text-xs font-mono uppercase text-gray-500">Email<input${ssrRenderAttr("value", newStaffEmail.value)} type="email" class="input-field mt-2" placeholder="jane@institution.edu"></label></div><label class="block mt-4 text-xs font-mono uppercase text-gray-500 max-w-[200px]"> Role <select class="input-field mt-2"><option value="LECTURER"${ssrIncludeBooleanAttr(Array.isArray(newStaffRole.value) ? ssrLooseContain(newStaffRole.value, "LECTURER") : ssrLooseEqual(newStaffRole.value, "LECTURER")) ? " selected" : ""}>Lecturer</option><option value="ADMIN"${ssrIncludeBooleanAttr(Array.isArray(newStaffRole.value) ? ssrLooseContain(newStaffRole.value, "ADMIN") : ssrLooseEqual(newStaffRole.value, "ADMIN")) ? " selected" : ""}>Admin</option></select></label>`);
					if (staffError.value) _push(`<p class="mt-3 text-sm text-danger">${ssrInterpolate(staffError.value)}</p>`);
					else _push(`<!---->`);
					if (staffInfo.value) _push(`<p class="mt-3 text-sm text-cyan-dark">${ssrInterpolate(staffInfo.value)}</p>`);
					else _push(`<!---->`);
					_push(`<button class="btn-outline mt-4"${ssrIncludeBooleanAttr(creatingStaff.value) ? " disabled" : ""}>${ssrInterpolate(creatingStaff.value ? "Creating…" : "Create Account")}</button></div>`);
				} else _push(`<!---->`);
				_push(`</div></div>`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/AdminSettings.vue
var _sfc_setup$9 = AdminSettings_vue_vue_type_script_setup_true_lang_default.setup;
AdminSettings_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AdminSettings.vue");
	return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var AdminSettings_default = Object.assign(AdminSettings_vue_vue_type_script_setup_true_lang_default, { __name: "AdminSettings" });
//#endregion
//#region components/StudentOverview.vue?vue&type=script&setup=true&lang.ts
var StudentOverview_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "StudentOverview",
	__ssrInlineRender: true,
	emits: ["notify", "navigate"],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		const { currentStudent } = usePortal();
		const api = useApi();
		const overrideCategory = ref("Missed Attendance");
		const overrideDescription = ref("");
		const submittingOverride = ref(false);
		const attendance = ref([]);
		const courses = ref([]);
		const loading = ref(true);
		const error = ref("");
		const showManualOverride = ref(false);
		const initials = computed(() => {
			return (currentStudent.value?.full_name || "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
		});
		const formatScanTime = (iso, index) => {
			const d = new Date(iso);
			const today = /* @__PURE__ */ new Date();
			const isToday = d.toDateString() === today.toDateString();
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			const isYesterday = d.toDateString() === yesterday.toDateString();
			const timeStr = d.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: true
			});
			if (isToday) return `TODAY, ${timeStr}`;
			if (isYesterday) return `YESTERDAY, ${timeStr}`;
			return d.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric"
			}) + ", " + timeStr;
		};
		const recentAttendance = computed(() => attendance.value.slice(0, 4));
		async function submitOverride() {
			if (!currentStudent.value || !overrideDescription.value.trim()) {
				emit("notify", "Please describe the issue before submitting.");
				return;
			}
			submittingOverride.value = true;
			try {
				await api.createSupportTicket({
					student_id: currentStudent.value.id,
					category: overrideCategory.value,
					description: overrideDescription.value.trim()
				});
				showManualOverride.value = false;
				overrideDescription.value = "";
				emit("notify", "Manual override request submitted for review.");
			} catch (e) {
				emit("notify", `Error: ${e.message}`);
			} finally {
				submittingOverride.value = false;
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_BaseModal = BaseModal_default;
			_push(`<section${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-4xl tracking-tight">Overview</h1><p class="mt-2 text-gray-500"> System Status: <span class="text-cyan font-mono">ONLINE_SECURE</span></p></div>`);
			if (loading.value) _push(`<p class="text-gray-500">Loading your data...</p>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (!loading.value && unref(currentStudent)) {
				_push(`<!--[--><div class="my-8 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_0.95fr]"><article class="card flex items-center gap-6 p-6 relative overflow-hidden min-h-[204px]"><div class="absolute -right-12 -top-20 w-[290px] h-[290px] rounded-full bg-cyan-light/10"></div><div class="relative z-10 w-[125px] h-[125px] rounded-full flex items-center justify-center text-3xl font-extrabold text-white border-[3px] border-gray-200" style="${ssrRenderStyle({ "background": "linear-gradient(145deg, #d5e8ef, #5f8092)" })}">${ssrInterpolate(initials.value)}</div><div class="relative z-10"><h2 class="text-xl mb-1.5">${ssrInterpolate(unref(currentStudent).full_name)}</h2><p class="font-mono mb-4">▣ ${ssrInterpolate(unref(currentStudent).student_id)}</p><b class="${ssrRenderClass([unref(currentStudent).face_enrolled ? "status-verified" : "status-pending", "status-tag"])}"> ◉ ${ssrInterpolate(unref(currentStudent).face_enrolled ? "Face Enrollment Verified" : "Face Enrollment Pending")}</b></div><div class="relative z-10 ml-auto w-[106px] h-[106px] rounded-full border-cyan flex flex-col justify-center items-center" style="${ssrRenderStyle({ "border-width": "9px" })}"><strong class="text-2xl">${ssrInterpolate(Number(unref(currentStudent).attendance_rate).toFixed(0))}%</strong><span class="font-mono text-[11px]">ATTENDANCE</span></div></article><article class="card p-6 flex flex-col gap-3.5"><small class="font-mono text-[11px]">SYSTEM ACTIONS</small><button class="bg-white border border-gray-300 p-3 text-ink hover:bg-gray-50 transition-colors"> ⌾ Request Manual Override </button><button class="bg-white border border-gray-300 p-3 text-danger hover:bg-red-50 transition-colors"> ⚠ Report Issue </button></article></div><div class="grid grid-cols-2 gap-6"><article class="card overflow-hidden"><div class="bg-gray-100 min-h-[46px] px-6 flex items-center"><h3 class="font-mono text-xs uppercase">▣ My Courses</h3></div><table class="data-table"><thead><tr><th class="w-[24%]">Code</th><th class="w-[52%]">Course</th><th class="w-[24%]">Credits</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(courses.value, (course) => {
					_push(`<tr><td class="font-mono text-[12px] text-[#334155]">${ssrInterpolate(course.course_code)}</td><td><div class="font-medium text-[#1f2d3d]">${ssrInterpolate(course.course_name)}</div><small class="block text-[11px] text-gray-500 font-mono mt-1">${ssrInterpolate(course.professor)} | ${ssrInterpolate(course.room)}</small></td><td>${ssrInterpolate(course.credits)} CR</td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
				if (courses.value.length === 0) _push(`<p class="p-6 text-center text-gray-400"> No courses enrolled. </p>`);
				else _push(`<!---->`);
				_push(`</article><article class="card overflow-hidden"><div class="bg-gray-100 min-h-[46px] px-6 flex items-center"><h3 class="font-mono text-xs uppercase"> ⟲ Telemetry: Recent Scans </h3></div><table class="data-table"><thead><tr><th class="w-[28%]">Time</th><th class="w-[34%]">Course</th><th class="w-[18%]">Status</th><th class="w-[20%]">Confidence</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(recentAttendance.value, (scan, index) => {
					_push(`<tr><td class="font-mono text-[11px] text-[#64748b]">${ssrInterpolate(formatScanTime(scan.check_in_time))}</td><td class="font-medium text-[#1f2d3d]">${ssrInterpolate(scan.sessions?.courses?.course_name || "Unknown Course")}</td><td><span class="inline-flex rounded bg-cyan-light/20 px-2 py-1 text-[10px] font-mono text-cyan-dark">${ssrInterpolate(scan.status === "Present" ? "MATCH FOUND" : scan.status.toUpperCase())}</span></td><td class="font-mono text-[11px] text-[#334155]">${ssrInterpolate(scan.confidence_score ? Number(scan.confidence_score).toFixed(1) + "%" : "N/A")}</td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
				if (recentAttendance.value.length === 0) _push(`<p class="p-6 text-center text-gray-400"> No scan history yet. </p>`);
				else _push(`<!---->`);
				_push(`</article></div>`);
				_push(ssrRenderComponent(_component_BaseModal, {
					show: showManualOverride.value,
					title: "Request Manual Override",
					message: "Send a secure request to an administrator to review your attendance record.",
					"button-text": submittingOverride.value ? "Submitting..." : "Send Request",
					onClose: ($event) => showManualOverride.value = false,
					onConfirm: submitOverride
				}, {
					default: withCtx((_, _push, _parent, _scopeId) => {
						if (_push) _push(`<div class="text-left"${_scopeId}><label class="block font-mono text-[11px] tracking-wide mt-4"${_scopeId}> CATEGORY <select class="input-field mt-2"${_scopeId}><option${ssrIncludeBooleanAttr(Array.isArray(overrideCategory.value) ? ssrLooseContain(overrideCategory.value, null) : ssrLooseEqual(overrideCategory.value, null)) ? " selected" : ""}${_scopeId}>Missed Attendance</option><option${ssrIncludeBooleanAttr(Array.isArray(overrideCategory.value) ? ssrLooseContain(overrideCategory.value, null) : ssrLooseEqual(overrideCategory.value, null)) ? " selected" : ""}${_scopeId}>Incorrect Identification</option><option${ssrIncludeBooleanAttr(Array.isArray(overrideCategory.value) ? ssrLooseContain(overrideCategory.value, null) : ssrLooseEqual(overrideCategory.value, null)) ? " selected" : ""}${_scopeId}>Biometric Enrollment</option><option${ssrIncludeBooleanAttr(Array.isArray(overrideCategory.value) ? ssrLooseContain(overrideCategory.value, null) : ssrLooseEqual(overrideCategory.value, null)) ? " selected" : ""}${_scopeId}>Other</option></select></label><label class="block font-mono text-[11px] tracking-wide mt-4"${_scopeId}> DESCRIPTION <textarea rows="4" class="input-field mt-2" placeholder="Describe what happened and include any relevant details..."${_scopeId}>${ssrInterpolate(overrideDescription.value)}</textarea></label></div>`);
						else return [createVNode("div", { class: "text-left" }, [createVNode("label", { class: "block font-mono text-[11px] tracking-wide mt-4" }, [createTextVNode(" CATEGORY "), withDirectives(createVNode("select", {
							"onUpdate:modelValue": ($event) => overrideCategory.value = $event,
							class: "input-field mt-2"
						}, [
							createVNode("option", null, "Missed Attendance"),
							createVNode("option", null, "Incorrect Identification"),
							createVNode("option", null, "Biometric Enrollment"),
							createVNode("option", null, "Other")
						], 8, ["onUpdate:modelValue"]), [[vModelSelect, overrideCategory.value]])]), createVNode("label", { class: "block font-mono text-[11px] tracking-wide mt-4" }, [createTextVNode(" DESCRIPTION "), withDirectives(createVNode("textarea", {
							"onUpdate:modelValue": ($event) => overrideDescription.value = $event,
							rows: "4",
							class: "input-field mt-2",
							placeholder: "Describe what happened and include any relevant details..."
						}, null, 8, ["onUpdate:modelValue"]), [[vModelText, overrideDescription.value]])])])];
					}),
					_: 1
				}, _parent));
				_push(`<!--]-->`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/StudentOverview.vue
var _sfc_setup$8 = StudentOverview_vue_vue_type_script_setup_true_lang_default.setup;
StudentOverview_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StudentOverview.vue");
	return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var StudentOverview_default = Object.assign(StudentOverview_vue_vue_type_script_setup_true_lang_default, { __name: "StudentOverview" });
//#endregion
//#region components/StudentAttendance.vue?vue&type=script&setup=true&lang.ts
var StudentAttendance_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "StudentAttendance",
	__ssrInlineRender: true,
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		usePortal();
		useApi();
		const attendance = ref([]);
		const courses = ref([]);
		const searchQuery = ref("");
		const courseFilter = ref("All Courses");
		const loading = ref(true);
		const error = ref("");
		const courseOptions = computed(() => ["All Courses", ...courses.value.map((c) => c.course_name)]);
		const filteredAttendance = computed(() => {
			return attendance.value.filter((a) => {
				const q = searchQuery.value.toLowerCase();
				const courseName = a.sessions?.courses?.course_name || "";
				const matchesSearch = !q || `${a.check_in_time} ${courseName}`.toLowerCase().includes(q);
				const matchesCourse = courseFilter.value === "All Courses" || courseName === courseFilter.value;
				return matchesSearch && matchesCourse;
			});
		});
		const statusClass = (status) => {
			if (status === "Present") return "bg-cyan-light/20 text-cyan-dark border-cyan-light";
			if (status === "Absent") return "bg-red-50 text-danger border-red-300";
			return "bg-gray-100 text-gray-600 border-gray-300";
		};
		const formatDate = (iso) => {
			const d = new Date(iso);
			return d.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric"
			}) + " " + d.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit"
			});
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(_attrs)}><div class="flex items-end justify-between gap-5 mb-6"><div><h1 class="text-3xl tracking-tight">My Attendance</h1><p class="mt-1.5 text-gray-500"> Detailed logging and biometric recognition telemetry for current semester. </p></div></div>`);
			if (loading.value) _push(`<p class="text-gray-500">Loading attendance data...</p>`);
			else _push(`<!---->`);
			if (error.value) _push(`<p class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (!loading.value) {
				_push(`<!--[--><div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]"><article class="card flex min-h-[300px] flex-col justify-center p-8 text-center"><h2 class="text-xl font-semibold">Attendance Summary</h2><strong class="my-4 text-5xl">${ssrInterpolate(attendance.value.length)}</strong><p class="text-sm text-gray-500"> Records returned by your account. An attendance rate and target require course-session totals from the backend. </p></article><aside class="flex flex-col gap-6"><article class="bg-navy-light text-white rounded-lg p-7 min-h-[155px]"><small class="text-cyan font-mono text-[11px]">RECORDED CHECK-INS</small><strong class="block text-5xl my-4">${ssrInterpolate(attendance.value.length)}</strong><p class="font-mono text-[11px] text-gray-300"> Returned by the attendance API </p></article><article class="card p-6"><h2 class="text-xl mb-6">Telemetry Filters</h2><label class="block font-mono text-[10px] mt-4"> COURSE SELECTION <select class="w-full p-2.5 border border-gray-300 bg-surface mt-2 text-ink"><!--[-->`);
				ssrRenderList(courseOptions.value, (c) => {
					_push(`<option${ssrRenderAttr("value", c)}${ssrIncludeBooleanAttr(Array.isArray(courseFilter.value) ? ssrLooseContain(courseFilter.value, c) : ssrLooseEqual(courseFilter.value, c)) ? " selected" : ""}>${ssrInterpolate(c)}</option>`);
				});
				_push(`<!--]--></select></label></article></aside></div><article class="card overflow-hidden"><div class="h-16 border-b border-line px-6 flex items-center justify-between"><h2 class="text-xl">Session Log</h2><div class="w-[230px] h-9 border border-gray-300 rounded bg-white flex items-center gap-2.5 px-3 text-gray-500"><span>⌕</span><input${ssrRenderAttr("value", searchQuery.value)} class="border-0 outline-none w-full text-ink" placeholder="Search logs..."></div></div><table class="data-table"><thead><tr><th class="w-[30%]">Date / Time</th><th class="w-[34%]">Course Name</th><th class="w-[18%]">Status</th><th class="w-[18%]">Rec. Confidence</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(filteredAttendance.value, (row) => {
					_push(`<tr><td class="font-mono text-[12px] text-[#334155]">${ssrInterpolate(formatDate(row.check_in_time))}</td><td class="text-[#1f2d3d]">${ssrInterpolate(row.sessions?.courses?.course_name || "Unknown")}</td><td><span class="${ssrRenderClass([statusClass(row.status), "inline-flex items-center gap-2 rounded border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.08em]"])}"><span class="${ssrRenderClass([row.status === "Present" ? "bg-[#2fb3d4]" : row.status === "Absent" ? "bg-[#ef4444]" : "bg-[#94a3b8]", "inline-block h-2 w-2 rounded-full"])}"></span> ${ssrInterpolate(row.status)}</span></td><td class="font-mono text-[12px] text-[#334155] text-right">${ssrInterpolate(row.confidence_score ? Number(row.confidence_score).toFixed(1) + "%" : "N/A")}</td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
				if (filteredAttendance.value.length === 0) _push(`<p class="p-6 text-center text-gray-400"> No attendance records found. </p>`);
				else _push(`<!---->`);
				_push(`</article><!--]-->`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/StudentAttendance.vue
var _sfc_setup$7 = StudentAttendance_vue_vue_type_script_setup_true_lang_default.setup;
StudentAttendance_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StudentAttendance.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var StudentAttendance_default = Object.assign(StudentAttendance_vue_vue_type_script_setup_true_lang_default, { __name: "StudentAttendance" });
//#endregion
//#region components/StudentSchedule.vue?vue&type=script&setup=true&lang.ts
var StudentSchedule_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "StudentSchedule",
	__ssrInlineRender: true,
	setup(__props) {
		useApi();
		const schedule = ref([]);
		const loading = ref(true);
		const error = ref("");
		const weekdays = [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
			"Sunday"
		];
		const scheduleItems = computed(() => schedule.value.map((item, index) => {
			const course = typeof item.course === "object" ? item.course : item;
			const rawDay = Number(item.day_of_week);
			const day = item.day_of_week_display || weekdays[rawDay - 1] || "Day not specified";
			return {
				id: item.id ?? `${item.course ?? course.code ?? index}-${index}`,
				day,
				start: item.start_time || "",
				end: item.end_time || "",
				code: item.course_code || course.code || course.course_code || "",
				name: item.course_name || course.name || course.course_name || "",
				room: item.room || "",
				lecturer: item.lecturer_name || course.lecturer_name || course.professor || ""
			};
		}).sort((a, b) => {
			return weekdays.indexOf(a.day) - weekdays.indexOf(b.day) || a.start.localeCompare(b.start);
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div><h1 class="text-3xl tracking-tight">Course Schedule</h1><p class="mt-1.5 text-gray-500">Schedule slots assigned to your enrolled courses.</p></div>`);
			if (loading.value) _push(`<p class="text-sm text-gray-500">Loading schedule...</p>`);
			else if (error.value) _push(`<p role="alert" class="text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
			else if (scheduleItems.value.length) {
				_push(`<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><!--[-->`);
				ssrRenderList(scheduleItems.value, (item) => {
					_push(`<article class="card p-5"><p class="font-mono text-xs uppercase tracking-wide text-cyan-dark">${ssrInterpolate(item.day)}</p><h2 class="mt-2 text-lg font-semibold">${ssrInterpolate(item.code)}`);
					if (item.code && item.name) _push(`<!--[-->: <!--]-->`);
					else _push(`<!---->`);
					_push(`${ssrInterpolate(item.name || "Course")}</h2>`);
					if (item.start || item.end) {
						_push(`<p class="mt-2 text-sm text-gray-600">${ssrInterpolate(item.start)}`);
						if (item.end) _push(`<!--[--> – ${ssrInterpolate(item.end)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</p>`);
					} else _push(`<!---->`);
					if (item.room) _push(`<p class="mt-1 text-sm text-gray-500">Room: ${ssrInterpolate(item.room)}</p>`);
					else _push(`<!---->`);
					if (item.lecturer) _push(`<p class="mt-1 text-sm text-gray-500">${ssrInterpolate(item.lecturer)}</p>`);
					else _push(`<!---->`);
					_push(`</article>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<article class="card p-8 text-center text-gray-500">No schedule slots were returned for your courses.</article>`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/StudentSchedule.vue
var _sfc_setup$6 = StudentSchedule_vue_vue_type_script_setup_true_lang_default.setup;
StudentSchedule_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StudentSchedule.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var StudentSchedule_default = Object.assign(StudentSchedule_vue_vue_type_script_setup_true_lang_default, { __name: "StudentSchedule" });
//#endregion
//#region components/StudentSupport.vue?vue&type=script&setup=true&lang.ts
var StudentSupport_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "StudentSupport",
	__ssrInlineRender: true,
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		usePortal();
		useApi();
		const loading = ref(true);
		const submitting = ref(false);
		const error = ref("");
		const tickets = ref([]);
		const courses = ref([]);
		const showForm = ref(false);
		const category = ref("Missed Attendance");
		const referenceId = ref("");
		const description = ref("");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-start justify-between gap-5"><div><p class="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-dark"> Support </p><h1 class="text-4xl font-semibold mt-2">Support &amp; Overrides</h1><p class="text-gray-500 mt-2"> Contest a missed attendance record or raise a technical issue. </p></div><button class="btn-dark">${ssrInterpolate(showForm.value ? "Cancel" : "New Request")}</button></div>`);
			if (error.value) _push(`<p class="border border-red-200 bg-red-50 text-danger rounded-md px-4 py-3 text-sm">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (showForm.value) {
				_push(`<div class="card p-6 space-y-5"><h2 class="text-xl font-semibold border-b border-line pb-4"> Submit a New Request </h2><div class="grid sm:grid-cols-2 gap-4"><label class="block text-xs font-mono uppercase text-gray-500">Category<select class="input-field mt-2"><option${ssrIncludeBooleanAttr(Array.isArray(category.value) ? ssrLooseContain(category.value, null) : ssrLooseEqual(category.value, null)) ? " selected" : ""}>Missed Attendance</option><option${ssrIncludeBooleanAttr(Array.isArray(category.value) ? ssrLooseContain(category.value, null) : ssrLooseEqual(category.value, null)) ? " selected" : ""}>Incorrect Identification</option><option${ssrIncludeBooleanAttr(Array.isArray(category.value) ? ssrLooseContain(category.value, null) : ssrLooseEqual(category.value, null)) ? " selected" : ""}>Biometric Enrollment</option><option${ssrIncludeBooleanAttr(Array.isArray(category.value) ? ssrLooseContain(category.value, null) : ssrLooseEqual(category.value, null)) ? " selected" : ""}>Technical Issue</option><option${ssrIncludeBooleanAttr(Array.isArray(category.value) ? ssrLooseContain(category.value, null) : ssrLooseEqual(category.value, null)) ? " selected" : ""}>Other</option></select></label><label class="block text-xs font-mono uppercase text-gray-500">Related module<select class="input-field mt-2"><option value=""${ssrIncludeBooleanAttr(Array.isArray(referenceId.value) ? ssrLooseContain(referenceId.value, "") : ssrLooseEqual(referenceId.value, "")) ? " selected" : ""}>General</option><!--[-->`);
				ssrRenderList(courses.value, (c) => {
					_push(`<option${ssrRenderAttr("value", c.course_code)}${ssrIncludeBooleanAttr(Array.isArray(referenceId.value) ? ssrLooseContain(referenceId.value, c.course_code) : ssrLooseEqual(referenceId.value, c.course_code)) ? " selected" : ""}>${ssrInterpolate(c.course_code)} — ${ssrInterpolate(c.course_name)}</option>`);
				});
				_push(`<!--]--></select></label></div><label class="block text-xs font-mono uppercase text-gray-500">Description<textarea rows="4" class="input-field mt-2" placeholder="Describe what happened and include any relevant details...">${ssrInterpolate(description.value)}</textarea></label><button class="btn-primary"${ssrIncludeBooleanAttr(submitting.value) ? " disabled" : ""}>${ssrInterpolate(submitting.value ? "Submitting..." : "Submit Request")}</button></div>`);
			} else _push(`<!---->`);
			if (loading.value) _push(`<div class="card p-8 text-gray-500"> Loading your support requests... </div>`);
			else if (tickets.value.length === 0) _push(`<div class="card p-12 text-center"><p class="text-gray-500"> You have not submitted any support requests yet. </p><p class="text-sm text-gray-400 mt-2"> Use the &quot;New Request&quot; button above to contest a missed attendance record or report an issue. </p></div>`);
			else {
				_push(`<div class="card overflow-hidden"><table class="data-table"><thead><tr><th class="w-[18%]">Category</th><th class="w-[18%]">Reference</th><th class="w-[46%]">Description</th><th class="w-[18%]">Status</th></tr></thead><tbody><!--[-->`);
				ssrRenderList(tickets.value, (t) => {
					_push(`<tr><td class="font-medium text-[#1f2d3d]">${ssrInterpolate(t.category)}</td><td class="text-gray-500 font-mono text-[12px]">${ssrInterpolate(t.reference_id || "General")}</td><td class="text-gray-600">${ssrInterpolate(t.description)}</td><td><span class="${ssrRenderClass(["inline-flex rounded border px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.08em]", t.status === "Resolved" || t.status === "Closed" ? "border-cyan-light bg-cyan-light/20 text-cyan-dark" : t.status === "In Review" ? "border-gray-300 bg-gray-100 text-gray-600" : "border-red-300 bg-red-50 text-danger"])}">${ssrInterpolate(t.status)}</span></td></tr>`);
				});
				_push(`<!--]--></tbody></table></div>`);
			}
			_push(`<div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4"> Frequently Asked Questions </h2><div class="divide-y divide-line"><!--[-->`);
			ssrRenderList([
				{
					q: "Why was my attendance marked as absent?",
					a: "If the system could not identify you within the session window, your attendance is recorded as absent. Submit a Missed Attendance request with details for your lecturer to review."
				},
				{
					q: "How accurate is the facial recognition?",
					a: "The system uses high-fidelity matching with a configurable confidence threshold. Matches below the threshold are flagged for manual review by your lecturer."
				},
				{
					q: "How is my biometric data protected?",
					a: "Your biometric template is encrypted at rest and never shared in raw form. You can request data deletion at any time through account settings."
				}
			], (faq) => {
				_push(`<details class="py-4"><summary class="cursor-pointer font-medium">${ssrInterpolate(faq.q)}</summary><p class="text-sm text-gray-600 mt-2">${ssrInterpolate(faq.a)}</p></details>`);
			});
			_push(`<!--]--></div></div></section>`);
		};
	}
});
//#endregion
//#region components/StudentSupport.vue
var _sfc_setup$5 = StudentSupport_vue_vue_type_script_setup_true_lang_default.setup;
StudentSupport_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StudentSupport.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var StudentSupport_default = Object.assign(StudentSupport_vue_vue_type_script_setup_true_lang_default, { __name: "StudentSupport" });
//#endregion
//#region components/StudentSettings.vue?vue&type=script&setup=true&lang.ts
var StudentSettings_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "StudentSettings",
	__ssrInlineRender: true,
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		const { currentStudent} = usePortal();
		useApi();
		const cam = useCamera();
		const loading = ref(true);
		const saving = ref(false);
		const error = ref("");
		const settings = reactive({
			attendance_notifications: true,
			security_alerts: true,
			campus_announcements: false
		});
		const oldPassword = ref("");
		const newPassword = ref("");
		const changingPw = ref(false);
		const pwError = ref("");
		const showCapture = ref(false);
		const capturing = ref(false);
		const captureError = ref("");
		const captureStatus = ref("");
		cam.videoRef;
		return (_ctx, _push, _parent, _attrs) => {
			const _component_PasswordInput = PasswordInput_default;
			_push(`<section${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-start justify-between gap-5"><div><p class="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-dark">Account</p><h1 class="text-4xl font-semibold mt-2">Account Settings</h1><p class="text-gray-500 mt-2">Manage your biometric profile, notifications, and security preferences.</p></div><button class="btn-dark"${ssrIncludeBooleanAttr(saving.value || loading.value) ? " disabled" : ""}>${ssrInterpolate(saving.value ? "Saving..." : "Save Changes")}</button></div>`);
			if (error.value) _push(`<p class="border border-red-200 bg-red-50 text-danger rounded-md px-4 py-3 text-sm">${ssrInterpolate(error.value)}</p>`);
			else _push(`<!---->`);
			if (loading.value) _push(`<div class="card p-8 text-gray-500">Loading account settings...</div>`);
			else {
				_push(`<div class="grid lg:grid-cols-2 gap-6"><div class="space-y-6"><div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4">Biometric Profile</h2><p class="text-sm text-gray-600 mt-5">Keep your reference profile up to date for accurate campus access and attendance logging.</p><div class="flex items-center justify-between gap-4 border border-line rounded-md p-4 mt-5"><div><strong class="block">Primary Reference</strong><small class="font-mono text-gray-500">${ssrInterpolate(unref(currentStudent)?.face_enrolled ? "ACTIVE" : "PENDING VERIFICATION")}</small></div><span class="${ssrRenderClass(unref(currentStudent)?.face_enrolled ? "status-tag status-verified" : "status-tag status-pending")}">${ssrInterpolate(unref(currentStudent)?.face_enrolled ? "Verified" : "Pending")}</span></div><button class="btn-outline w-full mt-4"${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""}>${ssrInterpolate(unref(currentStudent)?.face_enrolled ? "Request Reference Update" : "Capture Face Reference")}</button><p class="text-xs text-gray-500 mt-2">${ssrInterpolate(unref(currentStudent)?.face_enrolled ? "Updates to a verified reference are reviewed by staff." : "One-time self-enrollment. You will be asked to blink for a liveness check.")}</p></div><div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4">Notifications</h2><!--[-->`);
				ssrRenderList([
					{
						key: "attendance_notifications",
						label: "Attendance Confirmation",
						desc: "Receive a notification when your attendance is logged."
					},
					{
						key: "security_alerts",
						label: "Security Alerts",
						desc: "Email alerts for new logins or unusual activity."
					},
					{
						key: "campus_announcements",
						label: "Campus Announcements",
						desc: "General updates and institutional news."
					}
				], (item) => {
					_push(`<label class="flex items-center justify-between gap-4 py-5 border-b last:border-0 border-line"><span><strong class="block">${ssrInterpolate(item.label)}</strong><small class="text-gray-500">${ssrInterpolate(item.desc)}</small></span><input${ssrIncludeBooleanAttr(Array.isArray(settings[item.key]) ? ssrLooseContain(settings[item.key], null) : settings[item.key]) ? " checked" : ""} type="checkbox" class="w-5 h-5 accent-cyan"></label>`);
				});
				_push(`<!--]--></div></div><div class="space-y-6"><div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4">Security</h2><label class="block mt-5 text-xs font-mono uppercase text-gray-500">Current password`);
				_push(ssrRenderComponent(_component_PasswordInput, {
					modelValue: oldPassword.value,
					"onUpdate:modelValue": ($event) => oldPassword.value = $event,
					class: "mt-2",
					autocomplete: "current-password",
					placeholder: "Enter current password"
				}, null, _parent));
				_push(`</label><label class="block mt-4 text-xs font-mono uppercase text-gray-500">New password`);
				_push(ssrRenderComponent(_component_PasswordInput, {
					modelValue: newPassword.value,
					"onUpdate:modelValue": ($event) => newPassword.value = $event,
					class: "mt-2",
					autocomplete: "new-password",
					placeholder: "Enter a new password"
				}, null, _parent));
				_push(`</label>`);
				if (pwError.value) _push(`<p class="mt-3 text-sm text-danger">${ssrInterpolate(pwError.value)}</p>`);
				else _push(`<!---->`);
				_push(`<button class="btn-outline mt-3"${ssrIncludeBooleanAttr(changingPw.value) ? " disabled" : ""}>${ssrInterpolate(changingPw.value ? "Updating…" : "Update Password")}</button><div class="border-t border-line mt-6 pt-5"><h3 class="font-semibold">Two-Factor Authentication</h3><p class="text-sm text-gray-500 mt-1">Two-factor enrollment is not available through the current account API.</p></div></div><div class="card p-6"><h2 class="text-xl font-semibold border-b border-line pb-4">Data Privacy</h2><p class="text-sm text-gray-600 mt-5">Biometric data handling and attendance retention follow institutional policy. Contact your administrator for details.</p><div class="rounded-md border border-line bg-gray-50 p-4 mt-5"><strong class="font-mono text-xs uppercase">Personal data export</strong><p class="text-sm text-gray-600 mt-2">A data-export request cannot be submitted from the current backend API.</p></div></div></div></div>`);
			}
			if (showCapture.value) {
				_push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-6"><div class="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden"><div class="px-6 py-5 border-b border-line flex items-center justify-between"><h2 class="text-xl font-semibold">Capture Face Reference</h2><button class="text-gray-400 hover:text-ink text-2xl leading-none">×</button></div><div class="p-6 space-y-4"><p class="text-sm text-gray-600">Face the camera in good lighting. When you see <strong>“Blink now”</strong>, blink once, naturally — this is the liveness check.</p><div class="relative rounded-md overflow-hidden bg-black aspect-[4/3]"><video autoplay playsinline muted class="w-full h-full object-cover"></video>`);
				if (captureStatus.value) _push(`<div class="absolute inset-x-0 bottom-0 bg-navy/70 text-white text-center py-2 font-mono text-xs">${ssrInterpolate(captureStatus.value)}</div>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (captureError.value) _push(`<p class="border border-red-200 bg-red-50 text-danger rounded-md px-3 py-2 text-sm">${ssrInterpolate(captureError.value)}</p>`);
				else _push(`<!---->`);
				_push(`<div class="flex gap-3"><button class="btn-outline flex-1"${ssrIncludeBooleanAttr(capturing.value) ? " disabled" : ""}>Cancel</button><button class="btn-dark flex-1"${ssrIncludeBooleanAttr(capturing.value || !unref(cam).ready.value) ? " disabled" : ""}>${ssrInterpolate(capturing.value ? "Capturing…" : "Start Capture")}</button></div></div></div></div>`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region components/StudentSettings.vue
var _sfc_setup$4 = StudentSettings_vue_vue_type_script_setup_true_lang_default.setup;
StudentSettings_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StudentSettings.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var StudentSettings_default = Object.assign(StudentSettings_vue_vue_type_script_setup_true_lang_default, { __name: "StudentSettings" });
//#endregion
//#region components/ToastNotification.vue?vue&type=script&setup=true&lang.ts
var ToastNotification_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "ToastNotification",
	__ssrInlineRender: true,
	props: { message: {} },
	setup(__props) {
		return (_ctx, _push, _parent, _attrs) => {
			ssrRenderTeleport(_push, (_push) => {
				if (__props.message) _push(`<div class="fixed right-6 bottom-6 bg-navy text-white px-4 py-3.5 border-l-4 border-cyan rounded-md shadow-xl z-50 text-sm">${ssrInterpolate(__props.message)}</div>`);
				else _push(`<!---->`);
			}, "body", false, _parent);
		};
	}
});
//#endregion
//#region components/ToastNotification.vue
var _sfc_setup$3 = ToastNotification_vue_vue_type_script_setup_true_lang_default.setup;
ToastNotification_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ToastNotification.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var ToastNotification_default = Object.assign(ToastNotification_vue_vue_type_script_setup_true_lang_default, { __name: "ToastNotification" });
//#endregion
//#region app.vue?vue&type=script&setup=true&lang.ts
var app_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "app",
	__ssrInlineRender: true,
	setup(__props) {
		const { portal, isAuthed, authReady, mustChangePassword, isAdmin, logout, setPortal } = usePortal();
		const adminView = ref("overview");
		const studentView = ref("overview");
		const toast = ref("");
		let toastTimer = null;
		const notify = (message) => {
			toast.value = message;
			if (toastTimer) clearTimeout(toastTimer);
			toastTimer = setTimeout(() => {
				toast.value = "";
			}, 2600);
		};
		const handleAdminNav = (view) => {
			adminView.value = view;
		};
		const handleStudentNav = (view) => {
			studentView.value = view;
		};
		const handleSignOut = () => {
			logout();
			adminView.value = "overview";
			studentView.value = "overview";
		};
		return (_ctx, _push, _parent, _attrs) => {
			const _component_NuxtLayout = nuxt_layout_default;
			const _component_AdminLogin = AdminLogin_default;
			const _component_StudentLogin = StudentLogin_default;
			const _component_ForcePasswordChange = ForcePasswordChange_default;
			const _component_AppSidebar = AppSidebar_default;
			const _component_AppTopbar = AppTopbar_default;
			const _component_AdminSystemOverview = AdminSystemOverview_default;
			const _component_AdminOverview = AdminOverview_default;
			const _component_AdminSessions = AdminSessions_default;
			const _component_AdminLogs = AdminLogs_default;
			const _component_UserManagement = UserManagement_default;
			const _component_ClassManagement = ClassManagement_default;
			const _component_AdminCourses = AdminCourses_default;
			const _component_AdminRoster = AdminRoster_default;
			const _component_AdminAnalytics = AdminAnalytics_default;
			const _component_Reports = Reports_default;
			const _component_AdminSettings = AdminSettings_default;
			const _component_StudentOverview = StudentOverview_default;
			const _component_StudentAttendance = StudentAttendance_default;
			const _component_StudentSchedule = StudentSchedule_default;
			const _component_StudentSupport = StudentSupport_default;
			const _component_StudentSettings = StudentSettings_default;
			const _component_ToastNotification = ToastNotification_default;
			_push(ssrRenderComponent(_component_NuxtLayout, _attrs, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div${_scopeId}>`);
						if (!unref(authReady)) _push(`<div class="min-h-screen grid place-items-center bg-navy text-white"${_scopeId}><div class="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-cyan"${_scopeId}><span class="w-2 h-2 rounded-full bg-cyan animate-pulse"${_scopeId}></span> Restoring session… </div></div>`);
						else if (!unref(isAuthed) && unref(portal) === "admin") _push(ssrRenderComponent(_component_AdminLogin, {
							onLogin: () => {},
							onSwitchToStudent: ($event) => unref(setPortal)("student")
						}, null, _parent, _scopeId));
						else if (!unref(isAuthed) && unref(portal) === "student") _push(ssrRenderComponent(_component_StudentLogin, {
							onLogin: () => {},
							onSwitchToAdmin: ($event) => unref(setPortal)("admin")
						}, null, _parent, _scopeId));
						else if (unref(isAuthed) && unref(mustChangePassword)) _push(ssrRenderComponent(_component_ForcePasswordChange, { onSignOut: handleSignOut }, null, _parent, _scopeId));
						else {
							_push(`<div class="min-h-screen flex bg-gray-50"${_scopeId}>`);
							_push(ssrRenderComponent(_component_AppSidebar, {
								"active-view": unref(portal) === "admin" ? adminView.value : studentView.value,
								onNavigate: ($event) => unref(portal) === "admin" ? handleAdminNav($event) : handleStudentNav($event),
								onSignOut: handleSignOut
							}, {
								"sidebar-action": withCtx((_, _push, _parent, _scopeId) => {
									if (_push) ssrRenderSlot(_ctx.$slots, "sidebar-action", {}, null, _push, _parent, _scopeId);
									else return [renderSlot(_ctx.$slots, "sidebar-action")];
								}),
								_: 3
							}, _parent, _scopeId));
							_push(`<main class="flex-1 min-w-0"${_scopeId}>`);
							_push(ssrRenderComponent(_component_AppTopbar, null, null, _parent, _scopeId));
							_push(`<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"${_scopeId}>`);
							if (unref(portal) === "admin" && unref(isAdmin) && adminView.value === "overview") _push(ssrRenderComponent(_component_AdminSystemOverview, { onNavigate: handleAdminNav }, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && !unref(isAdmin) && adminView.value === "overview") _push(ssrRenderComponent(_component_AdminOverview, {
								onStartSession: ($event) => handleAdminNav(unref(isAdmin) ? "class-management" : "sessions"),
								onViewLog: ($event) => handleAdminNav(unref(isAdmin) ? "logs" : "sessions")
							}, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && !unref(isAdmin) && adminView.value === "sessions") _push(ssrRenderComponent(_component_AdminSessions, {
								onNotify: notify,
								onViewRoster: ($event) => handleAdminNav("roster")
							}, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && unref(isAdmin) && adminView.value === "logs") _push(ssrRenderComponent(_component_AdminLogs, null, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && unref(isAdmin) && adminView.value === "user-management") _push(ssrRenderComponent(_component_UserManagement, null, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && unref(isAdmin) && adminView.value === "class-management") _push(ssrRenderComponent(_component_ClassManagement, null, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && !unref(isAdmin) && adminView.value === "courses") _push(ssrRenderComponent(_component_AdminCourses, { onNotify: notify }, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && adminView.value === "roster") _push(ssrRenderComponent(_component_AdminRoster, { onNotify: notify }, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && adminView.value === "analytics") _push(ssrRenderComponent(_component_AdminAnalytics, { onNotify: notify }, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && unref(isAdmin) && adminView.value === "reports") _push(ssrRenderComponent(_component_Reports, null, null, _parent, _scopeId));
							else if (unref(portal) === "admin" && adminView.value === "settings") _push(ssrRenderComponent(_component_AdminSettings, { onNotify: notify }, null, _parent, _scopeId));
							else if (unref(portal) === "student" && studentView.value === "overview") _push(ssrRenderComponent(_component_StudentOverview, {
								onNotify: notify,
								onNavigate: handleStudentNav
							}, null, _parent, _scopeId));
							else if (unref(portal) === "student" && studentView.value === "attendance") _push(ssrRenderComponent(_component_StudentAttendance, { onNotify: notify }, null, _parent, _scopeId));
							else if (unref(portal) === "student" && studentView.value === "schedule") _push(ssrRenderComponent(_component_StudentSchedule, { onNotify: notify }, null, _parent, _scopeId));
							else if (unref(portal) === "student" && studentView.value === "support") _push(ssrRenderComponent(_component_StudentSupport, { onNotify: notify }, null, _parent, _scopeId));
							else if (unref(portal) === "student" && studentView.value === "settings") _push(ssrRenderComponent(_component_StudentSettings, { onNotify: notify }, null, _parent, _scopeId));
							else _push(`<!---->`);
							_push(`</div></main></div>`);
						}
						_push(ssrRenderComponent(_component_ToastNotification, { message: toast.value }, null, _parent, _scopeId));
						_push(`</div>`);
					} else return [createVNode("div", null, [!unref(authReady) ? (openBlock(), createBlock("div", {
						key: 0,
						class: "min-h-screen grid place-items-center bg-navy text-white"
					}, [createVNode("div", { class: "flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-cyan" }, [createVNode("span", { class: "w-2 h-2 rounded-full bg-cyan animate-pulse" }), createTextVNode(" Restoring session… ")])])) : !unref(isAuthed) && unref(portal) === "admin" ? (openBlock(), createBlock(_component_AdminLogin, {
						key: 1,
						onLogin: () => {},
						onSwitchToStudent: ($event) => unref(setPortal)("student")
					}, null, 8, ["onSwitchToStudent"])) : !unref(isAuthed) && unref(portal) === "student" ? (openBlock(), createBlock(_component_StudentLogin, {
						key: 2,
						onLogin: () => {},
						onSwitchToAdmin: ($event) => unref(setPortal)("admin")
					}, null, 8, ["onSwitchToAdmin"])) : unref(isAuthed) && unref(mustChangePassword) ? (openBlock(), createBlock(_component_ForcePasswordChange, {
						key: 3,
						onSignOut: handleSignOut
					})) : (openBlock(), createBlock("div", {
						key: 4,
						class: "min-h-screen flex bg-gray-50"
					}, [createVNode(_component_AppSidebar, {
						"active-view": unref(portal) === "admin" ? adminView.value : studentView.value,
						onNavigate: ($event) => unref(portal) === "admin" ? handleAdminNav($event) : handleStudentNav($event),
						onSignOut: handleSignOut
					}, {
						"sidebar-action": withCtx(() => [renderSlot(_ctx.$slots, "sidebar-action")]),
						_: 3
					}, 8, ["active-view", "onNavigate"]), createVNode("main", { class: "flex-1 min-w-0" }, [createVNode(_component_AppTopbar), createVNode("div", { class: "mx-auto max-w-5xl p-4 sm:p-6 lg:p-8" }, [unref(portal) === "admin" && unref(isAdmin) && adminView.value === "overview" ? (openBlock(), createBlock(_component_AdminSystemOverview, {
						key: 0,
						onNavigate: handleAdminNav
					})) : unref(portal) === "admin" && !unref(isAdmin) && adminView.value === "overview" ? (openBlock(), createBlock(_component_AdminOverview, {
						key: 1,
						onStartSession: ($event) => handleAdminNav(unref(isAdmin) ? "class-management" : "sessions"),
						onViewLog: ($event) => handleAdminNav(unref(isAdmin) ? "logs" : "sessions")
					}, null, 8, ["onStartSession", "onViewLog"])) : unref(portal) === "admin" && !unref(isAdmin) && adminView.value === "sessions" ? (openBlock(), createBlock(_component_AdminSessions, {
						key: 2,
						onNotify: notify,
						onViewRoster: ($event) => handleAdminNav("roster")
					}, null, 8, ["onViewRoster"])) : unref(portal) === "admin" && unref(isAdmin) && adminView.value === "logs" ? (openBlock(), createBlock(_component_AdminLogs, { key: 3 })) : unref(portal) === "admin" && unref(isAdmin) && adminView.value === "user-management" ? (openBlock(), createBlock(_component_UserManagement, { key: 4 })) : unref(portal) === "admin" && unref(isAdmin) && adminView.value === "class-management" ? (openBlock(), createBlock(_component_ClassManagement, { key: 5 })) : unref(portal) === "admin" && !unref(isAdmin) && adminView.value === "courses" ? (openBlock(), createBlock(_component_AdminCourses, {
						key: 6,
						onNotify: notify
					})) : unref(portal) === "admin" && adminView.value === "roster" ? (openBlock(), createBlock(_component_AdminRoster, {
						key: 7,
						onNotify: notify
					})) : unref(portal) === "admin" && adminView.value === "analytics" ? (openBlock(), createBlock(_component_AdminAnalytics, {
						key: 8,
						onNotify: notify
					})) : unref(portal) === "admin" && unref(isAdmin) && adminView.value === "reports" ? (openBlock(), createBlock(_component_Reports, { key: 9 })) : unref(portal) === "admin" && adminView.value === "settings" ? (openBlock(), createBlock(_component_AdminSettings, {
						key: 10,
						onNotify: notify
					})) : unref(portal) === "student" && studentView.value === "overview" ? (openBlock(), createBlock(_component_StudentOverview, {
						key: 11,
						onNotify: notify,
						onNavigate: handleStudentNav
					})) : unref(portal) === "student" && studentView.value === "attendance" ? (openBlock(), createBlock(_component_StudentAttendance, {
						key: 12,
						onNotify: notify
					})) : unref(portal) === "student" && studentView.value === "schedule" ? (openBlock(), createBlock(_component_StudentSchedule, {
						key: 13,
						onNotify: notify
					})) : unref(portal) === "student" && studentView.value === "support" ? (openBlock(), createBlock(_component_StudentSupport, {
						key: 14,
						onNotify: notify
					})) : unref(portal) === "student" && studentView.value === "settings" ? (openBlock(), createBlock(_component_StudentSettings, {
						key: 15,
						onNotify: notify
					})) : createCommentVNode("", true)])])])), createVNode(_component_ToastNotification, { message: toast.value }, null, 8, ["message"])])];
				}),
				_: 3
			}, _parent));
		};
	}
});
//#endregion
//#region app.vue
var _sfc_setup$2 = app_vue_vue_type_script_setup_true_lang_default.setup;
app_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var app_default = app_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region node_modules/nuxt/dist/app/components/nuxt-error-page.vue
var _sfc_main$1 = {
	__name: "nuxt-error-page",
	__ssrInlineRender: true,
	props: { error: Object },
	setup(__props) {
		const _error = __props.error;
		const status = Number(_error.statusCode || 500);
		const is404 = status === 404;
		const statusText = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
		const description = _error.message || _error.toString();
		const stack = void 0;
		const _Error404 = defineAsyncComponent(() => import('../build/error-404-BL3eGph6.mjs'));
		const _Error = defineAsyncComponent(() => import('../build/error-500-Dxo0SbUc.mjs'));
		const ErrorTemplate = is404 ? _Error404 : _Error;
		return (_ctx, _push, _parent, _attrs) => {
			_push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({
				status: unref(status),
				statusText: unref(statusText),
				statusCode: unref(status),
				statusMessage: unref(statusText),
				description: unref(description),
				stack: unref(stack)
			}, _attrs), null, _parent));
		};
	}
};
var _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
//#endregion
//#region virtual:nuxt:node_modules%2F.cache%2Fnuxt%2F.nuxt%2Fisland-renderer.mjs
var IslandRenderer = () => null;
//#endregion
//#region node_modules/nuxt/dist/app/components/nuxt-root.vue
var _sfc_main = {
	__name: "nuxt-root",
	__ssrInlineRender: true,
	setup(__props) {
		const nuxtApp = useNuxtApp();
		nuxtApp.deferHydration();
		nuxtApp.ssrContext.url;
		const SingleRenderer = false;
		provide(PageRouteSymbol, useRoute());
		nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup", []);
		const error = /* @__PURE__ */ useError();
		const abortRender = error.value && !nuxtApp.ssrContext.error;
		function invokeAppErrorHandler(err, target, info) {
			const errorHandler = nuxtApp.vueApp.config.errorHandler;
			if (errorHandler && !errorHandler.__nuxt_default) try {
				errorHandler(err, target, info);
			} catch (handlerError) {
				console.error("[nuxt] Error in `app.config.errorHandler`", handlerError);
			}
		}
		onErrorCaptured((err, target, info) => {
			nuxtApp.hooks.callHook("vue:error", err, target, info)?.catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
			{
				const p = nuxtApp.runWithContext(() => showError(err));
				onServerPrefetch(() => p);
				invokeAppErrorHandler(err, target, info);
				return false;
			}
		});
		const islandContext = nuxtApp.ssrContext.islandContext;
		return (_ctx, _push, _parent, _attrs) => {
			ssrRenderSuspense(_push, {
				default: () => {
					if (unref(abortRender)) _push(`<div></div>`);
					else if (unref(error)) _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
					else if (unref(islandContext)) _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
					else if (unref(SingleRenderer)) ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
					else _push(ssrRenderComponent(unref(app_default), null, null, _parent));
				},
				_: 1
			});
		};
	}
};
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
//#endregion
//#region node_modules/nuxt/dist/app/entry.js
var entry$1 = async function createNuxtAppServer(ssrContext) {
	const vueApp = createApp(_sfc_main);
	const nuxt = createNuxtApp({
		vueApp,
		ssrContext
	});
	try {
		await applyPlugins(nuxt, virtual_nuxt_node_modules_2F_cache_2Fnuxt_2F_nuxt_2Fplugins_server_default);
		await nuxt.hooks.callHook("app:created", vueApp);
	} catch (error) {
		await nuxt.hooks.callHook("app:error", error);
		nuxt.payload.error ||= createError$1(error);
	}
	if (ssrContext && (ssrContext["~renderResponse"] || ssrContext._renderResponse)) throw new Error("skipping render");
	return vueApp;
};
var entry_default = ((ssrContext) => entry$1(ssrContext));

const entry = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: entry_default
}, Symbol.toStringTag, { value: 'Module' }));

export { NuxtLink as N, entry as e, useHead$1 as u };
//# sourceMappingURL=entry.mjs.map
