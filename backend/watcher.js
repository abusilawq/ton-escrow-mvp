/**
 * ================================================
 * TON Escrow Transaction Watcher
 * ================================================
 * This service monitors TON blockchain for escrow-related transactions
 * and maintains a local database of transaction statuses.
 *
 * Dependencies:
 * npm install tonweb axios dotenv fs-extra
 */

const TonWeb = require('tonweb');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// ==================
// Configuration
// ==================

require('dotenv').config();

const CONFIG = {
    // TON API Configuration
    TONCENTER_API_KEY: process.env.TONCENTER_API_KEY || '',
    TONCENTER_API_URL: process.env.TONCENTER_API_URL || 'https://toncenter.com/api/v2/jsonRPC',

    // Escrow Contract Address (deploy contract and set this)
    ESCROW_CONTRACT_ADDRESS: process.env.ESCROW_CONTRACT_ADDRESS || '',

    // Polling interval in milliseconds (10 seconds)
    POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 10000,

    // Database file path
    DB_PATH: path.join(__dirname, 'escrow_database.json'),

    // Network (mainnet or testnet)
    NETWORK: process.env.TON_NETWORK || 'testnet'
};

// ==================
// Initialize TonWeb
// ==================

const tonweb = new TonWeb(
    new TonWeb.HttpProvider(CONFIG.TONCENTER_API_URL, {
        apiKey: CONFIG.TONCENTER_API_KEY
    })
);

// ==================
// Database Functions
// ==================

/**
 * Initialize database file if it doesn't exist
 */
async function initDatabase() {
    try {
        await fs.ensureFile(CONFIG.DB_PATH);

        const fileContent = await fs.readFile(CONFIG.DB_PATH, 'utf8');

        if (!fileContent) {
            const initialData = {
                escrows: {},
                lastCheckedLt: '0',
                lastCheckedHash: '',
                lastUpdated: new Date().toISOString()
            };
            await fs.writeJSON(CONFIG.DB_PATH, initialData, { spaces: 2 });
            console.log('✅ Database initialized');
        }
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
    }
}

/**
 * Read database
 */
async function readDatabase() {
    try {
        const data = await fs.readJSON(CONFIG.DB_PATH);
        return data;
    } catch (error) {
        console.error('❌ Error reading database:', error.message);
        return { escrows: {}, lastCheckedLt: '0', lastCheckedHash: '' };
    }
}

/**
 * Write to database
 */
async function writeDatabase(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        await fs.writeJSON(CONFIG.DB_PATH, data, { spaces: 2 });
    } catch (error) {
        console.error('❌ Error writing to database:', error.message);
    }
}

/**
 * Update escrow status in database
 */
async function updateEscrowStatus(escrowId, status, txHash, memo = '') {
    const db = await readDatabase();

    if (!db.escrows[escrowId]) {
        db.escrows[escrowId] = {
            id: escrowId,
            status: 'Created',
            transactions: [],
            createdAt: new Date().toISOString()
        };
    }

    db.escrows[escrowId].status = status;
    db.escrows[escrowId].transactions.push({
        status: status,
        txHash: txHash,
        memo: memo,
        timestamp: new Date().toISOString()
    });

    await writeDatabase(db);
    console.log(`📝 Escrow ${escrowId} status updated to: ${status}`);
}

// ==================
// Transaction Processing
// ==================

/**
 * Parse transaction memo/comment
 */
function parseMemo(transaction) {
    try {
        if (transaction.in_msg && transaction.in_msg.message) {
            const message = transaction.in_msg.message;

            // Try to decode comment/memo from message body
            if (message.body_hash) {
                // For simple text comments in TON
                return message.body_hash;
            }
        }
        return '';
    } catch (error) {
        return '';
    }
}

/**
 * Detect escrow action type from transaction
 */
function detectEscrowAction(transaction, memo) {
    try {
        const memoLower = memo.toLowerCase();

        // Check memo for action keywords
        if (memoLower.includes('create') || memoLower.includes('created')) {
            return 'Created';
        }
        if (memoLower.includes('fund') || memoLower.includes('funded')) {
            return 'Funded';
        }
        if (memoLower.includes('release') || memoLower.includes('released')) {
            return 'Released';
        }
        if (memoLower.includes('refund') || memoLower.includes('refunded')) {
            return 'Refunded';
        }

        // Fallback: detect by transaction value
        if (transaction.in_msg && transaction.in_msg.value) {
            const value = parseInt(transaction.in_msg.value);

            // If significant value sent, likely funding
            if (value > 100000000) { // > 0.1 TON
                return 'Funded';
            }
        }

        return 'Unknown';
    } catch (error) {
        return 'Unknown';
    }
}

/**
 * Extract escrow ID from transaction
 */
