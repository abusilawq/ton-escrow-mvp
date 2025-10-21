// Main Telegram Bot Application
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import express from 'express';
import { DatabaseManager } from './database/schema';
import { StartHandler } from './handlers/start.handler';
import { EscrowHandler } from './handlers/escrow.handler';
import { SettingsHandler } from './handlers/settings.handler';
import { createUserMiddleware, BotContext } from './middleware/user.middleware';
import { i18n, Language } from './utils/i18n';

// Load environment variables
dotenv.config();

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = parseInt(process.env.PORT || '3002');
const WEBHOOK_URL = process.env.BOT_WEBHOOK_URL;
const DATABASE_PATH = process.env.DATABASE_PATH || './data/escrow.db';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env file');
  process.exit(1);
}

// Initialize database
const db = new DatabaseManager(DATABASE_PATH);

// Initialize bot
const bot = new Telegraf<BotContext>(BOT_TOKEN);

// Initialize handlers
const startHandler = new StartHandler(db);
const escrowHandler = new EscrowHandler(db);
const settingsHandler = new SettingsHandler(db);

// Apply middleware
bot.use(createUserMiddleware(db));

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.');
});

// Command handlers
bot.command('start', async (ctx) => {
  await startHandler.handleStart(ctx);
});

bot.command('help', async (ctx) => {
  const lang = (ctx as BotContext).userLang || 'en';
  await settingsHandler.showHelp(ctx, lang);
});

bot.command('settings', async (ctx) => {
  const lang = (ctx as BotContext).userLang || 'en';
  await settingsHandler.showSettings(ctx, lang);
});

bot.command('deals', async (ctx) => {
  const lang = (ctx as BotContext).userLang || 'en';
  await escrowHandler.showUserDeals(ctx, lang);
});

// Callback query handlers (inline buttons)
bot.action(/^lang_(uz|en|ru)$/, async (ctx) => {
  const lang = ctx.match[1] as Language;
  await startHandler.handleLanguageSelection(ctx, lang);
});

bot.action('change_language', async (ctx) => {
  await settingsHandler.showLanguageSettings(ctx);
});

bot.action('back_to_menu', async (ctx) => {
  const lang = (ctx as BotContext).userLang || 'en';
  await settingsHandler.backToMenu(ctx, lang);
});

bot.action('back_to_settings', async (ctx) => {
  const lang = (ctx as BotContext).userLang || 'en';
  await settingsHandler.backToSettings(ctx, lang);
});

bot.action('cancel_escrow', async (ctx) => {
  const lang = (ctx as BotContext).userLang || 'en';
  await escrowHandler.handleCancelCallback(ctx, lang);
});

// Text message handlers
bot.on('text', async (ctx) => {
  const lang = (ctx as BotContext).userLang || 'en';
  const text = ctx.message.text;
  const telegramId = ctx.from.id;

  // Check if user is creating an escrow
  if (escrowHandler.isCreatingEscrow(telegramId)) {
    await escrowHandler.handleEscrowInput(ctx, lang, text);
    return;
  }

  // Menu button handlers
  if (text === i18n.t('btn_create_escrow', lang)) {
    await escrowHandler.startEscrowCreation(ctx, lang);
  } else if (text === i18n.t('btn_my_deals', lang)) {
    await escrowHandler.showUserDeals(ctx, lang);
  } else if (text === i18n.t('btn_help', lang)) {
    await settingsHandler.showHelp(ctx, lang);
  } else if (text === i18n.t('btn_settings', lang)) {
    await settingsHandler.showSettings(ctx, lang);
  } else {
    // Unknown command
    await ctx.reply(i18n.t('main_menu', lang));
  }
});

// Express server for webhooks (optional)
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'TON Escrow Telegram Bot'
  });
});

// Webhook endpoint
if (WEBHOOK_URL) {
  app.post('/bot-webhook', (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
  });
}

// Start bot
async function startBot() {
  try {
    console.log('🚀 Starting TON Escrow Telegram Bot...');

    if (WEBHOOK_URL) {
      // Use webhook mode (for production)
      await bot.telegram.setWebhook(`${WEBHOOK_URL}/bot-webhook`);
      console.log(`✅ Bot is running in webhook mode: ${WEBHOOK_URL}`);

      app.listen(PORT, () => {
        console.log(`📡 Webhook server listening on port ${PORT}`);
      });
    } else {
      // Use polling mode (for development)
      await bot.launch();
      console.log('✅ Bot is running in polling mode');
    }

    console.log('🎉 TON Escrow Bot is ready!');
    console.log(`💰 Commission: ${process.env.COMMISSION_PERCENT}%`);
    console.log(`🏦 Commission Wallet: ${process.env.COMMISSION_WALLET}`);
    console.log(`🌐 Network: ${process.env.TON_NETWORK}`);

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('Received SIGINT, stopping bot...');
  bot.stop('SIGINT');
  db.close();
});

process.once('SIGTERM', () => {
  console.log('Received SIGTERM, stopping bot...');
  bot.stop('SIGTERM');
  db.close();
});

// Start the bot
startBot();

export { bot, db };
