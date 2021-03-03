const svelte = require('@svitejs/vite-plugin-svelte')
const { defineConfig } = require('vite')
const vitePluginWindicss = require('vite-plugin-windicss').default

module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    plugins: [
      // uses enforce: pre
      svelte({
        hot: !isProduction,
        emitCss: true
      }),
      vitePluginWindicss({
        transformCSS: 'pre'
      })
    ],
    build: {
      minify: isProduction
    }
  }
})
