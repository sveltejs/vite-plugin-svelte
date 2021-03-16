const configConventional = require('@commitlint/config-conventional');
configConventional.rules['type-enum'][2].push('release', 'wip');
module.exports = configConventional;
