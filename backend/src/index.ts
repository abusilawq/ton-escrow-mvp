// TON Escrow Backend API Server
// Combines Express REST API with Telegram Bot
// Handles escrow creation, monitoring, and management

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// Import services
import { bot, launchBot } from './bot';
import tonService from './tonService';

dotenv.config();

// ============================================
// SERVER CONFIGURATION
// ============================================

const app: Express = express();
const port = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

/**
 * Health check endpoint
 * Returns server status and configuration
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'TON Escrow Backend',
    network: process.env.TON_NETWORK || 'testnet',
    version: '1.0.0'
  });
});

/**
 * Check TON connection status
 */
app.get('/api/v1/ton/status', async (req: Request, res: Response) => {
  try {
    await tonService.getTonClient();
    const commissionWallet = tonService.COMMISSION_WALLET;
    const commissionRate = tonService.COMMISSION_RATE;

    res.json({
      status: 'connected',
      network: process.env.TON_NETWORK || 'testnet',
      commissionWallet,
      commissionRate: `${commissionRate}%`,
      contractAddress: process.env.CONTRACT_ADDRESS || 'Not deployed yet'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================
// ESCROW API ENDPOINTS
// ============================================

/**
 * GET /api/v1/escrows
 * Get all escrows (or filtered by query params)
 */
app.get('/api/v1/escrows', async (req: Request, res: Response) => {
  try {
    // Get total count from smart contract
    const count = await tonService.getEscrowCount();

    // In production, you'd fetch from a database
    // For now, return basic info
    res.json({
      success: true,
      message: 'Escrow list endpoint',
      data: {
        totalCount: count,
        escrows: []
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/escrows/:id
 * Get specific escrow by ID
 */
app.get('/api/v1/escrows/:id', async (req: Request, res: Response) => {
  try {
    const escrowId = parseInt(req.params.id);

    if (isNaN(escrowId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID'
      });
    }

    // Get escrow data from smart contract
    const escrowData = await tonService.getEscrowData(escrowId);
    const isActive = await tonService.isEscrowActive(escrowId);

    res.json({
      success: true,
      data: {
        id: escrowId,
        isActive,
        escrowData
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/escrows/create
 * Create new escrow (returns transaction data for frontend)
 */
app.post('/api/v1/escrows/create', async (req: Request, res: Response) => {
  try {
    const { beneficiary, amount, deadline } = req.body;

    // Validate input
    if (!beneficiary || !amount || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: beneficiary, amount, deadline'
      });
    }

    // Validate TON address
    if (!tonService.isValidAddress(beneficiary)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid beneficiary address'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0.1) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least 0.1 TON'
      });
    }

    // Validate deadline
    const deadlineNum = parseInt(deadline);
    if (isNaN(deadlineNum) || deadlineNum <= Math.floor(Date.now() / 1000)) {
      return res.status(400).json({
        success: false,
        error: 'Deadline must be in the future'
      });
    }

    // Calculate commission
    const commissionInfo = tonService.calculateCommission(amountNum);

    // Build transaction payload
    const payload = tonService.buildCreateEscrowPayload(beneficiary, deadlineNum);

    res.json({
      success: true,
      message: 'Escrow transaction prepared',
      data: {
        beneficiary,
        amount: amountNum,
        deadline: deadlineNum,
        commission: commissionInfo,
        contractAddress: process.env.CONTRACT_ADDRESS || 'Not deployed',
        // Frontend will use this to create the transaction
        transactionData: {
          to: process.env.CONTRACT_ADDRESS || '',
          value: tonService.tonToNano(amountNum).toString(),
          payload: payload.toBoc().toString('base64')
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/escrows/:id/release
 * Release escrow funds to beneficiary
 */
app.post('/api/v1/escrows/:id/release', async (req: Request, res: Response) => {
  try {
    const escrowId = parseInt(req.params.id);

    if (isNaN(escrowId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID'
      });
    }

    // Check if escrow is active
    const isActive = await tonService.isEscrowActive(escrowId);
    if (!isActive) {
      return res.status(400).json({
        success: false,
        error: 'Escrow is not active'
      });
    }

    // Build release payload
    const payload = tonService.buildReleaseEscrowPayload(escrowId);

    res.json({
      success: true,
      message: 'Release transaction prepared',
      data: {
        escrowId,
        transactionData: {
          to: process.env.CONTRACT_ADDRESS || '',
          value: tonService.tonToNano(0.05).toString(), // Gas fee
          payload: payload.toBoc().toString('base64')
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/escrows/:id/refund
 * Refund escrow to depositor
 */
app.post('/api/v1/escrows/:id/refund', async (req: Request, res: Response) => {
  try {
    const escrowId = parseInt(req.params.id);

    if (isNaN(escrowId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID'
      });
    }

    // Build refund payload
    const payload = tonService.buildRefundEscrowPayload(escrowId);

    res.json({
      success: true,
      message: 'Refund transaction prepared',
      data: {
        escrowId,
        transactionData: {
          to: process.env.CONTRACT_ADDRESS || '',
          value: tonService.tonToNano(0.05).toString(), // Gas fee
          payload: payload.toBoc().toString('base64')
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// WALLET ENDPOINTS
// ============================================

/**
 * GET /api/v1/wallet/:address/balance
 * Get wallet balance
 */
app.get('/api/v1/wallet/:address/balance', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!tonService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const balance = await tonService.getWalletBalance(address);

    res.json({
      success: true,
      data: {
        address,
        balance,
        formatted: tonService.formatTonAmount(balance)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/wallet/validate
 * Validate TON address
 */
app.post('/api/v1/wallet/validate', (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    const isValid = tonService.isValidAddress(address);

    res.json({
      success: true,
      data: {
        address,
        isValid
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// TELEGRAM WEBHOOK ENDPOINT
// ============================================

/**
 * POST /webhook/telegram
 * Telegram bot webhook endpoint (for production)
 */
app.post('/webhook/telegram', (req: Request, res: Response) => {
  bot.handleUpdate(req.body, res);
});

// ============================================
// UTILITY ENDPOINTS
// ============================================

/**
 * GET /api/v1/config
 * Get public configuration
 */
app.get('/api/v1/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      network: process.env.TON_NETWORK || 'testnet',
      contractAddress: process.env.CONTRACT_ADDRESS || 'Not deployed',
      commissionWallet: tonService.COMMISSION_WALLET,
      commissionRate: tonService.COMMISSION_RATE,
      minEscrowAmount: 0.1,
      currency: 'TON'
    }
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

/**
 * Global error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong'
  });
});

// ============================================
// SERVER START
// ============================================

/**
 * Initialize and start the server
 */
async function startServer() {
  try {
    // Initialize TON client
    console.log('🔄 Initializing TON client...');
    await tonService.initTonClient();

    // Start Express server
    app.listen(port, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 TON Escrow Backend Server Started!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server running on port: ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Network: ${process.env.TON_NETWORK || 'testnet'}`);
      console.log(`💰 Commission: ${tonService.COMMISSION_RATE}%`);
      console.log(`💼 Commission Wallet: ${tonService.COMMISSION_WALLET}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Start Telegram bot (polling mode for development)
    if (isDevelopment) {
      console.log('🔄 Starting Telegram bot in polling mode...');
      await launchBot();
    } else {
      console.log('ℹ️  In production, use webhook mode for Telegram bot');
      console.log('   Call setWebhook() with your server URL');
    }

    console.log('\n✅ All services initialized successfully!\n');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;
