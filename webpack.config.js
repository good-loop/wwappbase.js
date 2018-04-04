var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: ['./src/wwappbase.js'],
  output: { path: __dirname, filename: './bin/wwappbase.js' },
  devtool: 'source-map',
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react'],
          plugins: ["transform-object-rest-spread"]
        }
      }
    ]
  },
};
