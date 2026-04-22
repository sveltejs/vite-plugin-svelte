/** @import { SvelteModuleRequest, SvelteRequest } from '../types/id.js' */
/** @import { LogFn, LogLevel, SimpleLogFn, SvelteWarningsMessage } from '../types/log.js' */
/** @import { ResolvedOptions } from '../types/options.js' */
/** @import { Warning } from 'svelte/compiler' */

/* eslint-disable no-console */

// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { styleText } from 'node:util';
const cyan = (/** @type {string} */ txt) => styleText('cyan', txt);
const yellow = (/** @type {string} */ txt) => styleText('yellow', txt);
const red = (/** @type {string} */ txt) => styleText('red', txt);

import { createDebug, enabled } from 'obug';

/** @type {LogLevel[]} */
const levels = ['debug', 'info', 'warn', 'error', 'silent'];
const prefix = 'vite-plugin-svelte';
/** @type {Record<LogLevel, any>} */
const loggers = {
	debug: {
		log: createDebug(`${prefix}`),
		enabled: false,
		isDebug: true
	},
	info: {
		color: cyan,
		log: console.log,
		enabled: true
	},
	warn: {
		color: yellow,
		log: console.warn,
		enabled: true
	},
	error: {
		color: red,
		log: console.error,
		enabled: true
	},
	silent: {
		enabled: false
	}
};

/** @type {LogLevel} */
let _level = 'info';
/**
 * @param {LogLevel} level
 * @returns {void}
 */
function setLevel(level) {
	if (level === _level) {
		return;
	}
	const levelIndex = levels.indexOf(level);
	if (levelIndex > -1) {
		_level = level;
		for (let i = 0; i < levels.length; i++) {
			loggers[levels[i]].enabled = i >= levelIndex;
		}
	} else {
		_log(loggers.error, `invalid log level: ${level} `);
	}
}

/**
 * @param {any} logger
 * @param {string} message
 * @param {any} [payload]
 * @param {string} [namespace]
 * @returns
 */
function _log(logger, message, payload, namespace) {
	if (!logger.enabled) {
		return;
	}
	if (logger.isDebug) {
		let log = logger.log;
		if (namespace) {
			if (!isDebugNamespaceEnabled(namespace)) {
				return;
			}
			log = logger.log.extend(namespace);
		}
		if (payload !== undefined) {
			log(message, payload);
		} else {
			log(message);
		}
	} else {
		logger.log(
			logger.color(
				`${new Date().toLocaleTimeString()} [${prefix}${
					namespace ? `:${namespace}` : ''
				}] ${message}`
			)
		);
		if (payload) {
			logger.log(payload);
		}
	}
}

/**
 * @param {LogLevel} level
 * @returns {LogFn}
 */
function createLogger(level) {
	const logger = loggers[level];
	const logFn = /** @type {LogFn} */ (_log.bind(null, logger));
	/** @type {Set<string>} */
	const logged = new Set();
	/** @type {SimpleLogFn} */
	const once = function (message, payload, namespace) {
		if (!logger.enabled || logged.has(message)) {
			return;
		}
		logged.add(message);
		logFn.apply(null, [message, payload, namespace]);
	};
	Object.defineProperty(logFn, 'enabled', {
		get() {
			return logger.enabled;
		}
	});
	Object.defineProperty(logFn, 'once', {
		get() {
			return once;
		}
	});
	return logFn;
}

export const log = {
	debug: createLogger('debug'),
	info: createLogger('info'),
	warn: createLogger('warn'),
	error: createLogger('error'),
	setLevel
};

/**
 * @param {SvelteRequest | SvelteModuleRequest} svelteRequest
 * @param {Warning[]} warnings
 * @param {ResolvedOptions} options
 */
export function logCompilerWarnings(svelteRequest, warnings, options) {
	const { emitCss, onwarn, isBuild } = options;
	const sendViaWS = !isBuild && options.experimental?.sendWarningsToBrowser;
	let warn = isBuild ? warnBuild : warnDev;
	/** @type {Warning[]} */
	const handledByDefaultWarn = [];
	const allWarnings = warnings?.filter((w) => !ignoreCompilerWarning(w, isBuild, emitCss));
	if (sendViaWS) {
		const _warn = warn;
		/** @type {(w: Warning) => void} */
		warn = (w) => {
			handledByDefaultWarn.push(w);
			_warn(w);
		};
	}
	allWarnings.forEach((warning) => {
		if (onwarn) {
			onwarn(warning, warn);
		} else {
			warn(warning);
		}
	});
	if (sendViaWS) {
		/** @type {SvelteWarningsMessage} */
		const message = {
			id: svelteRequest.id,
			filename: svelteRequest.filename,
			normalizedFilename: svelteRequest.normalizedFilename,
			timestamp: svelteRequest.timestamp,
			warnings: handledByDefaultWarn, // allWarnings filtered by warnings where onwarn did not call the default handler
			allWarnings, // includes warnings filtered by onwarn and our extra vite plugin svelte warnings
			rawWarnings: warnings // raw compiler output
		};
		log.debug(`sending svelte:warnings message for ${svelteRequest.normalizedFilename}`);
		options.server?.ws?.send('svelte:warnings', message);
	}
}

/**
 * @param {Warning} warning
 * @param {boolean} isBuild
 * @param {boolean} [emitCss]
 * @returns {boolean}
 */
function ignoreCompilerWarning(warning, isBuild, emitCss) {
	return (
		(!emitCss && warning.code === 'css_unused_selector') || // same as rollup-plugin-svelte
		(!isBuild && isNoScopableElementWarning(warning))
	);
}

/**
 *
 * @param {Warning} warning
 * @returns {boolean}
 */
function isNoScopableElementWarning(warning) {
	// see https://github.com/sveltejs/vite-plugin-svelte/issues/153
	return warning.code === 'css_unused_selector' && warning.message.includes('"*"');
}

/**
 * @param {Warning} w
 */
function warnDev(w) {
	if (w.filename?.includes('node_modules')) {
		if (isDebugNamespaceEnabled('node-modules-onwarn')) {
			log.debug(buildExtendedLogMessage(w), undefined, 'node-modules-onwarn');
		}
	} else if (log.info.enabled) {
		log.info(buildExtendedLogMessage(w));
	}
}

/**
 * @param {Warning & {frame?: string}} w
 */
function warnBuild(w) {
	if (w.filename?.includes('node_modules')) {
		if (isDebugNamespaceEnabled('node-modules-onwarn')) {
			log.debug(buildExtendedLogMessage(w), w.frame, 'node-modules-onwarn');
		}
	} else if (log.warn.enabled) {
		log.warn(buildExtendedLogMessage(w), w.frame);
	}
}

/**
 * @param {Warning} w
 */
export function buildExtendedLogMessage(w) {
	const parts = [];
	if (w.filename) {
		parts.push(w.filename);
	}
	if (w.start) {
		parts.push(':', w.start.line, ':', w.start.column);
	}
	if (w.message) {
		if (parts.length > 0) {
			parts.push(' ');
		}
		parts.push(w.message);
	}
	return parts.join('');
}

/**
 * @param {string} namespace
 * @returns {boolean}
 */
export function isDebugNamespaceEnabled(namespace) {
	return enabled(`${prefix}:${namespace}`);
}
