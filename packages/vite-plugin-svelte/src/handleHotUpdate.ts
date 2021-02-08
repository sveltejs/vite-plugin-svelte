import { getCompileData } from './utils/compile'

import { ModuleNode, HmrContext } from 'vite'
import { CompileData, compileSvelte } from './utils/compile'
import { log } from './utils/log'
import { SvelteRequest } from './utils/id'

/**
 * Vite-specific HMR handling
 */
export async function handleHotUpdate(
  ctx: HmrContext,
  svelteRequest: SvelteRequest
): Promise<ModuleNode[] | void> {
  const { read, server } = ctx
  const cachedCompileData = getCompileData(svelteRequest, false)
  if (!cachedCompileData) {
    // file hasn't been requested yet (e.g. async component)
    log.debug(`handleHotUpdate first call ${svelteRequest.id}`)
    return
  }

  const content = await read()
  const compileData: CompileData = await compileSvelte(
    svelteRequest,
    content,
    cachedCompileData.options,
    cachedCompileData.ssr
  )
  const affectedModules = new Set<ModuleNode | undefined>()

  const cssModule = server.moduleGraph.getModuleById(svelteRequest.cssId)
  const mainModule = server.moduleGraph.getModuleById(svelteRequest.id)
  if (cssModule && cssChanged(cachedCompileData, compileData)) {
    log.debug('handleHotUpdate css changed')
    affectedModules.add(cssModule)
  }

  if (mainModule && jsChanged(cachedCompileData, compileData)) {
    log.debug('handleHotUpdate js changed')
    affectedModules.add(mainModule)
  }

  const result = [...affectedModules].filter(Boolean) as ModuleNode[]
  log.debug(`handleHotUpdate result for ${svelteRequest.id}`, result)
  // TODO
  // for a css only change this does return only the css module
  // but a load/transfrom for App.svelte is triggered anyways, find out why
  return result
}

function cssChanged(prev: CompileData, next: CompileData) {
  return !isCodeEqual(prev.compiled.css, next.compiled.css)
}

function jsChanged(prev: CompileData, next: CompileData) {
  if (prev.options.emitCss) {
    const jsCode: string = next.compiled.js.code
    const patchedCode = jsCode.replace(
      new RegExp(next.svelteCssClass!, 'g'),
      prev.svelteCssClass!
    )
    const patchedNext = {
      ...next.compiled.js,
      code: patchedCode
    }
    const jsChanged = !isCodeEqual(prev.compiled.js, patchedNext)
    if (!jsChanged) {
      // TODO evil hack, reuse previous css hash in new css code so it is applied to existing dom
      // not the right place
      next.compiled.css.code = next.compiled.css.code.replace(
        new RegExp(next.svelteCssClass!, 'g'),
        prev.svelteCssClass!
      )
    }
    return jsChanged
  } else {
    return !isCodeEqual(prev.compiled.js, next.compiled.js)
  }
}

function isCodeEqual(
  a: { code: string; map?: any; dependencies?: any[] },
  b: { code: string; map?: any; dependencies?: any[] }
): boolean {
  if (a === b) {
    return true
  }
  if (a == null && b == null) {
    return true
  }
  if (a == null || b == null) {
    return false
  }
  return a.code === b.code
}
