import type {
  MemberOffer,
  MenuCategoryContent,
  MenuItemContent,
} from '@/lib/types';

import {
  type InstantRecord,
  toBoolean,
  toIsoString,
  toNullableString,
  toNumber,
  toStringOr,
} from './shared';

export function mapMemberOffer(record: InstantRecord): MemberOffer {
  return {
    id: record.id,
    badge_key: toStringOr(record.badge_key),
    code: toNullableString(record.code),
    created_at: toIsoString(record.created_at),
    is_active: toBoolean(record.is_active, true),
    kind: toStringOr(record.kind),
    sort_order: toNumber(record.sort_order),
    subtitle_key: toStringOr(record.subtitle_key),
    terms_key: toNullableString(record.terms_key),
    title_key: toStringOr(record.title_key),
  };
}

export function mapMenuCategory(record: InstantRecord): MenuCategoryContent {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    is_active: toBoolean(record.is_active, true),
    key: toStringOr(record.key),
    label_key: toStringOr(record.label_key),
    sort_order: toNumber(record.sort_order),
  };
}

export function mapMenuItem(record: InstantRecord): MenuItemContent {
  return {
    id: record.id,
    category_key: toStringOr(record.category_key),
    created_at: toIsoString(record.created_at),
    description_key: toStringOr(record.description_key),
    image: toStringOr(record.image),
    is_active: toBoolean(record.is_active, true),
    name_key: toStringOr(record.name_key),
    price: toStringOr(record.price),
    sort_order: toNumber(record.sort_order),
    tag_key: toNullableString(record.tag_key),
  };
}
