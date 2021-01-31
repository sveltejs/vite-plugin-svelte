import qs from 'querystring'

export interface SvelteQuery {
  svelte?: boolean
  src?: boolean
  type?: 'script' | 'template' | 'style' | 'custom'
  index?: number
  lang?: string
}

export function parseSvelteRequest(id: string) {
  const [filename, rawQuery] = id.split(`?`, 2)
  const query = qs.parse(rawQuery) as SvelteQuery
  if (query.svelte != null) {
    query.svelte = true
  }
  if (query.src != null) {
    query.src = true
  }
  if (query.index != null) {
    query.index = Number(query.index)
  }
  return {
    filename,
    query
  }
}
