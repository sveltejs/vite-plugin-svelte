// TODO reenable svelte.config.js parsing in vite-plugin-svelte
const { postcss } = require('svelte-preprocess')
module.exports = {
  preprocess: [postcss()]
}
