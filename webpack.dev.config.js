var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: ["babel-polyfill", './src/index.js'],
  output: { path: __dirname, filename: './test/bundle.js' },
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
          plugins: ["transform-object-rest-spread", "transform-react-jsx", "transform-es2015-arrow-functions", "transform-exponentiation-operator"]
        }
      }
    ]
  },
  watch:true,
  watchOptions: {
	poll: true
  }
};
