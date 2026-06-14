# Luxe Market Color System

This document describes the centralized color system for the Luxe Market project.

## Tailwind Utilities (Preferred)

All brand colors are defined in `src/app/globals.css` under the `@theme` directive and available as Tailwind utilities:

### Brand Colors

| Color | Tailwind Class | Hex Value | Usage |
|-------|---------------|-----------|-------|
| Gold (Primary) | `bg-brand-gold` / `text-brand-gold` | `#C9A84C` | Primary brand accent, CTAs, highlights |
| Dark Background | `bg-brand-dark` | `#0a0a0a` | Main background |
| Dark Secondary | `bg-brand-dark-secondary` | `#0f0f1a` | Secondary backgrounds, cards |
| Dark Tertiary | `bg-brand-dark-tertiary` | `#1a1a2e` | Tertiary backgrounds, hover states |
| Blue | `bg-brand-blue` | `#1B3A5C` | Footer, secondary accents |
| Blue Light | `bg-brand-blue-light` | `#5B9BD5` | Buttons, badges, interactive elements |
| Text Light | `text-brand-text-light` | `#F5F0E8` | Primary text color |
| Text Muted | `text-brand-text-muted` | `#6B8FAF` | Muted text, labels |
| Text Secondary | `text-brand-text-secondary` | `#A8BDD1` | Secondary text |
| Text Gold Light | `text-brand-text-gold-light` | `#E8C97A` | Gold-tinted text |
| Text Gold Muted | `text-brand-text-gold-muted` | `#B5A98A` | Muted gold text |
| Background Light | `bg-brand-bg-light` | `#FAF8F4` | Light backgrounds |
| Background Secondary | `bg-brand-bg-secondary` | `#F5F3EF` | Secondary light backgrounds |
| Red | `bg-brand-red` | `#DC2626` | Flash sale badges, errors |

### Examples

```tsx
// ✅ GOOD - Use Tailwind utilities
<div className="bg-brand-dark text-brand-text-light">
  <h1 className="text-brand-gold">Heading</h1>
  <p className="text-brand-text-muted">Description</p>
  <button className="bg-brand-blue-light text-white">Button</button>
</div>

// ❌ BAD - Don't use inline styles for static colors
<div style={{ backgroundColor: '#0a0a0a', color: '#F5F0E8' }}>
  <h1 style={{ color: '#C9A84C' }}>Heading</h1>
</div>
```

## JavaScript Constants (For Dynamic Styles Only)

When you need hex values in JavaScript (e.g., for dynamic color swatches from API data), import from `src/lib/constants/colors.ts`:

```tsx
import { BRAND_COLORS } from '@/lib/constants/colors';

// ✅ GOOD - Dynamic runtime value
<div style={{ backgroundColor: variant.hex_color }} />

// ✅ GOOD - Pass to third-party library that expects hex
<Chart colors={[BRAND_COLORS.gold, BRAND_COLORS.blue]} />

// ❌ BAD - Static styling (use Tailwind instead)
<div style={{ backgroundColor: BRAND_COLORS.darkBg }} />
```

## Migration Guide

### Before (Inline Styles)
```tsx
<div style={{ backgroundColor: '#0a0a0a' }}>
  <span style={{ color: '#C9A84C' }}>Text</span>
</div>
```

### After (Tailwind Utilities)
```tsx
<div className="bg-brand-dark">
  <span className="text-brand-gold">Text</span>
</div>
```

## Benefits

1. **Single source of truth** - Change colors once in `globals.css`, affects all usages
2. **Better performance** - Tailwind purges unused utilities; inline styles bloat bundle
3. **Type safety** - Typo in class name → build error; typo in hex → silent bug
4. **Responsive & state support** - `hover:bg-brand-gold`, `md:text-brand-blue` work seamlessly
5. **Smaller bundle** - Reusable CSS classes vs. 100+ unique inline style objects

## Adding New Colors

1. Add to `src/app/globals.css` under `@theme inline`:
```css
--color-brand-newcolor: #123456;
```

2. Add to `src/lib/constants/colors.ts` (optional, for JS use):
```ts
export const BRAND_COLORS = {
  // ...
  newColor: '#123456',
} as const;
```

3. Document in this file

4. Use as `bg-brand-newcolor` or `text-brand-newcolor`
