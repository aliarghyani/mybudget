# Developer Overview & Roadmap

This document captures the current state of the **MyBudget** starter, key implementation choices, and the recommended next steps for engineers who will continue developing the project. Review this alongside the main `README.md`.

---

## 1. Project snapshot (September 2025)

- **Framework**: Vue 3.5 (Vite + `<script setup>` + TypeScript)
- **State**: Pinia stores with VueUse `useStorage` (localStorage persistence) and debounced autosave
- **Routing**: Vue Router (Dashboard, Settings routes)
- **UI**: Reka UI primitives (wrapped in `ConfigProvider`), custom components for dashboard, table, cards, settings, dialogs, toasts
- **Internationalization**: vue-i18n (en/fa) with dynamic RTL/LTR switching via `useRtl`
- **Keyboard shortcuts**: `useMagicKeys` (VueUse) for navigation, save, language toggle, add-row
- **Data**: Ledger rows and settings stored as plain JSON in localStorage with seed data and manual import/export
- **Styling**: Global CSS (`styles.css`) with logical properties for RTL, custom density utilities

The dev server (`pnpm dev`) and build pipeline (`pnpm build`) are verified. ESLint/Prettier configs are in place but not yet enforced via CI.

---

## 2. Architecture highlights

### 2.1 Application shell
- `src/App.vue` wraps routed pages with `AppShell`, Reka `ConfigProvider`, and global composables (`useRtl`, `useKeyboardShortcuts`).
- `AppShell` manages navigation, theme dataset, toast queue (via a VueUse event bus), and language toggle.

### 2.2 State management
- `settings` store persists to `mb:settings` with defaults focused on Iranian users (fa, IRM totals, manual USD rate).
- `ledger` store manages rows persisted to `mb:ledger`, seeded with mixed currency examples. A debounce ensures writes <-> toasts on save, while `resolveActiveMonth()` keeps month state valid even when settings are still hydrating.

### 2.3 Data model
- `LedgerRow` holds base values in integer IRT; `inputUnit` captures the user’s preferred unit (IRT / IRMT / USD).
- Conversion logic (`useMoney.ts`) handles parsing and formatting, normalising Persian numerals and aliasing `IRMT`.

### 2.4 UI composition
- **Desktop**: `BudgetTable` renders an accessible table with inline editors, autosave on blur, and pending totals.
- **Mobile**: `BudgetCardList` mirrors the same fields in stacked cards.
- **Shared**: `TotalsBar` summarises daily totals, `MonthPicker` handles month navigation, `ConfirmDialog` wraps Reka alerts, `SettingsForm` manages preferences and data actions.

### 2.5 i18n & RTL
- `useRtl` watches store language, applies `dir` attribute, toggles body classes.
- All labels (including currency suffixes) are localised; IRMT now surfaces as "IRMT (Iran Million Toman)".

---

## 3. Recent changes (this iteration)

1. **Vite entry point** – Added `index.html` to fix dependency pre-bundling.
2. **Reka UI** – Removed non-existent global CSS & plugin import; wrap app with `ConfigProvider`.
3. **Pinia fixes** – Hardened settings/ledger initialisation to avoid null references when the stores hydrate.
4. **Currency labels** – Standardised IRMT naming across UI and formatting helpers.
5. **Docs & structure** – Project has lint/format configs, MIT license, README quick start, and this roadmap.

---

## 4. Data storage considerations (no backend)

Current approach: `useStorage` (localStorage) for settings + ledger.

- **Pros**: zero dependencies, transparent JSON export/import, works offline.
- **Cons**: limited storage (~5MB), synchronous API, no concurrency, data loss on browser clear.

### Recommended path forward

1. **Abstract persistence layer**
   - Introduce a data service (e.g., `src/services/storage.ts`) that wraps operations. Start with localStorage, but allow future drop-in replacements.
2. **Migrate to IndexedDB**
   - Evaluate Dexie or LocalForage for async persistence, larger quotas, and better schema evolution.
   - Use TanStack Query to orchestrate reads/writes with caching, background sync logic, and eventual backend integration.
3. **Versioned migrations**
   - Add version metadata to saved payloads (`mb:ledger:v1`), enabling safe transformations for future schema changes.
4. **Security**
   - Consider optional password protection/encryption if sensitive data is expected (libs: `crypto-js`, `libsodium-wrappers`).

---

## 5. Upcoming requirements & proposals

### 5.1 TanStack Table (reactivity-focused data grid)
Goal: Replace the custom `BudgetTable` with TanStack Table (Vue adapter) for richer features (sorting, filtering, virtualisation).

