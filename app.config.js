module.exports = ({ config }) => {
  const googleIosUrlScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();
  const plugins = (config.plugins ?? []).map((plugin) => {
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
    ...config,
    ios: {
      ...config.ios,
      usesAppleSignIn: true,
    },
    plugins,
  };
};
