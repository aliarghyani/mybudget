<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import { convertFromIrt, formatByUnit, parseMoney, type FiatUnit, type Kind } from '@/composables/useMoney';
import { useI18n } from 'vue-i18n';

const ledgerStore = useLedgerStore();
const settingsStore = useSettingsStore();
const { monthRows, pendingById, isSaving } = storeToRefs(ledgerStore);
const { settings } = storeToRefs(settingsStore);
const { t, locale } = useI18n();

const densityClass = computed(() =>
  settings.value.density === 'compact' ? 'table-density-compact' : 'table-density-comfortable'
);

const unitOptions = computed(() => [
  { label: t('units.irt'), value: 'IRT' },
  { label: t('units.irm'), value: 'IRM' },
  { label: t('units.usd'), value: 'USD' }
]);

const kindOptions = computed(() => [
  { label: t('kinds.expense'), value: 'expense' },
  { label: t('kinds.income'), value: 'income' }
]);

function focusNextCell(rowId: string, currentIndex: number) {
  nextTick(() => {
    const selector = `[data-row-id="${rowId}"][data-focus-index="${currentIndex + 1}"]`;
    const element = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(selector);
    element?.focus();
  });
}

function focusPrevCell(rowId: string, currentIndex: number) {
  nextTick(() => {
    const selector = `[data-row-id="${rowId}"][data-focus-index="${currentIndex - 1}"]`;
    const element = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(selector);
    element?.focus();
  });
}

function onKeyNavigation(event: KeyboardEvent, rowId: string, index: number) {
  if (event.key === 'Enter') {
    event.preventDefault();
    focusNextCell(rowId, index);
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    focusPrevCell(rowId, index);
  }
}

function updateTitle(id: string, value: string) {
  ledgerStore.updateRow(id, { title: value });
}

function updateComment(id: string, value: string) {
  ledgerStore.updateRow(id, { comment: value });
}

function updateMust(id: string, value: boolean) {
  ledgerStore.updateRow(id, { must: value });
}

function updatePaidFlag(id: string, value: boolean) {
  ledgerStore.updateRow(id, { paidFlag: value });
}

function updateKind(id: string, value: Kind) {
  ledgerStore.updateRow(id, { kind: value });
}

function updateUnit(id: string, unit: FiatUnit) {
  ledgerStore.updateRow(id, { inputUnit: unit });
}

function handlePlannedBlur(rowId: string, unit: FiatUnit, value: string) {
  const parsed = parseMoney(value, unit, settings.value.usdToIrt);
  ledgerStore.updateRow(rowId, { plannedIRT: parsed });
}

function handlePaidBlur(rowId: string, unit: FiatUnit, value: string) {
  const parsed = parseMoney(value, unit, settings.value.usdToIrt);
  ledgerStore.updateRow(rowId, { paidIRT: parsed });
}

function formattedUnitValue(irt: number, unit: FiatUnit): string {
  const result = convertFromIrt(irt, unit, settings.value.usdToIrt);
  return unit === 'USD' ? result.toFixed(2) : result.toString();
}

function displayPending(irt: number, unit: FiatUnit): string {
  return formatByUnit(irt, unit, locale.value, settings.value.usdToIrt);
}

function duplicateRow(id: string) {
  ledgerStore.duplicateRow(id);
}

function removeRow(id: string) {
  ledgerStore.removeRow(id);
}
</script>

