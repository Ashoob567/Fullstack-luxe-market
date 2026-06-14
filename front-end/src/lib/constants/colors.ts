/**
 * Brand color constants for Luxe Market
 * Use Tailwind utilities (bg-brand-gold, text-brand-gold) instead of these constants.
 * Keep this only for dynamic styles where CSS variables can't reach.
 */
export const BRAND_COLORS = {
  gold: '#C9A84C',
  darkBg: '#0a0a0a',
  darkSecondary: '#0f0f1a',
  darkTertiary: '#1a1a2e',
  blue: '#1B3A5C',
  blueLight: '#5B9BD5',
  accentBlue: '#5B9BD5',
  textLight: '#F5F0E8',
  textMuted: '#6B8FAF',
  textSecondary: '#A8BDD1',
  textGoldMuted: '#B5A98A',
  textGoldLight: '#E8C97A',
  bgLight: '#FAF8F4',
  bgSecondary: '#F5F3EF',
  bgSkeleton1: '#EAE6DF',
  bgSkeleton2: '#DDD9D0',
  red: '#DC2626',
} as const;
