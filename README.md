# TON Escrow MVP

TON blockchain asosida qurilgan xavfsiz va ishonchli escrow xizmati.

## 📋 Loyiha haqida

Bu loyiha TON (The Open Network) blockchain'da escrow smart contractlarini boshqarish uchun mo'ljallangan to'liq funksional MVP (Minimum Viable Product) hisoblanadi. Loyiha uchta asosiy qismdan iborat:

1. **Smart Contracts** - Tact tilida yozilgan TON escrow contractlari
2. **Backend API** - Express.js va TypeScript asosida REST API
3. **Frontend** - Next.js va React asosida qurilgan foydalanuvchi interfeysi

## 🏗️ Loyiha strukturasi

```
ton-escrow-mvp/
├── contracts/              # TON smart contracts (Tact)
│   ├── escrow.tact        # Asosiy escrow contract
│   ├── tact.config.json   # Tact konfiguratsiyasi
│   ├── package.json
│   └── README.md
├── backend/               # Backend API (Express + TypeScript)
│   ├── src/
│   │   └── index.ts      # API server
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/              # Frontend (Next.js + React)
│   ├── app/
│   │   ├── page.tsx      # Home page
│   │   └── layout.tsx    # Root layout
│   ├── package.json
│   ├── next.config.js
│   └── README.md
├── docker-compose.yml     # Docker orchestration
└── README.md             # Bu fayl
```

## 🚀 Ishga tushirish

### Talablar

- Node.js 18+
- Yarn yoki npm
- Docker va Docker Compose (ixtiyoriy)

### Local ishga tushirish

#### 1. Contracts

```bash
cd contracts
yarn install
yarn build
```

#### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# .env faylini tahrirlang
npm run dev
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker bilan ishga tushirish

```bash
# Barcha servislarni ishga tushirish
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f

# To'xtatish
docker-compose down
```

Keyin brauzerda quyidagi manzillarni oching:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## ✨ Xususiyatlar

### Smart Contract
- ✅ Ikki tomon o'rtasida xavfsiz escrow
- ✅ Deadline asosida avtomatik refund
- ✅ Multi-escrow support
- ✅ On-chain verification

### Backend API
- ✅ RESTful API
- ✅ TON blockchain integratsiyasi
- ✅ CORS support
- ✅ Error handling
- ✅ TypeScript type safety

### Frontend
- ✅ TON Connect wallet integratsiyasi
- ✅ Responsive dizayn
- ✅ Server-side rendering
- ✅ Modern UI/UX
- ✅ Real-time updates

## 📝 API Endpoints

```
GET    /health                  - Health check
GET    /api/v1/escrows          - Barcha escrowlarni olish
POST   /api/v1/escrows/create   - Yangi escrow yaratish
GET    /api/v1/escrows/:id      - Escrow ma'lumotlarini olish
```

## 🔧 Texnologiyalar

### Smart Contracts
- Tact - TON smart contract tili
- @tact-lang/compiler
- @ton/core, @ton/ton

### Backend
- Express.js - Web framework
- TypeScript - Type safety
- @ton/ton - TON SDK
- dotenv - Configuration

### Frontend
- Next.js 14 - React framework
- TypeScript
- TON Connect - Wallet integration
- React 18

## 🛠️ Development

### Testlar

```bash
# Contracts
cd contracts && yarn test

# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Linting

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

## 📚 Qo'shimcha ma'lumot

Har bir qism uchun batafsil ma'lumot tegishli papkalardagi README.md fayllarida mavjud:

- [Contracts README](./contracts/README.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/amazing-feature`)
3. O'zgarishlarni commit qiling (`git commit -m 'Add some amazing feature'`)
4. Branch'ga push qiling (`git push origin feature/amazing-feature`)
5. Pull Request oching

## 📄 License

MIT License - batafsil ma'lumot uchun LICENSE faylini ko'ring.

## 👥 Muallif

TON Escrow MVP - Xavfsiz va ishonchli escrow xizmati

---

**Eslatma:** Bu MVP versiyasi bo'lib, production muhitida ishlatishdan oldin qo'shimcha xavfsizlik tekshiruvlari va testlar o'tkazish tavsiya etiladi.
