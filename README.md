# 🔒 TON Escrow MVP

A complete decentralized escrow system built on the TON (The Open Network) blockchain with automatic 3% platform fee collection.

## 📋 Overview

This project provides a full-stack escrow solution including:

1. **Smart Contract** - Tact-based escrow contract with fund, release, and refund functions
2. **Backend Watcher** - Node.js service that monitors blockchain transactions
3. **Frontend dApp** - React application with TonConnect wallet integration

## 🏗️ Project Structure

```
ton-escrow-mvp/
├── contracts/              # TON smart contracts (Tact)
│   ├── Escrow.tact        # Main escrow contract with 3% fee
│   ├── escrow.tact        # Legacy contract
│   ├── tact.config.json   # Tact compiler configuration
│   └── package.json
│
├── backend/               # Backend services
│   ├── watcher.js         # Transaction watcher & JSON database
│   ├── src/
│   │   └── index.ts       # API server (TypeScript)
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/              # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Styles
│   │   └── main.jsx       # Entry point
│   ├── public/
│   │   └── tonconnect-manifest.json
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## ✨ Key Features

### Smart Contract (Escrow.tact)
- ✅ **fund()** - Buyer deposits funds into escrow
- ✅ **release()** - Releases funds to seller (97%) and platform (3%)
- ✅ **refund()** - Returns full amount to buyer
- ✅ **Automatic 3% fee** - Platform fee automatically deducted on release
- ✅ **On-chain storage** - All buyer, seller, and amount data stored on-chain
- ✅ **Deadline system** - Automatic refund after deadline
- ✅ **Multi-escrow support** - Handle multiple concurrent escrows

### Backend Watcher (watcher.js)
- ✅ Monitors TON blockchain for escrow transactions
- ✅ Verifies payment memos and transaction types
- ✅ JSON database for transaction status tracking
- ✅ Built-in HTTP API for status queries
- ✅ Real-time polling (configurable interval)

### Frontend dApp (React + TonConnect)
- ✅ TonConnect wallet integration (Tonkeeper, etc.)
- ✅ Create escrow interface
- ✅ Fund existing escrows
- ✅ Release and refund functionality
- ✅ Real-time transaction status updates
- ✅ Responsive design
- ✅ Fee calculator

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Tonkeeper wallet (for testing)
- TON testnet tokens

### 1. Install Smart Contract Dependencies

```bash
cd contracts
npm install
```

### 2. Build Smart Contract

```bash
npm run build
```

This compiles `Escrow.tact` and generates deployment files in `contracts/build/`.

### 3. Deploy Smart Contract

You need to deploy the contract to TON testnet:

```bash
# Option 1: Using TON CLI or deployment script
# Follow TON documentation: https://docs.ton.org/develop/smart-contracts/tutorials/wallet

# Option 2: Use online tools
# - Blueprint: https://github.com/ton-org/blueprint
# - TON Deploy: https://deploy.ton.org/

# After deployment, note your contract address
# Example: EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t
```

### 4. Setup Backend Watcher

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Watcher Configuration
TONCENTER_API_KEY=your_toncenter_api_key_here
TONCENTER_API_URL=https://testnet.toncenter.com/api/v2/jsonRPC
ESCROW_CONTRACT_ADDRESS=EQD...your_deployed_contract_address
POLL_INTERVAL=10000
```

Get your TonCenter API key from: https://toncenter.com/

### 5. Run Backend Watcher

```bash
npm run watcher
```

The watcher will:
- Monitor blockchain for escrow transactions
- Update `escrow_database.json` with transaction statuses
- Expose API on http://localhost:3002

### 6. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3002
VITE_ESCROW_CONTRACT=EQD...your_deployed_contract_address
```

### 7. Run Frontend

```bash
npm run dev
```

Frontend will be available at: http://localhost:3000

## 📝 File Locations Guide

### Where to paste each file:

1. **contracts/Escrow.tact** - Main smart contract
   - Path: `/contracts/Escrow.tact`
   - Contains: Complete escrow logic with 3% fee

2. **backend/watcher.js** - Transaction monitoring service
   - Path: `/backend/watcher.js`
   - Contains: Blockchain transaction watcher

3. **frontend/src/App.jsx** - React frontend
   - Path: `/frontend/src/App.jsx`
   - Contains: Complete UI with TonConnect

4. **frontend/src/App.css** - Styles
   - Path: `/frontend/src/App.css`
   - Contains: All styling

5. **frontend/src/main.jsx** - Entry point
   - Path: `/frontend/src/main.jsx`
   - Contains: React bootstrap code

6. **frontend/index.html** - HTML template
   - Path: `/frontend/index.html`
   - Contains: HTML structure

## 🔧 How It Works

### 1. Create Escrow Flow

```
Buyer → Smart Contract (CreateEscrow message)
  ↓
