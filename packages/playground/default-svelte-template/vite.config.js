import svelte from '@svitejs/vite-plugin-svelte'

const production = process.env.NODE_ENV === 'production'

/**
 * type {import('vite').UserConfig}
 */
export default {
  plugins: [
    svelte({
      emitCss: !!production,
      hot: {
        absoluteImports: false
      },
      compilerOptions: {
        dev: !production
      }
    })
  ]
}
