import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

import {
  type MemberSegment,
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';

export const geofenceRegistrationStatuses = {
  error: 'error',
  idle: 'idle',
  registered: 'registered',
} as const;

export type GeofenceRegistrationStatus =
  (typeof geofenceRegistrationStatuses)[keyof typeof geofenceRegistrationStatuses];

type RestaurantPresenceState = {
  backgroundLocationStatus: OnboardingPermissionStatus;
  geofenceRegistrationStatus: GeofenceRegistrationStatus;
  isInsideRestaurant: boolean;
  lastEntryAt: string | null;
  lastUpsellNotificationAt: string | null;
  memberSegment: MemberSegment | null;
  markRestaurantEntry: (entryAt?: string) => void;
  markRestaurantExit: () => void;
  markUpsellNotificationSent: (sentAt?: string) => void;
  reset: () => void;
  setBackgroundLocationStatus: (status: OnboardingPermissionStatus) => void;
  setGeofenceRegistrationStatus: (status: GeofenceRegistrationStatus) => void;
  setMemberSegment: (memberSegment: MemberSegment | null) => void;
};

const RESTAURANT_PRESENCE_STORAGE_KEY = 'restaurant-presence';
const restaurantPresenceStorage = createMMKV({
  id: 'esco.restaurant-presence',
});

const mmkvStateStorage: StateStorage = {
  getItem: (name: string): string | null =>
    restaurantPresenceStorage.getString(name) ?? null,
  removeItem: (name: string): void => {
    restaurantPresenceStorage.remove(name);
  },
  setItem: (name: string, value: string): void => {
    restaurantPresenceStorage.set(name, value);
  },
};

const initialState = {
  backgroundLocationStatus: onboardingPermissionStatuses.undetermined,
  geofenceRegistrationStatus: geofenceRegistrationStatuses.idle,
  isInsideRestaurant: false,
  lastEntryAt: null,
  lastUpsellNotificationAt: null,
  memberSegment: null,
} as const;

export const useRestaurantPresenceStore = create<RestaurantPresenceState>()(
  persist(
    (set) => ({
      ...initialState,
      setMemberSegment: (memberSegment): void => {
        set({ memberSegment });
      },
      setBackgroundLocationStatus: (backgroundLocationStatus): void => {
        set({ backgroundLocationStatus });
      },
      setGeofenceRegistrationStatus: (geofenceRegistrationStatus): void => {
        set({ geofenceRegistrationStatus });
      },
      markRestaurantEntry: (entryAt = new Date().toISOString()): void => {
        set({
          isInsideRestaurant: true,
          lastEntryAt: entryAt,
        });
      },
      markRestaurantExit: (): void => {
        set({ isInsideRestaurant: false });
      },
      markUpsellNotificationSent: (sentAt = new Date().toISOString()): void => {
        set({ lastUpsellNotificationAt: sentAt });
      },
      reset: (): void => {
        set(initialState);
      },
    }),
    {
      name: RESTAURANT_PRESENCE_STORAGE_KEY,
      partialize: (state) => ({
        backgroundLocationStatus: state.backgroundLocationStatus,
        geofenceRegistrationStatus: state.geofenceRegistrationStatus,
        isInsideRestaurant: state.isInsideRestaurant,
        lastEntryAt: state.lastEntryAt,
        lastUpsellNotificationAt: state.lastUpsellNotificationAt,
        memberSegment: state.memberSegment,
      }),
      storage: createJSONStorage(() => mmkvStateStorage),
      version: 1,
    }
  )
);
