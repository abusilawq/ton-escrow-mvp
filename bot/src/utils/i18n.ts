// Internationalization utility for multilingual support
import fs from 'fs';
import path from 'path';

export type Language = 'uz' | 'en' | 'ru';

interface Translations {
  [key: string]: string;
}

class I18n {
  private translations: Map<Language, Translations> = new Map();

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations(): void {
    const languages: Language[] = ['uz', 'en', 'ru'];

    languages.forEach(lang => {
      try {
        const filePath = path.join(__dirname, '../locales', `${lang}.json`);
        const content = fs.readFileSync(filePath, 'utf-8');
        this.translations.set(lang, JSON.parse(content));
      } catch (error) {
        console.error(`Error loading ${lang} translations:`, error);
      }
    });
  }

  t(key: string, lang: Language = 'en', params?: Record<string, string | number>): string {
    const translations = this.translations.get(lang);

    if (!translations) {
      console.warn(`Language ${lang} not found`);
      return key;
    }

    let text = translations[key] || key;

    // Replace parameters in text
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]));
      });
    }

    return text;
  }

  getLanguageName(lang: Language): string {
    const names = {
      uz: "🇺🇿 O'zbek",
      en: '🇬🇧 English',
      ru: '🇷🇺 Русский'
    };
    return names[lang];
  }
}

export const i18n = new I18n();
