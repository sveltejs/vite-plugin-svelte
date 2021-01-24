const configConventional = require('@commitlint/config-conventional')
configConventional.rules['type-enum'][2].push('wip')
module.exports = configConventional
