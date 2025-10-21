# 📖 Complete Setup Guide for Non-Developers

This guide will help you set up and test the TON Escrow Telegram Bot, even if you have no programming experience.

## 🎯 What You'll Need

1. **Computer** with internet connection (Windows, Mac, or Linux)
2. **Telegram account** on your phone
3. **Node.js** installed (we'll show you how)
4. **Code editor** (optional, for viewing files)

## 📱 Step 1: Get Your Telegram Bot

### 1.1 Create Bot with BotFather

1. Open Telegram on your phone
2. Search for `@BotFather`
3. Send `/newbot` command
4. Follow instructions:
   - Enter bot name (e.g., "My TON Escrow Bot")
   - Enter bot username (must end with 'bot', e.g., "mytonescrow_bot")
5. **Save the bot token** - it looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

You already have: `8316093589:AAGFZYKHD1Qe0WYb72BflUjExafGD4uepiE`

## 💻 Step 2: Install Node.js

### For Windows:

1. Go to https://nodejs.org/
2. Download "LTS" version (Recommended)
3. Run installer
4. Click "Next" until installation completes
5. Restart your computer

### For Mac:

1. Go to https://nodejs.org/
2. Download "LTS" version (Recommended)
3. Open downloaded file
4. Follow installation wizard
5. Restart your computer

### For Linux (Ubuntu/Debian):

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verify Installation:

Open Terminal (Mac/Linux) or Command Prompt (Windows) and type:

```bash
node --version
npm --version
```

You should see version numbers (e.g., v18.17.0).

## 📥 Step 3: Download and Setup Bot

### 3.1 Download Code

**Option A: Using Git (if installed)**
```bash
git clone https://github.com/abusilawq/ton-escrow-mvp.git
cd ton-escrow-mvp
```

**Option B: Manual Download**
1. Go to https://github.com/abusilawq/ton-escrow-mvp
2. Click green "Code" button
3. Click "Download ZIP"
4. Extract ZIP file to your Documents folder
5. Open folder in Terminal/Command Prompt

### 3.2 Install Bot Dependencies

```bash
cd bot
npm install
```

Wait 2-5 minutes while it downloads everything needed.

## ⚙️ Step 4: Configure Your Bot

### 4.1 Edit Configuration File

1. Find file: `bot/.env`
2. Open with any text editor (Notepad, TextEdit, VS Code)
3. It should already have:

```env
BOT_TOKEN=8316093589:AAGFZYKHD1Qe0WYb72BflUjExafGD4uepiE
COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
COMMISSION_PERCENT=3
TON_NETWORK=testnet
```

4. **Don't change anything else** unless you know what you're doing
5. Save file

## 🚀 Step 5: Start Your Bot

### 5.1 Run Bot in Development Mode

In Terminal/Command Prompt, inside the `bot` folder:

```bash
npm run dev
```

### What You'll See:

```
🚀 Starting TON Escrow Telegram Bot...
✅ Database initialized successfully
✅ Bot is running in polling mode
🎉 TON Escrow Bot is ready!
💰 Commission: 3%
🏦 Commission Wallet: UQDXc5gs_...
🌐 Network: testnet
```

### 5.2 Keep Terminal Open

**⚠️ IMPORTANT**: Don't close this Terminal window! The bot only works while this is running.

## 📱 Step 6: Test Your Bot

### 6.1 Open Bot in Telegram

1. Open Telegram
2. Search for your bot username (e.g., `@mytonescrow_bot`)
3. Click "Start" or send `/start`

### 6.2 Test Bot Features

#### Test 1: Language Selection
- When you start, you should see 3 language buttons
- Click one (🇺🇿 O'zbek, 🇬🇧 English, or 🇷🇺 Русский)
- You should see main menu

#### Test 2: Create Escrow
1. Click "➕ Create New Escrow"
2. Enter a TON address (you can use test address):
   ```
   UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
   ```
3. Enter amount (e.g., `10`)
4. You should see:
   - Summary with amount
   - Commission (3% = 0.3 TON)
   - Total (10.3 TON)
   - Payment button

#### Test 3: View Deals
1. Click "📦 My Deals"
2. You should see your created escrow

#### Test 4: Help
1. Click "❓ Help & Support"
2. You should see help information

#### Test 5: Change Language
1. Click "⚙️ Settings"
2. Click "🌐 Change Language"
3. Select different language
4. Interface should change

## 🎉 Success! Your Bot is Working!

## 🌐 Step 7: Deploy to Internet (Make it 24/7)

Right now, your bot only works when your computer is on. To make it available 24/7, deploy to a cloud service.

### Option A: Railway (Easiest, Free Tier Available)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your repository
6. Railway will auto-deploy!

**Set Environment Variables in Railway:**
- Click on your project
- Go to "Variables" tab
- Add all variables from your `.env` file

### Option B: Render (Also Easy, Free Tier)

1. Go to https://render.com
2. Sign up
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Settings:
   - **Build Command**: `cd bot && npm install && npm run build`
   - **Start Command**: `cd bot && npm start`
6. Add environment variables
7. Deploy!

### Option C: Your Own Server (VPS)

If you have a VPS (DigitalOcean, Linode, etc.):

```bash
# Install PM2 (process manager)
npm install -g pm2

# Start bot with PM2
cd bot
pm2 start npm --name "ton-escrow-bot" -- start

# Make it start on reboot
pm2 startup
pm2 save
```

## 🔍 Troubleshooting

### Bot doesn't respond to /start

**Solution:**
1. Check Terminal - look for errors (red text)
2. Make sure `BOT_TOKEN` in `.env` is correct
3. Try stopping bot (Ctrl+C) and starting again
4. Make sure you saved the `.env` file

### "Module not found" error

**Solution:**
```bash
cd bot
npm install
```

### "Port already in use" error

**Solution:**
1. Stop bot (Ctrl+C)
2. Change `PORT=3002` to `PORT=3003` in `.env`
3. Start bot again

### Database error

**Solution:**
```bash
cd bot
rm -rf data/escrow.db  # Deletes database
npm run dev            # Recreates database
```

### Payment link doesn't open Tonkeeper

**Solution:**
1. Make sure Tonkeeper is installed on your phone
2. Try opening link in mobile browser first
3. Check that `COMMISSION_WALLET` address is valid

## 📊 Understanding the Dashboard

When bot is running, you'll see logs like:

```
✅ Bot is ready!                     ← Bot started successfully
New user: John Doe (123456789)      ← Someone started your bot
Escrow created: ESC1234567890       ← New escrow created
Language changed: uz → en           ← User changed language
```

## 🛑 Stopping the Bot

Press `Ctrl+C` in Terminal to stop the bot.

## 🔐 Security Tips

1. **Never share** your `.env` file
2. **Never share** your `BOT_TOKEN`
3. Keep your server/computer secure
4. Regularly backup your database (`bot/data/escrow.db`)
5. Use strong passwords for hosting services

## 💰 Understanding Commissions

Every transaction automatically:
1. Takes 3% commission
2. Sends it to: `UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj`
3. Sends 97% to receiver

Example:
- User wants to send: **10 TON**
- Commission (3%): **0.3 TON** → Your wallet
- Receiver gets: **9.7 TON**
- User pays total: **10 TON**

## 📈 Next Steps

1. ✅ Bot is running
2. ✅ Tested all features
3. 🔜 Deploy to cloud (Railway/Render)
4. 🔜 Share bot with users
5. 🔜 Monitor transactions

## 🆘 Need Help?

- Check Terminal for error messages
- Read error message carefully - it usually tells you what's wrong
- Search error on Google
- Check GitHub Issues: https://github.com/abusilawq/ton-escrow-mvp/issues
- Contact: @your_support_username on Telegram

## 🎓 Learning More

Want to understand the code?

1. **Node.js Tutorial**: https://nodejs.dev/learn
2. **Telegram Bot API**: https://core.telegram.org/bots/api
3. **TON Documentation**: https://ton.org/docs
4. **TypeScript**: https://www.typescriptlang.org/docs/

---

**🎉 Congratulations! You've successfully set up a TON Escrow Bot!**

If something doesn't work, don't worry - programming is 90% debugging. Just follow the troubleshooting steps above.
