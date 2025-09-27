import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useDebounceFn, useStorage } from '@vueuse/core';
import { parseMoney, calcPending, sumRows, type FiatUnit, type Kind } from '@/composables/useMoney';
import { useSettingsStore } from './settings';

export interface LedgerRow {
  id: string;
  title: string;
  plannedIRT: number;
  paidIRT?: number;
  inputUnit: FiatUnit;
  must: boolean;
  comment?: string;
  paidFlag: boolean;
  month: string; // YYYY-MM
  kind: Kind;
}

const STORAGE_KEY = 'mb:ledger';
const DEFAULT_RATE = 107_000;

interface SerializableRow {
  id: string;
  title: string;
  plannedIRT: number;
  paidIRT?: number;
  inputUnit: string;
  must: boolean;
  comment?: string;
  paidFlag: boolean;
  month: string;
  kind: string;
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeMonth(value: string): string {
  return /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
}

function isFiatUnit(unit: string): unit is FiatUnit {
  return unit === 'IRT' || unit === 'IRM' || unit === 'USD';
}

function isKind(kind: string): kind is Kind {
  return kind === 'expense' || kind === 'income';
}

function normalizeRow(row: SerializableRow): LedgerRow | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  if (typeof row.title !== 'string' || row.title.trim() === '') {
    return null;
  }

  if (!isFiatUnit(row.inputUnit) || !isKind(row.kind)) {
    return null;
  }

  const planned = Number.isFinite(row.plannedIRT) ? Math.max(Math.round(row.plannedIRT), 0) : 0;
  const paid = Number.isFinite(row.paidIRT ?? 0) ? Math.max(Math.round(row.paidIRT ?? 0), 0) : undefined;
  const month = sanitizeMonth(row.month);

  return {
    id: typeof row.id === 'string' ? row.id : createId(),
    title: row.title.trim(),
    plannedIRT: planned,
    paidIRT: paid,
    inputUnit: row.inputUnit,
    must: Boolean(row.must),
    comment: typeof row.comment === 'string' ? row.comment : undefined,
    paidFlag: Boolean(row.paidFlag),
    month,
    kind: row.kind
  };
}

function seedRows(month: string, rate: number): LedgerRow[] {
  const base = [
    {
      title: 'Rent & Housing',
      planned: 45,
      paid: 45,
      unit: 'IRM' as FiatUnit,
      must: true,
      comment: 'Downtown apartment lease',
      paidFlag: true,
      kind: 'expense' as Kind
    },
    {
      title: 'Utilities & Energy',
      planned: 850_000,
      paid: 850_000,
      unit: 'IRT' as FiatUnit,
      must: true,
      comment: 'Electricity, water, gas',
      paidFlag: true,
      kind: 'expense' as Kind
    },
    {
      title: 'Groceries & Market',
      planned: 12,
      paid: 8,
      unit: 'IRM' as FiatUnit,
      must: true,
      comment: 'Weekly farmers market',
      paidFlag: false,
      kind: 'expense' as Kind
    },
    {
      title: 'Transportation',
      planned: 3.5,
      paid: 2.8,
      unit: 'IRM' as FiatUnit,
      must: false,
      comment: 'Metro card + fuel',
      paidFlag: false,
      kind: 'expense' as Kind
    },
    {
      title: 'Internet & Phone',
      planned: 1.4,
      paid: 1.4,
      unit: 'IRM' as FiatUnit,
      must: true,
      comment: 'Fiber connection bundle',
      paidFlag: true,
      kind: 'expense' as Kind
    },
    {
      title: 'Healthcare & Wellness',
      planned: 2,
      paid: 0,
      unit: 'IRM' as FiatUnit,
      must: true,
      comment: 'Dental check-up and meds',
      paidFlag: false,
      kind: 'expense' as Kind
    },
    {
      title: 'Family Support',
      planned: 5,
      paid: 5,
      unit: 'IRM' as FiatUnit,
      must: true,
      comment: 'Parents monthly support',
      paidFlag: true,
      kind: 'expense' as Kind
    },
    {
      title: 'Entertainment & Culture',
      planned: 1.2,
      paid: 0.8,
      unit: 'IRM' as FiatUnit,
      must: false,
      comment: 'Cinema, music events',
      paidFlag: false,
      kind: 'expense' as Kind
    },
    {
      title: 'Salary - Remote Product Role',
      planned: 3200,
      paid: 3200,
      unit: 'USD' as FiatUnit,
      must: true,
      comment: 'Monthly salary wired in USD',
      paidFlag: true,
      kind: 'income' as Kind
    },
    {
      title: 'Freelance Design Retainer',
      planned: 1500,
      paid: 1200,
      unit: 'USD' as FiatUnit,
      must: false,
      comment: 'Upwork + Dribbble retainers',
      paidFlag: false,
      kind: 'income' as Kind
    }
  ];

  return base.map((entry) => {
    const plannedIRT = parseMoney(entry.planned, entry.unit, rate);
    const paidIRT = entry.paid !== undefined ? parseMoney(entry.paid, entry.unit, rate) : undefined;

    return {
      id: createId(),
      title: entry.title,
      plannedIRT,
      paidIRT,
      inputUnit: entry.unit,
      must: entry.must,
      comment: entry.comment,
      paidFlag: entry.paidFlag,
      month,
      kind: entry.kind
    } satisfies LedgerRow;
  });
}

