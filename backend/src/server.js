import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import donorsRouter from './routes/donors.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import uploadRouter from './routes/upload.js';
import importRouter from './routes/import.js';
import verificationRouter from './routes/verification.js';
import fridgesRouter from './routes/fridges.js';

// Import middleware
import { sanitizeStrings } from './middleware/validation.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import database (initializes on import)
import db from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5175',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeStrings);

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Test database connection
    const result = db.prepare('SELECT 1 as status').get();

    res.json({
      status: 'ok',
      database: result.status === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/donors', donorsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/import', importRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/fridges', fridgesRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ReUSE Store Backend Server`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5175'}`);
  console.log(`   Database: SQLite (${join(__dirname, '../reuse-store.db')})`);
  console.log(`\n✅ Server ready at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API: http://localhost:${PORT}/api\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Closing database and shutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Closing database and shutting down...');
  db.close();
  process.exit(0);
});