<template>
  <div class="table-shell">
    <div class="table-shell__status" role="status" aria-live="polite">
      <span
        class="table-shell__status-dot"
        :class="{ 'table-shell__status-dot--saving': isSaving }"
      />
      <span>{{ isSaving ? t('feedback.saving') : t('feedback.saved') }}</span>
    </div>
    <div class="table-shell__container">
      <table class="budget-table" :class="densityClass">
        <thead>
          <tr>
            <th scope="col">{{ t('table.title') }}</th>
            <th scope="col">{{ t('table.planned') }}</th>
            <th scope="col" class="budget-table__unit">{{ t('table.unit') }}</th>
            <th scope="col">{{ t('table.must') }}</th>
            <th scope="col">{{ t('table.comment') }}</th>
            <th scope="col">{{ t('table.paidFlag') }}</th>
            <th scope="col">{{ t('table.paid') }}</th>
            <th scope="col">{{ t('table.pending') }}</th>
            <th scope="col">{{ t('table.kind') }}</th>
            <th scope="col" class="budget-table__actions">{{ t('table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in monthRows" :key="row.id">
            <td data-label="title">
              <input
                :data-row-id="row.id"
                data-focus-index="0"
                class="budget-table__input budget-table__input--text"
                type="text"
                :placeholder="t('placeholders.title')"
                :value="row.title"
                @input="updateTitle(row.id, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 0)"
              />
            </td>
            <td data-label="planned">
              <input
                :data-row-id="row.id"
                data-focus-index="1"
                class="budget-table__input budget-table__input--number"
                type="text"
                inputmode="decimal"
                :value="formattedUnitValue(row.plannedIRT, row.inputUnit)"
                @blur="handlePlannedBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 1)"
              />
            </td>
            <td data-label="unit" class="budget-table__unit">
              <select
                :data-row-id="row.id"
                data-focus-index="2"
                class="budget-table__select"
                :value="row.inputUnit"
                @change="updateUnit(row.id, ($event.target as HTMLSelectElement).value as FiatUnit)"
                @keydown="onKeyNavigation($event, row.id, 2)"
              >
                <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">
                  {{ unit.label }}
                </option>
              </select>
            </td>
            <td data-label="must" class="budget-table__checkbox">
              <input
                :data-row-id="row.id"
                data-focus-index="3"
                type="checkbox"
                :checked="row.must"
                @change="updateMust(row.id, ($event.target as HTMLInputElement).checked)"
                @keydown="onKeyNavigation($event, row.id, 3)"
              />
            </td>
            <td data-label="comment">
              <input
                :data-row-id="row.id"
                data-focus-index="4"
                class="budget-table__input budget-table__input--text"
                type="text"
                :placeholder="t('placeholders.comment')"
                :value="row.comment ?? ''"
                @input="updateComment(row.id, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 4)"
              />
            </td>
            <td data-label="paidFlag" class="budget-table__checkbox">
              <input
                :data-row-id="row.id"
                data-focus-index="5"
                type="checkbox"
                :checked="row.paidFlag"
                @change="updatePaidFlag(row.id, ($event.target as HTMLInputElement).checked)"
                @keydown="onKeyNavigation($event, row.id, 5)"
              />
            </td>
            <td data-label="paid">
              <input
                :data-row-id="row.id"
                data-focus-index="6"
                class="budget-table__input budget-table__input--number"
                type="text"
                inputmode="decimal"
                :value="row.paidIRT !== undefined ? formattedUnitValue(row.paidIRT, row.inputUnit) : ''"
                :placeholder="t('placeholders.paid')"
                @blur="handlePaidBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 6)"
              />
            </td>
            <td data-label="pending" class="budget-table__pending">
              {{ displayPending(pendingById[row.id] ?? 0, row.inputUnit) }}
            </td>
            <td data-label="kind">
              <select
                :data-row-id="row.id"
                data-focus-index="7"
                class="budget-table__select"
                :value="row.kind"
                @change="updateKind(row.id, ($event.target as HTMLSelectElement).value as Kind)"
                @keydown="onKeyNavigation($event, row.id, 7)"
              >
                <option v-for="kind in kindOptions" :key="kind.value" :value="kind.value">
                  {{ kind.label }}
                </option>
              </select>
            </td>
            <td class="budget-table__actions" data-label="actions">
              <button
                :data-row-id="row.id"
                data-focus-index="8"
                type="button"
                class="budget-table__action"
                @click="duplicateRow(row.id)"
                @keydown="onKeyNavigation($event, row.id, 8)"
              >
                {{ t('table.duplicate') }}
              </button>
              <button
                :data-row-id="row.id"
                data-focus-index="9"
                type="button"
                class="budget-table__action budget-table__action--danger"
                @click="removeRow(row.id)"
                @keydown="onKeyNavigation($event, row.id, 9)"
              >
                {{ t('table.delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="!monthRows.length">
            <td class="budget-table__empty" colspan="10">
              {{ t('feedback.noRows') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-shell {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.table-shell__status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--rk-color-muted-foreground, #64748b);
}

.table-shell__status-dot {
  inline-size: 0.65rem;
  block-size: 0.65rem;
  border-radius: 50%;
  background: #10b981;
  transition: background 0.2s ease;
}

.table-shell__status-dot--saving {
  background: #f97316;
}

.table-shell__container {
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  overflow-x: auto;
}

.budget-table {
  inline-size: 100%;
  border-collapse: collapse;
  min-inline-size: 960px;
}

.budget-table th,
.budget-table td {
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
  text-align: start;
}

.budget-table thead th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--rk-color-muted-foreground, #64748b);
}

.budget-table tbody tr:hover {
  background: rgba(226, 232, 240, 0.35);
}

.budget-table__input {
  inline-size: 100%;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--rk-color-foreground, #0f172a);
}

.budget-table__input:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(34, 211, 238, 0.45);
  border-radius: 0.75rem;
}

.budget-table__input--number {
  text-align: end;
}

.budget-table__select {
  inline-size: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 0.35rem 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.budget-table__select:focus-visible {
  outline: 2px solid rgba(34, 211, 238, 0.45);
}

.budget-table__checkbox {
  text-align: center;
}

.budget-table__checkbox input {
  inline-size: 1.1rem;
  block-size: 1.1rem;
  cursor: pointer;
}

.budget-table__pending {
  font-weight: 600;
  color: var(--rk-color-foreground, #0f172a);
}

.budget-table__actions {
  display: flex;
  gap: 0.5rem;
}

.budget-table__action {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  cursor: pointer;
  background: rgba(34, 211, 238, 0.15);
  color: var(--rk-color-foreground, #0f172a);
}

.budget-table__action:hover {
  background: rgba(34, 211, 238, 0.3);
}

.budget-table__action--danger {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.budget-table__action--danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.budget-table__unit {
  inline-size: 8rem;
}

.budget-table__empty {
  text-align: center;
  padding-block: 2rem;
  color: var(--rk-color-muted-foreground, #64748b);
}
</style>

