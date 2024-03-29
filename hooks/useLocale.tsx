import { useTranslation } from "react-i18next";

export default function useLocale() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const addResourceBundle = i18n.addResourceBundle;

  return { t, locale, addResourceBundle };
}
