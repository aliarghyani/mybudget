import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';

function applyDir(language: 'en' | 'fa') {
  const dir = language === 'fa' ? 'rtl' : 'ltr';
  const htmlEl = document?.documentElement;
  const body = document?.body;

  if (htmlEl) {
    htmlEl.setAttribute('dir', dir);
    htmlEl.setAttribute('lang', language);
  }

  if (body) {
    body.classList.remove('rtl', 'ltr');
    body.classList.add(dir);
  }
}

export function useRtl() {
  const { locale } = useI18n();
  const settingsStore = useSettingsStore();
  const { settings } = storeToRefs(settingsStore);

  const update = (language: 'en' | 'fa') => {
    locale.value = language;
    applyDir(language);
  };

  onMounted(() => update(settings.value.language));

  watch(
    () => settings.value.language,
    (language) => {
      update(language);
    }
  );
}
