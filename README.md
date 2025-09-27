# MyBudget – personal monthly budget app starter

A production-ready Vue 3 + TypeScript starter focused on managing personal income and expenses for Iranian tomans (IRT/IRM) with USD conversions. It ships with responsive table-first UX, autosave, full i18n (en/fa), RTL support, keyboard shortcuts, and local persistence.

## Quick start

```bash
pnpm install
pnpm dev
```

### Available scripts

- `pnpm dev` – start the Vite dev server with hot module reload
- `pnpm build` – compile the app for production
- `pnpm preview` – locally preview the production build
- `pnpm lint` – run ESLint on `.ts` and `.vue` files
- `pnpm format` – format the repo with Prettier

## Tech stack

- Vite + Vue 3 + `<script setup>` TypeScript
- Pinia stores with VueUse `useStorage`/`useMagicKeys`
- Reka UI components (toast, dialogs) + CSS logical properties
- Vue Router, vue-i18n (en, fa) with live RTL switching
- PostCSS logical, ESLint, Prettier, EditorConfig

## Domain model

```ts
type FiatUnit = 'IRT' | 'IRM' | 'USD'
type Kind = 'expense' | 'income'

interface LedgerRow {
  id: string
  title: string
  plannedIRT: number
  paidIRT?: number
  inputUnit: FiatUnit
  must: boolean
  comment?: string
  paidFlag: boolean
  month: string // YYYY-MM
  kind: Kind
}

interface Settings {
  language: 'en' | 'fa'
  theme: 'system' | 'light' | 'dark'
  usdToIrt: number
  defaultMonth: string // YYYY-MM
  density: 'comfortable' | 'compact'
  totalsDisplayUnit: 'IRT' | 'IRM'
}
```

Ledger rows, active month, and settings are persisted to `localStorage` with debounced autosave (300 ms). Seed data includes 8 expenses (IRT/IRM) and 2 USD income rows calculated with the default USD→IRT rate.

## Money rules

- **Storage unit**: all amounts stored as integer IRT (toman)
- **Units**
  - IRT multiplier: `1`
  - IRM (million toman) multiplier: `1_000_000`
  - USD parsed via manually supplied `usdToIrt` rate
- **Parsing**: string/number inputs are normalised (handles Persian digits), parsed with integer math, and rounded to the nearest IRT. Aliases: accepts `IRMT` → `IRM`.
- **Formatting**: Intl.NumberFormat with locale-aware suffixes (`IRT`/`تومان`, `IRM`/`میلیون تومان`, `USD`/`دلار`).
- **Totals**: planned/paid/pending + income/expense subtotals computed in IRT, formatted according to the `totalsDisplayUnit` setting.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `n` | add a new ledger row |
| `Ctrl/Cmd + S` | force-save ledger and show toast |
| `g` then `d` | go to dashboard |
| `g` then `s` | go to settings |
| `l` | toggle language en ↔ fa |

Focus navigation inside the table also supports `Enter` (next cell) and `Esc` (previous cell).

## Accessibility & UX

- Table-first desktop view with sticky header and logical CSS props for RTL/LTR.
- Mobile view renders stacked cards with the same inputs.
- Semantic table roles, labelled inputs, and visible focus rings.
- Autosave toasts powered by Reka UI, manual import/export with schema validation, and reset confirmation dialog.

## Next steps

1. Replace mock styling with your brand design system or extended Reka primitives.
2. Wire up authentication / cloud sync if you need multi-device support.
3. Add charts or analytics for category trends and cashflow forecasting.
4. Integrate automated exchange-rate updates via a secure backend.

---

Licensed under the [MIT License](LICENSE).
