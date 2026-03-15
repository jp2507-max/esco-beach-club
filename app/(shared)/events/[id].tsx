import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Crown,
  Star,
  UserCheck,
  PartyPopper,
  Share2,
  Heart,
} from 'lucide-react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useEventById } from '@/providers/DataProvider';
import { rmTiming } from '@/src/lib/animations/motion';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';
import { ScrollView, Text, Pressable, View } from '@/src/tw';

type PriceTier = {
  highlight: boolean;
  icon: React.ElementType;
  labelKey: string;
  perkKeys: string[];
  price: string;
};

export default function EventDetailsScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fade = useSharedValue(0);
  const slide = useSharedValue(40);
  const headerOpacity = useSharedValue(0);

  const { t } = useTranslation('events');
  const foundEvent = useEventById(id);

  if (!foundEvent) {
    console.warn(`[EventDetails] Warning: using fallback event data for missing event id: ${id}`);
  }

  const event = foundEvent ?? {
    id: id ?? '',
    title: 'Event',
    description: null,
    time: '',
    date: '',
    day_label: null,
    location: '',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
    attendees: 0,
    price: '$0',
    badge: null,
    badge_color: null,
    featured: false,
    category: null,
    vip_price: null,
    member_price: null,
    guest_price: null,
    created_at: '',
  };

  useEffect(() => {
    headerOpacity.set(withTiming(1, rmTiming(400)));
    fade.set(withTiming(1, rmTiming(500)));
    slide.set(withTiming(0, rmTiming(500)));
    return () => {
      cancelAnimation(headerOpacity);
      cancelAnimation(fade);
      cancelAnimation(slide);
    };
  }, [fade, headerOpacity, id, slide]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.get(),
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ translateY: slide.get() }],
  }));

  const contactForPricing = t('priceTiers.contactForPricing');
  const priceTiers: PriceTier[] = [
    {
      labelKey: 'priceTiers.vip.label',
      price: event.vip_price ?? contactForPricing,
      highlight: true,
      icon: Crown,
      perkKeys: ['priceTiers.vip.perk1', 'priceTiers.vip.perk2', 'priceTiers.vip.perk3'],
    },
    {
      labelKey: 'priceTiers.member.label',
      price: event.member_price ?? event.price ?? contactForPricing,
      highlight: false,
      icon: Star,
      perkKeys: ['priceTiers.member.perk1', 'priceTiers.member.perk2'],
    },
    {
      labelKey: 'priceTiers.guest.label',
      price: event.guest_price ?? contactForPricing,
      highlight: false,
      icon: UserCheck,
      perkKeys: ['priceTiers.guest.perk1', 'priceTiers.guest.perk2'],
    },
  ];

  function handleBook(): void {
    router.push({ pathname: '/(modals)/booking', params: { eventTitle: event.title } });
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Animated.View className="relative h-80" style={heroStyle}>
        <Image
          className="h-full w-full"
          source={{ uri: event.image }}
          cachePolicy="memory-disk"
          contentFit="cover"
          transition={180}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.4, 1]}
          style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
        />

        <View
          className="absolute left-4 right-4 z-10 flex-row items-center justify-between"
          style={{ top: insets.top + 8 }}
        >
          <Pressable
            className="size-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            testID="back-btn"
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View className="flex-row">
            <Pressable
              className="mr-2.5 size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            >
              <Share2 size={18} color="#fff" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            >
              <Heart size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {event.badge ? (
          <View className="absolute right-4 top-[100px] rounded-[10px] bg-warning px-[14px] py-1.5">
            <Text className="text-[10px] font-extrabold tracking-[0.5px] text-white">
              {event.badge}
            </Text>
          </View>
        ) : null}

        <View className="absolute bottom-0 left-0 right-0 p-5">
          <Text className="mb-2 text-[28px] font-extrabold text-white">{event.title}</Text>
          <View className="flex-row items-center">
            <View className="flex-row items-center">
              <Calendar size={14} color="rgba(255,255,255,0.85)" />
              <Text className="ml-[5px] text-[13px] font-medium text-white/90">{event.date}</Text>
            </View>
            <View
              className="mx-[10px] size-1 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            />
            <View className="flex-row items-center">
              <Clock size={14} color="rgba(255,255,255,0.85)" />
              <Text className="ml-[5px] text-[13px] font-medium text-white/90">{event.time}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1 rounded-t-[20px] bg-background dark:bg-dark-bg"
        contentContainerClassName="px-5 pt-6"
        showsVerticalScrollIndicator={false}
        style={{ marginTop: -16 }}
      >
        <Animated.View style={contentStyle}>
          <View className="mb-6 flex-row">
            <View className="mr-2.5 flex-row items-center rounded-xl border border-border bg-white px-3.5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card">
              <MapPin color={Colors.secondary} size={16} />
              <Text className="ml-1.5 text-[13px] font-semibold text-text dark:text-text-primary-dark">
                {event.location}
              </Text>
            </View>
            <View className="flex-row items-center rounded-xl border border-border bg-white px-3.5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card">
              <Users color={Colors.primary} size={16} />
              <Text className="ml-1.5 text-[13px] font-semibold text-text dark:text-text-primary-dark">
                {t('attendeesCount', { count: event.attendees })}
              </Text>
            </View>
          </View>

          <View className="mb-7">
            <Text className="mb-2 text-xl font-extrabold text-text dark:text-text-primary-dark">
              {t('aboutThisEvent')}
            </Text>
            <Text className="text-sm leading-[22px] text-text-secondary dark:text-text-secondary-dark">
              {t('aboutDescription1', { location: event.location })}{' '}
              {event.description || t('aboutDescription2')}{' '}
              {t('aboutDescription3')}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-xl font-extrabold text-text dark:text-text-primary-dark">
              {t('chooseExperience')}
            </Text>
            <Text className="mb-4 text-[13px] text-text-secondary dark:text-text-secondary-dark">
              {t('selectTier')}
            </Text>

            {priceTiers.map((tier) => (
              <View
                key={tier.labelKey}
                className="mb-3 rounded-[18px] border bg-white p-[18px] dark:bg-dark-bg-card"
                style={{
                  backgroundColor: tier.highlight ? '#FFF5F8' : Colors.surface,
                  borderColor: tier.highlight ? Colors.primary : Colors.border,
                  borderWidth: tier.highlight ? 2 : 1,
                }}
              >
                {tier.highlight ? (
                  <View className="absolute right-4 top-[-10px] rounded-lg bg-primary px-2.5 py-1">
                    <Text className="text-[9px] font-extrabold tracking-[1px] text-white">
                      {t('recommended')}
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 size-11 items-center justify-center rounded-[14px]"
                      style={{
                        backgroundColor: tier.highlight
                          ? Colors.primary
                          : `${Colors.tealLight}40`,
                      }}
                    >
                      <tier.icon size={20} color={tier.highlight ? '#fff' : Colors.secondary} />
                    </View>
                    <View>
                      <Text
                        className="text-base font-bold"
                        style={{ color: tier.highlight ? Colors.primary : Colors.text }}
                      >
                        {t(tier.labelKey as any)}
                      </Text>
                      <Text className="mt-0.5 text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
                        {t('perPerson')}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-[28px] font-extrabold"
                    style={{ color: tier.highlight ? Colors.primary : Colors.text }}
                  >
                    {tier.price}
                  </Text>
                </View>

                <View className="my-[14px] h-px bg-border dark:bg-dark-border" />

                {tier.perkKeys.map((key) => (
                  <View key={key} className="mb-2 flex-row items-center">
                    <View
                      className="mr-2.5 size-1.5 rounded-full"
                      style={{ backgroundColor: tier.highlight ? Colors.primary : Colors.secondary }}
                    />
                    <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
                      {t(key as any)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Pressable
            className="flex-row items-center rounded-2xl border px-4 py-4"
            onPress={() => router.push('/private-event')}
            style={{
              backgroundColor: `${Colors.tealLight}25`,
              borderColor: `${Colors.secondary}20`,
            }}
            testID="private-party-link"
          >
            <View
              className="mr-3.5 size-11 items-center justify-center rounded-[14px] border bg-white"
              style={{ borderColor: `${Colors.secondary}20` }}
            >
              <PartyPopper color={Colors.secondary} size={20} />
            </View>
            <View className="flex-1">
              <Text className="mb-0.5 text-[15px] font-bold text-text dark:text-text-primary-dark">
                {t('privatePartyTitle')}
              </Text>
              <Text className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
                {t('privatePartyDescription')}
              </Text>
            </View>
          </Pressable>

          <View className="h-[120px]" />
        </Animated.View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-border bg-white px-5 pt-3.5 dark:border-dark-border dark:bg-dark-bg-card"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View>
          <Text className="text-xs font-medium text-text-muted dark:text-text-muted-dark">
            {t('from')}
          </Text>
          <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
            {event.price}
          </Text>
        </View>
        <Pressable
          className="rounded-2xl bg-primary px-9 py-4"
          onPress={handleBook}
          testID="book-now-btn"
        >
          <Text className="text-base font-bold text-white">{t('bookNow')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
