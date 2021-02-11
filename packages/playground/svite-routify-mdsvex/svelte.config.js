const path = require('path')
const { mdsvex } = require('mdsvex')

module.exports = {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    mdsvex({
      layout: path.join(__dirname, 'src', 'layouts', 'MdsvexLayout.svelte')
    })
  ]
}
