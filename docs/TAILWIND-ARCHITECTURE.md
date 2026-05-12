# Tailwind v4 Architecture in TVPlus MFE
# =========================================
# Complete guide for how Tailwind CSS v4 works across the monorepo,
# including the CSS pipeline, design tokens, cascade layers, MFE CSS
# injection, and every known gotcha.

---

## Overview

This project uses **Tailwind CSS v4** with the `@tailwindcss/vite` plugin. Tailwind v4 is a complete rewrite from v3 with fundamental differences in how CSS is generated, configured, and cascaded.

Key differences from Tailwind v3:
- **CSS-first config**: No `tailwind.config.ts` file. Configuration lives in CSS using `@theme {}` blocks.
- **Cascade layers**: ALL utilities live inside `@layer utilities {}`. This has major implications for specificity.
- **`@import "tailwindcss"`**: Replaces the `@tailwind base/components/utilities` directives.
- **Logical properties**: `px-4` generates `padding-inline: 1rem` (not `padding-left/right`).
- **No purging needed**: All utilities are available by default; unused ones are tree-shaken at build.

---

## The CSS Pipeline

### Step 1: Each app's local `src/index.css`

Every app has a LOCAL CSS entry file that serves as the `@tailwindcss/vite` scan root:

```css
/* apps/sms/src/index.css (same pattern for all apps) */
@import "tailwindcss";          /* ← This is processed by @tailwindcss/vite */
@import "@repo/tailwind-config"; /* ← Signal & Flame design tokens */
```

**Why this file must exist in the app's own src/**: `@tailwindcss/vite` scans source files to generate CSS, but it uses the CSS file's location to determine the scan root. If `@import "tailwindcss"` is inside `node_modules` (e.g., via `@repo/shared-ui`), the plugin won't scan the app's source files for class names — resulting in only ~50 CSS rules instead of the full Tailwind output.

### Step 2: main.tsx imports in order

```ts
// ✅ EXACT ORDER — changing this breaks things
import './index.css';                // 1. Tailwind entry (local file)
import '@repo/shared-ui/styles.css'; // 2. shadcn component token variables
import '@repo/ui/styles.css';        // 3. @repo/ui pre-built component styles (remotes only)
```

### Step 3: `@tailwindcss/vite` processes the local CSS

When Vite builds the app, `@tailwindcss/vite`:
1. Finds `@import "tailwindcss"` in `src/index.css`
2. Scans all `*.tsx`, `*.ts`, `*.html` files in the app for class names
3. Generates utility CSS for every found class
4. Merges with `@repo/tailwind-config` design tokens
5. Outputs as a single CSS file (build) or HMR injection (dev)

### Step 4: `@repo/shared-ui/styles.css` adds shadcn variables

```css
/* packages/shared-ui/src/styles.css — no @import "tailwindcss" here */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    /* ...all shadcn New York Design System variables... */
  }
}
```

This file only provides the shadcn CSS variables used by `@repo/ui` components. It does NOT re-trigger Tailwind generation.

### Step 5: `@repo/ui/styles.css` (remote apps only)

```css
/* packages/ui/dist/index.css — pre-built, 3728 lines */
@layer properties;
@layer theme, base, components, utilities;
@layer theme { :root, :host { --font-sans: 'Inter', ...; } }
@layer base { *, ::before, ::after { box-sizing: border-box; ... } }
@layer utilities { .px-4 { padding-inline: 1rem } ... }
```

This is the pre-built CSS from `@repo/ui`. It contains all Tailwind utilities needed by the 48 components (Card, DataTable, Badge, etc.). Imported LAST so it doesn't conflict with app-generated utilities.

---

## Cascade Layers — The Most Important Concept

Tailwind v4 uses CSS Cascade Layers (`@layer`) to manage specificity:

```
layer order (lower = lower priority):
  @layer properties   ← CSS custom property fallbacks for older browsers
  @layer theme        ← Design tokens (colors, fonts, spacing)
  @layer base         ← CSS reset / normalize
  @layer components   ← Component-level styles (rarely used in Tailwind v4)
  @layer utilities    ← ALL Tailwind utility classes (.px-4, .flex, .gap-2, etc.)

outside any @layer = UNLAYERED = highest priority
```

### The Critical Gotcha: Unlayered CSS Beats Layered Utilities

```html
<!-- ❌ FATAL — this unlayered CSS overrides ALL Tailwind spacing utilities -->
<style>
  * { padding: 0; margin: 0; }  <!-- unlayered: higher priority than @layer utilities -->
</style>
```

When this exists:
- `.px-10 { padding-inline: 2.5rem }` is in `@layer utilities` ← layered
- `* { padding: 0 }` is unlayered ← WINS
- Result: ALL padding/margin classes silently compute to `0px`

**Discovery method**: `getComputedStyle(header).paddingLeft` returned `0px` even though:
- `.px-10` rule existed in the CSS file ✅
- The header element had `px-10` class ✅  
- The CSS rule value was `2.5rem` ✅

The Playwright test `assert_padding_working()` catches this automatically.