Contract stores: buyer address, seller address, amount, deadline
  ↓
Frontend receives confirmation
```

### 2. Fund Escrow Flow

```
Buyer → Smart Contract (FundEscrow message + TON)
  ↓
Contract verifies amount and stores funds
  ↓
Watcher detects transaction → Updates database to "Funded"
  ↓
Frontend shows "Funded" status
```

### 3. Release Flow

```
Buyer → Smart Contract (ReleaseEscrow message)
  ↓
Contract calculates:
  - 97% to seller
  - 3% to platform owner
  ↓
Sends two transactions
  ↓
Watcher detects → Updates database to "Released"
  ↓
Frontend shows "Released" status
```

### 4. Refund Flow

```
Buyer/Seller → Smart Contract (RefundEscrow message)
  ↓
Contract verifies deadline or sender authorization
  ↓
Sends 100% back to buyer
  ↓
Watcher detects → Updates database to "Refunded"
```

## 📡 API Endpoints (Watcher)

The watcher exposes these endpoints:

```
GET /health
  - Returns: { status: "healthy", timestamp: "..." }

GET /escrows
  - Returns: { success: true, data: {...all escrows...} }

GET /escrow/:id
  - Returns: { success: true, data: {...escrow details...} }
```

Example:
```bash
curl http://localhost:3002/escrows
curl http://localhost:3002/escrow/1
```

## 💰 Fee Structure

- **Platform Fee**: 3% of transaction amount
- **Gas Fee**: ~0.05 TON per transaction (covered by sender)

Example for 10 TON escrow:
- Buyer pays: 10 TON + 0.05 TON (gas)
- Seller receives: 9.7 TON (97%)
- Platform receives: 0.3 TON (3%)

## 🧪 Testing

### Test on TON Testnet

1. Get testnet TON from faucet: https://t.me/testgiver_ton_bot
2. Deploy contract to testnet
3. Update `.env` files with testnet addresses
4. Test all functions:
   - Create escrow
   - Fund escrow
   - Release to seller
   - Refund to buyer

### Smart Contract Testing

```bash
cd contracts
npm test
```

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Watcher: http://localhost:3002

## 📚 Dependencies

### Smart Contract
```json
{
  "@tact-lang/compiler": "^1.4.0",
  "@ton/core": "^0.56.0",
  "@ton/ton": "^13.11.0"
}
```

### Backend Watcher
```json
{
  "tonweb": "^0.0.66",
  "axios": "^1.6.0",
  "fs-extra": "^11.2.0",
  "dotenv": "^16.4.0"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "@tonconnect/ui-react": "^2.0.5",
  "ton": "^13.11.2",
  "ton-core": "^0.56.1",
  "axios": "^1.6.7",
  "vite": "^5.2.0"
}
```

## 🔐 Security Considerations

⚠️ **Important**: This is an MVP for educational purposes. Before production use:

1. **Audit the smart contract** - Hire professional auditors
2. **Add access controls** - Implement role-based permissions
3. **Test thoroughly** - Extensive testnet testing
4. **Add rate limiting** - Protect API endpoints
5. **Use HTTPS** - Secure all communications
6. **Backup database** - Implement proper data persistence
7. **Monitor gas costs** - Optimize transaction fees

## 🛣️ Roadmap

- [ ] Add dispute resolution system
- [ ] Implement multi-signature releases
- [ ] Add email/Telegram notifications
- [ ] Create mobile app
- [ ] Add support for TON tokens (not just TON)
- [ ] Implement partial releases
- [ ] Add reputation system
- [ ] Create admin dashboard

## 📖 Additional Resources

- [TON Documentation](https://docs.ton.org/)
- [Tact Language](https://tact-lang.org/)
- [TonConnect](https://github.com/ton-connect)
- [TON Center API](https://toncenter.com/api/v2/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- TON Community: https://t.me/tondev_eng

---

**⚠️ Disclaimer**: This is an educational MVP. Use at your own risk. Always audit smart contracts before handling real funds.

**Built with ❤️ on TON Blockchain**
