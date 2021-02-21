const { defineConfig } = require('vite')

const fs = require('fs')

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
