module.exports = {
  root: true,
  extends: ['plugin:node/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  rules: {
    'no-debugger': ['error'],
    'node/no-missing-import': [
      'error',
      {
        allowModules: ['types', 'estree', 'testUtils'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx']
      }
    ],
    'node/no-missing-require': [
      'error',
      {
        // for try-catching yarn pnp
        allowModules: ['pnpapi'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx']
      }
    ],

    'node/no-extraneous-import': [
      'error',
      {
        allowModules: ['vite']
      }
    ],
    'node/no-extraneous-require': [
      'error',
      {
        allowModules: ['vite']
      }
    ],
    'node/no-deprecated-api': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'no-process-exit': 'off'
  },
  overrides: [
    {
      files: ['packages/playground/**'],
      rules: {
        'node/no-extraneous-import': 'off',
        'node/no-extraneous-require': 'off'
      }
    },
    {
      files: ['packages/create-app/template-*/**'],
      rules: {
        'node/no-missing-import': 'off'
      }
    }
  ]
}