**Fix**: Remove the inline `<style>` reset. Tailwind's own `@layer base { *, ... { box-sizing: border-box; ... } }` handles this correctly WITHIN the layer system.

---

## The Signal & Flame Design System

Located at `packages/tailwind-config/shared-styles.css`. This is the TVPlus brand design system.

### Color Scales

```css
/* Signal Blue — brand primary, trust, action */
--signal-50:  #EEF1FC   /* Very light tint */
--signal-100: #D4DAFF   /* Light */
--signal-200: #AAB5F7
--signal-300: #7F90F0
--signal-400: #546BE8   /* QCA purple accent */
--signal-500: #1428A0   /* PRIMARY — SMS, Shell */
--signal-600: #102288
--signal-700: #0D1B70   /* CMS dark navy */
--signal-800: #091455   /* Shell sidebar dark */
--signal-900: #060D3A
--signal-950: #03071F

/* Flame Orange — energy, urgency, MAM */
--flame-50:  #FFF1ED
--flame-100: #FFD9CC
...
--flame-500: #F4511E   /* PRIMARY — MAM, destructive */
...
--flame-800: #7C2006   /* MAM sidebar dark */

/* Neutral — backgrounds, text, borders */
--neutral-50:  #F7F8FC   /* Page bg */
--neutral-100: #ECEEF5   /* Card borders */
--neutral-200: #D6D9E8   /* Input borders */
--neutral-400: #8C94B0   /* Placeholder text */
--neutral-500: #636B8A   /* Muted text */
--neutral-700: #343A56   /* Secondary text */
--neutral-900: #0D1020   /* Primary text */
```

### Status Colors

```css
--success-solid:   #16A34A   /* Green */
--warning-solid:   #D97706   /* Amber */
--error-solid:     #DC2626   /* Red */
--info-solid:      #2563EB   /* Blue */
```

### App Shell Layout Tokens

```css
--header-height: 3.5rem    /* 56px */
--sidebar-width: 220px     /* All remote sidebars */
--content-padding: 1.75rem /* p-7 on main content areas */
```

### Using Design Tokens in Code

```tsx
// In Tailwind classes — use arbitrary values for named tokens
<div className="bg-[--signal-500]">     // by CSS var reference
<div className="bg-[#1428A0]">          // by hex (less preferred)
<div className="border-t-[3px]" style={{ borderTopColor: appColor }}>  // dynamic colors

// CSS custom property bridge for dynamic colors
<div
  style={{ '--app-color': meta.color } as React.CSSProperties}
  className="border-t-[3px] border-t-[var(--app-color)]"
/>
```

---

## CSS in MFE Remotes: The Injection Problem

When the shell loads a remote app via `import(url)`, it loads a JavaScript module.
There is **no HTML document** to reference a `<link rel="stylesheet">`. The remote's
`dist/assets/style.css` would never load without explicit injection.

### Solution: `vite-plugin-css-injected-by-js`

Added to all remote vite configs (sms, qca, cms, mam):

```ts
// apps/*/vite.config.ts
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

plugins: [
  cssInjectedByJsPlugin(), // MUST be first — inlines CSS before federation bundles
  react(),
  tailwindcss(),
  federation({ ... }),
]
```

**What it does**: Takes the extracted `dist/assets/style.css` (121KB) and converts it
to a JavaScript statement that creates a `<style>` tag and inserts it into `document.head`.
The style is injected the moment the JS module is imported.

**Evidence**: remoteEntry.js grows from `166 bytes` (just ESM re-exports) to `~128KB`
(CSS inlined as a JavaScript string + injection code).

**Result**: When shell does `const mod = await import(smsUrl)`, the SMS styles
automatically apply to the shell's document.

### CSS Specificity in Shell Context

When SMS CSS is injected into the shell's document, both sets of styles coexist:
- Shell CSS (from `dist/assets/style.css` served for shell)
- SMS CSS (injected as `<style>` tag when SMS module loads)

Since they use Tailwind's `@layer` system, they don't conflict. Each layer declaration
adds to the same layers (browsers merge layers across stylesheets by name).

---

## Writing Tailwind Classes — Patterns and Anti-Patterns

### ✅ Static class strings (scanner-friendly)

```tsx
// Static classes are detected by @tailwindcss/vite scanner
<div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-100">

// Conditional classes — both branches fully spelled out
<div className={isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}>

// Template literals with known values
<div className={`flex ${isWide ? 'max-w-screen-xl' : 'max-w-lg'} mx-auto`}>
```

### ✅ Arbitrary values for dynamic/brand colors

```tsx
// When color is known at author-time
<div className="bg-[#1428A0] text-white">

// CSS variable reference
<div className="border-[var(--signal-500)]">
```

### ❌ Dynamic class generation (NOT scanner-friendly)

```tsx
// ❌ Scanner can't detect these — CSS won't be generated
<div className={`text-${color}-500`}>          // dynamic color name
<div className={`px-${size}`}>                 // dynamic spacing value
<div className={`${prefix}-blue-600`}>         // dynamic prefix
```

For truly dynamic values, use inline styles or CSS custom properties:

