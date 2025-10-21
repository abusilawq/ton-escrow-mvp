# 🚀 Deployment Guide

Complete guide for deploying TON Escrow Bot to production.

## 📋 Pre-Deployment Checklist

- [ ] Bot tested locally and working
- [ ] All environment variables configured
- [ ] Database schema tested
- [ ] Smart contract compiled
- [ ] Commission wallet verified
- [ ] Backup plan in place

## 🌐 Deployment Options

### Option 1: Railway (Recommended for Beginners)

**Pros:**
- ✅ Free tier available ($5 credit/month)
- ✅ Automatic deployments from GitHub
- ✅ Easy to use dashboard
- ✅ Built-in monitoring

**Steps:**

1. **Sign Up**
   ```
   Go to: https://railway.app
   Sign up with GitHub
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `ton-escrow-mvp` repository

3. **Configure Build**
   ```
   Root Directory: /bot
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Add Environment Variables**
   Go to Variables tab and add:
   ```
   BOT_TOKEN=8316093589:AAGFZYKHD1Qe0WYb72BflUjExafGD4uepiE
   COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
   COMMISSION_PERCENT=3
   TON_NETWORK=testnet
   DATABASE_PATH=/app/data/escrow.db
   PORT=3002
   NODE_ENV=production
   BOT_WEBHOOK_URL=https://your-app.railway.app
   ```

5. **Deploy**
   - Railway will auto-deploy
   - Check logs for "Bot is ready"
   - Test bot on Telegram

**Monitoring:**
```
railway logs
```

---

### Option 2: Render

**Pros:**
- ✅ Free tier available
- ✅ Auto-deploys from GitHub
- ✅ Easy SSL setup

**Steps:**

1. **Sign Up**
   ```
   Go to: https://render.com
   Sign up with GitHub
   ```

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `ton-escrow-mvp`

3. **Configure Service**
   ```
   Name: ton-escrow-bot
   Region: Choose closest to your users
   Branch: main
   Root Directory: bot
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Add Environment Variables**
   ```
   BOT_TOKEN=8316093589:AAGFZYKHD1Qe0WYb72BflUjExafGD4uepiE
   COMMISSION_WALLET=UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
   COMMISSION_PERCENT=3
   TON_NETWORK=testnet
   DATABASE_PATH=/opt/render/project/src/data/escrow.db
   PORT=3002
   NODE_ENV=production
   BOT_WEBHOOK_URL=https://your-app.onrender.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Check logs

---

### Option 3: VPS (DigitalOcean, Linode, etc.)

**Pros:**
- ✅ Full control
- ✅ Better performance
- ✅ Can run multiple apps

**Requirements:**
- Ubuntu 20.04+ server
- SSH access
- Domain name (optional)

**Steps:**

1. **Connect to Server**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Clone Repository**
   ```bash
   cd /opt
   git clone https://github.com/abusilawq/ton-escrow-mvp.git
   cd ton-escrow-mvp/bot
   ```

4. **Install Dependencies**
   ```bash
   npm install
   npm run build
   ```

5. **Configure Environment**
   ```bash
   nano .env
   # Add your environment variables
   # Save: Ctrl+X, Y, Enter
   ```

6. **Start with PM2**
   ```bash
   pm2 start dist/index.js --name ton-escrow-bot
   pm2 startup
   pm2 save
   ```

7. **Setup Nginx (Optional, for webhook)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/ton-bot
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3002;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ton-bot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL (Optional)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

9. **Monitoring**
   ```bash
   pm2 logs ton-escrow-bot
   pm2 status
   pm2 restart ton-escrow-bot
   ```

---

### Option 4: Docker

**Pros:**
- ✅ Consistent environment
- ✅ Easy to deploy
- ✅ Portable

**Steps:**

