const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// If the platform is 'web', we alias react-native-maps to a dummy component
// to prevent the "codegenNativeComponent" crash.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
