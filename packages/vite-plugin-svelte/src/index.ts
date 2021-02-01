import * as path from 'path'
import * as fs from 'fs'
import { HmrContext, ModuleNode, Plugin, ViteDevServer } from 'vite'
import { createFilter } from '@rollup/pluginutils'
// @ts-ignore
import * as relative from 'require-relative'

import { parseSvelteRequest } from './utils/query'
import { getDescriptor } from './utils/descriptorCache'
import { handleHotUpdate } from './handleHotUpdate'

const PREFIX = '[vite-plugin-svelte]'
const pkg_export_errors = new Set()

const plugin_options = new Set([
  'emitCss',
  'exclude',
  'extensions',
  'include',
  'onwarn',
  'preprocess',
  'hot'
])

export interface Options {
  /** One or more minimatch patterns */
  include: Arrayable<string>

  /** One or more minimatch patterns */
  exclude: Arrayable<string>

  /**
   * By default, all ".svelte" files are compiled
   * @default ['.svelte']
   */
  extensions: string[]

  /**
   * Optionally, preprocess components with svelte.preprocess:
   * \@see https://svelte.dev/docs#svelte_preprocess
   */
  preprocess: Arrayable<PreprocessorGroup>

  /** Emit Svelte styles as virtual CSS files for other plugins to process. */
  emitCss: boolean

  /** Options passed to `svelte.compile` method. */
  compilerOptions: CompileOptions

  onwarn?: undefined | false | ((warning: any, defaultHandler?: any) => void)

  /** Enable/configure HMR */
  hot?:
    | undefined
    | false
    | {
        /**
         * Enable state preservation when a component is updated by HMR for every
         * components.
         * @default false
         */
        preserveState: boolean

        /**
         * If this string appears anywhere in your component's code, then local
         * state won't be preserved, even when noPreserveState is false.
         * @default '\@hmr:reset'
         */
        noPreserveStateKey: string

        /**
         * If this string appears next to a `let` variable, the value of this
         * variable will be preserved accross HMR updates.
         * @default '\@hmr:keep'
         */
        preserveStateKey: string

        /**
         * Prevent doing a full reload on next HMR update after fatal error.
         * @default false
         */
        noReload: boolean

        /**
         * Try to recover after runtime errors in component init.
         * @default true
         */
        optimistic: boolean

        noDisableCss: boolean
        injectCss?: boolean
        cssEjectDelay: number
      }
}

export interface ResolvedOptions extends Options {
  root: string
  isProduction: boolean
  isBuild?: boolean
  isServe?: boolean
  devServer?: ViteDevServer
}

