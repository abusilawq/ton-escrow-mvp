// Database schema and initialization
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Escrow {
  id: number;
  escrow_id: string;
  creator_telegram_id: number;
  receiver_address: string;
  amount: number;
  commission: number;
  total_amount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create escrows table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS escrows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        escrow_id TEXT UNIQUE NOT NULL,
        creator_telegram_id INTEGER NOT NULL,
        receiver_address TEXT NOT NULL,
        amount REAL NOT NULL,
        commission REAL NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        transaction_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_telegram_id) REFERENCES users(telegram_id)
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_escrows_creator ON escrows(creator_telegram_id);
      CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows(status);
    `);

    console.log('✅ Database initialized successfully');
  }

  // User operations
  createOrUpdateUser(telegramId: number, userData: Partial<User>): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name, language)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `);

    return stmt.get(
      telegramId,
      userData.username || null,
      userData.first_name || null,
      userData.last_name || null,
      userData.language || 'en'
    ) as User;
  }

  getUser(telegramId: number): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    return stmt.get(telegramId) as User | undefined;
  }

  updateUserLanguage(telegramId: number, language: string): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET language = ?, updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = ?
    `);
    stmt.run(language, telegramId);
  }

  // Escrow operations
  createEscrow(data: {
    escrowId: string;
    creatorTelegramId: number;
    receiverAddress: string;
    amount: number;
    commission: number;
    totalAmount: number;
  }): Escrow {
    const stmt = this.db.prepare(`
      INSERT INTO escrows (
        escrow_id, creator_telegram_id, receiver_address,
        amount, commission, total_amount, status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
      RETURNING *
    `);

    return stmt.get(
      data.escrowId,
      data.creatorTelegramId,
      data.receiverAddress,
      data.amount,
      data.commission,
      data.totalAmount
    ) as Escrow;
  }

  getEscrow(escrowId: string): Escrow | undefined {
    const stmt = this.db.prepare('SELECT * FROM escrows WHERE escrow_id = ?');
    return stmt.get(escrowId) as Escrow | undefined;
  }

  getUserEscrows(telegramId: number): Escrow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM escrows
      WHERE creator_telegram_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(telegramId) as Escrow[];
  }

  updateEscrowStatus(escrowId: string, status: string, transactionHash?: string): void {
    const stmt = this.db.prepare(`
      UPDATE escrows
      SET status = ?, transaction_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE escrow_id = ?
    `);
    stmt.run(status, transactionHash || null, escrowId);
  }

  getActiveEscrowsCount(telegramId: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM escrows
      WHERE creator_telegram_id = ? AND status IN ('pending', 'active')
    `);
    const result = stmt.get(telegramId) as { count: number };
    return result.count;
  }

  close(): void {
    this.db.close();
  }
}
