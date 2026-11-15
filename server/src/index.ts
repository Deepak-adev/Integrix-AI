import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import auditRoutes from './routes/audit.routes.js';
import { repositoryLoader } from './services/ingestion/repository-loader.js';
import { getProviderStatus } from './services/ai/ai-provider-factory.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── CORS ────────────────────────────────────────────────────────────────────
// ALLOWED_ORIGINS env var: comma-separated list of permitted origins.
// Falls back to localhost:5173 and localhost:4173 (Vite defaults) in development.
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'];
const allowedOrigins: string[] = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultDevOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' is not permitted.`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static uploads route — only within uploads dir
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// ─── API routes ──────────────────────────────────────────────────────────────
app.use('/api/audit', auditRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Integrix AI Brand Governance Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Integrix AI] Unhandled error:', err.message);
  if (err.message?.includes('CORS')) {
    res.status(403).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Startup ─────────────────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    console.log('[Integrix AI] Initializing Brand Repository...');
    await repositoryLoader.initialize();
    console.log('[Integrix AI] Master Repository and Rulebook loaded successfully.');

    // Log AI provider configuration (no secrets)
    const aiStatus = getProviderStatus();
    console.log(`[Integrix AI] AI Audit Provider: ${aiStatus.auditProvider} (${aiStatus.auditModel}) — ${aiStatus.auditAvailable ? 'active' : 'inactive'}`);
    console.log(`[Integrix AI] AI Extraction Provider: ${aiStatus.extractionProvider} (${aiStatus.extractionModel}) — ${aiStatus.extractionAvailable ? 'active' : 'inactive'}`);

    app.listen(PORT, () => {
      console.log(`[Integrix AI] Server running on port ${PORT}`);
      console.log(`[Integrix AI] API endpoints: http://localhost:${PORT}/api/audit`);
      console.log(`[Integrix AI] CORS allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('[Integrix AI] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
