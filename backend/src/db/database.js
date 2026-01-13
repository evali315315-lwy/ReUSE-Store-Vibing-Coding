import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize SQLite database
const dbPath = join(__dirname, '../../reuse-store.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
function initializeDatabase() {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement);
    }
  }

  console.log('✅ Database initialized successfully');
}

// Initialize database on import
initializeDatabase();

export default db;
