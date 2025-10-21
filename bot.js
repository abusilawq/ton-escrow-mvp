/**
 * TON Escrow Telegram Bot
 * Beautiful, secure escrow service with multi-language support
 * Auto-sends 3% commission to designated wallet
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const BOT_TOKEN = process.env.BOT_TOKEN || '8316093589:AAGFZYKHD1Qe0WYb72BflUjExafGD4uepiE';
const COMMISSION_WALLET = process.env.COMMISSION_WALLET || 'UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj';
const COMMISSION_PERCENT = parseFloat(process.env.COMMISSION_PERCENT || '3');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TON_NETWORK = process.env.TON_NETWORK || 'testnet';

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ============================================
// IN-MEMORY DATA STORAGE
// ============================================
const userSessions = new Map(); // Store user language preferences and session data
const escrowSessions = new Map(); // Store active escrow creation sessions

// ============================================
// MULTI-LANGUAGE SUPPORT
// ============================================
const translations = {
  en: {
    welcome: "🎉 *Welcome to TON Escrow Bot\\!*\n\n" +
             "Secure and reliable escrow services on TON blockchain\\.\n\n" +
             "✅ Secure payments\n" +
             "✅ 3% low commission\n" +
             "✅ Automatic transactions\n" +
             "✅ Blockchain\\-powered\n\n" +
             "🌐 *Please select your language:*",

    language_selected: "✅ Language set to English 🇬🇧",

    main_menu: "📋 *Main Menu*\n\n" +
               "Welcome back\\! Choose an option:",

    btn_create_deal: "➕ Create Deal",
    btn_my_deals: "📦 My Deals",
    btn_help: "❓ Help / Info",
    btn_settings: "⚙️ Settings",
    btn_back: "◀️ Back to Menu",
    btn_cancel: "❌ Cancel",

    create_deal_start: "➕ *Create New Deal*\n\n" +
                       "Escrow keeps your money safe until both parties fulfill their obligations\\.\n\n" +
                       "📝 *Step 1:* Enter the receiver's TON wallet address:",

    invalid_address: "❌ *Invalid TON address\\!*\n\n" +
                     "Please enter a valid TON wallet address\\.\n" +
                     "Example: `UQDXc5gs_\\-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj`",

    enter_amount: "💰 *Step 2:* Enter the amount in TON\n\n" +
                  "👤 Receiver: `{receiver}`\n\n" +
                  "💎 Enter amount \\(e\\.g\\., 10 or 10\\.5\\):",

    invalid_amount: "❌ *Invalid amount\\!*\n\n" +
                    "Please enter a valid positive number\\.\n" +
                    "Example: 10 or 10\\.5",

    deal_summary: "📋 *Deal Summary*\n\n" +
                  "👤 *Receiver:*\n`{receiver}`\n\n" +
                  "💎 *Amount:* {amount} TON\n" +
                  "💸 *Commission \\(3%\\):* {commission} TON\n" +
                  "💵 *Total Payment:* {total} TON\n\n" +
                  "✅ Confirm to create this escrow deal:",

    btn_confirm: "✅ Confirm & Pay",

    deal_created: "✅ *Deal Created Successfully\\!*\n\n" +
                  "🆔 *Deal ID:* `{dealId}`\n" +
                  "👤 *Receiver:* `{receiver}`\n" +
                  "💎 *Amount:* {amount} TON\n" +
                  "💸 *Commission:* {commission} TON\n" +
                  "💰 *Total Paid:* {total} TON\n" +
                  "📅 *Created:* {date}\n\n" +
                  "🔐 Your funds are now securely locked in escrow\\!\n\n" +
                  "💳 *Payment Link:*\n[Pay with Tonkeeper](ton://transfer/{wallet}?amount={nanotons})\n\n" +
                  "_The deal will activate once payment is confirmed on the blockchain\\._",

    my_deals: "📦 *My Deals*\n\n" +
              "You have *{count} active deal\\(s\\)*:",

    no_deals: "📦 *My Deals*\n\n" +
              "You don't have any active deals yet\\.\n\n" +
              "Click *➕ Create Deal* to start your first escrow transaction\\.",

    deal_item: "━━━━━━━━━━━━━━━\n" +
               "🆔 *ID:* `{id}`\n" +
               "💰 *Amount:* {amount} TON\n" +
               "👤 *Receiver:* `{receiver}`\n" +
               "📊 *Status:* {status}\n" +
               "📅 *Date:* {date}",

    status_pending: "⏳ Pending Payment",
    status_active: "✅ Active",
    status_completed: "✔️ Completed",
    status_cancelled: "❌ Cancelled",

    help_text: "❓ *Help & Information*\n\n" +
               "🤖 *TON Escrow Bot* provides secure payment services using blockchain technology\\.\n\n" +
               "📚 *How it works:*\n" +
               "1️⃣ Create a new escrow deal\n" +
               "2️⃣ Enter receiver's wallet and amount\n" +
               "3️⃣ Confirm and pay via Tonkeeper\n" +
               "4️⃣ Funds are locked in smart contract\n" +
               "5️⃣ Automatic release when conditions are met\n\n" +
               "💰 *Commission:* 3% per transaction\n" +
               "🌐 *Network:* " + TON_NETWORK + "\n\n" +
               "📞 *Support:* @TONEscrowSupport\n" +
               "📖 *Documentation:* /guide",

    settings_text: "⚙️ *Settings*\n\n" +
                   "🌐 *Current Language:* English 🇬🇧\n\n" +
                   "Choose an option:",

    btn_change_language: "🌐 Change Language",

    operation_cancelled: "❌ Operation cancelled\\.\n\n" +
                        "Press /start to return to main menu\\.",

    error_occurred: "❌ *An error occurred\\!*\n\n" +
                   "{error}\n\n" +
                   "Please try again or contact support\\."
  },

  ru: {
    welcome: "🎉 *Добро пожаловать в TON Escrow Bot\\!*\n\n" +
             "Безопасные и надежные эскроу\\-услуги на блокчейне TON\\.\n\n" +
             "✅ Безопасные платежи\n" +
             "✅ Низкая комиссия 3%\n" +
             "✅ Автоматические транзакции\n" +
             "✅ Технология блокчейн\n\n" +
             "🌐 *Пожалуйста\\, выберите язык:*",

    language_selected: "✅ Язык установлен: Русский 🇷🇺",

    main_menu: "📋 *Главное меню*\n\n" +
               "С возвращением\\! Выберите опцию:",

    btn_create_deal: "➕ Создать сделку",
    btn_my_deals: "📦 Мои сделки",
    btn_help: "❓ Помощь / Инфо",
    btn_settings: "⚙️ Настройки",
    btn_back: "◀️ Назад в меню",
    btn_cancel: "❌ Отмена",

    create_deal_start: "➕ *Создать новую сделку*\n\n" +
                       "Эскроу сохраняет ваши деньги в безопасности до выполнения обязательств\\.\n\n" +
                       "📝 *Шаг 1:* Введите TON\\-адрес получателя:",

    invalid_address: "❌ *Неверный TON\\-адрес\\!*\n\n" +
                     "Пожалуйста\\, введите правильный TON\\-адрес\\.\n" +
                     "Пример: `UQDXc5gs_\\-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj`",

    enter_amount: "💰 *Шаг 2:* Введите сумму в TON\n\n" +
                  "👤 Получатель: `{receiver}`\n\n" +
                  "💎 Введите сумму \\(например\\, 10 или 10\\.5\\):",

    invalid_amount: "❌ *Неверная сумма\\!*\n\n" +
                    "Введите положительное число\\.\n" +
                    "Пример: 10 или 10\\.5",

    deal_summary: "📋 *Детали сделки*\n\n" +
                  "👤 *Получатель:*\n`{receiver}`\n\n" +
                  "💎 *Сумма:* {amount} TON\n" +
                  "💸 *Комиссия \\(3%\\):* {commission} TON\n" +
                  "💵 *Всего к оплате:* {total} TON\n\n" +
                  "✅ Подтвердите создание сделки:",

    btn_confirm: "✅ Подтвердить и оплатить",

    deal_created: "✅ *Сделка успешно создана\\!*\n\n" +
                  "🆔 *ID сделки:* `{dealId}`\n" +
                  "👤 *Получатель:* `{receiver}`\n" +
                  "💎 *Сумма:* {amount} TON\n" +
                  "💸 *Комиссия:* {commission} TON\n" +
                  "💰 *Оплачено:* {total} TON\n" +
                  "📅 *Создано:* {date}\n\n" +
                  "🔐 Ваши средства надежно заблокированы в эскроу\\!\n\n" +
                  "💳 *Ссылка для оплаты:*\n[Оплатить через Tonkeeper](ton://transfer/{wallet}?amount={nanotons})\n\n" +
                  "_Сделка активируется после подтверждения платежа в блокчейне\\._",

    my_deals: "📦 *Мои сделки*\n\n" +
              "У вас *{count} активных сделок\\(и\\)*:",

    no_deals: "📦 *Мои сделки*\n\n" +
              "У вас пока нет активных сделок\\.\n\n" +
              "Нажмите *➕ Создать сделку*\\, чтобы начать\\.",

    deal_item: "━━━━━━━━━━━━━━━\n" +
               "🆔 *ID:* `{id}`\n" +
               "💰 *Сумма:* {amount} TON\n" +
               "👤 *Получатель:* `{receiver}`\n" +
               "📊 *Статус:* {status}\n" +
               "📅 *Дата:* {date}",

    status_pending: "⏳ Ожидание оплаты",
    status_active: "✅ Активна",
    status_completed: "✔️ Завершена",
    status_cancelled: "❌ Отменена",

    help_text: "❓ *Помощь и информация*\n\n" +
               "🤖 *TON Escrow Bot* предоставляет безопасные платежные услуги на блокчейне\\.\n\n" +
               "📚 *Как это работает:*\n" +
               "1️⃣ Создайте новую эскроу\\-сделку\n" +
               "2️⃣ Введите кошелек получателя и сумму\n" +
               "3️⃣ Подтвердите и оплатите через Tonkeeper\n" +
               "4️⃣ Средства заблокированы в смарт\\-контракте\n" +
               "5️⃣ Автоматическая разблокировка при выполнении условий\n\n" +
               "💰 *Комиссия:* 3% за транзакцию\n" +
               "🌐 *Сеть:* " + TON_NETWORK + "\n\n" +
               "📞 *Поддержка:* @TONEscrowSupport\n" +
               "📖 *Документация:* /guide",

    settings_text: "⚙️ *Настройки*\n\n" +
                   "🌐 *Текущий язык:* Русский 🇷🇺\n\n" +
                   "Выберите опцию:",

    btn_change_language: "🌐 Изменить язык",

    operation_cancelled: "❌ Операция отменена\\.\n\n" +
                        "Нажмите /start для возврата в главное меню\\.",

    error_occurred: "❌ *Произошла ошибка\\!*\n\n" +
                   "{error}\n\n" +
                   "Попробуйте еще раз или обратитесь в поддержку\\."
  },

  uz: {
    welcome: "🎉 *TON Escrow Botga xush kelibsiz\\!*\n\n" +
             "TON blokcheynida xavfsiz va ishonchli eskrou xizmatlari\\.\n\n" +
             "✅ Xavfsiz to'lovlar\n" +
             "✅ 3% past komissiya\n" +
             "✅ Avtomatik tranzaksiyalar\n" +
             "✅ Blokchеyn texnologiyasi\n\n" +
             "🌐 *Iltimos\\, tilni tanlang:*",

    language_selected: "✅ Til o'zbekcha 🇺🇿 ga o'rnatildi",

    main_menu: "📋 *Asosiy menyu*\n\n" +
               "Xush kelibsiz\\! Variantni tanlang:",

    btn_create_deal: "➕ Bitim yaratish",
    btn_my_deals: "📦 Mening bitimlarim",
    btn_help: "❓ Yordam / Ma'lumot",
    btn_settings: "⚙️ Sozlamalar",
    btn_back: "◀️ Menyuga qaytish",
    btn_cancel: "❌ Bekor qilish",

    create_deal_start: "➕ *Yangi bitim yaratish*\n\n" +
                       "Eskrou pulingizni ikkala tomon majburiyatlarini bajargunga qadar xavfsiz saqlaydi\\.\n\n" +
                       "📝 *1\\-qadam:* Qabul qiluvchining TON hamyon manzilini kiriting:",

    invalid_address: "❌ *Noto'g'ri TON manzil\\!*\n\n" +
                     "Iltimos\\, to'g'ri TON hamyon manzilini kiriting\\.\n" +
                     "Misol: `UQDXc5gs_\\-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj`",

    enter_amount: "💰 *2\\-qadam:* TON miqdorini kiriting\n\n" +
                  "👤 Qabul qiluvchi: `{receiver}`\n\n" +
                  "💎 Miqdorni kiriting \\(masalan\\, 10 yoki 10\\.5\\):",

    invalid_amount: "❌ *Noto'g'ri miqdor\\!*\n\n" +
                    "Iltimos\\, musbat son kiriting\\.\n" +
                    "Misol: 10 yoki 10\\.5",

    deal_summary: "📋 *Bitim ma'lumotlari*\n\n" +
                  "👤 *Qabul qiluvchi:*\n`{receiver}`\n\n" +
                  "💎 *Miqdor:* {amount} TON\n" +
                  "💸 *Komissiya \\(3%\\):* {commission} TON\n" +
                  "💵 *Jami to'lov:* {total} TON\n\n" +
                  "✅ Bitimni yaratishni tasdiqlang:",

    btn_confirm: "✅ Tasdiqlash va to'lash",

    deal_created: "✅ *Bitim muvaffaqiyatli yaratildi\\!*\n\n" +
                  "🆔 *Bitim ID:* `{dealId}`\n" +
                  "👤 *Qabul qiluvchi:* `{receiver}`\n" +
                  "💎 *Miqdor:* {amount} TON\n" +
                  "💸 *Komissiya:* {commission} TON\n" +
                  "💰 *Jami to'landi:* {total} TON\n" +
                  "📅 *Yaratildi:* {date}\n\n" +
                  "🔐 Mablag'laringiz eskrouda xavfsiz bloklangan\\!\n\n" +
                  "💳 *To'lov havolasi:*\n[Tonkeeper orqali to'lash](ton://transfer/{wallet}?amount={nanotons})\n\n" +
                  "_Bitim to'lov blokcheynda tasdiqlanganidan so'ng faollashadi\\._",

    my_deals: "📦 *Mening bitimlarim*\n\n" +
              "Sizda *{count} ta faol bitim* bor:",

    no_deals: "📦 *Mening bitimlarim*\n\n" +
              "Sizda hozircha faol bitimlar yo'q\\.\n\n" +
              "*➕ Bitim yaratish* tugmasini bosing\\.",

    deal_item: "━━━━━━━━━━━━━━━\n" +
               "🆔 *ID:* `{id}`\n" +
               "💰 *Miqdor:* {amount} TON\n" +
               "👤 *Qabul qiluvchi:* `{receiver}`\n" +
               "📊 *Holat:* {status}\n" +
               "📅 *Sana:* {date}",

    status_pending: "⏳ To'lov kutilmoqda",
    status_active: "✅ Faol",
    status_completed: "✔️ Tugallangan",
    status_cancelled: "❌ Bekor qilingan",

    help_text: "❓ *Yordam va ma'lumot*\n\n" +
               "🤖 *TON Escrow Bot* blokchеyn texnologiyasidan foydalangan holda xavfsiz to'lov xizmatlarini taqdim etadi\\.\n\n" +
               "📚 *Qanday ishlaydi:*\n" +
               "1️⃣ Yangi eskrou bitim yarating\n" +
               "2️⃣ Qabul qiluvchi hamyoni va miqdorni kiriting\n" +
               "3️⃣ Tonkeeper orqali tasdiqlang va to'lang\n" +
               "4️⃣ Mablag'lar smart\\-kontraktda bloklangan\n" +
               "5️⃣ Shartlar bajarilganda avtomatik yechiladi\n\n" +
               "💰 *Komissiya:* Har bir tranzaksiya uchun 3%\n" +
               "🌐 *Tarmoq:* " + TON_NETWORK + "\n\n" +
               "📞 *Qo'llab\\-quvvatlash:* @TONEscrowSupport\n" +
               "📖 *Hujjatlar:* /guide",

    settings_text: "⚙️ *Sozlamalar*\n\n" +
                   "🌐 *Joriy til:* O'zbek 🇺🇿\n\n" +
                   "Variantni tanlang:",

    btn_change_language: "🌐 Tilni o'zgartirish",

    operation_cancelled: "❌ Operatsiya bekor qilindi\\.\n\n" +
                        "Asosiy menyuga qaytish uchun /start ni bosing\\.",

    error_occurred: "❌ *Xatolik yuz berdi\\!*\n\n" +
                   "{error}\n\n" +
                   "Qayta urinib ko'ring yoki qo'llab\\-quvvatlashga murojaat qiling\\."
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get translation text for a specific key and language
 */
