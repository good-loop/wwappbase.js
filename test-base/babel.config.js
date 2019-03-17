// https://github.com/facebook/jest/issues/6229

const config = {
  presets: [
    ['@babel/preset-env'],
    '@babel/preset-react'
  ],
  plugins: [
    "@babel/plugin-transform-modules-commonjs",
    "@babel/plugin-transform-runtime",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-transform-async-to-generator"
  ]
};

module.exports = config;
