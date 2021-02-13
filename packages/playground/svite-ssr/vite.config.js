const svelte = require('@svitejs/vite-plugin-svelte')

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
/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  plugins: [
    svelte(),
    {
      name: 'virtual',
      resolveId(id) {
        if (id === '@foo') {
          return id
        }
      },
      load(id) {
        if (id === '@foo') {
          return `export default { msg: 'hi' }`
        }
      }
    }
  ],
  build: {
    minify: false
  }
}
