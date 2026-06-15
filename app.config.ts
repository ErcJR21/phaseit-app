import { ExpoConfig, ConfigContext } from 'expo/config';

// Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env, or replace the placeholder below.
const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PhaseEat',
  slug: 'PhaseEatApp',
  scheme: 'phaseitapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.ericjr21.phaseit',
    config: {
      googleMapsApiKey,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'PhaseEat uses your location to show budget-friendly food spots near campus.',
    },
  },
  android: {
    package: 'com.ericjr21.phaseit',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow PhaseEat to access your camera to photograph meals.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow PhaseEat to access your location to find food spots near campus.',
      },
    ],
    [
      'react-native-maps',
      {
        googleMapsApiKey,
      },
    ],
  ],
});