function loadRowsFromStorage(month: string): LedgerRow[] {
  if (typeof window === 'undefined') {
    return seedRows(month, DEFAULT_RATE);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seedRows(month, DEFAULT_RATE);
  }

  try {
    const parsed = JSON.parse(raw) as SerializableRow[];
    if (!Array.isArray(parsed)) {
      return seedRows(month, DEFAULT_RATE);
    }
    const normalized = parsed
      .map((item) => normalizeRow(item))
      .filter((row): row is LedgerRow => row !== null);

    return normalized.length ? normalized : seedRows(month, DEFAULT_RATE);
  } catch (error) {
    console.error('Failed to parse ledger storage, resetting to seed data.', error);
    return seedRows(month, DEFAULT_RATE);
  }
}

export const useLedgerStore = defineStore('ledger', () => {
  const settingsStore = useSettingsStore();
  const fallbackMonth = sanitizeMonth(
    settingsStore.settings?.value?.defaultMonth ?? new Date().toISOString().slice(0, 7)
  );
  const monthRef = useStorage('mb:active-month', fallbackMonth, undefined, { mergeDefaults: false });

  const rows = ref<LedgerRow[]>([]);
  const initialMonth = sanitizeMonth(monthRef.value ?? fallbackMonth);
  monthRef.value = initialMonth;
  rows.value = loadRowsFromStorage(initialMonth);

  const isSaving = ref(false);
  const lastSavedAt = ref<number | null>(null);

  const persist = useDebounceFn(() => {
    if (typeof window === 'undefined') {
      isSaving.value = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));
    lastSavedAt.value = Date.now();
    isSaving.value = false;
  }, 300);

  watch(
    rows,
    () => {
      isSaving.value = true;
      persist();
    },
    { deep: true }
  );

  function saveNow() {
    isSaving.value = true;
    persist();
    if (typeof (persist as unknown as { flush?: () => void }).flush === 'function') {
      (persist as unknown as { flush: () => void }).flush();
    }
  }

  function setMonth(month: string) {
    monthRef.value = sanitizeMonth(month);
  }

  function ensureRowIndex(id: string) {
    return rows.value.findIndex((row) => row.id === id);
  }

  function resolveActiveMonth(): string {
    return sanitizeMonth(monthRef.value ?? fallbackMonth);
  }

  function addRow(partial?: Partial<Omit<LedgerRow, 'id'>>) {
    const base: LedgerRow = {
      id: createId(),
      title: '',
      plannedIRT: 0,
      paidIRT: undefined,
      inputUnit: partial?.inputUnit && isFiatUnit(partial.inputUnit) ? partial.inputUnit : 'IRT',
      must: false,
      comment: '',
      paidFlag: false,
      month: resolveActiveMonth(),
      kind: partial?.kind && isKind(partial.kind) ? partial.kind : 'expense'
    };

    const next: LedgerRow = {
      ...base,
      ...partial,
      title: (partial?.title ?? base.title).trim(),
      month: sanitizeMonth(partial?.month ?? base.month),
      plannedIRT: Math.max(Math.round(partial?.plannedIRT ?? base.plannedIRT), 0),
      paidIRT:
        partial?.paidIRT !== undefined
          ? Math.max(Math.round(partial.paidIRT), 0)
          : base.paidIRT
    };

    if (next.paidFlag && next.paidIRT === undefined) {
      next.paidIRT = next.plannedIRT;
    }

    rows.value.push(next);
  }

  function updateRow(id: string, patch: Partial<Omit<LedgerRow, 'id'>>) {
    const index = ensureRowIndex(id);
    if (index === -1) {
      return;
    }

    const current = rows.value[index];
    const updated: LedgerRow = {
      ...current,
      ...patch,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      month: patch.month ? sanitizeMonth(patch.month) : current.month,
      plannedIRT:
        patch.plannedIRT !== undefined
          ? Math.max(Math.round(patch.plannedIRT), 0)
          : current.plannedIRT,
      paidIRT:
        patch.paidIRT !== undefined
          ? Math.max(Math.round(patch.paidIRT ?? 0), 0)
          : current.paidIRT,
      inputUnit:
        patch.inputUnit && isFiatUnit(patch.inputUnit) ? patch.inputUnit : current.inputUnit,
      kind: patch.kind && isKind(patch.kind) ? patch.kind : current.kind
    };

    if (patch.must !== undefined) {
      updated.must = Boolean(patch.must);
    }

    if (patch.paidFlag !== undefined) {
      updated.paidFlag = Boolean(patch.paidFlag);
      if (updated.paidFlag) {
        updated.paidIRT = updated.plannedIRT;
      }
    }

    if (updated.paidFlag && updated.paidIRT === undefined) {
      updated.paidIRT = updated.plannedIRT;
    }

    rows.value.splice(index, 1, updated);
  }

  function removeRow(id: string) {
    rows.value = rows.value.filter((row) => row.id !== id);
  }

  function duplicateRow(id: string) {
    const index = ensureRowIndex(id);
    if (index === -1) {
      return;
    }

    const target = rows.value[index];
    const clone: LedgerRow = {
      ...target,
      id: createId(),
      title: `${target.title} (copy)`,
      paidFlag: false,
      paidIRT: undefined
    };
    rows.value.splice(index + 1, 0, clone);
  }

  function resetSeed() {
    rows.value = seedRows(monthRef.value, settingsStore.settings.value.usdToIrt ?? DEFAULT_RATE);
  }

  function exportRows(): string {
    return JSON.stringify(rows.value, null, 2);
  }

  function importRows(payload: unknown) {
    if (!Array.isArray(payload)) {
      throw new Error('INVALID_PAYLOAD');
    }

    const normalized = payload
      .map((item) => normalizeRow(item as SerializableRow))
      .filter((row): row is LedgerRow => row !== null);

    if (!normalized.length) {
      throw new Error('EMPTY_DATA');
    }

    rows.value = normalized;
  }

  const monthRows = computed(() => rows.value.filter((row) => row.month === monthRef.value));

  const totals = computed(() => sumRows(monthRows.value));

  const incomeTotals = computed(() =>
    sumRows(monthRows.value.filter((row) => row.kind === 'income'))
  );

  const expenseTotals = computed(() =>
    sumRows(monthRows.value.filter((row) => row.kind === 'expense'))
  );

  const pendingById = computed(() => {
    return monthRows.value.reduce<Record<string, number>>((acc, row) => {
      acc[row.id] = calcPending(row.plannedIRT, row.paidIRT);
      return acc;
    }, {});
  });

  return {
    rows,
    month: monthRef,
    monthRows,
    totals,
    incomeTotals,
    expenseTotals,
    pendingById,
    isSaving,
    lastSavedAt,
    addRow,
    updateRow,
    removeRow,
    duplicateRow,
    setMonth,
    saveNow,
    resetSeed,
    exportRows,
    importRows
  };
});









