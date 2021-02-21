const { defineConfig } = require('vite')
const fs = require('fs')

let svelte

try {
  svelte = require('@svitejs/vite-plugin-svelte')
} catch (e) {
  let path, exists
  try {
    path = require.resolve('@svitejs/vite-plugin-svelte')
    exists = fs.existsSync(path)
    console.error("require  resolve '@svitejs/vite-plugin-svelte'", {
      path,
      exists
    })
  } catch (e1) {
    console.error('require resolve failed', e1)
  }

  console.error('failed ro require', e)
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
