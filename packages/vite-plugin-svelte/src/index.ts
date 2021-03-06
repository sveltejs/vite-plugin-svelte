import * as path from 'path'
import {
  HmrContext,
  IndexHtmlTransformContext,
  ModuleNode,
  Plugin,
  UserConfig,
  ViteDevServer
} from 'vite'

// @ts-ignore
import * as relative from 'require-relative'

import { handleHotUpdate } from './handleHotUpdate'
import { log } from './utils/log'
import { createCompileSvelte } from './utils/compile'
import { buildIdParser, IdParser } from './utils/id'
import {
  buildInitialOptions,
  Options,
  ResolvedOptions,
  resolveOptions
} from './utils/options'
import { VitePluginSvelteCache } from './utils/VitePluginSvelteCache'

export {
  Options,
  Preprocessor,
  PreprocessorGroup,
  CompileOptions,
  CssHashGetter,
  Arrayable,
  MarkupPreprocessor,
  ModuleFormat,
  Processed
} from './utils/options'

const svelte_packages = [
  'svelte/animate',
  'svelte/easing',
  'svelte/internal',
  'svelte/motion',
  'svelte/store',
  'svelte/transition',
  'svelte',
  'svelte-hmr/runtime/hot-api-esm.js',
  'svelte-hmr/runtime/proxy-adapter-dom.js',
  'svelte-hmr'
]

const pkg_export_errors = new Set()

export default function vitePluginSvelte(rawOptions: Options): Plugin {
  if (process.env.DEBUG != null) {
    log.setLevel('debug')
  }
  const cache = new VitePluginSvelteCache()
  const initialOptions = buildInitialOptions(rawOptions)

  // updated in configResolved hook
  let requestParser: IdParser
  let options: ResolvedOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    ...initialOptions,
    root: process.cwd()
  }

  // updated in configureServer hook
  // @ts-ignore
  let server: ViteDevServer

  let compileSvelte: Function

  return {
    name: 'vite-plugin-svelte',
    // make sure our resolver runs before vite internal resolver to resolve svelte field correctly
    enforce: 'pre',
    config(config, { mode, command }): Partial<UserConfig> {
      // setup logger
      if (process.env.DEBUG) {
        log.setLevel('debug')
      } else if (config.logLevel) {
        log.setLevel(config.logLevel)
      }
      // init compiler
      compileSvelte = createCompileSvelte({
        hot:
          options.hot !== false &&
          mode === 'development' &&
          command === 'serve',
        // TODO fix TS (sorry)
        // @ts-ignore
        hotApi: options?.hot?.hotApi,
        // @ts-ignore
        adapter: options?.hot?.adapter
      })
      // extra vite config
      return {
        optimizeDeps: {
          exclude: [...svelte_packages]
        },
        resolve: {
          mainFields: ['svelte'],
          dedupe: [...svelte_packages]
        }
      }
    },

    configResolved(config) {
      options = resolveOptions(options, config)
      requestParser = buildIdParser(options)
    },

    configureServer(_server) {
      // eslint-disable-next-line no-unused-vars
      server = _server
    },

    load(id, ssr) {
      const svelteRequest = requestParser(id, !!ssr)
      if (!svelteRequest) {
        return
      }

      log.debug('load', svelteRequest)
      const { filename, query } = svelteRequest

      //
      if (query.svelte) {
        if (query.type === 'style') {
          const compileData = cache.getCompileData(svelteRequest, false)
          if (compileData?.compiled?.css) {
            log.debug(`load returns css for ${filename}`)
            return compileData.compiled.css
          }
        }
      }
    },

    async resolveId(importee, importer, options, ssr) {
      const svelteRequest = requestParser(importee, !!ssr)
      log.debug('resolveId', svelteRequest || importee)
      if (svelteRequest?.query.svelte) {
        log.debug(`resolveId resolved ${importee}`)
        return importee // query with svelte tag, an id we generated, no need for further analysis
      }

      // TODO below is code from rollup-plugin-svelte
      // what needs to be kept or can be deleted? (pkg.svelte handling?)
      if (
        !importer ||
        importee[0] === '.' ||
        importee[0] === '\0' ||
        path.isAbsolute(importee)
      ) {
        return null
      }

      // if this is a bare import, see if there's a valid pkg.svelte
      const parts = importee.split('/')

      let dir,
        pkg,
        name = parts.shift()
      if (name && name[0] === '@') {
        name += `/${parts.shift()}`
      }

      try {
        const file = `${name}/package.json`
        const resolved = relative.resolve(file, path.dirname(importer))
        dir = path.dirname(resolved)
        pkg = require(resolved)
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') return null
        if (err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
          pkg_export_errors.add(name)
          return null
        }
        // TODO is throw correct here?
        throw err
      }

      // use pkg.svelte
      if (parts.length === 0 && pkg.svelte) {
        return path.resolve(dir, pkg.svelte)
      }
      log.debug(`resolveId did not resolve ${importee}`)
    },

    async transform(code, id, ssr) {
      const svelteRequest = requestParser(id, !!ssr)
      if (!svelteRequest) {
        return
      }
      log.debug('transform', svelteRequest)
      const { filename, query } = svelteRequest
      const cachedCompileData = cache.getCompileData(svelteRequest, false)

      if (query.svelte) {
        // tagged svelte request, use cache
        if (query.type === 'style' && cachedCompileData?.compiled?.css) {
          log.debug(`transform returns css for ${filename}`)
          return cachedCompileData.compiled.css
        }
        log.error('failed to transform tagged svelte request', svelteRequest)
        throw new Error(
          `failed to transform tagged svelte request for id ${id}`
        )
      }

      if (cachedCompileData && !options.disableTransformCache) {
        log.debug(`transform returns cached js for ${filename}`)
        return cachedCompileData.compiled.js
      }

      // first request, compile here
      const compileData = await compileSvelte(svelteRequest, code, options)
      cache.setCompileData(compileData)
      log.debug(`transform returns compiled js for ${filename}`)
      return compileData.compiled.js
    },

    handleHotUpdate(ctx: HmrContext): void | Promise<Array<ModuleNode> | void> {
      if (!options.emitCss || options.disableCssHmr) {
        return
      }
      const svelteRequest = requestParser(ctx.file, false, ctx.timestamp)
      if (!svelteRequest) {
        return
      }
      log.debug('handleHotUpdate', svelteRequest)
      return handleHotUpdate(compileSvelte, ctx, svelteRequest, cache)
    },

    // eslint-disable-next-line no-unused-vars
    transformIndexHtml(html: string, ctx: IndexHtmlTransformContext) {
      // TODO useful for ssr? and maybe svelte:head stuff
      log.debug('transformIndexHtml', html)
    },
    /**
     * All resolutions done; display warnings wrt `package.json` access.
     */
    // TODO generateBundle isn't called by vite, is buildEnd enough or should it be logged once per violation in resolve
    buildEnd() {
      if (pkg_export_errors.size > 0) {
        log.warn(
          `The following packages did not export their \`package.json\` file so we could not check the "svelte" field.If you had difficulties importing svelte components from a package, then please contact the author and ask them to export the package.json file.`,
          Array.from(pkg_export_errors, (s) => `- ${s}`).join('\n')
        )
      }
    }
  }
}

// overwrite for cjs require('...')() usage
module.exports = vitePluginSvelte
vitePluginSvelte['default'] = vitePluginSvelte
