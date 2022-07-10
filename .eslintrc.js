module.exports = {
   env: {
      browser: true,
      es2021: true,
   },
   extends: [
      //        "eslint:recommended",
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
   plugins: ['vue', '@typescript-eslint'],
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
      //    [ 'error', { ignoreStatic: true, }, ],
   },
   ignorePatterns: ['**/dist/**', '**/docs/**', '**/.eslintrc.js'],
};
