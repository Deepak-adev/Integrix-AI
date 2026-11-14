import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import auditRoutes from './routes/audit.routes.js';
import { repositoryLoader } from './services/ingestion/repository-loader.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads route
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API routes
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Integrix AI Brand Governance Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'CodeNova India 2026 Round 2 MVP',
  });
});

async function startServer() {
  try {
    console.log('[Integrix AI] Initializing Brand Repository...');
    await repositoryLoader.initialize();
    console.log('[Integrix AI] Master Repository and Rulebook loaded successfully.');

    app.listen(PORT, () => {
      console.log(`[Integrix AI] Server running on port ${PORT}`);
      console.log(`[Integrix AI] API endpoints available at http://localhost:${PORT}/api/audit`);
    });
  } catch (error) {
    console.error('[Integrix AI] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

