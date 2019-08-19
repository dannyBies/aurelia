module.exports = {
  parser:  '@typescript-eslint/parser',
  root: true,
  extends:  [
    'eslint:recommended',
    'plugin:jsdoc/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended',
    'plugin:sonarjs/recommended',
    'plugin:import/typescript'
  ],
  parserOptions: {
    ecmaVersion: 2019,
    project: './tsconfig.json',
    sourceType: 'module',
    tsconfigRootDir: '.'
  },
  env: {
    es6: true
  },
  globals: {
    MutationObserver: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  plugins: [
    'import',
    'jsdoc',
    'security',
    'sonarjs'
  ],
  rules: {
    // Opinionated overrides of the default recommended rules:
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-inferrable-types': 'off', // Turn no-inferrable-types off in order to make the code consistent in its use of type decorations.
    'security/detect-object-injection': 'off',
    'sonarjs/cognitive-complexity': 'off',
    'sonarjs/no-identical-functions': 'off',
    'sonarjs/no-duplicate-string': 'off',
    'no-dupe-class-members': 'off',

    // Opinionated non default rules:
    '@typescript-eslint/ban-types': ['warn', {
      'types': {
        '{}': 'Avoid using the `{}` type. Prefer a specific lookup type, like `Record<string, unknown>`, or use `object` (lowercase) when referring simply to non-primitives.',
        Function: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`, or use `Constructable` / `Class<TProto, TStatic>` when referring to a constructor function.',
        Boolean: { message: 'Use boolean instead', fixWith: 'boolean' },
        Number: { message: 'Use number instead', fixWith: 'number' },
        String: { message: 'Use string instead', fixWith: 'string' },
        Object: { message: 'Use Record<string, unknown> instead', fixWith: 'Record<string, unknown>' },
        Symbol: { message: 'Use symbol instead', fixWith: 'symbol' }
      }
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/prefer-function-type': 'error',
    'import/no-unassigned-import': 'error',
    'sonarjs/no-all-duplicated-branches': 'error',
    'eqeqeq': 'error',
    'max-lines-per-function': ['error', 200],
    'no-constant-condition': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-restricted-properties': ['error',
      { property: 'substr', message: "'substr' is considered a legacy function and should be avoided when possible. Use 'substring' instead." }
    ],
    'no-shadow': 'error',
    'no-template-curly-in-string': 'error',
    'no-unused-expressions': 'error',
    'prefer-object-spread': 'error',
    'prefer-template': 'error',
    'quotes': ['error', 'single', { avoidEscape: true }],
    'space-in-parens': 'error',

    // Things we need to fix some day, so are marked as warnings for now:
    '@typescript-eslint/array-type': 'warn',
    '@typescript-eslint/class-name-casing': 'warn',
    '@typescript-eslint/explicit-member-accessibility': 'warn',
    '@typescript-eslint/indent': ['warn', 2],
    '@typescript-eslint/member-delimiter-style': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-namespace': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-this-alias': 'warn',
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    'import/no-unassigned-import': 'warn',
    'jsdoc/check-alignment': 'warn',
    'jsdoc/check-param-names': 'warn',
    'jsdoc/check-tag-names': 'warn',
    'jsdoc/newline-after-description': 'warn',
    'jsdoc/require-jsdoc': 'warn',
    'jsdoc/require-param': 'warn',
    'jsdoc/require-param-type': 'warn',
    'jsdoc/require-returns': 'warn',
    'jsdoc/require-returns-type': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-unsafe-regex': 'warn',
    'sonarjs/no-all-duplicated-branches': 'warn',
    'sonarjs/no-duplicated-branches': 'warn',
    'sonarjs/no-extra-arguments': 'warn',
    'sonarjs/no-inverted-boolean-check': 'warn',
    'sonarjs/no-small-switch': 'warn',
    'sonarjs/no-useless-catch': 'warn',
    'sonarjs/prefer-immediate-return': 'warn',
    'eqeqeq': 'warn',
    'max-lines-per-function': ['warn', 200],
    'no-case-declarations': 'warn',
    'no-cond-assign': 'warn',
    'no-console': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-extra-semi': 'warn',
    'no-inner-declarations': 'warn',
    'no-prototype-builtins': 'warn',
    'no-useless-escape': 'warn',
    'no-unused-expressions': 'warn',
    'no-useless-catch': 'warn',
    'no-shadow': 'warn',
    'no-template-curly-in-string': 'warn',
    'no-var': 'warn',
    'prefer-const': 'warn',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'prefer-template': 'warn',
    'quotes': ['warn', 'backtick', { avoidEscape: true }],
    'require-atomic-updates': 'warn',

    // Things we still need to decide on:
    '@typescript-eslint/ban-ts-ignore': 'warn',
    '@typescript-eslint/camelcase': 'warn',
    '@typescript-eslint/no-parameter-properties': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-use-before-define': 'warn',
    'no-fallthrough': 'warn',
    'no-undef': 'warn'
  },
  overrides: [{ // Specific overrides for JS files as some TS rules son't make sense there.
      "files": ['**/*.js'],
      "rules": {
        "@typescript-eslint/no-var-requires": 'off'
      }
  }]
};
