declare module '*.css';

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_FACEBOOK_URL?: string;
    EXPO_PUBLIC_INSTAGRAM_URL?: string;
    EXPO_PUBLIC_INSTANT_APP_ID?: string;
  }
}
