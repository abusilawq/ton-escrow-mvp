// TON Blockchain Service
// This service handles all interactions with the TON blockchain
// Includes smart contract communication and transaction monitoring

import { TonClient, Address, beginCell, toNano } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const TON_NETWORK = process.env.TON_NETWORK || 'testnet'; // 'testnet' or 'mainnet'
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// Commission wallet (hardcoded as per requirements)
export const COMMISSION_WALLET = 'UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj';
export const COMMISSION_RATE = 3; // 3%

// ============================================
// TON CLIENT INITIALIZATION
// ============================================

let tonClient: TonClient | null = null;

/**
 * Initialize TON client
 * Connects to TON network (testnet or mainnet)
 */
export async function initTonClient(): Promise<TonClient> {
    try {
        // Get HTTP endpoint for the network
        const endpoint = await getHttpEndpoint({
            network: TON_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
        });

        // Create TonClient instance
        tonClient = new TonClient({
            endpoint,
        });

        console.log(`✅ TON client initialized for ${TON_NETWORK}`);
        console.log(`📡 Endpoint: ${endpoint}`);

        return tonClient;
    } catch (error) {
        console.error('❌ Failed to initialize TON client:', error);
        throw error;
    }
}

/**
 * Get TON client instance
 * Initializes if not already done
 */
export async function getTonClient(): Promise<TonClient> {
    if (!tonClient) {
        return await initTonClient();
    }
    return tonClient;
}

// ============================================
// SMART CONTRACT INTERACTIONS
// ============================================

/**
 * Get escrow contract address
 */
export function getContractAddress(): Address {
    if (!CONTRACT_ADDRESS) {
        throw new Error('CONTRACT_ADDRESS not set in environment variables');
    }
    return Address.parse(CONTRACT_ADDRESS);
}

/**
 * Create escrow message payload
 * Builds the message for CreateEscrow transaction
 */
export function buildCreateEscrowPayload(
    beneficiary: string,
    deadline: number
): any {
    // Build message body for CreateEscrow
    const body = beginCell()
        .storeUint(0x1, 32) // op code for CreateEscrow (you'll need to match with contract)
        .storeAddress(Address.parse(beneficiary))
        .storeUint(deadline, 32)
        .endCell();

    return body;
}

/**
 * Create release escrow message
 * Builds the message for ReleaseEscrow transaction
 */
export function buildReleaseEscrowPayload(escrowId: number): any {
    const body = beginCell()
        .storeUint(0x2, 32) // op code for ReleaseEscrow
        .storeUint(escrowId, 32)
        .endCell();

    return body;
}

/**
 * Create refund escrow message
 * Builds the message for RefundEscrow transaction
 */
export function buildRefundEscrowPayload(escrowId: number): any {
    const body = beginCell()
        .storeUint(0x3, 32) // op code for RefundEscrow
        .storeUint(escrowId, 32)
        .endCell();

    return body;
}

/**
 * Create cancel escrow message
 * Builds the message for CancelEscrow transaction
 */
export function buildCancelEscrowPayload(escrowId: number): any {
    const body = beginCell()
        .storeUint(0x4, 32) // op code for CancelEscrow
        .storeUint(escrowId, 32)
        .endCell();

    return body;
}

// ============================================
// ESCROW DATA RETRIEVAL
// ============================================

/**
 * Get escrow data from smart contract
 * Calls the getEscrow getter method
 */
export async function getEscrowData(escrowId: number): Promise<any> {
    try {
        const client = await getTonClient();
        const contractAddress = getContractAddress();

        // Call the getter method
        // Note: This is a simplified version. In production, you'd use the actual contract ABI
        const result = await client.runMethod(
            contractAddress,
            'getEscrow',
            [{ type: 'int', value: BigInt(escrowId) }]
        );

        return result;
    } catch (error) {
        console.error(`❌ Failed to get escrow data for ID ${escrowId}:`, error);
        throw error;
    }
}

/**
 * Get total escrow count from contract
 */
export async function getEscrowCount(): Promise<number> {
    try {
        const client = await getTonClient();
        const contractAddress = getContractAddress();

        const result = await client.runMethod(contractAddress, 'escrowCount');

        // Extract the count from the result
        return Number(result.stack.readNumber());
    } catch (error) {
        console.error('❌ Failed to get escrow count:', error);
        return 0;
    }
}

