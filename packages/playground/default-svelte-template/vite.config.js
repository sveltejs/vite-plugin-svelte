import svelte from '@svitejs/vite-plugin-svelte'

const production = process.env.NODE_ENV === 'production'

/**
 * type {import('vite').UserConfig}
 */
export default {
  optimizeDeps: {
    // TODO move to plugin, exclude all and dedupe all
    exclude: ['svelte', 'svelte/internal']
  },
  plugins: [
    svelte({
      emitCss: true,
      hot: {
        absoluteImports: false,
        injectCss: false
      },
      compilerOptions: {
        dev: !production,
        css: false
      }
    })
  ]
}
