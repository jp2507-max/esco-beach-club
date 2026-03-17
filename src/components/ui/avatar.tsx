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
  const [imgSource, setImgSource] = useState<number | { uri: string }>(
    uri ? { uri } : config.defaultAvatarUri
  );

  // Synchronize internal source if the uri prop changes from the outside
  useEffect(() => {
    setImgSource(uri ? { uri } : config.defaultAvatarUri);
  }, [uri]);

  return (
    <Image
      className={className}
      source={imgSource}
      onError={() => {
        // Switch to the local fallback asset on any load error
        setImgSource(config.defaultAvatarUri);
      }}
      cachePolicy="memory-disk"
      transition={180}
      recyclingKey={recyclingKey}
    />
  );
}
