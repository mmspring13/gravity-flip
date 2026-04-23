export type Language = 'en' | 'ru';

export const dictionary = {
  en: {
    TITLE: 'GRAVITY FLIP',
    START_PROMPT: '> START GAME <',
    FREEZE: 'FREEZE!',
    IMMORTAL: 'IMMORTAL!',
    FINISHED_GAME: 'FINISHED GAME',
    SYSTEM_FAILURE: 'SYSTEM FAILURE',
    BEST_SCORE: '🌟 BEST: ',
    REBOOT: '> REBOOT <',
    SPEED_UP: 'SPEED UP!',
    ZONE_CLEARED: 'ZONE CLEARED!',
    BIOME_CYBER: 'CYBER ABYSS',
    BIOME_VAPOR: 'VAPORWAVE',
    BIOME_TOXIC: 'TOXIC CORE',
    BIOME_BLOOD: 'BLOOD MOON',
    BIOME_GOLD:  'GOLDEN HOUR',
  },
  ru: {
    TITLE: 'ГРАВИТАЦИЯ',
    START_PROMPT: '> НАЧАТЬ ИГРУ <',
    FREEZE: 'ЗАМОРОЗКА!',
    IMMORTAL: 'БЕССМЕРТИЕ!',
    FINISHED_GAME: 'ИГРА ПРОЙДЕНА',
    SYSTEM_FAILURE: 'СИСТЕМНЫЙ СБОЙ',
    BEST_SCORE: '🌟 РЕКОРД: ',
    REBOOT: '> ПЕРЕЗАГРУЗКА <',
    SPEED_UP: 'УСКОРЕНИЕ!',
    ZONE_CLEARED: 'СЕКТОР ПРОЙДЕН!',
    BIOME_CYBER: 'КИБЕР-БЕЗДНА',
    BIOME_VAPOR: 'ВЕЙПОРВЕЙВ',
    BIOME_TOXIC: 'ТОКСИЧНОЕ ЯДРО',
    BIOME_BLOOD: 'КРОВАВАЯ ЛУНА',
    BIOME_GOLD:  'ЗОЛОТОЕ ВРЕМЯ',
  }
};

export const languages: Language[] = Object.keys(dictionary) as Language[];

let currentLanguage: Language = 'en';

export function isValidLanguage(lang: string): lang is Language {
  return (languages as string[]).includes(lang);
}

export function initLanguage(lang?: Language | null) {
  if (lang && isValidLanguage(lang)) {
    currentLanguage = lang
  }
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === 'ru') {
      currentLanguage = 'ru';
    }
  }
}

export function toggleLanguage(): Language {
  currentLanguage = currentLanguage === 'en' ? 'ru' : 'en';
  return currentLanguage;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: keyof typeof dictionary.en): string {
  return dictionary[currentLanguage][key] || dictionary.en[key];
}
