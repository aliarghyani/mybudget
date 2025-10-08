<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import { convertFromIrt, formatByUnit, parseMoney, type FiatUnit, type Kind } from '@/composables/useMoney';
import { useI18n } from 'vue-i18n';
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
const { monthRows, pendingById, isSaving } = storeToRefs(ledgerStore);
const { settings } = storeToRefs(settingsStore);
const { t, locale } = useI18n();

const cellPad = computed(() => (settings.value.density === 'compact' ? 'px-3 py-2' : 'px-4 py-3'));

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
  <div class="grid gap-3">
    <div class="inline-flex items-center gap-2 text-sm text-slate-500" role="status" aria-live="polite">
      <span class="inline-block w-2.5 h-2.5 rounded-full" :class="isSaving ? 'bg-amber-500' : 'bg-emerald-500'" />
      <span>{{ isSaving ? t('feedback.saving') : t('feedback.saved') }}</span>
    </div>
    <div class="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur overflow-x-auto">
      <table class="w-full min-w-[960px] border-collapse">
        <thead>
          <tr class="text-[0.8rem] uppercase tracking-wide text-slate-500">
            <th scope="col" :class="cellPad + ' text-start'">{{ t('table.title') }}</th>
            <th scope="col" :class="cellPad + ' text-start'">{{ t('table.planned') }}</th>
            <th scope="col" :class="cellPad + ' text-start w-32'">{{ t('table.unit') }}</th>
            <th scope="col" :class="cellPad + ' text-center'">{{ t('table.must') }}</th>
            <th scope="col" :class="cellPad + ' text-start'">{{ t('table.comment') }}</th>
            <th scope="col" :class="cellPad + ' text-center'">{{ t('table.paidFlag') }}</th>
            <th scope="col" :class="cellPad + ' text-start'">{{ t('table.paid') }}</th>
            <th scope="col" :class="cellPad + ' text-start'">{{ t('table.pending') }}</th>
            <th scope="col" :class="cellPad + ' text-start'">{{ t('table.kind') }}</th>
            <th scope="col" :class="cellPad + ' text-start'">{{ t('table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in monthRows" :key="row.id" class="border-b border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
            <td :class="cellPad">
              <input
                :data-row-id="row.id"
                data-focus-index="0"
                class="w-full rounded-lg border border-slate-200/60 bg-white/90 px-3 py-2 text-[0.95rem] text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-offset-slate-900"
                type="text"
                :placeholder="t('placeholders.title')"
                :value="row.title"
                @input="updateTitle(row.id, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 0)"
              />
            </td>
            <td :class="cellPad">
              <input
                :data-row-id="row.id"
                data-focus-index="1"
                class="w-full rounded-lg border border-slate-200/60 bg-white/90 px-3 py-2 text-[0.95rem] text-end text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-offset-slate-900"
                type="text"
                inputmode="decimal"
                :value="formattedUnitValue(row.plannedIRT, row.inputUnit)"
                @blur="handlePlannedBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 1)"
              />
            </td>
            <td :class="cellPad + ' w-32'">
              <SelectRoot :model-value="row.inputUnit" @update:modelValue="(val: any) => updateUnit(row.id, val)">
                <SelectTrigger
                  :data-row-id="row.id"
                  data-focus-index="2"
                  class="w-full rounded-lg border border-slate-200/60 bg-white/90 px-2 py-1.5 text-left text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
                  @keydown="onKeyNavigation($event, row.id, 2)"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent class="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-lg">
                    <SelectViewport class="p-1">
                      <SelectItem v-for="unit in unitOptions" :key="unit.value" :value="unit.value" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                        <SelectItemIndicator class="flex h-4 w-4 items-center justify-center text-cyan-600">
                          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3.75 8.25 6.75 11.25 12.25 5.75" />
                          </svg>
                        </SelectItemIndicator>
                        <SelectItemText>{{ unit.label }}</SelectItemText>
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
            </td>
            <td :class="cellPad + ' text-center'">
              <CheckboxRoot
                :model-value="row.must"
                class="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-300/70 bg-white text-slate-600 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:focus-visible:ring-offset-slate-900 dark:data-[state=checked]:border-cyan-400"
                @update:modelValue="(v: any) => updateMust(row.id, v === true)"
                :data-row-id="row.id"
                data-focus-index="3"
                @keydown="onKeyNavigation($event, row.id, 3)"
              >
                <CheckboxIndicator class="pointer-events-none">
                  <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3.75 8.25 6.75 11.25 12.25 5.75" />
                  </svg>
                </CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td :class="cellPad">
              <input
                :data-row-id="row.id"
                data-focus-index="4"
                class="w-full rounded-lg border border-slate-200/60 bg-white/90 px-3 py-2 text-[0.95rem] text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-offset-slate-900"
                type="text"
                :placeholder="t('placeholders.comment')"
                :value="row.comment ?? ''"
                @input="updateComment(row.id, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 4)"
              />
            </td>
            <td :class="cellPad + ' text-center'">
              <CheckboxRoot
                :model-value="row.paidFlag"
                class="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-300/70 bg-white text-slate-600 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:focus-visible:ring-offset-slate-900 dark:data-[state=checked]:border-cyan-400"
                @update:modelValue="(v: any) => updatePaidFlag(row.id, v === true)"
                :data-row-id="row.id"
                data-focus-index="5"
                @keydown="onKeyNavigation($event, row.id, 5)"
              >
                <CheckboxIndicator class="pointer-events-none">
                  <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3.75 8.25 6.75 11.25 12.25 5.75" />
                  </svg>
                </CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td :class="cellPad">
              <input
                :data-row-id="row.id"
                data-focus-index="6"
                class="w-full rounded-lg border border-slate-200/60 bg-white/90 px-3 py-2 text-[0.95rem] text-end text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-offset-slate-900"
                type="text"
                inputmode="decimal"
                :value="row.paidIRT !== undefined ? formattedUnitValue(row.paidIRT, row.inputUnit) : ''"
                :placeholder="t('placeholders.paid')"
                @blur="handlePaidBlur(row.id, row.inputUnit, ($event.target as HTMLInputElement).value)"
                @keydown="onKeyNavigation($event, row.id, 6)"
              />
            </td>
            <td :class="cellPad + ' font-semibold text-slate-900 dark:text-slate-100'">
              {{ displayPending(pendingById[row.id] ?? 0, row.inputUnit) }}
            </td>
            <td :class="cellPad">
              <SelectRoot :model-value="row.kind" @update:modelValue="(val: any) => updateKind(row.id, val)">
                <SelectTrigger
                  :data-row-id="row.id"
                  data-focus-index="7"
                  class="w-full rounded-lg border border-slate-200/60 bg-white/90 px-2 py-1.5 text-left text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
                  @keydown="onKeyNavigation($event, row.id, 7)"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent class="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-lg">
                    <SelectViewport class="p-1">
                      <SelectItem v-for="opt in kindOptions" :key="opt.value" :value="opt.value" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                        <SelectItemIndicator class="flex h-4 w-4 items-center justify-center text-cyan-600">
                          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3.75 8.25 6.75 11.25 12.25 5.75" />
                          </svg>
                        </SelectItemIndicator>
                        <SelectItemText>{{ opt.label }}</SelectItemText>
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
            </td>
            <td :class="cellPad">
              <div class="flex items-center gap-2">
                <button
                  :data-row-id="row.id"
                  data-focus-index="8"
                  type="button"
                  class="px-3 py-1.5 rounded-full text-[0.85rem] bg-cyan-200/30 hover:bg-cyan-200/50"
                  @click="duplicateRow(row.id)"
                  @keydown="onKeyNavigation($event, row.id, 8)"
                >
                  {{ t('table.duplicate') }}
                </button>
                <button
                  :data-row-id="row.id"
                  data-focus-index="9"
                  type="button"
                  class="px-3 py-1.5 rounded-full text-[0.85rem] bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25"
                  @click="removeRow(row.id)"
                  @keydown="onKeyNavigation($event, row.id, 9)"
                >
                  {{ t('table.delete') }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!monthRows.length">
            <td class="px-4 py-6 text-center text-slate-500" colspan="10">
              {{ t('feedback.noRows') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
