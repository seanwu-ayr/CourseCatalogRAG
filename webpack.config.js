const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production', // Set to 'production' for production build, or 'development' for development build
  entry: './frontend/app/page.tsx', // Your entry file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js', // Output bundle file
    clean: true, // Cleans the output directory before each build
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'frontend'), // Alias for easier imports
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'], // Add @babel/preset-typescript
            },
          },
        ],
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './frontend/index.html', // Ensure this path is correct and the file exists
    }),
  ],
  devtool: 'source-map', // Provides source maps for debugging
  devServer: {
    static: path.resolve(__dirname, 'dist'), // Ensure it serves the correct directory
    hot: true,
    port: 8080, // Specifies the port
    open: true, // Automatically opens the browser
  },
};
