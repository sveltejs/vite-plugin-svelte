const { defineConfig } = require('vite')
const svelte = require('@svitejs/vite-plugin-svelte')

module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    plugins: [svelte()],
    build: {
      minify: isProduction
    }
  }
})
