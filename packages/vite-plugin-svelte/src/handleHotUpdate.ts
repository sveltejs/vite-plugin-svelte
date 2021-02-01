import _debug from 'debug'

import {
  createDescriptor,
  getDescriptor,
  setPrevDescriptor,
  SvelteComponentDescriptor
} from './utils/descriptorCache'

import { ModuleNode, HmrContext } from 'vite'

const debug = _debug('vite-plugin-svelte:hmr')

/**
 * Vite-specific HMR handling
 */
export async function handleHotUpdate({
  file,
  modules,
  read,
  server
}: HmrContext): Promise<ModuleNode[] | void> {
  const prevDescriptor = getDescriptor(file, false)
  if (!prevDescriptor) {
    // file hasn't been requested yet (e.g. async component)
    return
  }

  setPrevDescriptor(file, prevDescriptor)

  const content = await read()
  const descriptor: SvelteComponentDescriptor = await createDescriptor(
    file,
    content,
    server.config.root,
    false,
    prevDescriptor.compilerOptions,
    prevDescriptor.rest,
    prevDescriptor.ssr
  )

  const affectedModules = new Set<ModuleNode | undefined>()
  const mainModule = modules.find(
    (m) => !/type=/.test(m.url) || /type=script/.test(m.url)
  )

  if (!isCodeEqual(descriptor.js, prevDescriptor.js)) {
    affectedModules.add(mainModule)
  }

  if (!isCodeEqual(descriptor.css, prevDescriptor.css)) {
    const styleModule = modules.find((m) => m.url.includes(`type=style`))
    affectedModules.add(styleModule)
    debug(`[svelte:update(style)] ${file}`)
  }

  return [...affectedModules].filter(Boolean) as ModuleNode[]
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
  // TODO we can do better here
  return a.code === b.code
}
