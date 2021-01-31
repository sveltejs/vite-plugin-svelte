import * as path from 'path'
import { HmrContext, ModuleNode, Plugin, ViteDevServer } from 'vite'
import { createFilter } from '@rollup/pluginutils'
// @ts-ignore
import * as relative from 'require-relative'
import { compile, preprocess, walk } from 'svelte/compiler'
// @ts-ignore
import { createMakeHot } from 'svelte-hmr'

const PREFIX = '[rollup-plugin-svelte]'
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
  // TODO extend rollup plugin svelte options
  emitCss: boolean
  compilerOptions: any
  preprocess: any
  extensions: any
  include: any
  exclude: any
  onwarn: any
  hot: any
}

export interface ResolvedOptions extends Options {
  root: string
  isProduction: boolean
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

  // [filename]:[chunk]
  const cache_emit = new Map()
  const { onwarn, emitCss = true } = rest

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

  const makeHot = rest.hot && createMakeHot({ walk })

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
        isProduction: config.isProduction
      }
    },

    configureServer(server) {
      options.devServer = server
    },

    load(id, ssr) {
      // we should properbly handle stripping the query params here, see vite vue plugin
      // not sure if we also need to do sth different during ssr?

      // @ts-ignore
      const result = cache_emit.get(id) || null
      console.log('load', { id, result })
      return result
    },

    async resolveId(importee, importer, options, ssr) {
      if (cache_emit.has(importee)) return importee
      if (
        !importer ||
        importee[0] === '.' ||
        importee[0] === '\0' ||
        path.isAbsolute(importee)
      )
        return null

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
      if (!filter(id)) return null

      const extension = path.extname(id)
      if (!~extensions.indexOf(extension)) return null

      const dependencies = []
      const filename = path.relative(process.cwd(), id)
      const svelte_options = { ...compilerOptions, filename }

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
        const fname = id.replace(new RegExp(`\\${extension}$`), '.css')
        compiled.js.code += `\nimport ${JSON.stringify(fname)};\n`
        cache_emit.set(fname, compiled.css)
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

      if (this.addWatchFile) {
        dependencies.forEach(this.addWatchFile)
      } else {
        compiled.js.dependencies = dependencies
      }

      const result = compiled.js

      console.log('transform', { id, result })
      return result
    },

    handleHotUpdate(
      ctx: HmrContext
    ): Array<ModuleNode> | void | Promise<Array<ModuleNode> | void> {
      console.log('handleHotUpdate', ctx)
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
