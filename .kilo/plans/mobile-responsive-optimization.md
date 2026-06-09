# Mobile Responsive Optimization Plan

## Decisions Already Made
1. **Number formatting**: Long TL amounts abbreviated on mobile (e.g., `₺1.25M`)
2. **Compact mode**: Apply as default on all mobile screens
3. **Approach A**: Fix overflow/taşma issues first, then general improvements
4. **Bottom nav labels**: Hidden on very small screens (< 360px), icons only
5. **Card padding**: `p-6` → `p-4` on mobile

---

## Phase 1: Overflow Fixes (Critical)

### 1.1 Add `formatCompactCurrency` utility
**File**: `src/lib/utils.ts`
- Create `formatCompactCurrency(amount: number): string`
- Values ≥ 1M → `₺1.23M` format (1 decimal)
- Values ≥ 1K → `₺1.23K` format
- Values < 1K → normal `formatCurrency`

### 1.2 Fix Analytics projection cards overflow
**File**: `src/components/pages/Analytics.tsx:168-187` (already partially fixed in prior edit)
- Apply `grid-cols-1 sm:grid-cols-3`
- Apply responsive text sizes (`text-xs sm:text-sm`, `text-sm sm:text-base md:text-lg`)
- Add `break-all` or `truncate` safety to currency values

### 1.3 Fix Stats Grid overflow (Dashboard)
**File**: `src/components/pages/Dashboard.tsx:147`
- Add `truncate` to stat card values
- Reduce icon size from `w-6 h-6` → `w-5 h-5` on mobile
- Reduce badge padding on mobile

### 1.4 Fix Transaction card overflow
**File**: `src/components/pages/Transactions.tsx:136-140`
- Amount column: add `text-sm sm:text-base` and `truncate`
- Reduce category icon from `w-12 h-12 text-2xl` → `w-10 h-10 text-xl`

### 1.5 Fix Portfolio summary overflow
**File**: `src/components/pages/Portfolio.tsx:114-132`
- Apply `text-lg sm:text-2xl` to big numbers
- Reduce `p-6` → `p-4` on mobile

### 1.6 Fix Goals summary overflow
**File**: `src/components/pages/Goals.tsx:34-48`
- Apply `text-lg sm:text-2xl` to numbers
- Reduce `p-6` → `p-4`

### 1.7 Fix Subscriptions summary overflow
**File**: `src/components/pages/Subscriptions.tsx:44-59`
- Apply `text-lg sm:text-2xl` to numbers
- Reduce `p-6` → `p-4`

### 1.8 Fix Analytics FIRE card overflow
**File**: `src/components/pages/Analytics.tsx:229`
- `text-3xl` → `text-2xl sm:text-3xl`
- `w-32 h-32` svg → `w-24 h-24 sm:w-32 sm:h-32`

---

## Phase 2: General Mobile Comfort Improvements

### 2.1 Reduce all GlassCard padding on mobile
**Files**: All page components
- Wherever `GlassCard className="p-6"` exists → change to `p-4 sm:p-6`
- Affects: Dashboard, Analytics, Portfolio, Goals, Subscriptions, Settings

### 2.2 Reduce icon sizes globally on mobile
**Pattern**: All `w-6 h-6` icons → `w-5 h-5 sm:w-6 sm:h-6`
**Pattern**: All `w-5 h-5` icons → `w-4 h-4 sm:w-5 sm:h-5`
**Pattern**: All `w-4 h-4` icons → `w-4 h-4 sm:w-4 sm:h-4` (no change, already small)

### 2.3 Reduce heading sizes on mobile
**Pattern**: `text-2xl` → `text-xl sm:text-2xl`
**Pattern**: `text-3xl` → `text-2xl sm:text-3xl`

### 2.4 Reduce section title sizes on mobile
**Pattern**: `text-lg` → `text-base sm:text-lg`

### 2.5 Reduce gap sizes on mobile
**Pattern**: `gap-6` → `gap-3 sm:gap-6`
**Pattern**: `gap-4` → `gap-3 sm:gap-4` (only where content feels cramped)

### 2.6 Reduce grid card text sizes on mobile
**Pattern**: `text-2xl font-bold` numbers → `text-lg sm:text-2xl font-bold`

### 2.7 Adjust bottom nav for very small screens
**File**: `src/components/layout/MobileLayout.tsx:114-142`
- Add responsive class to nav buttons: hide labels below 360px
- `className` update: `flex flex-col items-center gap-1 px-2 sm:px-3 py-2`
- Label span: add `text-[10px] sm:text-xs`
- Icon: add `w-4 h-4 sm:w-5 sm:h-5`
- Reduce nav padding: `py-1.5 sm:py-2`

### 2.8 Adjust FAB sizing
**File**: `src/components/layout/MobileLayout.tsx:70-78`
- `w-14 h-14` → `w-12 h-14 sm:w-14 sm:h-14`
- `Plus` icon `w-7 h-7` → `w-6 h-6 sm:w-7 sm:h-7`
- FAB menu items: `px-4 py-2` → `px-3 py-1.5 sm:px-4 sm:py-2`

### 2.9 Page header spacing
**File**: `src/components/layout/MobileLayout.tsx:489`
- `gap-4` → `gap-3 sm:gap-4`
- `mb-6` → `mb-4 sm:mb-6`

### 2.10 Bottom Sheet header sizing
**File**: `src/components/layout/MobileLayout.tsx:341`
- `text-xl` → `text-lg sm:text-xl`
- Reduce padding where appropriate

---

## Phase 3: Consistency Pass

### 3.1 Standardize stat card grid
- Ensure all summary grids use `grid-cols-1` with appropriate breakpoints

### 3.2 Standardize modal sizing
- Ensure modals use `max-w-md` and appropriate padding

### 3.3 Standardize button sizing
- Ensure all buttons meet 44px minimum touch target on mobile

### 3.4 Standardize input sizing
- Ensure inputs use `py-3` consistently, not larger on mobile

---

## Implementation Order

```
Phase 1 (Overflow fixes):
  1.1 utils.ts → formatCompactCurrency
  1.2 Analytics.tsx projection cards
  1.3 Dashboard.tsx stat cards
  1.4 Transactions.tsx amount display
  1.5 Portfolio.tsx summary numbers
  1.6 Goals.tsx summary numbers
  1.7 Subscriptions.tsx summary numbers
  1.8 Analytics.tsx FIRE number

Phase 2 (General improvements):
  2.7 Bottom nav labels/icon sizing
  2.8 FAB sizing
  2.9 Page header spacing
  2.10 Bottom sheet header
  2.1 GlassCard padding (all pages)
  2.2 Icon sizes (all components)
  2.3 Heading sizes (all components)
  2.4 Section titles (all components)
  2.5 Gap sizes (all components)
  2.6 Grid card numbers (all components)

Phase 3 (Consistency):
  Review and polish
```

---

## Risk Mitigation
- Use `truncate` liberally to prevent any remaining overflow
- Test on 320px, 375px, 414px viewport widths
- Keep desktop layout completely unchanged (only add responsive prefixes)
- No layout-breaking changes — only sizing/overflow fixes
