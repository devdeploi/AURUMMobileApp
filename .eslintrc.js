const path = require('path');

module.exports = {
  root: true,
  extends: '@react-native',
  parserOptions: {
    babelOptions: {
      configFile: path.resolve(__dirname, 'babel.config.js'),
    },
  },
};
