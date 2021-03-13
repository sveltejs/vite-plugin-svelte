const svelte = require('@svitejs/vite-plugin-svelte')
const { defineConfig } = require('vite')

module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    optimizeDeps: {
      exclude: ['@roxi/routify']
    },
    plugins: [svelte()],
    build: {
      minify: isProduction
    }
  }
})
