const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './chatbot-window.js', // The entry point is the JS file where you define your Web Component
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js', // The bundled JS file will be injected into the HTML
  },
  mode: 'development', // Use 'production' for production-ready builds
  module: {
    rules: [
      {
        test: /\.js$/, // Apply Babel to all JS files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'], // Ensure style-loader and css-loader are used
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Your HTML file
      inject: 'body', // Injects the bundled script at the bottom of the body
    })
    // new MiniCssExtractPlugin({
    //   filename: 'tailwind.css', // Output filename
    // }),
  ],
  devServer: {
    static: './dist',
    port: 9000,
    open: true,
  },
  devtool: false
};
