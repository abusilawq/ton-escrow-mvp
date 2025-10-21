# 🤖 TON Escrow Telegram Bot Setup Guide

## 📋 Overview

This is a complete Telegram bot implementation for the TON Escrow MVP project. The bot provides a beautiful, multilingual interface for creating and managing escrow deals on the TON blockchain.

### ✨ Features

- 🌐 **Multi-language support**: English, Russian, and Uzbek
- 💰 **Automatic 3% commission**: Automatically sent to configured wallet
- 🔐 **Secure escrow**: Blockchain-powered smart contract escrow
- 📱 **Beautiful UI**: Clean design similar to @GiftGuarantBot
- 🔗 **Backend integration**: Connects with the existing escrow backend API
- 💳 **Tonkeeper integration**: Direct payment links for seamless transactions

---

## 📁 File Location

The bot file is located at:
```
/home/user/ton-escrow-mvp/bot.js
```

This is a **standalone JavaScript file** that works independently from the TypeScript bot in the `bot/` folder.

---

## 🚀 Quick Start

### 1. Install Dependencies

From the project root directory, run:

```bash
npm install
```

This will install:
- `node-telegram-bot-api` - Telegram Bot API library
- `axios` - HTTP client for backend API calls
- `dotenv` - Environment variable management

### 2. Configure Environment Variables

The `.env` file has already been created in the project root with your bot token:

```env
# Telegram Bot Configuration
BOT_TOKEN=8316093589:AAGFZYKHD1Qe0WYb72BflUjExafGD4uepiE

# TON Configuration
COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
COMMISSION_PERCENT=3
TON_NETWORK=testnet

# Backend API
BACKEND_URL=http://localhost:3001
```

**You can modify these values as needed:**
- `BOT_TOKEN`: Your Telegram bot token
- `COMMISSION_WALLET`: Wallet address to receive 3% commission
- `COMMISSION_PERCENT`: Commission percentage (default: 3)
- `TON_NETWORK`: Either `testnet` or `mainnet`
- `BACKEND_URL`: URL of your backend API

### 3. Run the Bot

```bash
npm run bot
```

Or directly:
```bash
node bot.js
```

For development with auto-restart:
```bash
npm run bot:dev
```

---

## 🎯 Bot Features in Detail

### 1. Language Selection

When a user first starts the bot with `/start`, they'll see:

```
🎉 Welcome to TON Escrow Bot!

Secure and reliable escrow services on TON blockchain.

✅ Secure payments
✅ 3% low commission
✅ Automatic transactions
✅ Blockchain-powered

🌐 Please select your language:

[🇺🇿 O'zbek]
[🇬🇧 English]
[🇷🇺 Русский]
```

### 2. Main Menu

After language selection, users see a beautiful menu:

```
📋 Main Menu

Welcome back! Choose an option:

[➕ Create Deal]
[📦 My Deals] [❓ Help / Info]
[⚙️ Settings]
```

### 3. Create Deal Flow

**Step 1: Enter Receiver's Wallet**
```
➕ Create New Deal

Escrow keeps your money safe until both parties fulfill their obligations.

📝 Step 1: Enter the receiver's TON wallet address:
```

**Step 2: Enter Amount**
```
💰 Step 2: Enter the amount in TON

👤 Receiver: UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj

💎 Enter amount (e.g., 10 or 10.5):
```

**Step 3: Confirmation**
```
📋 Deal Summary

👤 Receiver:
UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj

💎 Amount: 100 TON
💸 Commission (3%): 3 TON
💵 Total Payment: 103 TON

[✅ Confirm & Pay] [❌ Cancel]
```

**Step 4: Deal Created**
```
✅ Deal Created Successfully!

🆔 Deal ID: ESC1729543210ABCDE
👤 Receiver: UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
💎 Amount: 100 TON
💸 Commission: 3 TON
💰 Total Paid: 103 TON
📅 Created: 2025-10-21 15:30:00

🔐 Your funds are now securely locked in escrow!

💳 Payment Link:
[Pay with Tonkeeper](ton://transfer/...)

The deal will activate once payment is confirmed on the blockchain.
```

### 4. My Deals

Shows all active and completed deals:

```
📦 My Deals

You have 2 active deal(s):

━━━━━━━━━━━━━━━
🆔 ID: ESC1729543210ABCDE
💰 Amount: 100 TON
👤 Receiver: UQDXc5...rhkUj
📊 Status: ⏳ Pending Payment
📅 Date: 2025-10-21 15:30:00

━━━━━━━━━━━━━━━
🆔 ID: ESC1729543211FGHIJ
💰 Amount: 50 TON
👤 Receiver: EQAbc5...xyz123
📊 Status: ✅ Active
📅 Date: 2025-10-21 14:15:00
```

### 5. Help & Information

Comprehensive guide about the bot:

```
❓ Help & Information

🤖 TON Escrow Bot provides secure payment services using blockchain technology.

📚 How it works:
1️⃣ Create a new escrow deal
2️⃣ Enter receiver's wallet and amount
3️⃣ Confirm and pay via Tonkeeper
4️⃣ Funds are locked in smart contract
5️⃣ Automatic release when conditions are met

💰 Commission: 3% per transaction
🌐 Network: testnet

📞 Support: @TONEscrowSupport
📖 Documentation: /guide
```

### 6. Settings

Users can change their language preference:

```
⚙️ Settings

🌐 Current Language: English 🇬🇧

[🌐 Change Language]
[◀️ Back to Menu]
```

