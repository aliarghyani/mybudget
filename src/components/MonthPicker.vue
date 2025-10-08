<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger
} from 'reka-ui';
import type { DateValue } from '@internationalized/date';
import { CalendarDate, createCalendar, getLocalTimeZone, toCalendar, today } from '@internationalized/date';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t, locale } = useI18n();

const timeZone = getLocalTimeZone();

function withFirstDay(date: CalendarDate): CalendarDate {
  return date.set({ day: 1 });
}

function currentMonth(): string {
  const now = today(timeZone);
  return `${now.year}-${String(now.month).padStart(2, '0')}`;
}

function normalize(value: string): string {
  return /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

const sanitizedInitial = normalize(props.modelValue);
if (sanitizedInitial !== props.modelValue) {
  emit('update:modelValue', sanitizedInitial);
}

const displayLocale = computed(() => (locale.value === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US'));
const calendarKey = computed(() => (locale.value === 'fa' ? 'persian' : 'gregory'));
const calendarDir = computed(() => (locale.value === 'fa' ? 'rtl' : 'ltr'));

function toCalendarDate(value: string, targetCalendar: string): CalendarDate {
  const normalized = normalize(value);
  const [year, month] = normalized.split('-').map(Number);
  const base = new CalendarDate(year, month, 1);
  const target = toCalendar(base, createCalendar(targetCalendar)) as CalendarDate;
  return withFirstDay(target);
}

function toGregorian(date: CalendarDate): CalendarDate {
  return withFirstDay(toCalendar(date, createCalendar('gregory')) as CalendarDate);
}

function emitGregorianMonth(date: CalendarDate) {
  const normalized = new CalendarDate(date.year, date.month, 1);
  const value = `${normalized.year}-${String(normalized.month).padStart(2, '0')}`;
  selectedDate.value = toCalendarDate(value, calendarKey.value);
  emit('update:modelValue', value);
}

const selectedDate = ref<CalendarDate>(toCalendarDate(sanitizedInitial, calendarKey.value));

watch(
  () => props.modelValue,
  (value) => {
    selectedDate.value = toCalendarDate(value, calendarKey.value);
  }
);

watch(calendarKey, (key) => {
  const next = toCalendar(toGregorian(selectedDate.value), createCalendar(key)) as CalendarDate;
  selectedDate.value = withFirstDay(next);
});

const isOpen = ref(false);

const monthFormatter = computed(() => new Intl.DateTimeFormat(displayLocale.value, {
  calendar: calendarKey.value === 'persian' ? 'persian' : 'gregory',
  month: 'long',
  year: 'numeric'
}));

const triggerLabel = computed(() => monthFormatter.value.format(selectedDate.value.toDate(timeZone)));

function onCalendarSelect(value?: DateValue) {
  if (!value) return;
  const greg = toCalendar(value, createCalendar('gregory')) as CalendarDate;
  emitGregorianMonth(greg);
  isOpen.value = false;
}

function shiftMonth(delta: number) {
  const [year, month] = normalize(props.modelValue).split('-').map(Number);
  const base = new CalendarDate(year, month, 1);
  const next = base.add({ months: delta });
  emitGregorianMonth(next);
}
</script>

<template>
  <div
    class="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/85 px-3 py-1 dark:border-slate-700/60 dark:bg-slate-900/70"
    role="group"
    :aria-label="t('dashboard.monthGroupLabel')"
  >
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-full text-lg transition hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-700/60 dark:focus-visible:ring-offset-slate-900"
      :aria-label="t('dashboard.prevMonth')"
      @click="shiftMonth(-1)"
    >
      <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 4 6 8l4 4" />
      </svg>
    </button>
    <PopoverRoot v-model:open="isOpen">
      <PopoverTrigger as-child>
        <button
          type="button"
          :aria-label="t('dashboard.monthInputLabel')"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:bg-cyan-500/10 dark:text-slate-100 dark:focus-visible:ring-offset-slate-900 dark:hover:bg-cyan-500/20"
        >
          <span>{{ triggerLabel }}</span>
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m4 6 4 4 4-4" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          class="z-50 mt-2 w-[320px] rounded-xl border border-slate-200/70 bg-white p-4 shadow-xl outline-none dark:border-slate-700/60 dark:bg-slate-900"
          :side-offset="8"
        >
          <CalendarRoot
            v-slot="{ weekDays, grid }"
            :model-value="selectedDate"
            :locale="displayLocale"
            :dir="calendarDir"
            fixed-weeks
            @update:modelValue="onCalendarSelect"
            class="grid gap-3"
          >
            <CalendarHeader class="flex items-center justify-between">
              <CalendarPrev
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
                :aria-label="t('dashboard.prevMonth')"
              >
                <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 4 6 8l4 4" />
                </svg>
              </CalendarPrev>
              <CalendarHeading class="text-sm font-semibold text-slate-900 dark:text-slate-100" />
              <CalendarNext
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
                :aria-label="t('dashboard.nextMonth')"
              >
                <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 4 4 4-4 4" />
                </svg>
              </CalendarNext>
            </CalendarHeader>
            <CalendarGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="grid gap-1"
            >
              <CalendarGridHead>
                <CalendarGridRow class="grid grid-cols-7 gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CalendarHeadCell v-for="day in weekDays" :key="day" class="flex items-center justify-center">
                    {{ day }}
                  </CalendarHeadCell>
                </CalendarGridRow>
              </CalendarGridHead>
              <CalendarGridBody class="grid gap-1">
                <CalendarGridRow
                  v-for="(weekDates, rowIndex) in month.rows"
                  :key="`week-${rowIndex}`"
                  class="grid grid-cols-7 gap-1"
                >
                  <CalendarCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                  >
                    <CalendarCellTrigger
                      :day="weekDate"
                      :month="month.value"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[outside-view]:text-slate-300 data-[selected]:bg-cyan-500 data-[selected]:text-white data-[highlighted]:bg-cyan-100 dark:text-slate-200 dark:data-[outside-view]:text-slate-500 dark:data-[selected]:bg-cyan-400 dark:data-[selected]:text-slate-900 dark:data-[highlighted]:bg-cyan-500/20 dark:focus-visible:ring-offset-slate-900"
                    />
                  </CalendarCell>
                </CalendarGridRow>
              </CalendarGridBody>
            </CalendarGrid>
          </CalendarRoot>
          <PopoverArrow class="fill-white dark:fill-slate-900" />
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-full text-lg transition hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-700/60 dark:focus-visible:ring-offset-slate-900"
      :aria-label="t('dashboard.nextMonth')"
      @click="shiftMonth(1)"
    >
      <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 4 4 4-4 4" />
      </svg>
    </button>
  </div>
</template>
