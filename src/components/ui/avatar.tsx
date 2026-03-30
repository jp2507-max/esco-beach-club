import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { View } from '@/src/tw';
import { Image } from '@/src/tw/image';

const af = Colors.avatarFallback;

interface AvatarProps {
  /** The remote URI of the avatar image. If null or undefined, the local fallback is used. */
  uri?: string | null;
  /** Tailwind classes for styling the image. */
  className?: string;
  /** Optional key for expo-image recycling optimization. */
  recyclingKey?: string;
}

function AvatarFallback({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <View
      className={cn('overflow-hidden', className)}
      style={{ backgroundColor: af.base }}
    >
      <LinearGradient
        colors={[...af.gradient]}
        end={{ x: 1, y: 0.9 }}
        start={{ x: 0, y: 0 }}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />
      <View
        className="absolute rounded-full"
        style={{
          backgroundColor: af.highlight,
          height: '52%',
          right: '-10%',
          top: '-8%',
          width: '52%',
        }}
      />
      <View
        className="absolute rounded-full"
        style={{
          backgroundColor: af.discTeal,
          height: '38%',
          left: '-12%',
          top: '20%',
          width: '38%',
        }}
      />
      <View
        className="absolute"
        style={{
          backgroundColor: af.wave,
          bottom: 0,
          height: '22%',
          left: 0,
          right: 0,
        }}
      />

      <View
        className="absolute rounded-t-full"
        style={{
          backgroundColor: af.chin,
          bottom: '-2%',
          height: '34%',
          left: '17%',
          width: '66%',
        }}
      />
      <View
        className="absolute rounded-full"
        style={{
          backgroundColor: af.cheek,
          height: '19%',
          left: '45%',
          top: '53%',
          width: '10%',
        }}
      />
      <View
        className="absolute rounded-full"
        style={{
          backgroundColor: af.nose,
          height: '47%',
          left: '19%',
          top: '15%',
          width: '62%',
        }}
      />
      <View
        className="absolute rounded-full"
        style={{
          backgroundColor: af.faceLight,
          height: '39%',
          left: '25%',
          top: '21%',
          width: '50%',
        }}
      />
      <View
        className="absolute rounded-full"
        style={{
          backgroundColor: af.faceLight,
          height: '11%',
          left: '18%',
          top: '48%',
          width: '18%',
        }}
      />
      <View
        className="absolute rounded-full"
        style={{
          backgroundColor: af.faceLight,
          height: '11%',
          right: '18%',
          top: '48%',
          width: '18%',
        }}
      />

      <View
        className="absolute rounded-[10px]"
        style={{
          backgroundColor: af.feature,
          height: '11%',
          left: '28%',
          top: '34%',
          width: '18%',
        }}
      />
      <View
        className="absolute rounded-[10px]"
        style={{
          backgroundColor: af.feature,
          height: '11%',
          right: '28%',
          top: '34%',
          width: '18%',
        }}
      />
      <View
        className="absolute"
        style={{
          backgroundColor: af.feature,
          height: '3%',
          left: '46%',
          top: '38%',
          width: '8%',
        }}
      />
    </View>
  );
}

/**
 * A robust Avatar component that handles remote image loading and automatically
 * falls back to a bundled poster-style placeholder if the remote URI is missing
 * or fails to load.
 */
export function Avatar({ uri, className, recyclingKey }: AvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    setLoadFailed(false);
  }, [uri]);

  if (!uri || loadFailed) {
    return <AvatarFallback className={className} />;
  }

  return (
    <Image
      className={className}
      source={{ uri }}
      onError={() => {
        setLoadFailed(true);
      }}
      cachePolicy="memory-disk"
      transition={180}
      recyclingKey={recyclingKey}
    />
  );
}
