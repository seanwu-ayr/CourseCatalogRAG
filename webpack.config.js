const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production', // Set to 'production' for production build, or 'development' for development build
  entry: './frontend/index.tsx', // Your entry file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js', // Output bundle file
    clean: true, // Cleans the output directory before each build
    library: 'CustomChatbot', // Change this to something unique
    libraryTarget: 'umd',
    globalObject: 'this'
    // library: 'ChatbotWindow', // Expose the library globally under this name
    
    // libraryTarget: 'window',  // Attach it to the global `window` object
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
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'], // Ensure style-loader and css-loader are used
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
    compress: true,
    port: 8080, // Specifies the port
    open: true, // Automatically opens the browser
  },
  optimization: {
    minimize: true,
    concatenateModules: true, // Explicitly enabling module concatenation
    // splitChunks: {
    //   cacheGroups: {
    //     vendor: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: 'vendor',
    //       chunks: 'all',
    //       enforce: true,
    //     },
    //   },
    // },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
},
externals: {
  react: 'React',
  'react-dom': 'ReactDOM'
}
  // externals: [nodeExternals()]
};
