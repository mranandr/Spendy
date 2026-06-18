/** @param {{ config: import('expo/config').ExpoConfig }} ctx */
export default ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5050',
  },
  android: {
    ...config.android,
    usesCleartextTraffic: true,
  },
});
