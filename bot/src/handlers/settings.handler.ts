// Settings and help handler
import { Context, Markup } from 'telegraf';
import { i18n, Language } from '../utils/i18n';
import { DatabaseManager } from '../database/schema';

export class SettingsHandler {
  constructor(private db: DatabaseManager) {}

  async showSettings(ctx: Context, lang: Language): Promise<void> {
    try {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(i18n.t('btn_language', lang), 'change_language')],
        [Markup.button.callback(i18n.t('btn_back', lang), 'back_to_menu')]
      ]);

      await ctx.reply(
        i18n.t('settings_text', lang),
        keyboard
      );
    } catch (error) {
      console.error('Error showing settings:', error);
      await ctx.reply(i18n.t('error_occurred', lang, { error: String(error) }));
    }
  }

  async showLanguageSettings(ctx: Context): Promise<void> {
    try {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🇺🇿 O\'zbek', 'lang_uz')],
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
        [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
        [Markup.button.callback('◀️ Back', 'back_to_settings')]
      ]);

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        i18n.t('select_language', 'en'),
        keyboard
      );
    } catch (error) {
      console.error('Error showing language settings:', error);
    }
  }

  async changeLanguage(ctx: Context, newLang: Language): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      // Update language in database
      this.db.updateUserLanguage(telegramId, newLang);

      await ctx.answerCbQuery();
      await ctx.editMessageText(i18n.t('language_selected', newLang));

      // Show main menu in new language
      const keyboard = Markup.keyboard([
        [i18n.t('btn_create_escrow', newLang)],
        [i18n.t('btn_my_deals', newLang)],
        [i18n.t('btn_help', newLang), i18n.t('btn_settings', newLang)]
      ]).resize();

      await ctx.reply(i18n.t('main_menu', newLang), keyboard);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  async showHelp(ctx: Context, lang: Language): Promise<void> {
    try {
      await ctx.reply(i18n.t('help_text', lang));
    } catch (error) {
      console.error('Error showing help:', error);
      await ctx.reply(i18n.t('error_occurred', lang, { error: String(error) }));
    }
  }

  async backToMenu(ctx: Context, lang: Language): Promise<void> {
    try {
      await ctx.answerCbQuery();

      const keyboard = Markup.keyboard([
        [i18n.t('btn_create_escrow', lang)],
        [i18n.t('btn_my_deals', lang)],
        [i18n.t('btn_help', lang), i18n.t('btn_settings', lang)]
      ]).resize();

      await ctx.editMessageText(i18n.t('main_menu', lang));
      await ctx.reply(i18n.t('main_menu', lang), keyboard);
    } catch (error) {
      console.error('Error going back to menu:', error);
    }
  }

  async backToSettings(ctx: Context, lang: Language): Promise<void> {
    try {
      await ctx.answerCbQuery();

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(i18n.t('btn_language', lang), 'change_language')],
        [Markup.button.callback(i18n.t('btn_back', lang), 'back_to_menu')]
      ]);

      await ctx.editMessageText(
        i18n.t('settings_text', lang),
        keyboard
      );
    } catch (error) {
      console.error('Error going back to settings:', error);
    }
  }
}
