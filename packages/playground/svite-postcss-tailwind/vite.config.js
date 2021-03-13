const svelte = require('@svitejs/vite-plugin-svelte')
const { defineConfig } = require('vite')
const { postcss } = require('svelte-preprocess')

module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    plugins: [svelte()],
    build: {
      minify: isProduction
    }
  }
})
