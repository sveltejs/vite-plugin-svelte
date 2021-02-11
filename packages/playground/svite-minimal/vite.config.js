import svelte from '@svitejs/vite-plugin-svelte'

const production = process.env.NODE_ENV === 'production'

/**
 * type {import('vite').UserConfig}
 */
export default {
  plugins: [
    svelte({
      hot: !production,
      emitCss: true
    })
  ]
}