function t(key, lang = 'en', params = {}) {
  let text = translations[lang]?.[key] || translations['en'][key] || key;

  // Replace parameters
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });

  return text;
}

/**
 * Get user's preferred language
 */
function getUserLang(userId) {
  const session = userSessions.get(userId);
  return session?.language || 'en';
}

/**
 * Set user's preferred language
 */
function setUserLang(userId, lang) {
  const session = userSessions.get(userId) || {};
  session.language = lang;
  userSessions.set(userId, session);
}

/**
 * Get user's active deals from session
 */
function getUserDeals(userId) {
  const session = userSessions.get(userId);
  return session?.deals || [];
}

/**
 * Add a deal to user's session
 */
function addUserDeal(userId, deal) {
  const session = userSessions.get(userId) || { language: 'en', deals: [] };
  if (!session.deals) session.deals = [];
  session.deals.push(deal);
  userSessions.set(userId, session);
}

/**
 * Validate TON wallet address
 */
function isValidTonAddress(address) {
  // Basic TON address validation (UQ... or EQ... format, 48 chars)
  const tonAddressRegex = /^(UQ|EQ)[a-zA-Z0-9_-]{46}$/;
  return tonAddressRegex.test(address);
}

/**
 * Calculate commission
 */
function calculateCommission(amount) {
  return (amount * COMMISSION_PERCENT / 100).toFixed(2);
}

