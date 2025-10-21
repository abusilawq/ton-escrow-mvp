// TON blockchain service for payment link generation and transaction handling
import { Address } from '@ton/core';
import QRCode from 'qrcode';

export interface PaymentLink {
  url: string;
  qrCode?: string;
}

export class TonService {
  private commissionWallet: string;
  private commissionPercent: number;
  private network: string;

  constructor() {
    this.commissionWallet = process.env.COMMISSION_WALLET || '';
    this.commissionPercent = Number(process.env.COMMISSION_PERCENT) || 3;
    this.network = process.env.TON_NETWORK || 'testnet';
  }

  /**
   * Validate TON address
   */
  isValidAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate commission and total amount
   */
  calculateAmounts(amount: number): {
    originalAmount: number;
    commission: number;
    receiverAmount: number;
    totalAmount: number;
  } {
    const commission = amount * (this.commissionPercent / 100);
    const receiverAmount = amount - commission;
    const totalAmount = amount;

    return {
      originalAmount: amount,
      commission: Number(commission.toFixed(9)),
      receiverAmount: Number(receiverAmount.toFixed(9)),
      totalAmount: Number(totalAmount.toFixed(9))
    };
  }

  /**
   * Generate payment link for Tonkeeper
   * This creates a deep link that opens in Tonkeeper wallet
   */
  async generatePaymentLink(
    receiverAddress: string,
    amount: number,
    comment?: string
  ): Promise<PaymentLink> {
    const amounts = this.calculateAmounts(amount);

    // Create payment link for the full amount to commission wallet first
    // The smart contract will handle distribution
    const tonAmount = amounts.totalAmount;

    // Generate Tonkeeper deep link
    // Format: ton://transfer/<address>?amount=<nanotons>&text=<comment>
    const nanotons = Math.floor(tonAmount * 1e9);
    const encodedComment = comment ? encodeURIComponent(comment) : '';

    // For now, we'll send to commission wallet and handle distribution via smart contract
    // In production, this should interact with deployed smart contract
    const paymentUrl = `ton://transfer/${this.commissionWallet}?amount=${nanotons}&text=${encodedComment}`;

    // Generate QR code
    let qrCode: string | undefined;
    try {
      qrCode = await QRCode.toDataURL(paymentUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    return {
      url: paymentUrl,
      qrCode
    };
  }

  /**
   * Create Tonkeeper payment URL with inline keyboard
   */
  createTonkeeperUrl(receiverAddress: string, amount: number, comment?: string): string {
    const amounts = this.calculateAmounts(amount);
    const nanotons = Math.floor(amounts.totalAmount * 1e9);
    const encodedComment = comment ? encodeURIComponent(comment) : '';

    return `https://app.tonkeeper.com/transfer/${this.commissionWallet}?amount=${nanotons}&text=${encodedComment}`;
  }

  /**
   * Format TON amount for display
   */
  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Generate unique escrow ID
   */
  generateEscrowId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ESC${timestamp}${random}`;
  }

  /**
   * Get transaction status (stub for now - would query blockchain)
   */
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    // TODO: Implement actual blockchain query
    // For now, return pending
    return 'pending';
  }

  /**
   * Verify transaction on blockchain (stub)
   */
  async verifyTransaction(txHash: string, expectedAmount: number): Promise<boolean> {
    // TODO: Implement actual blockchain verification
    // This would query TON blockchain to verify the transaction
    return false;
  }

  /**
   * Get commission wallet address
   */
  getCommissionWallet(): string {
    return this.commissionWallet;
  }

  /**
   * Get commission percentage
   */
  getCommissionPercent(): number {
    return this.commissionPercent;
  }

  /**
   * Shorten address for display
   */
  shortenAddress(address: string, chars: number = 6): string {
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }
}

export const tonService = new TonService();
