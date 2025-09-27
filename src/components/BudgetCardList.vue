<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import {
  convertFromIrt,
  formatByUnit,
  parseMoney,
  type FiatUnit,
  type Kind
} from '@/composables/useMoney';

const ledgerStore = useLedgerStore();
const settingsStore = useSettingsStore();
const { monthRows, pendingById } = storeToRefs(ledgerStore);
const { settings } = storeToRefs(settingsStore);
const { t, locale } = useI18n();

const unitOptions = computed(() => [
  { label: t('units.irt'), value: 'IRT' },
  { label: t('units.irm'), value: 'IRM' },
  { label: t('units.usd'), value: 'USD' }
]);

const kindOptions = computed(() => [
  { label: t('kinds.expense'), value: 'expense' },
  { label: t('kinds.income'), value: 'income' }
]);

function formattedUnitValue(irt: number, unit: FiatUnit): string {
  const result = convertFromIrt(irt, unit, settings.value.usdToIrt);
  if (unit === 'USD') {
    return result.toFixed(2);
  }
  if (unit === 'IRM') {
    return Number(result.toFixed(3)).toString();
  }
  return Math.round(result).toString();
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
  <section class="card-list">
    <article
      v-for="row in monthRows"
      :key="row.id"
      class="card-list__card"
      :data-kind="row.kind"
    >
      <header class="card-list__header">
        <input
          class="card-list__title"
          type="text"
          :placeholder="t('placeholders.title')"
          :value="row.title"
          @input="updateTitle(row.id, ($event.target as HTMLInputElement).value)"
        />
        <span class="card-list__badge" :data-kind="row.kind">
          {{ row.kind === 'income' ? t('kinds.income') : t('kinds.expense') }}
        </span>
      </header>

      <div class="card-list__grid">
        <label class="card-list__field">
          <span>{{ t('table.planned') }}</span>
          <input
            class="card-list__input"
            type="text"
            inputmode="decimal"
            :value="formattedUnitValue(row.plannedIRT, row.inputUnit)"
            @blur="handlePlannedBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="card-list__field">
          <span>{{ t('table.unit') }}</span>
          <select
            class="card-list__select"
            :value="row.inputUnit"
            @change="updateUnit(row.id, ($event.target as HTMLSelectElement).value as FiatUnit)"
          >
            <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">
              {{ unit.label }}
            </option>
          </select>
        </label>

        <label class="card-list__field card-list__field--checkbox">
          <span>{{ t('table.must') }}</span>
          <input
            type="checkbox"
            :checked="row.must"
            @change="updateMust(row.id, ($event.target as HTMLInputElement).checked)"
          />
        </label>

        <label class="card-list__field">
          <span>{{ t('table.comment') }}</span>
          <input
            class="card-list__input"
            type="text"
            :placeholder="t('placeholders.comment')"
            :value="row.comment ?? ''"
            @input="updateComment(row.id, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="card-list__field card-list__field--checkbox">
          <span>{{ t('table.paidFlag') }}</span>
          <input
            type="checkbox"
            :checked="row.paidFlag"
            @change="updatePaidFlag(row.id, ($event.target as HTMLInputElement).checked)"
          />
        </label>

        <label class="card-list__field">
          <span>{{ t('table.paid') }}</span>
          <input
            class="card-list__input"
            type="text"
            inputmode="decimal"
            :placeholder="t('placeholders.paid')"
            :value="row.paidIRT !== undefined ? formattedUnitValue(row.paidIRT, row.inputUnit) : ''"
            @blur="handlePaidBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="card-list__field">
          <span>{{ t('table.kind') }}</span>
          <select
            class="card-list__select"
            :value="row.kind"
            @change="updateKind(row.id, ($event.target as HTMLSelectElement).value as Kind)"
          >
            <option v-for="kind in kindOptions" :key="kind.value" :value="kind.value">
              {{ kind.label }}
            </option>
          </select>
        </label>

        <div class="card-list__field card-list__field--pending">
          <span>{{ t('table.pending') }}</span>
          <strong>{{ displayPending(pendingById[row.id] ?? 0, row.inputUnit) }}</strong>
        </div>
      </div>

      <footer class="card-list__footer">
        <button type="button" class="card-list__action" @click="duplicateRow(row.id)">
          {{ t('table.duplicate') }}
        </button>
        <button
          type="button"
          class="card-list__action card-list__action--danger"
          @click="removeRow(row.id)"
        >
          {{ t('table.delete') }}
        </button>
      </footer>
    </article>

    <p v-if="!monthRows.length" class="card-list__empty">{{ t('feedback.noRows') }}</p>
  </section>
</template>

<style scoped>
.card-list {
  display: grid;
  gap: 1rem;
}

.card-list__card {
  border-radius: 1.25rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}

.card-list__card::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  inset-block-end: 0;
  inline-size: 4px;
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.8), rgba(59, 130, 246, 0.8));
}

.card-list__card[data-kind='income']::before {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.8), rgba(34, 197, 94, 0.8));
}

.card-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-list__title {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--rk-color-foreground, #0f172a);
}

.card-list__title:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(34, 211, 238, 0.45);
  border-radius: 0.75rem;
}

.card-list__badge {
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(34, 211, 238, 0.18);
}

.card-list__badge[data-kind='income'] {
  background: rgba(16, 185, 129, 0.18);
}

.card-list__grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.card-list__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--rk-color-muted-foreground, #64748b);
}

.card-list__field--checkbox {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.card-list__field--pending strong {
  font-size: 1.05rem;
  color: var(--rk-color-foreground, #0f172a);
}

.card-list__input,
.card-list__select {
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
}

.card-list__input:focus-visible,
.card-list__select:focus-visible {
  outline: 2px solid rgba(34, 211, 238, 0.45);
}

.card-list__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.card-list__action {
  border: none;
  border-radius: 999px;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  background: rgba(34, 211, 238, 0.18);
  color: var(--rk-color-foreground, #0f172a);
}

.card-list__action--danger {
  background: rgba(239, 68, 68, 0.18);
  color: #b91c1c;
}

.card-list__empty {
  text-align: center;
  padding: 1rem;
  color: var(--rk-color-muted-foreground, #64748b);
}
</style>
