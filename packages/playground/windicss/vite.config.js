const svelte = require('@svitejs/vite-plugin-svelte')
const { defineConfig } = require('vite')
import windicss from 'vite-plugin-windicss'

const windiOpts = {
  verbose: true,
  silent: false,
  debug: true,
  config: 'tailwind.config.js', // tailwind config file path (optional)
  compile: false, // false: interpretation mode; true: compilation mode
  prefix: 'windi-', // set compilation mode style prefix
  globalPreflight: true, // set preflight style is global or scoped
  globalUtility: true // set utility style is global or scoped
}

module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  return {
    plugins: [
      svelte({
        hot: !isProduction,
        emitCss: true,
        preprocess: [
          require('svelte-windicss-preprocess').preprocess(windiOpts)
        ]
      }),
      windicss(windiOpts)
    ],
    build: {
      minify: isProduction
    }
  }
})