function extractEscrowId(transaction, memo) {
    try {
        // Try to find escrow ID in memo (format: "Escrow #123")
        const escrowMatch = memo.match(/escrow[:\s#]+(\d+)/i);
        if (escrowMatch) {
            return escrowMatch[1];
        }

        // Fallback: use transaction logical time as ID
        return transaction.lt || Date.now().toString();
    } catch (error) {
        return Date.now().toString();
    }
}

/**
 * Process a single transaction
 */
async function processTransaction(transaction) {
    try {
        const txHash = transaction.transaction_id?.hash || 'unknown';
        const memo = parseMemo(transaction);
        const action = detectEscrowAction(transaction, memo);
        const escrowId = extractEscrowId(transaction, memo);

        console.log(`\n🔍 Processing Transaction:`);
        console.log(`   Hash: ${txHash}`);
        console.log(`   Escrow ID: ${escrowId}`);
        console.log(`   Action: ${action}`);
        console.log(`   Memo: ${memo || 'N/A'}`);

        // Update database with new status
        await updateEscrowStatus(escrowId, action, txHash, memo);

        return true;
    } catch (error) {
        console.error('❌ Error processing transaction:', error.message);
        return false;
    }
}

// ==================
// Transaction Fetching
// ==================

/**
 * Fetch transactions for escrow contract
 */
async function fetchTransactions() {
    try {
        if (!CONFIG.ESCROW_CONTRACT_ADDRESS) {
            console.log('⚠️  No escrow contract address configured. Skipping...');
            return [];
        }

        console.log(`\n🔄 Fetching transactions for: ${CONFIG.ESCROW_CONTRACT_ADDRESS}`);

        const response = await axios.post(CONFIG.TONCENTER_API_URL, {
            method: 'getTransactions',
            params: {
                address: CONFIG.ESCROW_CONTRACT_ADDRESS,
                limit: 10,
                archival: false
            },
            jsonrpc: '2.0',
            id: Date.now()
        }, {
            headers: {
                'X-API-Key': CONFIG.TONCENTER_API_KEY
            }
        });

        if (response.data && response.data.result) {
            return response.data.result;
        }

        return [];
    } catch (error) {
        console.error('❌ Error fetching transactions:', error.message);
        return [];
    }
}

/**
 * Check for new transactions
 */
async function checkNewTransactions() {
    try {
        const db = await readDatabase();
        const transactions = await fetchTransactions();

        if (transactions.length === 0) {
            console.log('ℹ️  No transactions found');
            return;
        }

        console.log(`✅ Found ${transactions.length} transactions`);

        // Process each transaction
        for (const tx of transactions) {
            const txLt = tx.transaction_id?.lt || '0';

            // Skip if already processed
            if (BigInt(txLt) <= BigInt(db.lastCheckedLt)) {
                continue;
            }

            await processTransaction(tx);

            // Update last checked LT
            if (BigInt(txLt) > BigInt(db.lastCheckedLt)) {
                db.lastCheckedLt = txLt;
                await writeDatabase(db);
            }
        }

    } catch (error) {
        console.error('❌ Error checking transactions:', error.message);
    }
}

// ==================
// Main Watcher Loop
// ==================

/**
 * Start the transaction watcher
 */
async function startWatcher() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   TON Escrow Transaction Watcher      ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log(`📡 Network: ${CONFIG.NETWORK}`);
    console.log(`📍 Contract: ${CONFIG.ESCROW_CONTRACT_ADDRESS || 'Not configured'}`);
    console.log(`⏱️  Poll Interval: ${CONFIG.POLL_INTERVAL / 1000}s`);
    console.log(`💾 Database: ${CONFIG.DB_PATH}`);
    console.log('\n▶️  Starting watcher...\n');

    // Initialize database
    await initDatabase();

    // Initial check
    await checkNewTransactions();

    // Set up polling interval
    setInterval(async () => {
        await checkNewTransactions();
    }, CONFIG.POLL_INTERVAL);
}

// ==================
// API Server (Optional)
// ==================

/**
 * Simple HTTP server to query escrow status
 */
function startAPIServer(port = 3002) {
    const http = require('http');

    const server = http.createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Health check
        if (req.url === '/health') {
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
            return;
        }

        // Get all escrows
        if (req.url === '/escrows') {
            const db = await readDatabase();
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: db.escrows }));
            return;
        }

        // Get specific escrow
        const escrowMatch = req.url.match(/^\/escrow\/(\w+)$/);
        if (escrowMatch) {
            const escrowId = escrowMatch[1];
            const db = await readDatabase();
            const escrow = db.escrows[escrowId];

            if (escrow) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, data: escrow }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, error: 'Escrow not found' }));
            }
            return;
        }

        // 404
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Not found' }));
    });

    server.listen(port, () => {
        console.log(`\n🌐 API Server running on http://localhost:${port}`);
        console.log(`   - GET /health - Health check`);
        console.log(`   - GET /escrows - Get all escrows`);
        console.log(`   - GET /escrow/:id - Get specific escrow\n`);
    });
}

// ==================
// Start Application
// ==================

if (require.main === module) {
    // Start watcher
    startWatcher().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

    // Start API server
    startAPIServer(3002);
}

// Export functions for external use
module.exports = {
    startWatcher,
    readDatabase,
    updateEscrowStatus,
    initDatabase
};
