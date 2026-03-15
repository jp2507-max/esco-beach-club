export const appLanguages = ['en', 'vi', 'ko'] as const;

export type AppLanguage = (typeof appLanguages)[number];

export const namespaces = ['common', 'auth', 'events', 'home', 'profile', 'perks', 'booking'] as const;

export type AppNamespace = (typeof namespaces)[number];

export const defaultLanguage: AppLanguage = 'en';
export const defaultNamespace: AppNamespace = 'common';
