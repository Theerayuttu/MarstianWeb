import { createContext, use, useEffect, useMemo, Suspense } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import usePersistedState from '../util/usePersistedState';
import Loader from './Loader';

import en from '../../resources/l10n/en.json';
import 'dayjs/locale/en';

const localeLoaders = import.meta.glob('../../resources/l10n/*.json');

const dayjsLoaders = {
  en: () => Promise.resolve({ default: { name: 'en' } }),
  hi: () => import('dayjs/locale/hi.js'),
  th: () => import('dayjs/locale/th.js'),
  zh: () => import('dayjs/locale/zh.js'),
};

const languages = {
  en: { country: 'US', name: 'English' },
  th: { country: 'TH', name: 'ไทย' },
  zh: { country: 'CN', name: '中文' },
  hi: { country: 'IN', name: 'हिन्दी' },
};

const cache = new Map([['en', Promise.resolve({ data: en, dayjsName: 'en' })]]);

const loadLocale = (language) => {
  if (!cache.has(language)) {
    const dataLoader = localeLoaders[`../../resources/l10n/${language}.json`];
    const dayjsLoader = dayjsLoaders[language];
    cache.set(
      language,
      Promise.all([dataLoader(), dayjsLoader()]).then(([dataMod, dayjsMod]) => ({
        data: dataMod.default,
        dayjsName: dayjsMod.default.name,
      })),
    );
  }
  return cache.get(language);
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
  direction: 'ltr',
});

const ResolvedLocalizationProvider = ({ language, setLocalLanguage, children }) => {
  const { data, dayjsName } = use(loadLocale(language));

  const direction = /^(ar|he|fa)$/.test(language) ? 'rtl' : 'ltr';

  const value = useMemo(
    () => ({
      languages: { ...languages, [language]: { ...languages[language], data } },
      language,
      setLocalLanguage,
      direction,
    }),
    [language, data, setLocalLanguage, direction],
  );

  useEffect(() => {
    dayjs.locale(dayjsName);
    document.dir = direction;
  }, [dayjsName, direction]);

  return <LocalizationContext value={value}>{children}</LocalizationContext>;
};

export const LocalizationProvider = ({ children }) => {
  const remoteLanguage = useSelector((state) => {
    const serverLanguage = state.session.server?.attributes?.language;
    const userLanguage = state.session.user?.attributes?.language;
    const targetLanguage = userLanguage || serverLanguage;
    return targetLanguage && targetLanguage in languages ? targetLanguage : null;
  });

  const [localLanguage, setLocalLanguage] = usePersistedState('language', getDefaultLanguage());

  const language = remoteLanguage || localLanguage;

  return (
    <Suspense fallback={<Loader />}>
      <ResolvedLocalizationProvider language={language} setLocalLanguage={setLocalLanguage}>
        {children}
      </ResolvedLocalizationProvider>
    </Suspense>
  );
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