Steps:
1. Install dependencies: `@tanstack/vue-table` (for core) + `@tanstack/table-core`.
2. Refactor `BudgetTable` to define column defs, row models, and use `useVueTable` to produce state-driven columns/rows.
3. Integrate unit selectors and inline editing using TanStack’s cell renderers; tie debounced updates back to Pinia actions.
4. Add column reordering, grouping, and summary footers (TanStack supports manual aggregates).

### 5.2 TanStack Query (async data orchestration)
Even without a backend, TanStack Query can manage persistence & derived queries:
1. Wrap local storage service calls in query/mutation hooks (`useLedgerQuery`, `useLedgerMutation`).
2. Expose optimistic updates; this makes future backend work trivial (swap storage service with HTTP calls).
3. Use Query’s `invalidateQueries` after import/export or rate changes.

### 5.3 Persian calendar support
Requirements: Replace Gregorian month handling with Solar Hijri (Jalali).

Implementation plan:
1. Add a date library with Persian calendar support (options: `dayjs` + `jalaliday`, `jalaali-js`, or `Intl.DateTimeFormat` with `fa-IR-u-ca-persian`).
2. Update `MonthPicker` to format months using Jalali, while storing canonical IDs (`YYYY-MM` in Gregorian or equivalent). Consider storing both representations:
   - `monthKey` (Gregorian `YYYY-MM`) for internal keys & compatibility.
   - `displayMonth` derived from Jalali for UI.
3. Adjust defaults (`currentMonth()`) in both stores to produce Jalali-friendly values. Guard conversions when parsing persisted data.
4. Update translations for month names, and ensure `TotalsBar` or future charts respect the new calendar.
5. Audit keyboard/input behaviours (`type="month"` is Gregorian-only). Replace with text input + masked editing or a custom date picker (Reka Calendar supports custom calendars once configured).

### 5.4 Settings updates
- Add toggles for calendar type, and a field for automatic exchange-rate fetch (when backend or public API is available).
- Persist theme/density options to CSS variables for easier theming.
- Add a "Reset month data" button to wipe only current month entries (requires a filtered mutation).

---

## 6. Suggested next moves (short/medium term)

1. **Refactor persistence**
   - Introduce storage service abstraction and experiment with IndexedDB + TanStack Query for resilience.

2. **Adopt TanStack Table**
   - Prototype replacement for `BudgetTable` focusing on column schema, cell editing, and aggregated footers.
   - Ensure accessibility (aria roles) remain equivalent or better.

3. **Introduce TanStack Query**
   - Wrap ledger/settings persistence in queries/mutations.
   - Use Query Devtools during development for insight.

4. **Persian calendar integration**
   - Replace the native month input with a Jalali-aware picker.
   - Update stores and utilities to respect the new calendar.

5. **Testing & QA**
   - Add unit tests for money parsing (`vitest`), store behaviour (Pinia testing), and component snapshots.
   - Add Playwright or Cypress smoke tests after table refactor.

6. **Performance**
   - Evaluate virtualization/path-based updates once the table uses TanStack to maintain responsiveness with large datasets.

7. **Design polish**
   - Replace placeholders with design tokens, consistent spacing, and dynamic theme switching based on settings.

---

## 7. Longer-term roadmap

| Milestone | Description | Notes |
| --- | --- | --- |
| **Cloud sync** | Introduce backend (Supabase/Firebase/Hasura) or encrypted cloud storage, using TanStack Query for API orchestration. | Requires auth, conflict resolution. |
| **Budgets & analytics** | Add category budgets, charts, savings goals, and monthly comparisons. | Will benefit from TanStack Table grouping + Query derived states. |
| **Collaboration** | Multi-user sharing or export to formats (CSV, PDF). | Ensure data schema is normalized before sync. |
| **Mobile packaging** | Wrap in Capacitor/Tauri for desktop/mobile apps leveraging same front-end. | IndexedDB essential for offline. |

---

## 8. Known gaps & technical debt

- **No unit tests**: Stores & parsers lack automated coverage
- **Accessibility review needed**: Table actions rely on buttons only; consider keyboard instructions and ARIA updates when replacing with TanStack Table
- **Theme tokens**: Hard-coded colours in CSS; move to CSS custom properties tied to settings
- **Error handling**: Toasts exist, but import/export errors could display detailed info (line counts, schema hints)
- **CI/CD**: No Git hooks or pipelines enforcing lint/test

---

## 9. Onboarding checklist for new developers

1. Install dependencies: `pnpm install`
2. Run dev server: `pnpm dev`
3. Review `README.md` for shortcuts and data model
4. Explore Pinia stores (`src/stores/*`) to understand persistence & seed logic
5. Familiarise yourself with `useMoney` for conversions
6. Read this document for roadmap before starting new features
7. Coordinate changes to money formats / storage migrations carefully (data compatibility)

---

Reach out to the current maintainer(s) before shipping breaking schema changes or introducing backend dependencies.
