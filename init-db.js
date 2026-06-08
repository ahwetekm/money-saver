import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function init() {
  try {
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        mood TEXT,
        recurring BOOLEAN,
        recurringInterval TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        limit_amount REAL NOT NULL,
        spent REAL NOT NULL,
        month TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS portfolio_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        averageCost REAL NOT NULL,
        currentPrice REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS portfolio_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        portfolio_item_id TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (portfolio_item_id) REFERENCES portfolio_items(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL,
        deadline TEXT NOT NULL,
        icon TEXT NOT NULL,
        linkedAssets TEXT, -- JSON array of strings
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        nextPayment TEXT NOT NULL,
        interval TEXT NOT NULL,
        category TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS delayed_gratifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        itemName TEXT NOT NULL,
        amount REAL NOT NULL,
        alternativeInvestment TEXT NOT NULL,
        projectedValue REAL NOT NULL,
        createdAt TEXT NOT NULL,
        waitUntil TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT PRIMARY KEY,
        theme TEXT NOT NULL,
        currency TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

init();
