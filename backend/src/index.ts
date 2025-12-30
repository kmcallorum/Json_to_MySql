import 'reflect-metadata';
import './container.js'; // Initialize DI container (dotenv loads inside container.ts)
import express from 'express';
import cors from 'cors';
import filterRoutes from './routes/filterRoutes.js';
import mappingRoutes from './routes/mappingRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import tableRoutes from './routes/tableRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/filters', filterRoutes);
app.use('/api/mappings', mappingRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/tables', tableRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
