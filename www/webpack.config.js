const path = require('path');

module.exports = {
  entry: './src/index.tsx', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'build'), // Output directory
    filename: 'bundle.js', // Output bundle file name
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'], // File extensions to resolve
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Match TypeScript files
        use: 'ts-loader', // Use ts-loader for TypeScript files
        exclude: /node_modules/, // Exclude the node_modules directory
      },
      {
        test: /\.css$/, // Match CSS files
        use: ['style-loader', 'css-loader'], // Use style and CSS loaders for CSS files
      },
    ],
  },
};