1. **Create Dockerfile**
   ```dockerfile
   # Create: bot/Dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   RUN mkdir -p /app/data

   EXPOSE 3002

   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   # Create: docker-compose.yml in root
   version: '3.8'

   services:
     bot:
       build: ./bot
       container_name: ton-escrow-bot
       restart: unless-stopped
       env_file:
         - ./bot/.env
       volumes:
         - ./bot/data:/app/data
       ports:
         - "3002:3002"
       environment:
         - NODE_ENV=production
   ```

3. **Build and Run**
   ```bash
   docker-compose up -d
   ```

4. **Monitor**
   ```bash
   docker-compose logs -f
   docker-compose restart bot
   ```

---

## 🔧 Post-Deployment Setup

### 1. Set Webhook (for webhook mode)

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL>/bot-webhook"
```

Example:
```bash
curl "https://api.telegram.org/bot8316093589:AAGFZYKHD1Qe0WYb72BflUjExafGD4uepiE/setWebhook?url=https://your-app.railway.app/bot-webhook"
```

### 2. Verify Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### 3. Test Bot

1. Open bot in Telegram
2. Send `/start`
3. Test all features:
   - Language selection
   - Create escrow
   - View deals
   - Settings

---

## 📊 Monitoring

### Health Check

```bash
curl https://your-app.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "TON Escrow Telegram Bot"
}
```

### Logs

**Railway:**
```bash
railway logs
```

**Render:**
Check dashboard → Logs tab

**PM2:**
```bash
pm2 logs ton-escrow-bot
```

**Docker:**
```bash
docker logs -f ton-escrow-bot
```

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to git
   - Use platform's secret management
   - Rotate tokens regularly

2. **Database**
   - Regular backups
   - Secure storage
   - Access control

3. **Server**
   - Keep updated: `sudo apt update && sudo apt upgrade`
   - Use firewall
   - Disable root SSH
   - Use SSH keys

4. **Bot**
   - Rate limiting
   - Input validation
   - Error handling
   - Logging

---

## 📦 Backup Strategy

### Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /app/data/escrow.db /backups/escrow_$DATE.db
# Keep only last 7 days
find /backups -name "escrow_*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# Run daily with cron
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Environment Backup

```bash
# Save .env to secure location
cp bot/.env ~/backups/env_backup_$(date +%Y%m%d).txt
```

---

## 🚨 Troubleshooting Production Issues

### Bot Not Responding

1. Check health endpoint
2. Check logs
3. Verify webhook is set correctly
4. Check environment variables
5. Restart service

### Database Issues

1. Check disk space: `df -h`
2. Check permissions
3. Restore from backup
4. Check logs for errors

### High Memory Usage

```bash
# Check memory
free -h

# Restart bot
pm2 restart ton-escrow-bot

# Monitor
pm2 monit
```

### Connection Errors

1. Check network connectivity
2. Verify TON network status
3. Check API endpoints
4. Review firewall rules

---

## 📈 Scaling

### Vertical Scaling (More Resources)

- Upgrade server plan
- Increase RAM/CPU
- Better database

### Horizontal Scaling (Multiple Instances)

Not recommended for Telegram bots (single bot token = single instance)

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_escrows_status ON escrows(status);
CREATE INDEX idx_escrows_created ON escrows(created_at);

-- Clean old data
DELETE FROM escrows WHERE status = 'completed' AND created_at < date('now', '-90 days');
```

---

## 🔄 Updates and Maintenance

### Update Bot

```bash
# On server
cd /opt/ton-escrow-mvp
git pull origin main
cd bot
npm install
npm run build
pm2 restart ton-escrow-bot
```

### Rollback

```bash
git log  # Find previous commit
git checkout <commit-hash>
npm install
npm run build
pm2 restart ton-escrow-bot
```

---

## 📞 Support

- **Logs**: First place to check
- **Health Check**: Verify bot is running
- **Telegram API Status**: https://status.telegram.org
- **TON Network Status**: https://toncenter.com/

---

**🎉 Your bot is now deployed and running 24/7!**

Monitor regularly and keep backups!
