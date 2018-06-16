module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
    'eslint:recommended',
  ],
  plugins: [
  ],
  parserOptions: {
    ecmaVersion: 2017,
    ecmaFeatures: {
      impliedStrict: true,
      experimentalObjectRestSpread: true,
    },
    sourceType: 'module',
  },
  settings: {
  },
  rules: {
    // off
    'class-methods-use-this': 0,
    'consistent-return': 0,
    'func-names': 0,
    'global-require': 0,
    'guard-for-in': 0,
    'import/extensions': 0,
    'max-len': 0,
    'new-cap': 0,
    'no-confusing-arrow': 0,
    'no-continue': 0,
    'no-mixed-requires': 0,
    'no-multi-assign': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-restricted-syntax': 0,
    'no-shadow': 0,
    'no-undef': 0,
    'no-underscore-dangle': 0,
    'object-curly-newline': 0,
    'require-jsdoc': 0,
    'valid-jsdoc': 0,

    // warn
    'camelcase': 1,
    'indent': ['warn', 2],
    'prefer-destructuring': 1,
    'prefer-promise-reject-errors': 1,

    // error
    'brace-style': ['error', '1tbs'],
    'curly': ['error', 'all'],
    'eol-last': ['error', 'always'],
    'eqeqeq': ['error', 'always'],
    'keyword-spacing': 'error',
    'no-bitwise': 'error',
    'no-extra-semi': 'error',
    'no-trailing-spaces': 'error',
    'no-unused-expressions': ['error', { 'allowShortCircuit': true, 'allowTernary': true }],
    'no-unused-vars': 'error',
    'no-use-before-define': 'error',
    'no-var': 'error',
    'nonblock-statement-body-position': ['error', 'below'],
    'quotes': [2, 'single'],
    'semi': ['error', 'always'],
    'space-before-blocks': 'error',
  }
};
