# TON Escrow Contracts

Bu papka TON blockchain uchun Tact tilida yozilgan escrow smart contractlarni o'z ichiga oladi.

## Struktura

- `escrow.tact` - Asosiy escrow smart contract
- `tact.config.json` - Tact kompilyator konfiguratsiyasi
- `package.json` - Project dependencies

## Ishga tushirish

```bash
# Dependencies o'rnatish
yarn install

# Contractlarni build qilish
yarn build

# Testlarni ishga tushirish
yarn test

# Deploy qilish
yarn deploy
```

## Xususiyatlar

- ✅ Ikki tomon o'rtasida xavfsiz escrow
- ✅ Deadline asosida avtomatik refund
- ✅ Multi-escrow support
- ✅ On-chain verification
