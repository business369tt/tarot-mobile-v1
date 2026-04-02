"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AppLocale = "zh-TW" | "en";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  t: (zh: string, en: string) => string;
  inlineText: (value: string | null | undefined) => string;
};

const STORAGE_KEY = "tarot-mobile-locale";

const LocaleContext = createContext<LocaleContextValue | null>(null);

function pickInlineText(value: string | null | undefined, locale: AppLocale) {
  if (!value) {
    return "";
  }

  const slashParts = value.split(/\s+\/\s+/);

  if (slashParts.length >= 2) {
    const [zh, ...rest] = slashParts;
    const en = rest.join(" / ");
    return locale === "zh-TW" ? zh.trim() : en.trim() || zh.trim();
  }

  const fullWidthMatch = value.match(/^(.*)（([^（）]+)）$/);

  if (fullWidthMatch) {
    const zh = fullWidthMatch[1]?.trim() ?? value;
    const en = fullWidthMatch[2]?.trim() ?? zh;
    return locale === "zh-TW" ? zh : en;
  }

  const bracketMatch = value.match(/^(.*)\(([^()]+)\)$/);

  if (bracketMatch) {
    const zh = bracketMatch[1]?.trim() ?? value;
    const en = bracketMatch[2]?.trim() ?? zh;
    return locale === "zh-TW" ? zh : en;
  }

  return value;
}

export function LocaleProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [locale, setLocaleState] = useState<AppLocale>("zh-TW");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let frameId = 0;

    frameId = window.requestAnimationFrame(() => {
      const savedLocale = window.localStorage.getItem(STORAGE_KEY);

      if (savedLocale === "zh-TW" || savedLocale === "en") {
        setLocaleState(savedLocale);
      }

      setIsReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "zh-TW" ? "zh-Hant" : "en";
  }, [isReady, locale]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale: setLocaleState,
        t: (zh, en) => (locale === "zh-TW" ? zh : en),
        inlineText: (value) => pickInlineText(value, locale),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