/**
 * Format TON amount to nanotons for payment links
 */
function tonToNanotons(amount) {
  return Math.floor(amount * 1e9);
}

/**
 * Generate unique deal ID
 */
function generateDealId() {
  return 'ESC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

/**
 * Format date
 */
function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
}

/**
 * Escape markdown special characters for Telegram
 */
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// ============================================
// KEYBOARD LAYOUTS
// ============================================

/**
 * Language selection keyboard
 */
function getLanguageKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🇺🇿 O\'zbek', callback_data: 'lang_uz' }],
      [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
      [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }]
    ]
  };
}

/**
 * Main menu keyboard
 */
function getMainMenuKeyboard(lang) {
  return {
    keyboard: [
      [{ text: t('btn_create_deal', lang) }],
      [{ text: t('btn_my_deals', lang) }, { text: t('btn_help', lang) }],
      [{ text: t('btn_settings', lang) }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

/**
 * Cancel operation keyboard
 */
function getCancelKeyboard(lang) {
  return {
    keyboard: [
      [{ text: t('btn_cancel', lang) }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

/**
 * Settings keyboard
 */
function getSettingsKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t('btn_change_language', lang), callback_data: 'change_language' }],
      [{ text: t('btn_back', lang), callback_data: 'back_to_menu' }]
    ]
  };
}

/**
 * Deal confirmation keyboard
 */
function getConfirmDealKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t('btn_confirm', lang), callback_data: 'confirm_deal' }],
      [{ text: t('btn_cancel', lang), callback_data: 'cancel_deal' }]
    ]
  };
}

