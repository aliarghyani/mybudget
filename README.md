You are an expert Vue 3 + TypeScript engineer. Create a production-ready starter for a **personal monthly budget** app with the following strict requirements:

TECH + LIBS
- Vite + Vue 3 + TypeScript
- Pinia (state)
- @vueuse/core (useStorage, useMagicKeys, etc.)
- vue-i18n (languages: en, fa)
- Reka UI (latest) for components/layout (https://reka-ui.com/)
- ESLint + Prettier + EditorConfig
- No server yet; persist to localStorage via VueUse.

ACCESSIBILITY & UX
- Full keyboard navigation and ARIA labels.
- Keyboard shortcuts: 
  - `n` -> add new row
  - `ctrl/cmd+s` -> save (no-op but shows a small “Saved” Reka toast)
  - `g` then `s` -> go to Settings
  - `g` then `d` -> go to Dashboard
  - `l` -> toggle language (en/fa)
- Focus outline visible, proper roles for table, checkboxes, buttons.
- Responsive: on small screens, table rows render as stacked cards; on larger screens a scrollable data table with sticky header.

i18n + RTL
- App supports English and Persian (fa). 
- When language is `fa`, set `dir="rtl"` at the root and mirror paddings/margins; otherwise `ltr`.
- Provide minimal translations for all visible strings. 
- Currency symbol for **تومان** and **USD** are localized.

DATA MODEL
- Row (Transaction): 
  ```ts
  type Currency = 'IRR' | 'USD'; // IRR means Toman visually; display as TMN
  interface LedgerRow {
    id: string;
    title: string;         // e.g., 'اجاره', 'Rent'
    planned: number;       // planned amount in row currency
    currency: Currency;    // USD allowed mainly for incomes; otherwise IRR
    must: boolean;         // required expense
    comment?: string;      // free text
    paidFlag: boolean;     // checkbox “Paid?”
    paid?: number;         // amount actually paid (same currency as row)
    pending?: number;      // computed: planned - paid (floor at 0)
    month: string;         // YYYY-MM
    kind: 'expense' | 'income';
  }
Settings:

interface Settings {
  language: 'en' | 'fa';
  theme: 'system' | 'light' | 'dark';
  baseCurrency: 'IRR';            // fixed for now; display as تومان
  secondaryCurrency: 'USD';
  usdToIrr: number;               // manual exchange rate
  defaultMonth: string;           // YYYY-MM
}


Store totals per month:

Show totals in تومان. Convert any USD rows using usdToIrr.

Show: Totals (Planned), Totals (Paid), Totals (Pending), and separate Income vs Expense subtotals.

PAGES

Dashboard (default route /)

Header: month switcher (prev/next select), quick totals, language toggle, button to Settings.

Table with columns:

Title (editable text)

Planned (editable numeric, masked)

Currency (select: IRR/USD; default IRR; if USD and kind=income highlight)

Must (checkbox)

Comment (inline editable)

Paid? (checkbox)

Paid (editable numeric, enabled when Paid? checked)

Pending (read-only, computed)

Kind (select expense/income)

Row actions: duplicate, delete

Footer row: totals.

“Add row” button + n shortcut to append a blank row focused to Title.

All edits auto-save (debounced) to localStorage; show Reka toast “Saved”.

Settings (route /settings)

Card layout using Reka UI:

Language (en/fa) radio

Theme (system/light/dark)

Exchange rate: USD ➜ تومان (numeric, required)

Default month selector (month input, YYYY-MM)

Import/Export data as JSON (download/upload); validate schema before applying

Toggle “compact table density”

“Reset all data” (confirm dialog)

Live preview: when switching language, instantly update RTL/LTR and strings.

ARCHITECTURE

Use Pinia stores: useSettingsStore, useLedgerStore.

Persist store slices with VueUse useStorage (namespace mb:).

Composables:

useRtl() -> reactively set document.dir and add body class.

useKeyboardShortcuts() -> register all shortcuts with useMagicKeys.

useCurrency() -> format/parse amounts, convert USD→IRR.

Components:

AppShell (header, sidebar placeholder)

BudgetTable (desktop table)

BudgetCardList (mobile stacked rows)

TotalsBar (summary for the month)

MonthPicker

SettingsForm

ConfirmDialog

Routing: / and /settings with Vue Router.

FILES TO CREATE (WITH CONTENT)

package.json — include scripts:

dev, build, preview, lint, format.

vite.config.ts — set up alias @/ and Reka UI plugin if needed; enable RTL safe postcss logical props.

src/main.ts — createApp, install Pinia, i18n, router, apply Reka UI, set dir via useRtl.

src/App.vue — AppShell (Reka top bar) + <router-view/>.

src/router/index.ts — routes for Dashboard & Settings.

src/stores/settings.ts — Pinia store w/ useStorage.

src/stores/ledger.ts — Pinia store with CRUD, month filters, totals selectors (convert USD→IRR).

src/composables/useRtl.ts — sync document.dir with active locale.

src/composables/useKeyboardShortcuts.ts — register shortcuts.

src/composables/useCurrency.ts — formatters using Intl.NumberFormat (fa-IR/en-US).

src/i18n/index.ts — i18n setup + messages:

en.json & fa.json strings for UI labels, columns, toasts.

src/pages/Dashboard.vue — header (MonthPicker, TotalsBar, actions), responsive rendering:

v-if (isDesktop) show <BudgetTable/>

else <BudgetCardList/>

src/pages/Settings.vue — uses <SettingsForm/>.

src/components/BudgetTable.vue — Reka table with inline editors (inputs, selects, checkboxes), sticky header, a11y roles.

src/components/BudgetCardList.vue — stacked row card for mobile with same fields.

src/components/TotalsBar.vue — shows totals (planned/paid/pending; income/expense).

src/components/MonthPicker.vue — month switcher (prev/next + dropdown).

src/components/SettingsForm.vue — form described above; export/import JSON buttons.

src/styles.css — minimal globals, logical properties for RTL, focus ring.

public/icon.svg — placeholder app icon.

.eslintrc.cjs, .prettierrc, .editorconfig — standard configs.

README.md — how to run/build; keyboard shortcuts; data model; a11y notes.

LICENSE — MIT.

SEED DATA

On first run, seed example rows (taken from screenshot semantics):

“اجاره” planned 15500 IRR, expense, must=true

“همسر” planned 16000 IRR, expense, must=true

“وام ۶ تومن بلو” planned 1100 IRR, expense, paid? (true), etc.

Include at least 8–10 sample rows split across expense/income.

Also seed usdToIrr with a sensible demo value (e.g., 107000).

IMPLEMENTATION DETAILS

Pending = max(planned - (paid ?? 0), 0).

Totals compute two views:

totalPlannedIrr = sum(IRR planned) + sum(USD planned * rate)

totalPaidIrr = sum(IRR paid) + sum(USD paid * rate)

totalPendingIrr = totalPlannedIrr - totalPaidIrr

Also income/expense subtotals in IRR.

Table Editing:

Inline inputs; Enter saves and moves to next cell; Esc cancels focus change.

When paidFlag toggles on, auto-copy planned into paid (user can edit).

Validation:

planned/paid >= 0; title required; currency required.

Use Reka UI components for inputs/buttons/toggles/table and its toast system.

Use VueUse useBreakpoints to switch Desktop vs Mobile.

Keep components small, strongly typed props/emits.

SCRIPTS (write in README too)

pnpm create vite mybudget --template vue-ts

pnpm add pinia vue-i18n @vueuse/core reka-ui

pnpm add -D eslint @vue/eslint-config-typescript prettier eslint-config-prettier postcss

pnpm dev

DELIVERABLE

Generate all files with working code, respecting the above spec.

Ensure running pnpm dev launches an app with:

Dashboard table, seeded rows, totals update live.

Settings page w/ working language switch (affects RTL), exchange rate, import/export.

Keyboard shortcuts functioning.

Mobile layout switches to cards.

Keep code clean, typed, commented where helpful.

Finally, print a concise “NEXT STEPS” checklist in the README:

 Connect to real FX API later

 Recurring items & reminders

 CSV/Excel import/export

 Multi-profile households

 PWA offline