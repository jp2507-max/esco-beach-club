declare module '*.css';

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_INSTANT_APP_ID?: string;
  }
}
