// Start command and language selection handler
import { Context, Markup } from 'telegraf';
import { i18n, Language } from '../utils/i18n';
import { DatabaseManager } from '../database/schema';

export class StartHandler {
  constructor(private db: DatabaseManager) {}

  async handleStart(ctx: Context): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      // Get or create user
      const user = this.db.getUser(telegramId);

      if (!user) {
        // New user - show language selection
        await this.showLanguageSelection(ctx);
      } else {
        // Existing user - show main menu
        await this.showMainMenu(ctx, user.language as Language);
      }
    } catch (error) {
      console.error('Error in start handler:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  }

  async showLanguageSelection(ctx: Context): Promise<void> {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🇺🇿 O\'zbek', 'lang_uz')],
      [Markup.button.callback('🇬🇧 English', 'lang_en')],
      [Markup.button.callback('🇷🇺 Русский', 'lang_ru')]
    ]);

    await ctx.reply(
      i18n.t('welcome', 'en'),
      keyboard
    );
  }

  async handleLanguageSelection(ctx: Context, lang: Language): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      // Create or update user with selected language
      this.db.createOrUpdateUser(telegramId, {
        telegram_id: telegramId,
        username: ctx.from?.username,
        first_name: ctx.from?.first_name,
        last_name: ctx.from?.last_name,
        language: lang
      });

      this.db.updateUserLanguage(telegramId, lang);

      // Acknowledge language selection
      await ctx.answerCbQuery();
      await ctx.editMessageText(i18n.t('language_selected', lang));

      // Show main menu
      await this.showMainMenu(ctx, lang);
    } catch (error) {
      console.error('Error handling language selection:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  }

  async showMainMenu(ctx: Context, lang: Language): Promise<void> {
    const keyboard = Markup.keyboard([
      [i18n.t('btn_create_escrow', lang)],
      [i18n.t('btn_my_deals', lang)],
      [i18n.t('btn_help', lang), i18n.t('btn_settings', lang)]
    ]).resize();

    await ctx.reply(
      i18n.t('main_menu', lang),
      keyboard
    );
  }
}
