const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add the resolver configuration
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;