# TON Escrow Telegram Bot

A professional Telegram bot for managing TON escrow transactions with automatic 3% commission.

## 🎯 Features

- **Multilingual Support**: Uzbek 🇺🇿, English 🇬🇧, Russian 🇷🇺
- **Secure Escrow**: Smart contract-based escrow system
- **Automatic Commission**: 3% automatically sent to platform wallet
- **User-Friendly Interface**: Beautiful buttons and intuitive flow
- **Deal Management**: Track all your escrow deals
- **Tonkeeper Integration**: Seamless wallet connectivity

## 🏗️ Architecture

```
bot/
├── src/
│   ├── handlers/          # Command and action handlers
│   │   ├── start.handler.ts
│   │   ├── escrow.handler.ts
│   │   └── settings.handler.ts
│   ├── middleware/        # Bot middleware
│   │   └── user.middleware.ts
│   ├── services/          # Business logic services
│   │   └── ton.service.ts
│   ├── database/          # Database schema and queries
│   │   └── schema.ts
│   ├── locales/           # Translations
│   │   ├── uz.json
│   │   ├── en.json
│   │   └── ru.json
│   ├── utils/             # Helper utilities
│   │   ├── i18n.ts
│   │   └── helpers.ts
│   └── index.ts           # Main bot application
├── data/                  # SQLite database
├── package.json
├── tsconfig.json
├── .env                   # Environment configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Telegram Bot Token (get from [@BotFather](https://t.me/BotFather))
- TON wallet for commission

### Installation

1. **Navigate to bot directory**
   ```bash
   cd bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the bot**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## ⚙️ Configuration

Edit the `.env` file with your settings:

```env
# Telegram Bot Configuration
BOT_TOKEN=your_bot_token_here
BOT_WEBHOOK_URL=                    # Leave empty for polling mode

# TON Configuration
COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
COMMISSION_PERCENT=3
TON_NETWORK=testnet

# Database
DATABASE_PATH=./data/escrow.db

# Server Configuration
PORT=3002
NODE_ENV=development
```

## 📱 Bot Usage

### For End Users

1. **Start the bot**: Send `/start` to your bot
2. **Select language**: Choose from Uzbek, English, or Russian
3. **Create escrow**:
   - Click "➕ Create New Escrow"
   - Enter receiver's TON wallet address
   - Enter amount in TON
   - Click payment link to open Tonkeeper
   - Confirm transaction
4. **View deals**: Click "📦 My Deals" to see all your escrows
5. **Get help**: Click "❓ Help & Support" for assistance

### Bot Commands

- `/start` - Start bot and show main menu
- `/help` - Show help information
- `/settings` - Open settings (language, etc.)
- `/deals` - View your escrow deals

## 🔧 Development

### Project Structure

- **handlers/**: Handle user interactions (commands, buttons, text input)
- **middleware/**: Process requests before handlers
- **services/**: Business logic (TON transactions, payments)
- **database/**: SQLite database operations
- **locales/**: Translations for multilingual support
- **utils/**: Helper functions and utilities

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language TEXT DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### Escrows Table
```sql
CREATE TABLE escrows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  escrow_id TEXT UNIQUE NOT NULL,
  creator_telegram_id INTEGER NOT NULL,
  receiver_address TEXT NOT NULL,
  amount REAL NOT NULL,
  commission REAL NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Adding New Languages

1. Create new translation file in `src/locales/` (e.g., `fr.json`)
2. Copy structure from `en.json` and translate all keys
3. Update `Language` type in `src/utils/i18n.ts`
4. Add language button in start handler

## 🌐 Deployment

### Option 1: Polling Mode (Easy)

Leave `BOT_WEBHOOK_URL` empty in `.env` and just run:

```bash
npm start
```

The bot will use long polling to receive updates.

### Option 2: Webhook Mode (Production)

1. Deploy to a server (Railway, Render, VPS, etc.)
2. Set `BOT_WEBHOOK_URL` to your public URL
3. Bot will automatically register webhook

#### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Deploy to Render

1. Connect your GitHub repository
2. Create new Web Service
3. Set build command: `cd bot && npm install && npm run build`
4. Set start command: `cd bot && npm start`
5. Add environment variables from `.env`

### Environment Variables for Deployment

Make sure to set these in your hosting platform:

- `BOT_TOKEN`
- `BOT_WEBHOOK_URL` (your public URL + `/bot-webhook`)
- `COMMISSION_WALLET`
- `COMMISSION_PERCENT`
- `TON_NETWORK`
- `DATABASE_PATH`
- `PORT`

## 📊 Monitoring

### Health Check

The bot exposes a health check endpoint:

```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "TON Escrow Telegram Bot"
}
```

### Logs

Monitor bot activity through console logs:

```bash
# View logs in production
pm2 logs ton-escrow-bot

# Or with Docker
docker logs -f ton-escrow-bot
```

## 🔒 Security

- Never commit `.env` file to version control
- Use environment variables for sensitive data
- Regularly update dependencies: `npm audit fix`
- Enable rate limiting in production
- Validate all user inputs
- Use HTTPS for webhook mode

## 🐛 Troubleshooting

### Bot doesn't respond

1. Check if bot is running: `curl http://localhost:3002/health`
2. Verify `BOT_TOKEN` is correct
3. Check console for errors
4. Ensure database directory exists and is writable

### Payment links don't work

1. Verify `COMMISSION_WALLET` address is valid
2. Check TON network setting (testnet/mainnet)
3. Ensure Tonkeeper is installed on user's device

### Database errors

1. Check `DATABASE_PATH` directory exists
2. Ensure write permissions
3. Delete `escrow.db` to reset database (WARNING: deletes all data)

## 📝 License

MIT License - see LICENSE file for details

## 👥 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/abusilawq/ton-escrow-mvp/issues)
- Telegram: @your_support_username

## 🚀 Roadmap

- [ ] Smart contract deployment automation
- [ ] Real-time transaction monitoring
- [ ] Admin panel for managing escrows
- [ ] Multi-currency support
- [ ] Dispute resolution system
- [ ] Transaction history export
- [ ] Push notifications
- [ ] Referral system

---

**Made with ❤️ for the TON ecosystem**
