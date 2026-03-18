import React, { useEffect, useState } from 'react';

import { config } from '@/src/lib/config';
import { Image } from '@/src/tw/image';

interface AvatarProps {
  /** The remote URI of the avatar image. If null or undefined, the local fallback is used. */
  uri?: string | null;
  /** Tailwind classes for styling the image. */
  className?: string;
  /** Optional key for expo-image recycling optimization. */
  recyclingKey?: string;
}

/**
 * A robust Avatar component that handles remote image loading and automatically
 * falls back to a bundled local asset if the remote URI is missing or fails to load.
 */
export function Avatar({ uri, className, recyclingKey }: AvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    setLoadFailed(false);
  }, [uri]);

  const imgSource = uri && !loadFailed ? { uri } : config.defaultAvatarUri;

  return (
    <Image
      className={className}
      source={imgSource}
      onError={() => {
        setLoadFailed(true);
      }}
      cachePolicy="memory-disk"
      transition={180}
      recyclingKey={recyclingKey}
    />
  );
}
