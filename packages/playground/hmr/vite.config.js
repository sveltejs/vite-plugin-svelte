const { defineConfig } = require('vite')

let svelte

try {
  svelte = require('@svitejs/vite-plugin-svelte')
} catch (e) {
  console.error('failed ro require', e)
  throw e
}

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
