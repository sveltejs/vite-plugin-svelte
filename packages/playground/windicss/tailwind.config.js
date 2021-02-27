const colors = require('windicss/colors')
const typography = require('windicss/plugin/typography')
module.exports = {
  darkMode: 'class',
  plugins: [typography],
  theme: {
    extend: {
      colors: {
        teal: colors.teal,
        svelte: {
          500: '#ff3e00'
        }
      }
    }
  }
}
