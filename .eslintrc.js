module.exports = {
   env: {
      browser: true,
      es2021: true,
   },
   plugins: ['vue', '@typescript-eslint', 'import'],
   extends: [
      //        "eslint:recommended",
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:@typescript-eslint/recommended',
      'plugin:vue/vue3-strongly-recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'prettier',
   ],
   parser: 'vue-eslint-parser',
   parserOptions: {
      ecmaVersion: 'latest',
      parser: '@typescript-eslint/parser',
      sourceType: 'module',
      tsconfigRootDir: __dirname,
      extraFileExtensions: ['.vue'],
      project: ['./tsconfig.json'],
   },
   rules: {
      //        "no-explicit-any": "off",
      //        "@typescript-eslint/ban-types": [ "error", { types: { string: 'temp error until VarNames and MilestoneNames are used'}}]
      '@typescript-eslint/no-unused-vars': [
         'error',
         { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      //      '@typescript-eslint/no-unsafe-assignment': 0, // TODO
      '@typescript-eslint/no-non-null-assertion': 0, // TODO - maybe
      '@typescript-eslint/restrict-plus-operands': 0, // TODO - maybe
      '@typescript-eslint/unbound-method': 0,
      'vue/multi-word-component-names': 0, // making them multi-word at import site
      //    [ 'error', { ignoreStatic: true, }, ],
   },
   ignorePatterns: ['**/dist/**', '**/docs/**', '**/.eslintrc.js'],
   settings: {
      'import/parsers': { '@typescript-eslint/parser': ['.ts']},
      'import/resolver': {
         typescript: {},
      },
   },
};
