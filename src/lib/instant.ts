import { init } from '@instantdb/react-native';
import Store from '@instantdb/react-native-mmkv';
import schema from '@/instant.schema';

const appId = process.env.EXPO_PUBLIC_INSTANT_APP_ID;

if (!appId) {
  throw new Error(
    'Missing EXPO_PUBLIC_INSTANT_APP_ID environment variable. ' +
    'Please add it to your .env file or Expo configuration.'
  );
}

export const db = init({
  appId,
  schema,
  Store,
});
