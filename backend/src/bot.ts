// Telegram Bot Service
// This file handles all Telegram bot interactions using Telegraf
// Provides commands for creating and managing escrow transactions

import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// BOT INITIALIZATION
// ============================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';

if (!BOT_TOKEN) {
    throw new Error('❌ TELEGRAM_BOT_TOKEN is not defined in .env file');
}

// Initialize Telegraf bot
export const bot = new Telegraf(BOT_TOKEN);

// ============================================
// MIDDLEWARE - Logging
// ============================================

// Log all incoming messages for debugging
bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`[BOT] Response time: ${ms}ms`);
});

// ============================================
// COMMAND HANDLERS
// ============================================

/**
 * /start command
 * Welcomes the user and shows main menu
 */
bot.command('start', async (ctx: Context) => {
    const userName = ctx.from?.first_name || 'User';

    await ctx.reply(
        `👋 Welcome to TON Escrow Bot, ${userName}!\n\n` +
        `🔒 This bot helps you create secure escrow transactions on the TON blockchain.\n\n` +
        `💡 How it works:\n` +
        `1️⃣ Click "Create Escrow" to start\n` +
        `2️⃣ Connect your Tonkeeper wallet\n` +
        `3️⃣ Send TON to the smart contract\n` +
        `4️⃣ When the deal completes:\n` +
        `   • 97% goes to the receiver\n` +
        `   • 3% platform commission\n\n` +
        `🚀 Let's get started!`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🆕 Create Escrow', `${WEBAPP_URL}`)],
            [Markup.button.callback('📋 My Escrows', 'my_escrows')],
            [Markup.button.callback('ℹ️ Help', 'help')]
        ])
    );
});

/**
 * /help command
 * Shows help information
 */
bot.command('help', async (ctx: Context) => {
    await ctx.reply(
        `📖 TON Escrow Bot - Help\n\n` +
        `Available Commands:\n` +
        `/start - Start the bot and create escrow\n` +
        `/help - Show this help message\n` +
        `/myescrows - View your active escrows\n` +
        `/about - About the bot\n\n` +
        `🔐 Security Features:\n` +
        `✅ Blockchain-secured transactions\n` +
        `✅ Automatic deadline-based refunds\n` +
        `✅ Transparent 3% commission\n` +
        `✅ Non-custodial (you control your wallet)\n\n` +
        `💬 Need assistance? Contact @support`
    );
});

/**
 * /about command
 * Shows information about the bot
 */
bot.command('about', async (ctx: Context) => {
    await ctx.reply(
        `ℹ️ About TON Escrow Bot\n\n` +
        `Version: 1.0.0\n` +
        `Network: TON Blockchain\n` +
        `Commission: 3%\n\n` +
        `🔗 Smart Contract Features:\n` +
        `• Secure fund holding\n` +
        `• Automatic commission split\n` +
        `• Deadline-based refunds\n` +
        `• Transparent on-chain transactions\n\n` +
        `💼 Commission Wallet:\n` +
        `UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj\n\n` +
        `Built with ❤️ using Tact & TON SDK`
    );
});

/**
 * /myescrows command
 * Shows user's active escrows
 */
bot.command('myescrows', async (ctx: Context) => {
    // In production, this would fetch from database
    await ctx.reply(
        `📋 Your Escrows\n\n` +
        `You currently have no active escrows.\n\n` +
        `Create a new escrow to get started!`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🆕 Create Escrow', `${WEBAPP_URL}`)]
        ])
    );
});

// ============================================
// CALLBACK QUERY HANDLERS
// ============================================

/**
 * Handle "My Escrows" button click
 */
bot.action('my_escrows', async (ctx) => {
    await ctx.answerCbQuery();

    // In production, fetch user's escrows from database
    await ctx.editMessageText(
        `📋 Your Active Escrows\n\n` +
        `You currently have no active escrows.\n\n` +
        `💡 Tip: Create a new escrow from the main menu!`,
        Markup.inlineKeyboard([
            [Markup.button.callback('« Back to Menu', 'back_to_menu')]
        ])
    );
});

/**
 * Handle "Help" button click
 */
bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
        `📖 How to Use TON Escrow Bot\n\n` +
        `1️⃣ Click "Create Escrow"\n` +
        `   • Opens web interface\n\n` +
        `2️⃣ Connect Tonkeeper Wallet\n` +
        `   • Click "Connect Wallet"\n` +
        `   • Approve connection\n\n` +
        `3️⃣ Enter Escrow Details\n` +
        `   • Beneficiary wallet address\n` +
        `   • Amount to escrow\n` +
        `   • Deadline for refund\n\n` +
        `4️⃣ Send Transaction\n` +
        `   • Review and confirm\n` +
        `   • Wait for blockchain confirmation\n\n` +
        `5️⃣ Release or Refund\n` +
        `   • Release: 97% to beneficiary + 3% commission\n` +
        `   • Refund: After deadline, get 100% back\n\n` +
        `🔒 All transactions are secured by TON smart contracts!`,
        Markup.inlineKeyboard([
            [Markup.button.callback('« Back to Menu', 'back_to_menu')]
        ])
    );
});

/**
 * Handle "Back to Menu" button
 */
bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();

    const userName = ctx.from?.first_name || 'User';

    await ctx.editMessageText(
        `👋 Welcome back, ${userName}!\n\n` +
        `🔒 Create secure escrow transactions on TON blockchain.\n\n` +
        `Choose an option below:`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🆕 Create Escrow', `${WEBAPP_URL}`)],
            [Markup.button.callback('📋 My Escrows', 'my_escrows')],
            [Markup.button.callback('ℹ️ Help', 'help')]
        ])
    );
});

// ============================================
// TEXT MESSAGE HANDLERS
// ============================================

/**
 * Handle any text message
 * Provides helpful response
 */
bot.on('text', async (ctx: Context) => {
    await ctx.reply(
        `👋 Hello! I'm the TON Escrow Bot.\n\n` +
        `Use /start to begin or /help for assistance.`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Get Started', 'back_to_menu')]
        ])
    );
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Global error handler
 */
bot.catch((err, ctx) => {
    console.error(`[BOT ERROR] ${err}`);
    ctx.reply('❌ An error occurred. Please try again or contact support.');
});

// ============================================
// BOT LAUNCH
// ============================================

/**
 * Start the bot in polling mode
 * For production, use webhooks instead
 */
export async function launchBot() {
    try {
        // Enable graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));

        // Start bot
        await bot.launch();

        console.log('✅ Telegram bot started successfully!');
        console.log(`📱 Bot username: @${bot.botInfo?.username}`);
        console.log(`🌐 WebApp URL: ${WEBAPP_URL}`);
    } catch (error) {
        console.error('❌ Failed to start Telegram bot:', error);
        throw error;
    }
}

/**
 * Set webhook for production
 * Call this instead of launchBot() in production
 */
export async function setWebhook(url: string) {
    try {
        await bot.telegram.setWebhook(url);
        console.log(`✅ Webhook set to: ${url}`);
    } catch (error) {
        console.error('❌ Failed to set webhook:', error);
        throw error;
    }
}

export default bot;
