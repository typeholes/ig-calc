module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
//        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:vue/vue3-strongly-recommended",
        "prettier"
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "parser": "@typescript-eslint/parser",
        "sourceType": "module"
    },
    "plugins": [
        "vue",
        "@typescript-eslint"
    ],
    "rules": {
//        "no-explicit-any": "off",
//        "@typescript-eslint/ban-types": [ "error", { types: { string: 'temp error until VarNames and MilestoneNames are used'}}]
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" , "varsIgnorePattern": "^_" } ]
    }
}