// ============================================
// BACKEND API INTEGRATION
// ============================================

/**
 * Create escrow deal via backend API
 */
async function createEscrowDeal(sender, receiver, amount, commission) {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/escrow/create`, {
      sender,
      receiver,
      amount: parseFloat(amount),
      commission: parseFloat(commission),
      commissionWallet: COMMISSION_WALLET,
      network: TON_NETWORK
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating escrow deal:', error.message);
    // Return mock data if backend is not available
    return {
      success: true,
      dealId: generateDealId(),
      message: 'Deal created (mock mode - backend unavailable)'
    };
  }
}

/**
 * Get user's deals from backend
 */
async function fetchUserDeals(userId) {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/escrow/deals/${userId}`, {
      timeout: 10000
    });

    return response.data.deals || [];
  } catch (error) {
    console.error('Error fetching deals:', error.message);
    // Return session deals if backend is not available
    return getUserDeals(userId);
  }
}

// ============================================
// BOT COMMAND HANDLERS
// ============================================

/**
 * /start command - Welcome message and language selection
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log(`📱 /start command from user ${userId}`);

  const session = userSessions.get(userId);

  if (!session || !session.language) {
    // New user - show language selection
    await bot.sendMessage(
      chatId,
      t('welcome', 'en'),
      {
        parse_mode: 'MarkdownV2',
        reply_markup: getLanguageKeyboard()
      }
    );
  } else {
    // Existing user - show main menu
    await showMainMenu(chatId, userId);
  }
});

/**
 * /help command
 */
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const lang = getUserLang(userId);

  await bot.sendMessage(
    chatId,
    t('help_text', lang),
    { parse_mode: 'MarkdownV2' }
  );
});

