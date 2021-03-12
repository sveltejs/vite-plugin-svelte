import { ResolvedConfig, TransformResult } from 'vite'
import { Preprocessor, PreprocessorGroup, ResolvedOptions } from './options'
import { TransformPluginContext } from 'rollup'
// import type { WindiPluginUtils } from '@windicss/plugin-utils'
const supportedStyleLangs = [
  'css',
  'less',
  'sass',
  'scss',
  'styl',
  'stylus',
  'postcss'
]

const supportedScriptLangs = ['ts']

function createPreprocessorFromVitePlugin(
  config: ResolvedConfig,
  options: ResolvedOptions,
  pluginName: string,
  supportedLangs: string[]
): Preprocessor {
  const plugin = config.plugins.find((p) => p.name === pluginName)
  if (!plugin) {
    throw new Error(`failed to find plugin ${pluginName}`)
  }
  if (!plugin.transform) {
    throw new Error(`plugin ${pluginName} has no transform`)
  }
  const pluginTransform = plugin.transform!.bind(
    (null as unknown) as TransformPluginContext
  )
  // @ts-ignore
  return async ({ attributes, content, filename }) => {
    const lang = attributes.lang as string
    if (!supportedLangs.includes(lang)) {
      return { code: content }
    }
    const moduleId = `${filename}.${lang}`
    const moduleGraph = options.server?.moduleGraph
    if (moduleGraph && !moduleGraph.getModuleById(moduleId)) {
      await moduleGraph.ensureEntryFromUrl(moduleId)
    }
    const transformResult: TransformResult = (await pluginTransform(
      content,
      moduleId
    )) as TransformResult
    // TODO vite:css transform currently returns an empty mapping that would kill svelte compiler.
    const hasMap = !!transformResult.map?.mappings
    if (transformResult.map?.sources?.[0] === moduleId) {
      transformResult.map.sources[0] = filename as string
    }
    return {
      code: transformResult.code,
      map: hasMap ? (transformResult.map as object) : null,
      dependencies: transformResult.deps
    }
  }
}

export function createVitePreprocessorGroup(
  config: ResolvedConfig,
  options: ResolvedOptions
): PreprocessorGroup {
  return {
    script: createPreprocessorFromVitePlugin(
      config,
      options,
      'vite:esbuild',
      supportedScriptLangs
    ),
    style: createPreprocessorFromVitePlugin(
      config,
      options,
      'vite:css',
      supportedStyleLangs
    )
  } as PreprocessorGroup
}

/*
function createWindicssStylePreprocessorFromVite(
  windiPlugin: Plugin
): PreprocessorGroup {
  const cssTransform = windiPlugin.transform!.bind(
    (null as unknown) as TransformPluginContext
  )
  return {
    style: async ({attributes,content, filename }) => {
      const lang = attributes.lang as string || 'css'
      const transformResult: string = (await cssTransform(
        content,
        `${filename}.${lang}`
      )) as unknown as string


      return {
        code: transformResult
      }
    }
  } as PreprocessorGroup
}



function createWindicssApiStylePreprocessorFromVite(
  windiPlugin: Plugin
): PreprocessorGroup {
  const windiAPI = windiPlugin.api as WindiPluginUtils

  return {
    style: async ({  content, filename }) => {
      windiAPI.extractFile(content,filename,false);
      const transformResult = await windiAPI.transformGroupsWithSourcemap(content)
      if(transformResult) {
        return {
          code: transformResult.code,
          map: transformResult.map as object
        }
      }
    }
  } as PreprocessorGroup
}

 */

export function buildExtraPreprocessors(
  options: ResolvedOptions,
  config: ResolvedConfig
) {
  const extraPreprocessors = []
  if (options.useVitePreprocess) {
    extraPreprocessors.push(createVitePreprocessorGroup(config, options))
  }
  // TODO
  /*
  const windiCssPlugin = config.plugins.find(p => p.name === 'vite-plugin-windicss:css');
  if (windiCssPlugin) {
    extraPreprocessors.unshift(createWindicssStylePreprocessorFromVite(windiCssPlugin))
  }
   */
  return extraPreprocessors
}
