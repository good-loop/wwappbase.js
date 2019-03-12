var webpack = require('webpack');
var fs = require('fs');

// Compile object containing all .js files in res folder
const entries = fs.readdirSync('./res')
                .filter( file => file.substr(file.length - 3) === '.js')
                .reduce( (entriesObj, file) => {
                    entriesObj[file] = './res/' + file;
                    return entriesObj;
                }, {});

module.exports = {
  entry: entries,
  target: 'node',
  output: { 
      filename: '[name]', 
      path: __dirname + '/babeled-res' 
    },
  devtool: 'source-map',
  resolve: {
    // .json to fix this error: https://github.com/broofa/node-mime/issues/172
    extensions: ['*', '.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
                ['@babel/preset-env', {'targets': { 'node': 6 } }],
                '@babel/preset-react'
            ],
            plugins: [
                "@babel/plugin-transform-modules-commonjs",
                "@babel/plugin-transform-runtime",
                "@babel/plugin-syntax-dynamic-import",
                "@babel/plugin-proposal-object-rest-spread",
                "@babel/plugin-transform-async-to-generator"
            ]
          }
        }
      }
    ]
  }
};
