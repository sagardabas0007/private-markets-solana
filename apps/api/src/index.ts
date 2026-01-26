// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

// Load .env - try multiple paths for different execution contexts
const envPaths = [
  path.resolve(process.cwd(), '.env'),                    // From api directory
  path.resolve(process.cwd(), 'apps/api/.env'),           // From monorepo root
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error && process.env.ANTHROPIC_API_KEY) {
    console.log('✅ Loaded .env from:', envPath);
    break;
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import marketRoutes from './routes/markets';
import tradingRoutes from './routes/trading';
import agentRoutes from './routes/agent';
import privacyRoutes from './routes/privacy';
import pricesRoutes from './routes/prices';
import orderbookRoutes from './routes/orderbook';
import darkMarketsRoutes from './routes/darkMarkets';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/markets', marketRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/orderbook', orderbookRoutes);
app.use('/api/dark-markets', darkMarketsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Dark Alpha API running on port ${port}`);
});

export default app;