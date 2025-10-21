// Helper utility functions
import crypto from 'crypto';

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate secure random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Parse amount from string
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.trim().replace(',', '.');
  const amount = parseFloat(cleaned);

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

/**
 * Escape markdown special characters
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate TON amount
 */
export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000000 && !isNaN(amount);
}

/**
 * Format status for display
 */
export function formatStatus(status: string, lang: string = 'en'): string {
  const statusMap: Record<string, Record<string, string>> = {
    pending: { en: '⏳ Pending', ru: '⏳ Ожидание', uz: '⏳ Kutilmoqda' },
    active: { en: '✅ Active', ru: '✅ Активен', uz: '✅ Faol' },
    completed: { en: '✔️ Completed', ru: '✔️ Завершен', uz: '✔️ Bajarildi' },
    cancelled: { en: '❌ Cancelled', ru: '❌ Отменен', uz: '❌ Bekor qilindi' }
  };

  return statusMap[status]?.[lang] || status;
}
