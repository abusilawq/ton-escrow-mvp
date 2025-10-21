# TON Escrow Backend

Express.js va TypeScript asosida qurilgan backend API.

## Texnologiyalar

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **@ton/ton** - TON SDK
- **dotenv** - Environment configuration

## Ishga tushirish

```bash
# Dependencies o'rnatish
npm install

# Environment o'zgaruvchilarini sozlash
cp .env.example .env
# .env faylini tahrirlang

# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Escrow Management
```
GET    /api/v1/escrows          - Barcha escrowlarni olish
POST   /api/v1/escrows/create   - Yangi escrow yaratish
GET    /api/v1/escrows/:id      - Escrow ma'lumotlarini olish
```

## Environment Variables

`.env` faylini yarating (`.env.example` asosida):

```env
PORT=3001
NODE_ENV=development
TON_NETWORK=testnet
CONTRACT_ADDRESS=your_contract_address
```

## Xususiyatlar

- ✅ RESTful API
- ✅ TypeScript type safety
- ✅ CORS configuration
- ✅ Error handling
- ✅ TON blockchain integration