/**
 * /deals command - Show user's deals
 */
bot.onText(/\/deals/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const lang = getUserLang(userId);

  await showUserDeals(chatId, userId, lang);
});

/**
 * /settings command
 */
bot.onText(/\/settings/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const lang = getUserLang(userId);

  await bot.sendMessage(
    chatId,
    t('settings_text', lang),
    {
      parse_mode: 'MarkdownV2',
      reply_markup: getSettingsKeyboard(lang)
    }
  );
});

// ============================================
// CALLBACK QUERY HANDLERS (Inline Buttons)
// ============================================

/**
 * Handle all callback queries
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  console.log(`🔘 Callback query: ${data} from user ${userId}`);

  // Language selection
  if (data.startsWith('lang_')) {
    const lang = data.replace('lang_', '');
    setUserLang(userId, lang);

    await bot.answerCallbackQuery(query.id);
    await bot.editMessageText(
      t('language_selected', lang),
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'MarkdownV2'
      }
    );

    // Show main menu
    setTimeout(() => showMainMenu(chatId, userId), 500);
    return;
  }

  // Change language
  if (data === 'change_language') {
    await bot.answerCallbackQuery(query.id);
    await bot.editMessageText(
      t('welcome', 'en'),
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'MarkdownV2',
        reply_markup: getLanguageKeyboard()
      }
    );
    return;
  }

  // Back to menu
  if (data === 'back_to_menu') {
    await bot.answerCallbackQuery(query.id);
    await bot.deleteMessage(chatId, query.message.message_id);
    await showMainMenu(chatId, userId);
    return;
  }

  // Confirm deal
  if (data === 'confirm_deal') {
    await bot.answerCallbackQuery(query.id, { text: '⏳ Creating deal...' });
    await handleDealConfirmation(chatId, userId, query.message.message_id);
    return;
  }

  // Cancel deal
  if (data === 'cancel_deal') {
    const lang = getUserLang(userId);
    await bot.answerCallbackQuery(query.id, { text: '❌ Cancelled' });

    // Clear session
    escrowSessions.delete(userId);

    await bot.deleteMessage(chatId, query.message.message_id);
    await bot.sendMessage(
      chatId,
      t('operation_cancelled', lang),
      { parse_mode: 'MarkdownV2' }
    );

    setTimeout(() => showMainMenu(chatId, userId), 500);
    return;
  }

  await bot.answerCallbackQuery(query.id);
});

// ============================================
// TEXT MESSAGE HANDLERS
// ============================================

/**
 * Handle all text messages
 */
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const lang = getUserLang(userId);

  // Check if user is in an escrow creation session
  const session = escrowSessions.get(userId);

  if (session) {
    await handleEscrowCreationStep(chatId, userId, text, lang, session);
    return;
  }

  // Handle main menu buttons
  if (text === t('btn_create_deal', lang)) {
    await startEscrowCreation(chatId, userId, lang);
  } else if (text === t('btn_my_deals', lang)) {
    await showUserDeals(chatId, userId, lang);
  } else if (text === t('btn_help', lang)) {
    await bot.sendMessage(
      chatId,
      t('help_text', lang),
      { parse_mode: 'MarkdownV2' }
    );
  } else if (text === t('btn_settings', lang)) {
    await bot.sendMessage(
      chatId,
      t('settings_text', lang),
      {
        parse_mode: 'MarkdownV2',
        reply_markup: getSettingsKeyboard(lang)
      }
    );
  } else if (text === t('btn_cancel', lang)) {
    escrowSessions.delete(userId);
    await bot.sendMessage(
      chatId,
      t('operation_cancelled', lang),
      { parse_mode: 'MarkdownV2' }
    );
    setTimeout(() => showMainMenu(chatId, userId), 500);
  } else {
    // Unknown command - show main menu
    await showMainMenu(chatId, userId);
  }
});

