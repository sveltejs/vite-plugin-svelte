const path = require('path')
const { mdsvex } = require('mdsvex')
const { typescript } = require('svelte-preprocess')

module.exports = {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    mdsvex(
      {
        layout: path.join(__dirname, 'src', 'layouts', 'MdsvexLayout.svelte')
      },
      typescript()
    )
  ]
}
