<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle
} from 'reka-ui';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

function handleConfirm() {
  emit('confirm');
  open.value = false;
}

function handleCancel() {
  emit('cancel');
  open.value = false;
}
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <slot name="trigger" />
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 bg-slate-900/60" />
      <AlertDialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[min(90vw,360px)] rounded-2xl p-6 shadow-2xl bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 grid gap-4" role="alertdialog">
        <AlertDialogTitle class="text-lg font-semibold">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription v-if="description" class="text-slate-600 dark:text-slate-400">
          {{ description }}
        </AlertDialogDescription>
        <div class="flex items-center justify-end gap-2">
          <AlertDialogCancel class="min-w-24 rounded-full px-4 py-2 bg-slate-200/70 hover:bg-slate-300/60 dark:bg-slate-700/60 dark:hover:bg-slate-700" type="button" @click="handleCancel">
            {{ cancelLabel }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="min-w-24 rounded-full px-4 py-2 text-white"
            :class="destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'"
            type="button"
            @click="handleConfirm"
          >
            {{ confirmLabel }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