export default function vitePluginSvelte(rawOptions: Options): Plugin {
  const { compilerOptions = {}, ...rest } = rawOptions
  const extensions = rest.extensions || ['.svelte']
  const filter = createFilter(rest.include, rest.exclude)

  compilerOptions.format = 'esm'

  for (const key in rest) {
    if (plugin_options.has(key)) continue
    console.warn(
      `${PREFIX} Unknown "${key}" option. Please use "compilerOptions" for any Svelte compiler configuration.`
    )
  }

  if (emitCss) {
    if (compilerOptions.css) {
      console.warn(
        `${PREFIX} Forcing \`"compilerOptions.css": false\` because "emitCss" was truthy.`
      )
    }
    compilerOptions.css = false
  }

  if (rest.hot && !compilerOptions.dev) {
    console.info(`${PREFIX} Disabling HMR because "dev" option is disabled.`)
    rest.hot = false
  }

  let options: ResolvedOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    ...rawOptions,
    root: process.cwd()
  }

  return {
    name: 'vite-plugin-svelte',

    config(config) {
      // patch vite config
      if (!config.dedupe) {
        config.dedupe = ['svelte']
      } else if (!config.dedupe.includes('svelte')) {
        config.dedupe.push('svelte')
      }
    },

    configResolved(config) {
      options = {
        ...options,
        root: config.root,
        isProduction: config.isProduction,
        isBuild: config.command === 'build',
        isServe: config.command === 'serve'
      }
    },

    configureServer(server) {
      options.devServer = server
    },

    load(id, ssr) {
      const { filename, query } = parseSvelteRequest(id)
      // select corresponding block for subpart virtual modules
      if (query.svelte) {
        if (query.src) {
          return fs.readFileSync(filename, 'utf-8')
        }
        const descriptor = getDescriptor(filename)!
        let block: SFCBlock | null | undefined
        if (query.type === 'script') {
          // handle <scrip> + <script setup> merge via compileScript()
          block = getResolvedScript(descriptor, ssr)
        } else if (query.type === 'template') {
          block = descriptor.template!
        } else if (query.type === 'style') {
          block = descriptor.styles[query.index!]
        } else if (query.index != null) {
          block = descriptor.customBlocks[query.index]
        }
        if (block) {
          return {
            code: block.content,
            map: block.map as any
          }
        }
      }
    },

    async resolveId(importee, importer, options, ssr) {
      if (parseSvelteRequest(importee).query.svelte) {
        return importee
      }

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
        throw err
      }

      // use pkg.svelte
      if (parts.length === 0 && pkg.svelte) {
        return path.resolve(dir, pkg.svelte)
      }
    },

    async transform(code, id, ssr) {
      const { filename, query } = parseSvelteRequest(id)
      if (
        !query.svelte &&
        (!filter(filename) || !extensions.some((ext) => filename.endsWith(ext)))
      ) {
        return
      }

      if (!query.svelte) {
        // main request
        return transformMain(code, filename, options, this, ssr)
      } else {
        // sub block request
        const descriptor = getDescriptor(filename)!
        if (query.type === 'template') {
          return transformTemplateAsModule(code, descriptor, options, this, ssr)
        } else if (query.type === 'style') {
          return transformStyle(
            code,
            descriptor,
            Number(query.index),
            options,
            this
          )
        }
      }

      const dependencies = []

      const svelte_options = {
        ssr,
        ...compilerOptions,
        filename
      }

      if (rest.preprocess) {
        const processed = await preprocess(code, rest.preprocess, { filename })
        if (processed.dependencies) dependencies.push(...processed.dependencies)
        if (processed.map) svelte_options.sourcemap = processed.map
        code = processed.code
      }

      const compiled = compile(code, svelte_options)

      ;(compiled.warnings || []).forEach((warning) => {
        if (!emitCss && warning.code === 'css-unused-selector') return
        if (onwarn) onwarn(warning, this.warn)
        else this.warn(warning)
      })

      if (emitCss && compiled.css.code) {
        const cssImport = `${filename}?svelte&type=style`
        compiled.js.code += `\nimport ${JSON.stringify(cssImport)};\n`
      }

      if (makeHot) {
        compiled.js.code = makeHot({
          id,
          compiledCode: compiled.js.code,
          hotOptions: {
            injectCss: !rest.emitCss,
            ...rest.hot
          },
          compiled,
          originalCode: code,
          compileOptions: compilerOptions
        })
      }

      compiled.js.dependencies = dependencies

      const result = compiled.js

      console.log('transform', { id, result })
      return result
    },

    handleHotUpdate(
      ctx: HmrContext
    ): Array<ModuleNode> | void | Promise<Array<ModuleNode> | void> {
      if (
        !filter(ctx.file) ||
        !extensions.some((ext) => ctx.file.endsWith(ext))
      ) {
        return
      }
      return handleHotUpdate(ctx)
    }

    /*
    async resolveId(id, importer) {
      // serve subpart requests (*?vue) as virtual modules
      if (parseVueRequest(id).query.vue) {
        return id
      }
    },

    load(id, ssr = !!options.ssr) {
      const { filename, query } = parseVueRequest(id)
      // select corresponding block for subpart virtual modules
      if (query.vue) {
        if (query.src) {
          return fs.readFileSync(filename, 'utf-8')
        }
        const descriptor = getDescriptor(filename)!
        let block: SFCBlock | null | undefined
        if (query.type === 'script') {
          // handle <scrip> + <script setup> merge via compileScript()
          block = getResolvedScript(descriptor, ssr)
        } else if (query.type === 'template') {
          block = descriptor.template!
        } else if (query.type === 'style') {
          block = descriptor.styles[query.index!]
        } else if (query.index != null) {
          block = descriptor.customBlocks[query.index]
        }
        if (block) {
          return {
            code: block.content,
            map: block.map as any
          }
        }
      }
    },

    transform(code, id, ssr = !!options.ssr) {
      const { filename, query } = parseVueRequest(id)
      if (!query.vue && !filter(filename)) {
        return
      }

      if (!query.vue) {
        // main request
        return transformMain(code, filename, options, this, ssr)
      } else {
        // sub block request
        const descriptor = getDescriptor(filename)!
        if (query.type === 'template') {
          return transformTemplateAsModule(code, descriptor, options, this, ssr)
        } else if (query.type === 'style') {
          return transformStyle(
            code,
            descriptor,
            Number(query.index),
            options,
            this
          )
        }
      }
    }
    */
  }
}

// overwrite for cjs require('...')() usage
module.exports = vitePluginSvelte
vitePluginSvelte['default'] = vitePluginSvelte

// TODO import from appropriate places
export declare type ModuleFormat = 'esm' | 'cjs'

export interface CompileOptions {
  format?: ModuleFormat
  name?: string
  filename?: string
  generate?: 'dom' | 'ssr' | false
  sourcemap?: object | string
  outputFilename?: string
  cssOutputFilename?: string
  sveltePath?: string
  dev?: boolean
  accessors?: boolean
  immutable?: boolean
  hydratable?: boolean
  legacy?: boolean
  customElement?: boolean
  tag?: string
  css?: boolean
  loopGuardTimeout?: number
  namespace?: string
  preserveComments?: boolean
  preserveWhitespace?: boolean
}

export interface Processed {
  code: string
  map?: string | object
  dependencies?: string[]
  toString?: () => string
}

export declare type MarkupPreprocessor = (options: {
  content: string
  filename: string
}) => Processed | Promise<Processed>

export declare type Preprocessor = (options: {
  content: string
  attributes: Record<string, string | boolean>
  filename?: string
}) => Processed | Promise<Processed>

export interface PreprocessorGroup {
  markup?: MarkupPreprocessor
  style?: Preprocessor
  script?: Preprocessor
}

export type Arrayable<T> = T | T[]
