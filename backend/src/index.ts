// TON Escrow Backend API Server
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'TON Escrow Backend'
  });
});

// API routes
app.get('/api/v1/escrows', (req: Request, res: Response) => {
  res.json({
    message: 'Escrow list endpoint',
    data: []
  });
});

app.post('/api/v1/escrows/create', (req: Request, res: Response) => {
  res.json({
    message: 'Create escrow endpoint',
    data: req.body
  });
});

app.get('/api/v1/escrows/:id', (req: Request, res: Response) => {
  res.json({
    message: 'Get escrow by ID',
    id: req.params.id
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 TON Escrow Backend running on port ${port}`);
  console.log(`📡 Network: ${process.env.TON_NETWORK || 'testnet'}`);
});

export default app;
