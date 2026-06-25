import { useLanguageStore } from '../store/languageStore';
import { translations } from '../i18n/translations';

export function useT() {
  const { lang, setLang } = useLanguageStore();
  const T = translations[lang];
  return { T, lang, setLang };
}
