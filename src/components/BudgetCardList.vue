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
import {
  CheckboxRoot,
  CheckboxIndicator,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator
} from 'reka-ui';

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
  if (unit === 'USD') return result.toFixed(2);
  if (unit === 'IRM') return Number(result.toFixed(3)).toString();
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
  <section class="grid gap-4">
    <article
      v-for="row in monthRows"
      :key="row.id"
      class="relative overflow-hidden rounded-2xl p-4 bg-white/85 dark:bg-slate-900/70 shadow-[0_12px_30px_rgba(15,23,42,.12)] grid gap-3"
      :data-kind="row.kind"
    >
      <div class="absolute inset-y-0 left-0 w-1.5" :class="row.kind === 'income' ? 'bg-gradient-to-b from-emerald-500 to-green-500' : 'bg-gradient-to-b from-cyan-500 to-sky-500'" />
      <header class="flex items-center justify-between gap-3">
        <input
          class="flex-1 bg-transparent text-[1.05rem] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 rounded-lg px-1"
          type="text"
          :placeholder="t('placeholders.title')"
          :value="row.title"
          @input="updateTitle(row.id, ($event.target as HTMLInputElement).value)"
        />
        <span class="px-3 py-1 rounded-full text-[0.75rem] font-semibold uppercase" :class="row.kind === 'income' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'">
          {{ row.kind === 'income' ? t('kinds.income') : t('kinds.expense') }}
        </span>
      </header>

      <div class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
        <label class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.planned') }}</span>
          <input
            class="rounded-lg border border-slate-300/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800 px-3 py-2 text-[0.95rem] text-slate-900 dark:text-slate-100"
            type="text"
            inputmode="decimal"
            :value="formattedUnitValue(row.plannedIRT, row.inputUnit)"
            @blur="handlePlannedBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.unit') }}</span>
          <SelectRoot :model-value="row.inputUnit" @update:modelValue="(val: any) => updateUnit(row.id, val)">
            <SelectTrigger class="w-full rounded-lg border border-slate-300/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800 px-3 py-2 text-left">
              <SelectValue />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent class="z-50 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-lg">
                <SelectViewport class="p-1">
                  <SelectItem v-for="unit in unitOptions" :key="unit.value" :value="unit.value" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                    <SelectItemIndicator>✓</SelectItemIndicator>
                    <SelectItemText>{{ unit.label }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </label>

        <label class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.must') }}</span>
          <div class="flex justify-end">
            <CheckboxRoot
              :model-value="row.must"
              class="inline-grid place-items-center w-5 h-5 rounded border border-slate-400/60 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              @update:modelValue="(v: any) => updateMust(row.id, v === true)"
            >
              <CheckboxIndicator class="text-white">✓</CheckboxIndicator>
            </CheckboxRoot>
          </div>
        </label>

        <label class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.comment') }}</span>
          <input
            class="rounded-lg border border-slate-300/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800 px-3 py-2 text-[0.95rem] text-slate-900 dark:text-slate-100"
            type="text"
            :placeholder="t('placeholders.comment')"
            :value="row.comment ?? ''"
            @input="updateComment(row.id, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.paidFlag') }}</span>
          <div class="flex justify-end">
            <CheckboxRoot
              :model-value="row.paidFlag"
              class="inline-grid place-items-center w-5 h-5 rounded border border-slate-400/60 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              @update:modelValue="(v: any) => updatePaidFlag(row.id, v === true)"
            >
              <CheckboxIndicator class="text-white">✓</CheckboxIndicator>
            </CheckboxRoot>
          </div>
        </label>

        <label class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.paid') }}</span>
          <input
            class="rounded-lg border border-slate-300/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800 px-3 py-2 text-[0.95rem] text-slate-900 dark:text-slate-100"
            type="text"
            inputmode="decimal"
            :placeholder="t('placeholders.paid')"
            :value="row.paidIRT !== undefined ? formattedUnitValue(row.paidIRT, row.inputUnit) : ''"
            @blur="handlePaidBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.kind') }}</span>
          <SelectRoot :model-value="row.kind" @update:modelValue="(val: any) => updateKind(row.id, val)">
            <SelectTrigger class="w-full rounded-lg border border-slate-300/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800 px-3 py-2 text-left">
              <SelectValue />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent class="z-50 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-lg">
                <SelectViewport class="p-1">
                  <SelectItem v-for="opt in kindOptions" :key="opt.value" :value="opt.value" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                    <SelectItemIndicator>✓</SelectItemIndicator>
                    <SelectItemText>{{ opt.label }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </label>

        <div class="grid gap-1 text-[0.85rem] text-slate-500 dark:text-slate-400">
          <span>{{ t('table.pending') }}</span>
          <strong class="text-[1.05rem] text-slate-900 dark:text-slate-100">{{ displayPending(pendingById[row.id] ?? 0, row.inputUnit) }}</strong>
        </div>
      </div>

      <footer class="flex items-center justify-end gap-2">
        <button type="button" class="px-3 py-1.5 rounded-full text-[0.85rem] bg-cyan-200/30 hover:bg-cyan-200/50" @click="duplicateRow(row.id)">
          {{ t('table.duplicate') }}
        </button>
        <button type="button" class="px-3 py-1.5 rounded-full text-[0.85rem] bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25" @click="removeRow(row.id)">
          {{ t('table.delete') }}
        </button>
      </footer>
    </article>

    <p v-if="!monthRows.length" class="text-center p-4 text-slate-500">{{ t('feedback.noRows') }}</p>
  </section>
</template>

