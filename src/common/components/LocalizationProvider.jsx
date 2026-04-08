import { createContext, use, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import usePersistedState from '../util/usePersistedState';

import en from '../../resources/l10n/en.json';
import 'dayjs/locale/en';
import hi from '../../resources/l10n/hi.json';
import 'dayjs/locale/hi';
import th from '../../resources/l10n/th.json';
import 'dayjs/locale/th';
import zh from '../../resources/l10n/zh.json';
import 'dayjs/locale/zh';

const languages = {
  en: { data: en, country: 'US', name: 'English' },
  th: { data: th, country: 'TH', name: 'ไทย' },
  zh: { data: zh, country: 'CN', name: '中文' },
  hi: { data: hi, country: 'IN', name: 'हिन्दी' },
};

const getDefaultLanguage = () => {
  const browserLanguages = window.navigator.languages ? window.navigator.languages.slice() : [];
  const browserLanguage = window.navigator.userLanguage || window.navigator.language;
  browserLanguages.push(browserLanguage);
  browserLanguages.push(browserLanguage.substring(0, 2));

  for (let i = 0; i < browserLanguages.length; i += 1) {
    let language = browserLanguages[i].replace('-', '_');
    if (language in languages) {
      return language;
    }
    if (language.length > 2) {
      language = language.substring(0, 2);
      if (language in languages) {
        return language;
      }
    }
  }
  return 'en';
};

const LocalizationContext = createContext({
  languages,
  language: 'en',
  setLocalLanguage: () => {},
});

export const LocalizationProvider = ({ children }) => {
  const remoteLanguage = useSelector((state) => {
    const serverLanguage = state.session.server?.attributes?.language;
    const userLanguage = state.session.user?.attributes?.language;
    const targetLanguage = userLanguage || serverLanguage;
    return targetLanguage && targetLanguage in languages ? targetLanguage : null;
  });

  const [localLanguage, setLocalLanguage] = usePersistedState('language', getDefaultLanguage());

  const language = remoteLanguage || localLanguage;

  const direction = /^(ar|he|fa)$/.test(language) ? 'rtl' : 'ltr';

  const value = useMemo(
    () => ({ languages, language, setLocalLanguage, direction }),
    [language, setLocalLanguage, direction],
  );

  useEffect(() => {
    let selected;
    if (language.length > 2) {
      selected = `${language.slice(0, 2)}-${language.slice(-2).toLowerCase()}`;
    } else {
      selected = language;
    }
    dayjs.locale(selected);
    document.dir = direction;
  }, [language, direction]);

  return <LocalizationContext value={value}>{children}</LocalizationContext>;
};

export const useLocalization = () => use(LocalizationContext);

export const useTranslation = () => {
  const context = use(LocalizationContext);
  const { data } = context.languages[context.language];
  return useMemo(() => (key) => data[key], [data]);
};

export const useTranslationKeys = (predicate) => {
  const context = use(LocalizationContext);
  const { data } = context.languages[context.language];
  return Object.keys(data).filter(predicate);
};
