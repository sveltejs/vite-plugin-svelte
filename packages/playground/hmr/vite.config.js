const { defineConfig } = require('vite')
const svelte = require('@svitejs/vite-plugin-svelte')

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
