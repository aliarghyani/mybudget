import { useMagicKeys, whenever } from '@vueuse/core';
import { onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';

export function useKeyboardShortcuts() {
  const router = useRouter();
  const ledgerStore = useLedgerStore();
  const settingsStore = useSettingsStore();

  const keys = useMagicKeys({
    passive: false,
    onEventFired(event) {
      const key = event.key.toLowerCase();
      const isSaveCombo = (key === 's' && (event.ctrlKey || event.metaKey));
      if (isSaveCombo) {
        event.preventDefault();
      }
    }
  });

  const stops = [
    whenever(keys.n, () => {
      ledgerStore.addRow();
    }),
    whenever(keys['ctrl+s'], () => {
      ledgerStore.saveNow();
    }),
    whenever(keys['meta+s'], () => {
      ledgerStore.saveNow();
    }),
    whenever(keys['g+s'], () => {
      router.push({ name: 'settings' }).catch(() => {});
    }),
    whenever(keys['g+d'], () => {
      router.push({ name: 'dashboard' }).catch(() => {});
    }),
    whenever(keys.l, () => {
      settingsStore.toggleLanguage();
    })
  ];

  onUnmounted(() => {
    stops.forEach((stop) => stop?.());
  });
}