/**
 * Check if escrow is active
 */
export async function isEscrowActive(escrowId: number): Promise<boolean> {
    try {
        const client = await getTonClient();
        const contractAddress = getContractAddress();

        const result = await client.runMethod(
            contractAddress,
            'isEscrowActive',
            [{ type: 'int', value: BigInt(escrowId) }]
        );

        return result.stack.readBoolean();
    } catch (error) {
        console.error(`❌ Failed to check escrow status for ID ${escrowId}:`, error);
        return false;
    }
}

/**
 * Get commission wallet address from contract
 */
export async function getCommissionWalletFromContract(): Promise<string> {
    try {
        const client = await getTonClient();
        const contractAddress = getContractAddress();

        const result = await client.runMethod(contractAddress, 'getCommissionWallet');

        return result.stack.readAddress().toString();
    } catch (error) {
        console.error('❌ Failed to get commission wallet:', error);
        return COMMISSION_WALLET; // Return hardcoded as fallback
    }
}

/**
 * Get commission rate from contract
 */
export async function getCommissionRate(): Promise<number> {
    try {
        const client = await getTonClient();
        const contractAddress = getContractAddress();

        const result = await client.runMethod(contractAddress, 'getCommissionRate');

        return Number(result.stack.readNumber());
    } catch (error) {
        console.error('❌ Failed to get commission rate:', error);
        return COMMISSION_RATE; // Return hardcoded as fallback
    }
}

// ============================================
// WALLET OPERATIONS
// ============================================

/**
 * Get wallet balance
 * Returns balance in TON (not nanoTON)
 */
export async function getWalletBalance(address: string): Promise<string> {
    try {
        const client = await getTonClient();
        const walletAddress = Address.parse(address);

        const balance = await client.getBalance(walletAddress);

        // Convert from nanoTON to TON
        return (Number(balance) / 1_000_000_000).toFixed(2);
    } catch (error) {
        console.error(`❌ Failed to get balance for ${address}:`, error);
        return '0';
    }
}

/**
 * Validate TON address
 */
export function isValidAddress(address: string): boolean {
    try {
        Address.parse(address);
        return true;
    } catch {
        return false;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert TON to nanoTON
 */
export function tonToNano(amount: number): bigint {
    return toNano(amount);
}

/**
 * Convert nanoTON to TON
 */
export function nanoToTon(nanoAmount: bigint): number {
    return Number(nanoAmount) / 1_000_000_000;
}

/**
 * Calculate commission amount
 */
export function calculateCommission(amount: number): {
    commission: number;
    beneficiaryAmount: number;
    total: number;
} {
    const commission = (amount * COMMISSION_RATE) / 100;
    const beneficiaryAmount = amount - commission;

    return {
        commission: Number(commission.toFixed(2)),
        beneficiaryAmount: Number(beneficiaryAmount.toFixed(2)),
        total: amount,
    };
}

/**
 * Format TON amount for display
 */
export function formatTonAmount(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} TON`;
}

// ============================================
// TRANSACTION MONITORING
// ============================================

/**
 * Monitor transaction status
 * Polls the blockchain for transaction confirmation
 */
export async function waitForTransaction(
    address: string,
    timeout: number = 60000
): Promise<boolean> {
    const startTime = Date.now();
    const client = await getTonClient();
    const walletAddress = Address.parse(address);

    while (Date.now() - startTime < timeout) {
        try {
            const transactions = await client.getTransactions(walletAddress, {
                limit: 1,
            });

            if (transactions.length > 0) {
                console.log('✅ Transaction confirmed!');
                return true;
            }

            // Wait 2 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error('Error checking transaction:', error);
        }
    }

    console.log('⏱️ Transaction timeout');
    return false;
}

export default {
    initTonClient,
    getTonClient,
    getContractAddress,
    buildCreateEscrowPayload,
    buildReleaseEscrowPayload,
    buildRefundEscrowPayload,
    buildCancelEscrowPayload,
    getEscrowData,
    getEscrowCount,
    isEscrowActive,
    getCommissionWalletFromContract,
    getCommissionRate,
    getWalletBalance,
    isValidAddress,
    tonToNano,
    nanoToTon,
    calculateCommission,
    formatTonAmount,
    waitForTransaction,
    COMMISSION_WALLET,
    COMMISSION_RATE,
};