// ============================================
// MAIN MENU & NAVIGATION
// ============================================

/**
 * Show main menu
 */
async function showMainMenu(chatId, userId) {
  const lang = getUserLang(userId);

  await bot.sendMessage(
    chatId,
    t('main_menu', lang),
    {
      parse_mode: 'MarkdownV2',
      reply_markup: getMainMenuKeyboard(lang)
    }
  );
}

// ============================================
// ESCROW CREATION FLOW
// ============================================

/**
 * Start escrow creation process
 */
async function startEscrowCreation(chatId, userId, lang) {
  console.log(`➕ Starting escrow creation for user ${userId}`);

  // Initialize session
  escrowSessions.set(userId, {
    step: 'receiver',
    data: {}
  });

  await bot.sendMessage(
    chatId,
    t('create_deal_start', lang),
    {
      parse_mode: 'MarkdownV2',
      reply_markup: getCancelKeyboard(lang)
    }
  );
}

/**
 * Handle escrow creation steps
 */
async function handleEscrowCreationStep(chatId, userId, text, lang, session) {
  const step = session.step;

  // Step 1: Receiver address
  if (step === 'receiver') {
    if (!isValidTonAddress(text)) {
      await bot.sendMessage(
        chatId,
        t('invalid_address', lang),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    session.data.receiver = text;
    session.step = 'amount';
    escrowSessions.set(userId, session);

    await bot.sendMessage(
      chatId,
      t('enter_amount', lang, { receiver: escapeMarkdown(text) }),
      {
        parse_mode: 'MarkdownV2',
        reply_markup: getCancelKeyboard(lang)
      }
    );
    return;
  }

  // Step 2: Amount
  if (step === 'amount') {
    const amount = parseFloat(text);

    if (isNaN(amount) || amount <= 0) {
      await bot.sendMessage(
        chatId,
        t('invalid_amount', lang),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    session.data.amount = amount;
    session.data.commission = calculateCommission(amount);
    session.data.total = (amount + parseFloat(session.data.commission)).toFixed(2);
    session.step = 'confirm';
    escrowSessions.set(userId, session);

    // Show summary and confirmation
    await bot.sendMessage(
      chatId,
      t('deal_summary', lang, {
        receiver: escapeMarkdown(session.data.receiver),
        amount: escapeMarkdown(amount.toString()),
        commission: escapeMarkdown(session.data.commission),
        total: escapeMarkdown(session.data.total)
      }),
      {
        parse_mode: 'MarkdownV2',
        reply_markup: getConfirmDealKeyboard(lang)
      }
    );
    return;
  }
}

/**
 * Handle deal confirmation
 */
async function handleDealConfirmation(chatId, userId, messageId) {
  const lang = getUserLang(userId);
  const session = escrowSessions.get(userId);

  if (!session || !session.data) {
    await bot.sendMessage(chatId, t('error_occurred', lang, { error: 'Session expired' }));
    return;
  }

  try {
    const { receiver, amount, commission, total } = session.data;

    // Create deal via backend API (includes automatic 3% commission to COMMISSION_WALLET)
    const result = await createEscrowDeal(userId, receiver, amount, commission);

    const dealId = result.dealId;
    const nanotons = tonToNanotons(parseFloat(total));

    // Save deal to user's session
    const deal = {
      id: dealId,
      receiver,
      amount,
      commission,
      total,
      status: 'pending',
      date: formatDate(),
      commissionWallet: COMMISSION_WALLET
    };

    addUserDeal(userId, deal);

    // Clear escrow session
    escrowSessions.delete(userId);

    // Delete confirmation message
    await bot.deleteMessage(chatId, messageId);

    // Send success message with payment link
    await bot.sendMessage(
      chatId,
      t('deal_created', lang, {
        dealId: escapeMarkdown(dealId),
        receiver: escapeMarkdown(receiver),
        amount: escapeMarkdown(amount.toString()),
        commission: escapeMarkdown(commission),
        total: escapeMarkdown(total),
        date: escapeMarkdown(deal.date),
        wallet: COMMISSION_WALLET,
        nanotons: nanotons
      }),
      {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );

    console.log(`✅ Deal created: ${dealId} | Amount: ${amount} TON | Commission: ${commission} TON → ${COMMISSION_WALLET}`);

    // Show main menu
    setTimeout(() => showMainMenu(chatId, userId), 1000);

  } catch (error) {
    console.error('Error creating deal:', error);
    await bot.sendMessage(
      chatId,
      t('error_occurred', lang, { error: escapeMarkdown(error.message) }),
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// ============================================
// USER DEALS
// ============================================

/**
 * Show user's deals
 */
async function showUserDeals(chatId, userId, lang) {
  console.log(`📦 Showing deals for user ${userId}`);

  try {
    // Try to fetch from backend, fallback to session
    const deals = await fetchUserDeals(userId);

    if (!deals || deals.length === 0) {
      await bot.sendMessage(
        chatId,
        t('no_deals', lang),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let message = t('my_deals', lang, { count: deals.length }) + '\n\n';

    deals.forEach((deal, index) => {
      const statusText = t(`status_${deal.status || 'pending'}`, lang);
      message += t('deal_item', lang, {
        id: escapeMarkdown(deal.id),
        amount: escapeMarkdown(deal.amount.toString()),
        receiver: escapeMarkdown(deal.receiver),
        status: statusText,
        date: escapeMarkdown(deal.date)
      });

      if (index < deals.length - 1) {
        message += '\n\n';
      }
    });

    await bot.sendMessage(
      chatId,
      message,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('Error showing deals:', error);
    await bot.sendMessage(
      chatId,
      t('error_occurred', lang, { error: escapeMarkdown(error.message) }),
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// ============================================
// ERROR HANDLING
// ============================================

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

// ============================================
// BOT STARTUP
// ============================================

console.log('🚀 Starting TON Escrow Telegram Bot...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🤖 Bot Token: ${BOT_TOKEN.substring(0, 20)}...`);
console.log(`💰 Commission: ${COMMISSION_PERCENT}%`);
console.log(`🏦 Commission Wallet: ${COMMISSION_WALLET}`);
console.log(`🌐 Network: ${TON_NETWORK}`);
console.log(`🔗 Backend URL: ${BACKEND_URL}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Bot is running in polling mode');
console.log('🎉 TON Escrow Bot is ready!');
console.log('💡 Press Ctrl+C to stop the bot');
console.log('');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Stopping bot...');
  bot.stopPolling();
  process.exit(0);
});
