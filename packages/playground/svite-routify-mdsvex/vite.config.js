import path from 'path'
import { mdsvex } from 'mdsvex'
import svelte from '@svitejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    optimizeDeps: {
      exclude: ['@roxi/routify']
    },
    plugins: [
      svelte({
        hot: !isProduction,
        emitCss: true,
        extensions: ['.svelte', '.svx'],
        preprocess: [
          mdsvex({
            layout: path.join(
              __dirname,
              'src',
              'layouts',
              'MdsvexLayout.svelte'
            )
          })
        ]
      })
    ],
    build: {
      minify: isProduction
    }
  }
})