---

## 💰 Commission Handling

The bot **automatically calculates and includes** a 3% commission on every deal:

1. **User creates deal** for 100 TON
2. **Bot calculates**:
   - Deal amount: 100 TON
   - Commission (3%): 3 TON
   - Total payment: 103 TON
3. **Payment link includes** the full 103 TON
4. **Backend smart contract** automatically:
   - Sends 3 TON to `COMMISSION_WALLET`
   - Locks 100 TON in escrow for the deal

**Commission wallet is configured in `.env`:**
```env
COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
COMMISSION_PERCENT=3
```

---

## 🔗 Backend Integration

The bot connects to the backend API to:

1. **Create escrow deals**: `POST /api/escrow/create`
2. **Fetch user deals**: `GET /api/escrow/deals/:userId`

### Fallback Mode

If the backend is **not available**, the bot will:
- Still work and create deals
- Store deals in-memory (temporary)
- Show a "(mock mode)" message
- Generate unique deal IDs

**To connect with a real backend:**
1. Start your backend server (default: `http://localhost:3001`)
2. Update `BACKEND_URL` in `.env` if using a different URL
3. The bot will automatically connect

---

## 🛠️ Available Commands

Users can interact with the bot using:

- `/start` - Start the bot and show language selection (or main menu)
- `/help` - Show help and information
- `/deals` - Show user's deals
- `/settings` - Show settings and change language

---

## 📊 Technical Details

### Data Storage

**Current implementation** uses in-memory storage:
- `userSessions` - Stores user language preferences and deals
- `escrowSessions` - Stores active escrow creation sessions

**Data persists** only during bot runtime. When the bot restarts, all data is cleared.

**For production**, consider:
- Connecting to the backend API for persistent storage
- Using the existing TypeScript bot with SQLite database (`bot/` folder)
- Implementing a database solution (MongoDB, PostgreSQL, etc.)

### Wallet Address Validation

The bot validates TON wallet addresses using:
```javascript
/^(UQ|EQ)[a-zA-Z0-9_-]{46}$/
```

This ensures addresses:
- Start with `UQ` or `EQ`
- Are exactly 48 characters long
- Contain only valid base64url characters

### Payment Links

Payment links use the **Tonkeeper deep link** format:
```
ton://transfer/{wallet}?amount={nanotons}
```

Where:
- `{wallet}` = Commission wallet address
- `{nanotons}` = Amount in nanotons (1 TON = 1,000,000,000 nanotons)

---

## 🎨 Design Philosophy

The bot is designed to be:

1. **Beautiful** - Clean, emoji-rich interface similar to @GiftGuarantBot
2. **Intuitive** - Simple step-by-step flows
3. **Multilingual** - Full support for English, Russian, Uzbek
4. **Secure** - Blockchain-powered escrow with automatic commission
5. **Responsive** - Fast responses and inline button actions

---

## 🚨 Troubleshooting

### Bot doesn't start

1. **Check bot token**:
   ```bash
   echo $BOT_TOKEN
   ```
   Make sure it matches your Telegram bot token.

2. **Check dependencies**:
   ```bash
   npm install
   ```

3. **Check for errors**:
   ```bash
   node bot.js
   ```
   Look for error messages in the console.

### Backend connection issues

1. **Check backend is running**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Update backend URL** in `.env` if needed

3. **Bot will work in mock mode** if backend is unavailable

### Polling errors

If you see "409 Conflict" errors:
- Another instance of the bot is running
- Stop all instances and restart
- Only run one instance at a time

---

## 📝 Development Tips

### Add new languages

Edit the `translations` object in `bot.js`:

```javascript
const translations = {
  en: { /* English translations */ },
  ru: { /* Russian translations */ },
  uz: { /* Uzbek translations */ },
  es: { /* Add Spanish */ },
  // Add more languages...
};
```

### Customize messages

All messages are in the `translations` object. Edit them to customize:
- Welcome messages
- Button labels
- Help text
- Error messages

### Add new features

The bot is modular and easy to extend:
- Add new commands in the command handlers section
- Add new buttons in the keyboard layouts section
- Add new flows similar to escrow creation flow

---

## 🔐 Security Notes

1. **Never commit `.env` file** to version control
2. **Keep bot token secret** - regenerate if exposed
3. **Validate all user inputs** - addresses, amounts, etc.
4. **Use HTTPS** for webhook mode in production
5. **Implement rate limiting** for production use

---

## 📦 Project Structure

```
ton-escrow-mvp/
├── bot.js              ← Your standalone bot (this file!)
├── .env                ← Configuration (auto-created)
├── package.json        ← Dependencies (auto-created)
├── BOT_SETUP.md        ← This guide
├── backend/            ← Backend API
├── frontend/           ← Frontend UI
├── contracts/          ← TON smart contracts
└── bot/                ← TypeScript bot (alternative implementation)
```

---

## 🎉 You're All Set!

Your TON Escrow Bot is ready to use!

**To start the bot:**
```bash
npm run bot
```

**To test the bot:**
1. Open Telegram
2. Search for your bot by username
3. Send `/start`
4. Select a language
5. Try creating a deal!

---

## 📞 Support

For issues or questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review the backend API documentation
- Contact the development team

---

**Built with ❤️ for the TON Ecosystem**

🔗 Powered by TON Blockchain
🤖 Made with node-telegram-bot-api
