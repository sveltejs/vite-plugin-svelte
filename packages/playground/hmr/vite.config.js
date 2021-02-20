const svelte = require('@svitejs/vite-plugin-svelte')
const { defineConfig } = require('vite')

module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    optimizeDeps: {
      include: ['@dependency/dependency']
    },
    plugins: [
      svelte({
        hot: !isProduction,
        emitCss: true
      })
    ],
    build: {
      minify: isProduction
    }
  }
})
