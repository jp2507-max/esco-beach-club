const appJson = require('./app.json');

module.exports = () => {
  const baseConfig = appJson.expo;
  const googleIosUrlScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();
  const plugins = baseConfig.plugins.map((plugin) => {
    if (
      Array.isArray(plugin) ||
      plugin !== '@react-native-google-signin/google-signin'
    ) {
      return plugin;
    }

    if (!googleIosUrlScheme) {
      return plugin;
    }

    return [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: googleIosUrlScheme,
      },
    ];
  });

  return {
    ...baseConfig,
    ios: {
      ...baseConfig.ios,
      usesAppleSignIn: true,
    },
    plugins,
  };
};
