import svelte from '@svitejs/vite-plugin-svelte'
import { postcss } from 'svelte-preprocess'

const production = process.env.NODE_ENV === 'production'

/**
 * type {import('vite').UserConfig}
 */
export default {
  plugins: [
    svelte({
      hot: !production,
      emitCss: true,
      preprocess: [postcss()]
    })
  ]
}
