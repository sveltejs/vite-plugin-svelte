import { getCompileData } from './utils/compile'

import { ModuleNode, HmrContext } from 'vite'
import { CompileData, compileSvelte } from './utils/compile'
import { normalizePath } from './utils/id'
import { log } from './utils/log'

/**
 * Vite-specific HMR handling
 */
export async function handleHotUpdate({
  file,
  modules,
  read,
  server
}: HmrContext): Promise<ModuleNode[] | void> {
  const cachedCompileData = getCompileData(
    normalizePath(file, server.config.root),
    false
  )
  if (!cachedCompileData) {
    // file hasn't been requested yet (e.g. async component)
    log.debug(`handleHotUpdate first call ${file}`)
    return
  }

  const content = await read()
  const compileData: CompileData = await compileSvelte(
    file,
    content,
    cachedCompileData.options,
    cachedCompileData.ssr
  )

  const affectedModules = new Set<ModuleNode | undefined>()
  const mainModule = modules.find(
    (m) => !/type=/.test(m.url) || /type=script/.test(m.url)
  )

  if (!isCodeEqual(compileData.compiled.js, cachedCompileData.compiled.js)) {
    affectedModules.add(mainModule)
  }

  if (!isCodeEqual(compileData.compiled.css, cachedCompileData.compiled.css)) {
    const styleModule = modules.find((m) => m.url.includes(`type=style`))
    affectedModules.add(styleModule)
  }
  const result = [...affectedModules].filter(Boolean) as ModuleNode[]
  log.debug(`handleHotUpdate result for ${file}`, result)
  return result
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
  // TODO we have to do better here, js code differs at least with generated style hash
  const equal = a.code === b.code

  return equal
}
