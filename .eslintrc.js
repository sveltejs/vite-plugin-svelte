module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'prettier'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  plugins: ['@typescript-eslint', 'svelte3', 'html', 'markdown'],
  settings: {
    'svelte3/typescript': require('typescript'),
    'svelte3/ignore-styles': (attrs) =>
      (attrs.type && attrs.type !== 'text/css') ||
      (attrs.lang && attrs.lang !== 'css')
  },
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
        'node/no-extraneous-require': 'off',
        'no-unused-vars': 'off'
      },
      env: {
        browser: true
      }
    },
    {
      files: ['packages/templates/**'],
      rules: {
        'node/no-extraneous-import': [
          'error',
          {
            allowModules: ['@svitejs/vite-plugin-svelte', 'svite']
          }
        ],
        'node/no-extraneous-require': [
          'error',
          {
            allowModules: ['@svitejs/vite-plugin-svelte', 'svite']
          }
        ]
      },
      env: {
        browser: true
      }
    },
    {
      files: [
        'packages/templates/**/vite.config.js',
        'packages/playground/**/vite.config.js'
      ],
      rules: {
        'no-unused-vars': 'off',
        'node/no-missing-require': 'off'
      }
    },
    {
      files: ['**/*.svelte'],
      env: {
        es6: true,
        browser: true,
        node: false
      },
      processor: 'svelte3/svelte3',
      rules: {
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-unresolved': 'off'
      }
    },
    {
      files: ['**/*.svx', '**/*.md'],
      processor: 'markdown/markdown',
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'no-console': 'off',
        'padded-blocks': 'off',
        'node/no-missing-import': 'off',
        'node/no-extraneous-require': 'off',
        'import/no-unresolved': 'off'
      }
    },
    {
      files: ['**/*.svx/*.**', '**/*.md/*.**'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'no-console': 'off',
        'padded-blocks': 'off',
        'node/no-missing-import': 'off',
        'node/no-extraneous-require': 'off',
        'import/no-unresolved': 'off'
      }
    },
    {
      files: ['**/__tests__/**/*.spec.ts'],
      env: {
        jest: true,
        node: true,
        browser: true
      },
      // Can't extend in overrides: https://github.com/eslint/eslint/issues/8813
      // "extends": ["plugin:jest/recommended"]
      plugins: ['jest'],
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error'
      }
    },
    {
      files: ['scripts/**'],
      env: {
        jest: true,
        node: true,
        browser: false
      }
    }
  ]
}