```tsx
// ✅ Use CSS custom property bridge for dynamic values
<div
  style={{ '--role-color': roleColors[user.role] } as React.CSSProperties}
  className="border-2 border-[var(--role-color)] text-[var(--role-color)]"
>

// ✅ Or inline style for values not representable in Tailwind
<div style={{ background: `linear-gradient(150deg, ${color1}, ${color2})` }}>
```

### ✅ CSS module pattern for complex dynamic styles

If you have many dynamic values, extract to a style object:

```tsx
const cardStyle: React.CSSProperties = {
  '--app-color': meta.color,
  borderTopColor: meta.color,
} as React.CSSProperties;

return (
  <div
    style={cardStyle}
    className="rounded-2xl border border-slate-200 border-t-[3px] px-6 py-4 hover:shadow-lg transition-shadow"
  >
```

---

## Common Tailwind v4 Patterns Used in This Codebase

### Layout

```tsx
// Full-height sidebar + main layout
<div className="flex h-screen overflow-hidden font-sans">
  <nav className="w-[220px] shrink-0 flex-col">
  <div className="flex flex-1 flex-col overflow-hidden">

// Sticky header
<header className="sticky top-0 z-10 flex h-[60px] items-center px-10 border-b border-slate-200 bg-white/[0.92] backdrop-blur-md">

// Content area
<div className="flex-1 overflow-auto bg-slate-50 p-7">

// Portal grid
<div className="grid max-w-[900px] grid-cols-2 gap-[18px]">
```

### Typography

```tsx
// Heading — Sora font
<h1 className="font-[Sora] text-2xl font-bold text-slate-900">

// Body text
<p className="text-sm text-slate-500">

// Label
<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">

// Mono metrics
<span className="font-mono text-sm">
```

### Sidebar nav item (active/inactive pattern)

```tsx
<NavLink
  className={({ isActive }) =>
    `flex items-center gap-2.5 border-l-[3px] px-4 py-2.5 text-[13px] no-underline transition-all ` +
    (isActive
      ? 'bg-white/[0.09] font-semibold text-white'
      : 'border-l-transparent font-normal text-white/50 hover:bg-white/[0.05]')
  }
  style={({ isActive }) => ({ borderLeftColor: isActive ? COLOR : 'transparent' })}
>
```

### Status badges with @repo/ui

```tsx
import { Badge } from '@repo/ui'

const statusVariant = (s: string) =>
  s === 'healthy' ? 'default' : s === 'degraded' ? 'secondary' : 'destructive'

<Badge variant={statusVariant(status)} className="capitalize">{status}</Badge>
```

### DataTable column definition

```tsx
import type { ColumnDef } from '@tanstack/react-table'
import { Badge, DataTable } from '@repo/ui'

const columns: ColumnDef<Metric>[] = [
  { accessorKey: 'service', header: 'Service' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <Badge variant={getValue() === 'healthy' ? 'default' : 'destructive'}>
        {getValue() as string}
      </Badge>
    ),
  },
]

<DataTable
  columns={columns}
  data={metrics}
  features={{ sorting: true, globalFilter: true, hoverable: true, striped: true }}
/>
```

---

## Debugging CSS Issues

### Check if spacing utilities are applied

```js
// In browser console or Playwright
const el = document.querySelector('header');
const cs = getComputedStyle(el);
console.log({
  paddingLeft: cs.paddingLeft,        // Should be 40px for px-10
  paddingInlineStart: cs.paddingInlineStart,  // Logical property
  className: el.className,
});
```

### Check if design tokens are set

```js
const root = getComputedStyle(document.documentElement);
console.log({
  signal500: root.getPropertyValue('--signal-500'),  // Should be '#1428A0'
  neutral50:  root.getPropertyValue('--neutral-50'),  // Should be '#F7F8FC'
  spacing:    root.getPropertyValue('--spacing'),     // Should be '0.25rem'
});
```

### Check if CSS rules exist (find specific utility)

```js
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules) {
      const inner = rule.cssRules || [];
      for (const r of inner) {
        const innerInner = r.cssRules || [];
        for (const rr of innerInner) {
          if (rr.selectorText?.includes('px-10')) {
            console.log('Found:', rr.cssText);
          }
        }
        if (r.selectorText?.includes('px-10')) console.log('Found:', r.cssText);
      }
    }
  } catch {}
}
```

### Common failures and fixes

| Symptom | Cause | Fix |
|---|---|---|
| All padding is 0px | `* { padding: 0 }` in index.html (unlayered) | Remove inline style from index.html |
| Only arbitrary values work | Same as above (arbitrary uses direct px, not var) | Same fix |
| Design tokens not set | `@import "@repo/tailwind-config"` not resolving | Add `@repo/tailwind-config` to devDeps |
| Classes generated but not applied | CSS not loading at all | Check network tab for CSS file 404 |
| Remote app unstyled | CSS not injected in MFE remote | Add `vite-plugin-css-injected-by-js` to vite.config.ts |
| Font is Inter instead of DM Sans | @repo/ui/styles.css theme overriding | Import order: shared-ui before @repo/ui |
| Spacing wrong in dev, right in build | Dev mode CSS injection timing | Add wait in dev mode or use preview |
