// User middleware to ensure user exists and inject language
import { Context } from 'telegraf';
import { DatabaseManager } from '../database/schema';
import { Language } from '../utils/i18n';

export interface BotContext extends Context {
  userLang: Language;
  userId: number;
}

export function createUserMiddleware(db: DatabaseManager) {
  return async (ctx: Context, next: () => Promise<void>) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return next();

      // Get or create user
      let user = db.getUser(telegramId);

      if (!user) {
        user = db.createOrUpdateUser(telegramId, {
          telegram_id: telegramId,
          username: ctx.from?.username,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          language: 'en'
        });
      }

      // Inject user data into context
      (ctx as BotContext).userLang = user.language as Language;
      (ctx as BotContext).userId = telegramId;

      await next();
    } catch (error) {
      console.error('Error in user middleware:', error);
      await next();
    }
  };
}
