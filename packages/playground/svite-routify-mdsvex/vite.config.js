const path = require('path')
const { mdsvex } = require('mdsvex')
const svelte = require('@svitejs/vite-plugin-svelte')
const { defineConfig } = require('vite')

module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    optimizeDeps: {
      exclude: ['@roxi/routify']
    },
    plugins: [
      svelte({
        hot: !isProduction,
        emitCss: true,
        extensions: ['.svelte', '.svx'],
        preprocess: [
          mdsvex({
            layout: path.join(
              __dirname,
              'src',
              'layouts',
              'MdsvexLayout.svelte'
            )
          })
        ]
      })
    ],
    build: {
      minify: isProduction
    }
  }
})
