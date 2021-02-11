import path from 'path'
import { mdsvex } from 'mdsvex'
import svelte from '@svitejs/vite-plugin-svelte'

const production = process.env.NODE_ENV === 'production'

/**
 * type {import('vite').UserConfig}
 */
export default {
  optimizeDeps: {
    exclude: ['@roxi/routify']
  },
  plugins: [
    svelte({
      hot: !production,
      emitCss: true,
      extensions: ['.svelte', '.svx'],
      preprocess: [
        mdsvex({
          layout: path.join(__dirname, 'src', 'layouts', 'MdsvexLayout.svelte')
        })
      ]
    })
  ]
}
