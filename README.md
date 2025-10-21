# 🔒 TON Escrow MVP

**Fully automated TON blockchain escrow system with Telegram bot integration**

A production-ready escrow service built on the TON blockchain featuring:
- ✅ **Smart Contract** in Tact language with 3% automatic commission
- ✅ **Telegram Bot** for easy user interaction
- ✅ **React Frontend** with TonConnect wallet integration
- ✅ **Node.js Backend** with Express REST API
- ✅ **Auto-deployment** scripts for testnet and mainnet

---

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Quick Start](#-quick-start)
- [Detailed Setup](#-detailed-setup)
- [How It Works](#-how-it-works)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Technologies](#-technologies)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Smart Contract (Tact)
- ✅ Secure escrow holding between two parties
- ✅ Automatic 3% commission to platform wallet
- ✅ 97% payment to beneficiary on release
- ✅ Deadline-based automatic refund capability
- ✅ Cancel escrow before release
- ✅ Multiple getter functions for data retrieval
- ✅ Reentrancy protection

### Telegram Bot (Telegraf)
- ✅ Interactive bot commands (`/start`, `/help`, `/about`)
- ✅ "Create Escrow" button opens WebApp
- ✅ View active escrows
- ✅ Webhook support for production
- ✅ Telegram WebApp integration

### Backend (Node.js + Express)
- ✅ RESTful API endpoints
- ✅ TON blockchain integration
- ✅ Transaction payload building
- ✅ Wallet balance checking
- ✅ Address validation
- ✅ CORS support
- ✅ Comprehensive error handling

### Frontend (React + Vite + TonConnect)
- ✅ TonConnect wallet integration (Tonkeeper, etc.)
- ✅ Escrow creation form with validation
- ✅ Real-time commission calculation
- ✅ Transaction status tracking
- ✅ Responsive design
- ✅ Telegram WebApp optimized

---

## 🏗️ System Architecture

```
┌─────────────────┐
│  Telegram Bot   │
│   (Telegraf)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   React WebApp  │◄────►│  Express Backend │
│ (Vite + React)  │      │   (Node.js)      │
└─────────┬───────┘      └────────┬─────────┘
          │                       │
          │    TonConnect          │
          │                       │
          ▼                       ▼
┌──────────────────────────────────────┐
│      TON Blockchain Network          │
│                                      │
│  ┌────────────────────────────┐     │
│  │   Escrow Smart Contract    │     │
│  │        (Tact)              │     │
│  └────────────────────────────┘     │
│                                      │
│  Commission: 3% → UQDXc5gs_-G...    │
│  Payment: 97% → Beneficiary         │
└──────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Telegram Bot Token** (get from [@BotFather](https://t.me/BotFather))
- **TON wallet** with testnet TON (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/abusilawq/ton-escrow-mvp.git
cd ton-escrow-mvp

# Install dependencies for all services
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Environment Setup

1. **Backend Configuration**
```bash
cd backend
cp .env.example .env
# Edit .env and add your TELEGRAM_BOT_TOKEN
```

2. **Frontend Configuration**
```bash
cd frontend
cp .env.example .env
# Edit .env if needed (defaults should work for local development)
```

### Running Locally

```bash
# Terminal 1 - Start Backend + Telegram Bot
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm run dev

# Terminal 3 - Build Smart Contract (optional)
cd contracts
npm run build
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Telegram Bot: Search for your bot in Telegram

---

## 📖 Detailed Setup

### 1. Smart Contract Deployment

#### Build the Contract
```bash
cd contracts
npm install
npm run build
```

The compiled contract will be in `contracts/build/`

#### Deploy to Testnet
```bash
npm run deploy:testnet
```

#### Deploy to Mainnet
```bash
npm run deploy:mainnet
```

After deployment, you'll get a contract address. Add it to:
- `backend/.env` → `CONTRACT_ADDRESS`
- `frontend/.env` → `VITE_CONTRACT_ADDRESS`

### 2. Telegram Bot Setup

1. **Create Bot with BotFather**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot`
   - Follow the instructions
   - Copy the bot token

2. **Configure Bot Token**
   ```bash
   # In backend/.env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   WEBAPP_URL=http://localhost:5173
   ```

3. **Test the Bot**
   - Search for your bot in Telegram
   - Send `/start`
   - Click "Create Escrow" to open the WebApp

### 3. Backend Configuration

Key environment variables in `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# TON Network
TON_NETWORK=testnet
CONTRACT_ADDRESS=your_contract_address_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEBAPP_URL=http://localhost:5173

# Commission (hardcoded in contract)
COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
COMMISSION_RATE=3
```

### 4. Frontend Configuration

Key environment variables in `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_TON_NETWORK=testnet
VITE_CONTRACT_ADDRESS=your_contract_address_here
VITE_COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
VITE_COMMISSION_RATE=3
```

---

## 💡 How It Works

### User Flow

1. **Start**: User opens Telegram bot and clicks `/start`
2. **Create Escrow**: User clicks "Create Escrow" button
3. **WebApp Opens**: Frontend React app opens in Telegram
4. **Connect Wallet**: User connects Tonkeeper wallet via TonConnect
5. **Enter Details**:
   - Beneficiary TON address
   - Amount to escrow
   - Deadline for refund
6. **Review Commission**:
   - Total: 100%
   - Beneficiary gets: 97%
   - Platform commission: 3%
7. **Send Transaction**: User confirms in Tonkeeper
8. **Blockchain Processing**: Smart contract receives and holds funds
9. **Release Options**:
   - **Release**: Depositor releases → 97% to beneficiary, 3% to commission wallet
   - **Refund**: After deadline → Full amount back to depositor
   - **Cancel**: Before release → Full amount back to depositor

### Commission Distribution

When escrow is released:
```
Total Amount: 10 TON
├─ Beneficiary: 9.7 TON (97%)
└─ Commission:  0.3 TON (3%) → UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Endpoints

#### Health Check
```http
GET /health
```

#### Get Configuration
```http
GET /api/v1/config
```

#### Create Escrow
```http
POST /api/v1/escrows/create
Content-Type: application/json

{
  "beneficiary": "UQ...",
  "amount": 10,
  "deadline": 1735689600
}
```

#### Get Escrow by ID
```http
GET /api/v1/escrows/:id
```

#### Release Escrow
```http
POST /api/v1/escrows/:id/release
```

#### Refund Escrow
```http
POST /api/v1/escrows/:id/refund
```

#### Get Wallet Balance
```http
GET /api/v1/wallet/:address/balance
```

#### Validate Address
```http
POST /api/v1/wallet/validate
Content-Type: application/json

{
  "address": "UQ..."
}
```

---

## 🚢 Deployment

### Deploy to Production

#### 1. Deploy Smart Contract to Mainnet
```bash
cd contracts
npm run deploy:mainnet
# Save the contract address
```

#### 2. Configure Backend for Production
```env
NODE_ENV=production
TON_NETWORK=mainnet
CONTRACT_ADDRESS=your_mainnet_contract_address
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook/telegram
WEBAPP_URL=https://yourdomain.com
```

#### 3. Build and Deploy Frontend
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting (Vercel, Netlify, etc.)
```

#### 4. Deploy Backend
```bash
cd backend
npm run build
npm start
# Or use PM2, Docker, etc.
```

#### 5. Set Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/webhook/telegram"
```

### Recommended Hosting

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, DigitalOcean, AWS
- **Smart Contract**: TON Mainnet

---

## 📁 Project Structure

```
ton-escrow-mvp/
├── contracts/                  # Smart Contracts (Tact)
│   ├── escrow.tact            # Main escrow contract with 3% commission
│   ├── scripts/
│   │   └── deploy.ts          # Deployment script
│   ├── build/                 # Compiled contracts
│   ├── tact.config.json       # Tact compiler config
│   └── package.json
│
├── backend/                   # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── index.ts          # Main server file
│   │   ├── bot.ts            # Telegram bot (Telegraf)
│   │   └── tonService.ts     # TON blockchain service
│   ├── .env.example          # Environment variables template
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.tsx          # Entry point
│   │   ├── App.tsx           # Main app component
│   │   ├── App.css           # App styles
│   │   ├── index.css         # Global styles
│   │   └── vite-env.d.ts     # Type definitions
│   ├── index.html            # HTML template
│   ├── vite.config.ts        # Vite configuration
│   ├── .env.example          # Environment variables template
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
└── README.md                  # This file
```

---

## 🛠️ Technologies

### Smart Contract
- **Tact** - TON smart contract language
- **@tact-lang/compiler** - Contract compiler
- **@ton/core, @ton/ton** - TON SDK

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Telegraf** - Telegram bot framework
- **@ton/ton** - TON blockchain SDK
- **@orbs-network/ton-access** - TON HTTP API
- **axios** - HTTP client
- **dotenv** - Environment configuration

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TonConnect UI React** - Wallet connection
- **@ton/ton** - TON SDK
- **axios** - HTTP client

---

## 📊 Commission Details

**Platform Commission Wallet:**
```
UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
```

**Commission Rate:** 3%

**Distribution on Release:**
- Beneficiary: 97% of escrowed amount
- Platform: 3% of escrowed amount

**No Commission on:**
- Refunds (after deadline)
- Cancellations (before release)

---

## 🧪 Testing

### Test Smart Contract
```bash
cd contracts
npm test
```

### Test Backend
```bash
cd backend
npm test
```

### Test Frontend
```bash
cd frontend
npm test
```

### Manual Testing Flow

1. Start all services (backend + frontend)
2. Open Telegram bot
3. Click "Create Escrow"
4. Connect Tonkeeper wallet
5. Create a test escrow (use testnet TON)
6. Verify transaction on TON explorer
7. Test release/refund functionality

---

## 🔒 Security Features

- ✅ **Reentrancy Protection** - State updated before transfers
- ✅ **Access Control** - Only depositor can release/cancel
- ✅ **Deadline Enforcement** - Refunds only after deadline
- ✅ **Input Validation** - All inputs validated on-chain
- ✅ **Non-Custodial** - Users control their wallets
- ✅ **Transparent Commission** - Hardcoded 3% visible on-chain

---

## 🐛 Troubleshooting

### Bot Not Responding
- Check `TELEGRAM_BOT_TOKEN` in backend/.env
- Ensure backend server is running
- Check bot logs for errors

### Contract Not Found
- Verify `CONTRACT_ADDRESS` in both .env files
- Ensure contract is deployed to the correct network

### Wallet Connection Issues
- Update TonConnect UI to latest version
- Check browser console for errors
- Ensure using HTTPS in production

### Transaction Failures
- Verify wallet has sufficient balance
- Check network (testnet vs mainnet)
- Ensure contract address is correct

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Author

**TON Escrow MVP**

Built with ❤️ for the TON ecosystem

---

## 🌟 Acknowledgments

- TON Foundation for the amazing blockchain platform
- Tact language team for the smart contract language
- TonConnect for wallet integration
- Telegram for the bot platform

---

## 📞 Support

For questions or support:
- Open an issue on GitHub
- Contact via Telegram: [@yourusername]

---

**⚠️ Disclaimer:** This is an MVP (Minimum Viable Product). Before using in production, conduct thorough security audits and testing.

---

**Made with 🔒 for secure TON escrow transactions**
