import qs from 'querystring'
import { createFilter } from '@rollup/pluginutils'
import { Arrayable } from './options'
import path from 'path'

export type SvelteQueryTypes = 'style' | 'script'

export interface SvelteQuery {
  svelte?: boolean
  type?: SvelteQueryTypes
}

export interface SvelteRequest {
  filename: string
  query: SvelteQuery
}

export type SvelteRequestFilter = (svelteRequest: SvelteRequest) => boolean

export function parseToSvelteRequest(id: string): SvelteRequest {
  let [filename, rawQuery] = id.split(`?`, 2)

  const query = qs.parse(rawQuery) as SvelteQuery
  if (query.svelte != null) {
    query.svelte = true
  }

  // remove .css ending from genenerated import
  if (query.svelte && query.type === 'style' && filename.endsWith('.css')) {
    filename = filename.slice(0, -4)
  }

  return {
    filename,
    query
  }
}

export function createVirtualImportId(
  filename: string,
  type: SvelteQueryTypes
) {
  if (type === 'style') {
    // add .css so it is handled by vite css pipeline for hmr
    return `${filename}.css?svelte&type=style`
  }
  return `${filename}?svelte&type=${type}`
}

export function buildFilter(
  include: Arrayable<string>,
  exclude: Arrayable<string>,
  extensions: string[]
): SvelteRequestFilter {
  const rollupFilter = createFilter(include, exclude)
  return (svelteRequest) => {
    return (
      svelteRequest.query?.svelte ||
      (rollupFilter(svelteRequest.filename) &&
        extensions.some((ext) => svelteRequest.filename.endsWith(ext)))
    )
  }
}

export function normalizePath(file: string, root = process.cwd()) {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file
}
