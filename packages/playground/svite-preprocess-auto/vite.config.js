import svelte from '@svitejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    plugins: [
      svelte({
        hot: !isProduction,
        emitCss: true,
        preprocess: sveltePreprocess()
      })
    ],
    build: {
      minify: isProduction
    }
  }
})
