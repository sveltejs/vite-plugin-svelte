// import fs from 'fs'
import { Plugin, ViteDevServer } from 'vite'
import svelte from 'rollup-plugin-svelte'
// import { parseVueRequest } from './utils/query'
// import { getDescriptor } from './utils/descriptorCache'
// import { getResolvedScript } from './script'
// import { transformMain } from './main'
// import { handleHotUpdate } from './handleHotUpdate'
// import { transformTemplateAsModule } from './template'
// import { transformStyle } from './style'

export { parseVueRequest, VueQuery } from './utils/query'

export interface Options {
  // TODO extend rollup plugin svelte options
}

export interface ResolvedOptions extends Options {
  root: string
  isProduction: boolean
  devServer?: ViteDevServer
}

export default function vitePluginSvelte(rawOptions: Options): Plugin {
  let options: ResolvedOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    ...rawOptions,
    root: process.cwd()
  }
  const rollupPluginSvelte = svelte(options as any)
  if (rollupPluginSvelte == null) {
    throw new Error('failed to init')
  }

  return {
    ...rollupPluginSvelte,
    name: 'vite:svelte',

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
      return rollupPluginSvelte.load(id)
    },
    async resolveId(importee, importer, options, ssr) {
      // see load, maybe we need to check ssr flag here
      // @ts-ignore
      return rollupPluginSvelte?.resolveId(importee, importer, options)
    },
    async transform(code, id, ssr) {
      // this could be tricky, we need to pass ssr flag to svelte compiler inside
      // @ts-ignore
      return rollupPluginSvelte?.transform(code, id)
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
